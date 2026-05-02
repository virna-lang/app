# Handoff — onde paramos e como retomar

> Ultimo update: 2026-05-01, fim de tarde.
> Ver tambem: `AUDITORIA_FASE1_E_PLANO_FASE2.md` (auditoria completa + plano detalhado).

---

## O que ja esta em producao

**Fase 1 do Codex (hardening critico)** — finalmente subiu pro git e Vercel.
Servidor virou dono da regra: rotas `/api/insights`, `/api/vorp/sync`, `/api/admin/users` exigem sessao real e papel correto. Rate limit por usuario. Sem fallback de credencial publica hardcoded em `supabase.ts`. Build voltou a falhar com erro de tipo (`tsconfig.json` em `strict: true`). Headers de seguranca basicos em `next.config.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

**Fase 2a (gaps criticos da auditoria)** — fechada hoje.
Allowlist de dominios em `/api/auth/bootstrap-profile`: so emails `@grupovorp.com` conseguem cadastro automatico. AuthContext faz signOut em erro de profile (sem fail-open implicito). Removido o fallback de INSERT pelo cliente em `loadOrCreateProfile`.

**Lado Vercel:** env `AUTH_ALLOWED_EMAIL_DOMAINS=grupovorp.com` setada nos 3 ambientes (Production, Preview, Development).

---

## O que ainda falta — em ordem de prioridade

### Fase 2b — Estabilizar a fundacao (~3 horas de trabalho)

Sao 4 melhorias que nao mudam comportamento do produto, mas blindam producao:

1. **CSP + HSTS no `next.config.ts`.** Hoje voce tem so X-Frame-Options e nada de Content-Security-Policy nem Strict-Transport-Security. Sem CSP, qualquer XSS embutido vira sequestro de sessao.
2. **Rate limit em Postgres em vez de memoria.** O `src/lib/rate-limit.ts` hoje usa `Map` no processo. Em Vercel multi-instancia (que voce tem), cada replica tem seu proprio bucket — entao um usuario pode estourar o limite multiplicado pelo numero de replicas. Custo OpenAI fica desprotegido.
3. **Cleanup do Map de rate-limit (mitigacao temporaria).** Enquanto a versao Postgres nao sai, adicionar um cleanup que evita memory leak em producao.
4. **Remover `SYNC_SECRET` do `.env.local`** e do painel Vercel — variavel morta, nao e mais usada pelo codigo.

### Fase 2c — Consolidar dashboard em BFF (~6 horas)

Hoje `useDashboardData.ts` faz 13 queries paralelas por troca de filtro, todas direto do cliente para views Supabase. Isso e:
- Lento em escala (cold start RLS, latencia cliente <-> Supabase).
- Inseguro se RLS quebrar em qualquer view.
- Dificil de cachear.

Solucao: criar `/api/dashboard` como BFF (server-side), uma RPC `dashboard_snapshot` no Postgres que devolve o pacote inteiro em uma chamada, refatorar `useDashboardData` para chamar o BFF. Plano detalhado e diffs estao no `AUDITORIA_FASE1_E_PLANO_FASE2.md` se voce quiser revisar antes.

### Fase 2d — Hardening de producao (~5 horas)

1. **Cron Vercel para sync da Vorp.** Hoje sync depende de admin clicar manualmente. Criar `/api/vorp/sync/cron` com lock advisory no Postgres e schedule em `vercel.json`.
2. **Tabela `openai_usage` para orcamento global.** Antes de chamar OpenAI em insights, checar gasto do dia. Aborta com 503 se passar do teto.
3. **Sentry + metricas minimas.**
4. **Suite de teste de rotas.** Vitest contra as rotas — 401 sem token, 403 permissao errada, 200 happy, 429 rate limit.

---

## Como abrir a proxima sessao

**Opcao A — Voce escolhe a fase:**
> "Claude, abre o `HANDOFF_PROXIMA_SESSAO.md`. Quero atacar a Fase 2b inteira hoje."

(Ou 2c, ou 2d, ou um item especifico. A fase 2b e a mais rapida e baixo risco.)

**Opcao B — Voce nao sabe por onde comecar:**
> "Claude, le o `HANDOFF_PROXIMA_SESSAO.md` e o `AUDITORIA_FASE1_E_PLANO_FASE2.md`. Me sugere o proximo passo."

**Opcao C — Algo quebrou em producao e voce precisa diagnosticar:**
> "Claude, le o `HANDOFF_PROXIMA_SESSAO.md`. [Descreve o problema]. Ajuda eu debugar."

---

## Coisas que voce vai precisar ter em maos

- Acesso ao Supabase dashboard (https://supabase.com/dashboard, projeto `euivfkoulfaslbypmqyl`).
- Acesso ao painel do Vercel.
- PowerShell aberto na pasta do projeto. Padrao funciona: criamos scripts `.ps1` que voce roda com `.\nome-do-script.ps1`.
- Os conectores MCP que conectamos hoje continuam validos:
  - **Supabase MCP** (consigo rodar SQL direto)
  - **Vercel MCP** (com permissao limitada — provavelmente vai precisar reautenticar)

---

## Coisas a NAO fazer sozinha sem me consultar

- Rodar migrations novas em producao (sempre dry-run primeiro).
- Mexer em `next.config.ts` headers (CSP errada quebra app inteira).
- Deletar arquivos do `.git/worktrees/` ou tentar consertar git a mao.
- Apagar a env `AUTH_ALLOWED_EMAIL_DOMAINS` ou os perfis admin no `usuarios_app`.

---

## Ultima nota

Se aparecer um erro de build novo no Vercel apos mexer em qualquer coisa: a primeira pergunta e sempre "alguma coisa local nao foi commitada?". Hoje gastamos 1h descobrindo que a Fase 1 inteira do Codex estava fora do git. O ciclo `git add -u && git commit && git push` resolve 90% dos casos.
