# Auditoria da Fase 1 + Plano da Fase 2

> Documento técnico produzido em 2026-05-01 após o Codex declarar Fase 1 (hardening crítico) concluída. O objetivo aqui é (1) confirmar o que de fato foi aplicado, (2) listar gaps que ele deixou abertos, (3) propor um plano de Fase 2 com diffs por arquivo antes de mexer em código.

---

## Parte 1 — Auditoria da Fase 1

### 1.1 O que o Codex aplicou e está bom

**`src/lib/server-auth.ts` (novo) — OK.** Centraliza o bearer auth no servidor. Valida token contra `auth.users` via `getUser`, busca `usuarios_app` pelo `auth_user_id`, normaliza role e permissões e expõe `requiredRole` / `requiredPermissions`. Retorna 401 se o token está faltando/inválido, 403 se o usuário está inativo ou se falta papel/permissão. Boa cobertura de erro: erro de env no boot vira 500 explícito, perfil ausente vira 403 com mensagem clara.

**`src/lib/server-env.ts` (novo) — OK.** Quebra o boot se faltar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`. Não tem mais fallback hardcoded como o Codex disse que tinha em `supabase.ts`.

**`src/lib/rate-limit.ts` (novo) — OK funcionalmente, com ressalvas em escala (ver gap #4 abaixo).**

**`src/app/api/insights/route.ts` — OK.** Agora exige `authenticateRequest` com permissão `dashboard.correlacao` (linhas 374-377), checa que consultor não pode ver outro consultor (linhas 392-401), rate-limita refresh (6/min) e read (60/min) por usuário (linhas 403-419). O custo de IA está protegido pelo rate limit do refresh.

**`src/app/api/vorp/sync/route.ts` — OK.** Removeu o `SYNC_SECRET` estático. Agora exige role `Administrador`, rate-limita POST (3/min) e GET (20/min). Também usa `auth.context.supabaseAdmin` para o GET do log, sem criar novo client.

**`src/app/api/admin/users/route.ts` — OK.** Exige role `Administrador` para GET e PATCH. Valida o payload (role, permissões e status). Rejeita atualizações vazias.

**`src/app/api/auth/bootstrap-profile/route.ts` — OK funcionalmente, com brecha de cadastro automático (gap #1 abaixo).**

**`src/lib/supabase.ts` — OK.** Falha cedo se faltar env. Sem fallback hardcoded.

**`src/components/AuthContext.tsx` — OK em sua maior parte.** Quando o `loadOrCreateProfile` falha, faz `signOut` e seta `authError` (linhas 155-161). Não cai mais em "consultor padrão" silenciosamente. Mas tem ainda um `fail-open` implícito muito sutil (gap #6 abaixo).

**`src/components/dashboard/InsightsSection.tsx` — OK.** Manda `Authorization: Bearer ${session.access_token}` e cai em estado "sessão expirou" se não tiver token (linhas 121-149).

**`src/lib/api.ts` — OK no escopo admin.** `getUsuariosApp` e `updateUsuarioApp` agora vão pela rota `/api/admin/users` com bearer.

**`next.config.ts` — OK em parte.** Removeu o `ignoreBuildErrors` (build voltou a falhar com erro de tipo — confirmado também em `tsconfig.json` com `strict: true`). Adicionou X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy desligando câmera/mic/geolocation. Faltou CSP e HSTS (gap #3 abaixo).

**`.gitignore` — OK.** `.env*` está ignorado.

### 1.2 Gaps que o Codex deixou abertos

Severidade: **A** = exploitável agora, **B** = problema sério em escala/produção, **C** = higiene.

**Gap #1 [A] — Bootstrap-profile permite cadastro automático de qualquer usuário Google.**
Em `src/app/api/auth/bootstrap-profile/route.ts` linha 89-101, qualquer usuário que conseguir autenticar via Supabase OAuth (Google) ganha automaticamente um registro `usuarios_app` com role `Consultor` e permissões padrão de consultor — incluindo `dashboard.overview`, `dashboard.correlacao`, etc. Não tem allowlist de email, não tem aprovação manual, não tem domínio corporativo bloqueado. **Em outras palavras: se o seu projeto Supabase aceita login Google "any account", qualquer pessoa do planeta com conta Google entra como consultor.** O único critério é que o primeiro usuário a se cadastrar vira admin (linha 89). Codex deixou isso passar.

**Gap #2 [A] — `AuthContext.loadOrCreateProfile` ainda faz INSERT direto pelo cliente.**
Linhas 110-117: se o bootstrap server falha, o cliente tenta inserir o perfil pelo navegador via `supabase.from('usuarios_app').insert(...)`. Isso só não é uma brecha aberta porque RLS *deveria* bloquear, mas (a) você está dependendo 100% de RLS bem configurada para uma operação que já tem caminho seguro pelo servidor, (b) se RLS estiver permissiva por engano, qualquer um pode forjar um perfil. O fallback deveria ser removido — se o bootstrap server falhou, o usuário é deslogado e ponto.

**Gap #3 [B] — Headers de segurança incompletos.**
`next.config.ts` está sem `Content-Security-Policy` e sem `Strict-Transport-Security`. CSP é o mais crítico aqui, porque o app embute scripts inline (Tailwind, Next, possíveis bibliotecas de chart) e renderiza dados externos da Vorp. HSTS é trivial e deveria estar com `max-age=63072000; includeSubDomains; preload`.

**Gap #4 [B] — Rate limit em memória não funciona em multi-instância.**
`src/lib/rate-limit.ts` usa `Map<string, ...>` no processo. Em Vercel (qualquer ambiente serverless ou multi-region), cada instância tem seu próprio bucket — então um usuário pode fazer 6 refreshes por minuto **por instância**, multiplicando o custo de OpenAI pelo número de réplicas. Em produção real, isso precisa migrar para Upstash Redis, KV do Vercel, ou tabela `rate_limit` no Postgres com `INSERT ... ON CONFLICT DO UPDATE`. Adicionalmente, o `Map` cresce sem limite (não tem expiração de bucket nem cleanup) — leak de memória em produção.

**Gap #5 [B] — Sync da Vorp depende de admin clicar manualmente.**
Codex removeu o token estático `SYNC_SECRET` do código, mas não substituiu por um scheduler/cron. A planilha de sync hoje depende de um admin estar logado e apertar um botão. Não tem cron Vercel, não tem job em fila, não tem lock de concorrência (dois admins simultâneos = sync duplicado), não tem retry/backoff se a Vorp API falhar. Em produção isso é frágil.

**Gap #6 [B] — Fail-open sutil no AuthContext entre erro e signOut.**
`src/components/AuthContext.tsx` linhas 218-224: quando `profile` é `null`, o `role` cai em `'Consultor'` e `permissions` vira `normalizePermissions(undefined, DEFAULT_CONSULTOR_PERMISSIONS)` — o que retorna DEFAULT_CONSULTOR_PERMISSIONS. Se o estado `profile === null` aparece em qualquer momento (por exemplo, durante o tempo em que o `signOut()` ainda está em flight depois de uma falha de bootstrap), o `useAuth()` retorna permissões de consultor. Os componentes do dashboard podem renderizar dados nesse intervalo. Mitigação simples: enquanto `loading || !profile`, retornar `permissions: []`.

**Gap #7 [B] — Custo OpenAI sem orçamento global.**
Rate limit é por usuário (6 refreshes/min). Mas não há orçamento agregado: 10 admins × 6 refreshes × custo médio de chamada `INSIGHTS_AI_MODEL` pode estourar conta da OpenAI sem alarme. Falta um contador global por dia/mês (ex: `insights_ia_daily_spend` em Postgres) e um circuit breaker que recusa chamadas se passar do orçamento.

**Gap #8 [B] — Dashboard ainda é "cliente pesado".**
`src/hooks/useDashboardData.ts` faz **9 queries paralelas** + **4 do mês anterior** = 13 round-trips Supabase por troca de filtro. Cada query é direto do cliente em uma view Postgres (`view_reunioes_consultor`, `view_metas_consultor`, etc.), e a segurança depende inteiramente de RLS. Em escala, isso (a) é lento (cold start RLS, latência cliente↔Supabase), (b) é difícil de cachear (cada query separada), (c) é um vetor de ataque se RLS quebrar em qualquer view. Esta é exatamente a Fase 2 que o Codex prometeu mas não fez.

**Gap #9 [C] — Endpoint `/api/insights` cria `createClient` extra desnecessário.**
Linhas 53, 81 do `route.ts`: criam novo client Supabase com service role para resolver consultor e snapshots. Já existe o `auth.context.supabaseAdmin` na request. Refatoração simples — economiza objetos por request e mantém tudo centralizado.

**Gap #10 [C] — `SYNC_SECRET` em `.env.local` é dead weight.**
A variável ainda está em `.env.local`, mas o código de sync atual não usa mais. Removível.

**Gap #11 [C] — Sem observabilidade.**
Não tem tracing (Datadog/Sentry/Honeycomb), não tem métrica custom (queries lentas, taxa de 403/429, custo OpenAI por dia), não tem alarme. Em escala, problema vira incidente antes de virar alerta.

**Gap #12 [C] — Sem CSRF/origin check em rotas POST.**
As rotas POST/PATCH (sync, admin/users) confiam só no bearer token. Se o token vazar (ex: extensão maliciosa), não tem segunda camada. Em apps que servem o token via storage, a prática é checar `Origin`/`Referer` ao menos.

**Gap #13 [C] — Sem teste automatizado das rotas server-side.**
Codex validou só com `tsc`, `eslint`, `next build`. Não tem teste de integração das rotas (`/api/insights` com token inválido = 401, com permissão errada = 403, etc.). Em refactor pesado da Fase 2, a ausência disso vai morder.

### 1.3 Veredito

A Fase 1 do Codex **avançou de verdade** o sistema do modelo "cliente pesado, servidor permissivo" para "servidor é dono da regra sensível". Insights, sync e admin estão seguros. AuthContext não falha mais aberto.

Mas **três coisas precisam ser tratadas antes de qualquer Fase 2 ambiciosa**, porque enquanto não estiverem fechadas, qualquer otimização posterior está pisando em fundação fraca:

1. Gap #1 (cadastro automático) é **brecha real**. Qualquer email Google ganha acesso de consultor.
2. Gap #2 (insert pelo cliente em fallback) é **brecha condicional**. Se RLS quebrar, vira aberta.
3. Gap #4 (rate limit em memória) é **falsa segurança em produção**. Em Vercel multi-instância, o limite vira ficção.

---

## Parte 2 — Plano da Fase 2

### 2.1 Princípios

A Fase 2 do Codex é "consolidar dashboard em camada server-side/BFF". Eu reordenaria assim:

- **Fase 2a — Fechar gaps A da Fase 1** (não dá para escalar com cadastro automático aberto).
- **Fase 2b — Estabilizar a fundação** (rate limit distribuído, cleanup, CSP, HSTS).
- **Fase 2c — Consolidar dashboard em BFF + RPCs** (a Fase 2 que o Codex prometeu).
- **Fase 2d — Hardening de produção** (observabilidade, scheduler de sync, orçamento OpenAI).

Cada sub-fase é independente e pode ser shippada sozinha.

### 2.2 Fase 2a — Fechar gaps críticos

**Diff 2a.1 — Bootstrap só aprova emails de uma allowlist.**
`src/app/api/auth/bootstrap-profile/route.ts`:

```diff
+ const VORP_EMAIL_DOMAINS = (process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? '')
+   .split(',')
+   .map(s => s.trim().toLowerCase())
+   .filter(Boolean);
+
+ function emailIsAllowed(email: string) {
+   if (VORP_EMAIL_DOMAINS.length === 0) return false;
+   const domain = email.split('@')[1]?.toLowerCase();
+   return Boolean(domain && VORP_EMAIL_DOMAINS.includes(domain));
+ }

  if (existing) { /* ... */ }

+ if (!emailIsAllowed(email)) {
+   return NextResponse.json(
+     { error: 'Acesso restrito. Solicite acesso ao administrador.' },
+     { status: 403 },
+   );
+ }

  const { count, error: countError } = ...
```

Adicionar `AUTH_ALLOWED_EMAIL_DOMAINS=grupovorp.com.br` (ou o que for) em `.env.local` e em produção. Sem essa env, ninguém entra automaticamente.

**Diff 2a.2 — Remover insert pelo cliente no AuthContext.**
`src/components/AuthContext.tsx` linhas 110-133. Substituir por: se bootstrap server falhou e não veio profile, sair (`signOut()` e `setAuthError`). Sem fallback de insert.

**Diff 2a.3 — Endurecer fail-open implícito.**
`src/components/AuthContext.tsx` linhas 218-224:

```diff
-  const role = profile?.role ?? 'Consultor';
-  const permissions = profile?.status === 'Inativo'
-    ? []
-    : normalizePermissions(
-      profile?.permissoes,
-      role === 'Administrador' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CONSULTOR_PERMISSIONS,
-    );
+  const role: UserRole = profile?.role ?? 'Consultor';
+  const permissions: AppPermission[] = profile && profile.status === 'Ativo'
+    ? normalizePermissions(
+        profile.permissoes,
+        role === 'Administrador' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_CONSULTOR_PERMISSIONS,
+      )
+    : [];
```

Sem profile ativo = sem permissão. Ponto.

### 2.3 Fase 2b — Estabilizar fundação

**Diff 2b.1 — Rate limit no Postgres.**
Migrar `src/lib/rate-limit.ts` para uma função SQL ou para uma tabela `rate_limit_buckets (key text primary key, count int, reset_at timestamptz)` com upsert atômico. Alternativa: integrar Upstash Redis com `@upstash/ratelimit` se você já tiver Upstash.

**Diff 2b.2 — CSP + HSTS no `next.config.ts`.**

```diff
   headers: [
     { key: 'X-Frame-Options', value: 'DENY' },
     { key: 'X-Content-Type-Options', value: 'nosniff' },
     { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
     { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
+    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
+    { key: 'Content-Security-Policy', value:
+      "default-src 'self'; " +
+      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
+      "style-src 'self' 'unsafe-inline'; " +
+      "img-src 'self' data: blob: https:; " +
+      "connect-src 'self' https://*.supabase.co https://api.openai.com; " +
+      "font-src 'self' data:; " +
+      "frame-ancestors 'none';"
+    },
   ],
```

`unsafe-inline`/`unsafe-eval` são feios mas o Next + Tailwind usam inline. Se quiser CSP estrita, precisa migrar pra nonces — refator separado.

**Diff 2b.3 — Limpeza do bucket de rate limit (se manter em memória temporariamente).**

```diff
+ const MAX_BUCKETS = 10_000;
+ function maybeCleanup() {
+   if (buckets.size < MAX_BUCKETS) return;
+   const now = Date.now();
+   for (const [k, v] of buckets) {
+     if (v.resetAt <= now) buckets.delete(k);
+   }
+ }

  export function checkRateLimit(...) {
+   maybeCleanup();
    ...
```

**Diff 2b.4 — Remover `SYNC_SECRET` do `.env.local`.** Trabalho de 5 segundos.

### 2.4 Fase 2c — BFF do dashboard

Esta é a refatoração estrutural. Proposta:

**Diff 2c.1 — Nova rota `src/app/api/dashboard/route.ts`.**
Recebe `?mes=YYYY-MM&consultorId=...`. Exige bearer auth com permissão `dashboard.overview`. Server-side, faz **uma RPC só** no Postgres que retorna o pacote inteiro `{ auds, reunioes, vMetas, metas, churn, conf, tipoScores, rankAtend, metasProd, prevAuds, prevMetas, prevConf, prevTipoScores }`. Aplica scope-check (consultor só vê o próprio se não tiver `filters.consultores.todos`). Adiciona `Cache-Control: private, max-age=30` para reduzir hit rate.

**Diff 2c.2 — Nova RPC `dashboard_snapshot(p_mes_ano text, p_consultor_id uuid)`.**
Migration em `supabase/migrations/`:

```sql
CREATE OR REPLACE FUNCTION public.dashboard_snapshot(
  p_mes_ano text,
  p_consultor_id uuid DEFAULT NULL,
  p_prev_mes_ano text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql STABLE
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'auds',   (SELECT jsonb_agg(a.*) FROM auditorias_mensais a WHERE a.mes_ano = p_mes_ano AND (p_consultor_id IS NULL OR a.consultor_id = p_consultor_id)),
    'reunioes', (SELECT jsonb_agg(v.*) FROM view_reunioes_consultor v WHERE v.mes_ano = p_mes_ano AND (p_consultor_id IS NULL OR v.consultor_id = p_consultor_id)),
    -- ... (vMetas, metas, churn, conf, tipoScores, rankAtend, metasProd)
    'prev', CASE WHEN p_prev_mes_ano IS NULL THEN NULL ELSE jsonb_build_object(
      'auds', (SELECT jsonb_agg(a.*) FROM auditorias_mensais a WHERE a.mes_ano = p_prev_mes_ano AND (p_consultor_id IS NULL OR a.consultor_id = p_consultor_id)),
      -- ... prev metas, conf, tipoScores
    ) END
  );
$$;
```

Uma round-trip por filtro em vez de 13. RLS continua valendo (SECURITY INVOKER respeita permissões do caller). Para o servidor-BFF que usa service role, essa proteção é redundante — então o servidor faz scope-check antes.

**Diff 2c.3 — Refatorar `useDashboardData.ts`.**

```diff
- import { getAuditoriasMensais, getViewReunioes, ... } from '@/lib/api';
- async function fetchAll(...) {
-   const [...] = await Promise.all([...13 queries...]);
- }
+ async function fetchDashboard(month, consultorId, accessToken) {
+   const params = new URLSearchParams({ mes: labelToMesAno(month), consultorId });
+   const r = await fetch(`/api/dashboard?${params}`, {
+     headers: { Authorization: `Bearer ${accessToken}` }
+   });
+   if (!r.ok) throw new Error((await r.json())?.error ?? 'falha no dashboard');
+   return r.json();
+ }
```

**Diff 2c.4 — Deprecar funções de view em `src/lib/api.ts`.**
`getViewReunioes`, `getViewMetas`, `getViewFlags`, `getViewConformidade`, `getScoresPorTipo`, `getRankingAtendidosMes`, `getMetasBatidasPorProduto` — marcar como `@deprecated` e migrar todos os callers para o BFF. Onde tiver caller fora do dashboard, ou cria endpoint específico, ou esses callers continuam usando RLS.

**Risco da 2c**: refator grande, mexe em tipos. Mitigar com:
1. Sub-PR só com RPC + endpoint, sem mexer no cliente (rota nova vive em paralelo).
2. Sub-PR mudando o `useDashboardData` para chamar o endpoint novo.
3. Sub-PR removendo as funções deprecated.

### 2.5 Fase 2d — Hardening de produção

**Diff 2d.1 — Cron Vercel para sync.**
`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/vorp/sync/cron", "schedule": "0 */6 * * *" }
  ]
}
```

Nova rota `src/app/api/vorp/sync/cron/route.ts` — executa `syncAll()` com lock (advisory lock no Postgres) e header secreto que só o cron Vercel injeta (`x-vercel-cron`).

**Diff 2d.2 — Tabela `openai_usage` para orçamento.**

```sql
CREATE TABLE openai_usage (
  day date PRIMARY KEY,
  call_count int DEFAULT 0,
  estimated_cost numeric DEFAULT 0
);
```

Antes de chamar OpenAI em insights, fazer `SELECT estimated_cost FROM openai_usage WHERE day = current_date` e abortar com 503 se passar do teto. Atualizar contador depois.

**Diff 2d.3 — Sentry + métricas mínimas.**
`@sentry/nextjs` no `instrumentation.ts`. Métricas: `insights_ai_calls_total`, `dashboard_query_duration_ms`, `vorp_sync_failures_total`.

**Diff 2d.4 — Suite de teste de rotas.**
`vitest` + supertest contra as rotas. Casos: 401 sem token, 403 com permissão errada, 200 happy, 429 rate limit.

### 2.6 Ordem de execução recomendada

1. **2a.1, 2a.2, 2a.3** — fechar gaps A. Tarefa pequena, alto impacto. Subir hoje.
2. **2b.4** — apagar `SYNC_SECRET` do `.env.local`. 30 segundos.
3. **2b.2** — CSP + HSTS. ~30 minutos.
4. **2b.3** — cleanup do rate-limit em memória. ~15 minutos.
5. **2b.1** — rate limit distribuído no Postgres. ~2 horas.
6. **2c.1 + 2c.2** — endpoint BFF + RPC. ~4 horas.
7. **2c.3 + 2c.4** — migração do `useDashboardData`. ~2 horas.
8. **2d.1** — cron de sync. ~1 hora.
9. **2d.2** — orçamento OpenAI. ~1 hora.
10. **2d.3** — Sentry. ~1 hora.
11. **2d.4** — testes. ~3 horas.

Total estimado: **~16 horas** de trabalho linear, distribuído em ~3 PRs (2a, 2b, 2c — 2d pode ir junto com 2c).

### 2.7 O que eu NÃO recomendo fazer agora

- **CSP estrita com nonces** — refator alto, vai quebrar Tailwind/Next. Faça quando tudo o resto estiver estável.
- **Migrar para Server Components puro** — você tem muito useSWR+SWR cache, mexer nisso é re-arquitetar a UI inteira. Postergar.
- **Trocar Supabase por outra coisa** — não há razão. RLS + RPC + service role é suficiente para o tamanho atual.
- **Migrar tudo para tRPC ou Hono** — o Next API Routes está fazendo o serviço. Ganho marginal não justifica.

---

## Pergunta para você

Depois de ler isto, me diga qual sub-fase você quer que eu aplique primeiro. Minha sugestão pessoal: **2a inteira hoje** (uns 30 minutos), porque enquanto o cadastro estiver aberto a qualquer Google account, todo o hardening do Codex tem uma porta lateral.
