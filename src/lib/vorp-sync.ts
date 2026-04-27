/**
 * SincronizaÃ§Ã£o Vorp System â†’ Supabase
 *
 * Cada funÃ§Ã£o busca os dados do NocoDB e faz upsert nas tabelas
 * vorp_* do Supabase, usando o Id do NocoDB como chave primÃ¡ria.
 * Um log de execuÃ§Ã£o Ã© gravado em vorp_sync_log.
 */

import { supabase } from './supabase';
import {
  getVorpColaboradores,
  getVorpProjetos,
  getVorpProdutos,
  getVorpChurn,
  getVorpHealthScores,
  getVorpMetas,
  resolveIds,
  resolveNome,
  resolveNomes,
  resolveNomesTexto,
  type VorpProjeto,
} from './vorp-api';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function logSync(
  tabela: string,
  registros: number,
  status: 'ok' | 'erro',
  mensagem?: string,
) {
  await supabase
    .from('vorp_sync_log')
    .insert({ tabela, registros, status, mensagem: mensagem ?? null });
}

function normalizeKey(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumberOrNull(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toHealthMetric(value: unknown) {
  if (typeof value === 'string') {
    const key = normalizeKey(value);
    const map: Record<string, number> = {
      ruim: 1,
      normal: 2,
      bom: 3,
      otimo: 4,
      excelente: 4,
    };
    if (key in map) return map[key];
  }

  return toNumberOrNull(value);
}

async function getProjetoIdByName() {
  const { data } = await supabase
    .from('vorp_projetos')
    .select('vorp_id, nome, empresa_nome');

  const map = new Map<string, string>();
  (data ?? []).forEach((p: { vorp_id: string; nome?: string | null; empresa_nome?: string | null }) => {
    const nomeKey = normalizeKey(p.nome);
    const empresaKey = normalizeKey(p.empresa_nome);
    if (nomeKey) map.set(nomeKey, p.vorp_id);
    if (empresaKey) map.set(empresaKey, p.vorp_id);
  });
  return map;
}

function resolveProjetoVorpId(
  field: Parameters<typeof resolveNome>[0],
  projetoIdByName: Map<string, string>,
) {
  const linkedId = resolveIds(field)[0];
  if (linkedId && Array.from(projetoIdByName.values()).includes(linkedId)) return linkedId;
  return projetoIdByName.get(normalizeKey(resolveNome(field))) ?? null;
}

function hasGrowthVertical(field: Parameters<typeof resolveNome>[0]) {
  return resolveNomes(field).some((nome) => normalizeKey(nome) === 'growth');
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sync individual por entidade
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function syncColaboradores() {
  try {
    const rows = await getVorpColaboradores();
    const upsert = rows.map((r) => ({
      vorp_id:   String(r.Id),
      nome:      r.Nome,
      email:     r.Email     ?? null,
      telefone:  r.Telefone  ?? null,
      cargo:     r.Cargo     ?? null,
      status:    r.Status    ?? null,
      vertical:  r.Vertical  ?? null,
      synced_at: new Date().toISOString(),
    }));

    if (upsert.length > 0) {
      const { error } = await supabase
        .from('vorp_colaboradores')
        .upsert(upsert, { onConflict: 'vorp_id' });
      if (error) throw error;
    }

    // Vincula consultores locais que ainda não têm vorp_id, cruzando pelo nome.
    await supabase.rpc('link_consultores_vorp');

    await logSync('vorp_colaboradores', upsert.length, 'ok');
    return { ok: true, count: upsert.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('vorp_colaboradores', 0, 'erro', msg);
    return { ok: false, error: msg };
  }
}

export async function syncProdutos() {
  try {
    const rows = await getVorpProdutos();
    const upsert = rows.map((r) => ({
      vorp_id:   String(r.Id),
      nome:      r.Nome,
      tipo:      r.Tipo     ?? null,
      vertical:  r.Vertical ?? null,
      synced_at: new Date().toISOString(),
    }));

    if (upsert.length > 0) {
      const { error } = await supabase
        .from('vorp_produtos')
        .upsert(upsert, { onConflict: 'vorp_id' });
      if (error) throw error;
    }

    await logSync('vorp_produtos', upsert.length, 'ok');
    return { ok: true, count: upsert.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('vorp_produtos', 0, 'erro', msg);
    return { ok: false, error: msg };
  }
}

export async function syncChurn() {
  try {
    const rows = await getVorpChurn();
    const projetoIdByName = await getProjetoIdByName();
    const upsert = rows
      .map((r) => {
        const projetoVorpId = resolveProjetoVorpId(r.Projetos, projetoIdByName);
        return {
          vorp_id:          String(r.Id),
          projeto_nome:     resolveNome(r.Projetos),
          projeto_vorp_id:  projetoVorpId,
          status:           r.Status   ?? null,
          tipo:             r.Tipo     ?? null,
          vertical:         r.Vertical ?? null,
          vorp_created_at:  r.created_at ?? null,
          synced_at:        new Date().toISOString(),
        };
      })
      .filter((r) => r.projeto_vorp_id);

    if (upsert.length > 0) {
      const { error } = await supabase
        .from('vorp_churn')
        .upsert(upsert, { onConflict: 'vorp_id' });
      if (error) throw error;
    }

    await logSync('vorp_churn', upsert.length, 'ok');
    return { ok: true, count: upsert.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('vorp_churn', 0, 'erro', msg);
    return { ok: false, error: msg };
  }
}

async function syncProjetoColaboradores(projetos: VorpProjeto[]) {
  // Carrega espelho de colaboradores: vorp_id, nome e ID interno do consultor.
  const { data: colabsData } = await supabase
    .from('vorp_colaboradores')
    .select('vorp_id, nome');

  // Map: nome normalizado → vorp_id (para lookup por nome do campo lookup NocoDB)
  const nomeToVorpId = new Map<string, string>(
    (colabsData ?? []).map((c: { vorp_id: string; nome: string }) => [
      normalizeKey(c.nome),
      c.vorp_id,
    ]),
  );

  // Map: vorp_colaborador_id → consultores.id (para preenchimento automático)
  const { data: consultoresData } = await supabase
    .from('consultores')
    .select('id, vorp_colaborador_id');
  const consultorMap = new Map<string, string>(
    (consultoresData ?? [])
      .filter((c): c is { id: string; vorp_colaborador_id: string } =>
        Boolean(c.vorp_colaborador_id))
      .map((c) => [c.vorp_colaborador_id, c.id]),
  );

  const now = new Date().toISOString();
  const links: Array<{
    projeto_vorp_id: string;
    vorp_colaborador_id: string;
    consultor_id: string | null;
    colaborador_nome_snapshot: string | null;
    origem: string;
    confianca_match: number;
    synced_at: string;
  }> = [];
  const projetoIds: string[] = [];

  for (const r of projetos) {
    const projetoVorpId = String(r.Id);
    projetoIds.push(projetoVorpId);

    // NocoDB v3 retorna o campo linked "Colaboradores" apenas como contagem.
    // O campo lookup "Nome colaborador" (ou "Nome do colaborador") traz os nomes
    // derivados diretamente dos registros vinculados — alta confiança de match.
    const colabNomes = resolveNomes(
      r['Nome colaborador'] ?? r['Nome do colaborador'] ?? r.Colaboradores,
    );

    for (const nome of colabNomes) {
      const vorpId = nomeToVorpId.get(normalizeKey(nome));
      if (!vorpId) continue; // sem match → não insere (cai no pendências via SQL)
      links.push({
        projeto_vorp_id:           projetoVorpId,
        vorp_colaborador_id:       vorpId,
        consultor_id:              consultorMap.get(vorpId) ?? null,
        colaborador_nome_snapshot: nome,
        origem:                    'sync_nome_lookup',
        confianca_match:           1.00,
        synced_at:                 now,
      });
    }
  }

  if (links.length > 0) {
    const { error } = await supabase
      .from('vorp_projeto_colaboradores')
      .upsert(links, { onConflict: 'projeto_vorp_id,vorp_colaborador_id' });
    if (error) throw error;
  }

  // Remove vínculos obsoletos: colaboradores que não estão mais no projeto.
  if (projetoIds.length > 0) {
    const { data: existing } = await supabase
      .from('vorp_projeto_colaboradores')
      .select('projeto_vorp_id, vorp_colaborador_id')
      .in('projeto_vorp_id', projetoIds);

    const currentPairs = new Set(
      links.map((l) => `${l.projeto_vorp_id}:${l.vorp_colaborador_id}`),
    );

    const stale = (existing ?? []).filter(
      (r: { projeto_vorp_id: string; vorp_colaborador_id: string }) =>
        !currentPairs.has(`${r.projeto_vorp_id}:${r.vorp_colaborador_id}`),
    );

    for (const row of stale) {
      await supabase
        .from('vorp_projeto_colaboradores')
        .delete()
        .eq('projeto_vorp_id', row.projeto_vorp_id)
        .eq('vorp_colaborador_id', row.vorp_colaborador_id);
    }
  }
}

export async function syncProjetos() {
  try {
    const todos = await getVorpProjetos();

    // Filtra projetos da vertical Growth pela vertical herdada do produto.
    const growthProjetos = todos.filter((p) => {
      return hasGrowthVertical(p['Vertical (from Produtos)']);
    });

    const upsert = growthProjetos.map((r: VorpProjeto) => ({
      vorp_id:          String(r.Id),
      nome:             r.Nome,
      empresa_nome:     resolveNome(r.Empresas),
      status:           r.Status ?? null,
      produto_nome:     resolveNome(r.Produtos),
      // NocoDB v3 retorna Colaboradores como contagem; usa o campo lookup de nome.
      colaborador_nome: resolveNomesTexto(
        r['Nome colaborador'] ?? r['Nome do colaborador'] ?? r.Colaboradores,
      ),
      fee:              toNumberOrNull(r.FEE),
      canal:            r.Canal  ?? null,
      synced_at:        new Date().toISOString(),
    }));

    if (upsert.length > 0) {
      const { error } = await supabase
        .from('vorp_projetos')
        .upsert(upsert, { onConflict: 'vorp_id' });
      if (error) throw error;
    }

    // Sincroniza vínculos por ID canônico do NocoDB (confianca_match = 1.00).
    await syncProjetoColaboradores(growthProjetos);

    await logSync('vorp_projetos', upsert.length, 'ok');
    return { ok: true, count: upsert.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('vorp_projetos', 0, 'erro', msg);
    return { ok: false, error: msg };
  }
}

export async function syncHealthScores() {
  try {
    // Busca IDs dos projetos Growth jÃ¡ sincronizados
    const projetoIdByName = await getProjetoIdByName();

    const todos = await getVorpHealthScores();

    const growthHS = todos.filter((hs) => {
      const nome = normalizeKey(resolveNome(hs.Projetos));
      return nome ? projetoIdByName.has(nome) : false;
    });

    const upsert = growthHS.map((r) => ({
      vorp_id:                    String(r.Id),
      projeto_nome:               resolveNome(r.Projetos),
      projeto_vorp_id:            resolveProjetoVorpId(r.Projetos, projetoIdByName),
      ano:                        r.ano                       ?? null,
      mes:                        r.mes                       ?? null,
      pontuacao:                  toNumberOrNull(r.pontuacao),
      classificacao:              r.classificacao             ?? null,
      engajamento_cliente:        toHealthMetric(r.engajamento_cliente),
      entregas:                   toHealthMetric(r.entregas),
      relacionamento:             toHealthMetric(r.relacionamento),
      resultado:                  toHealthMetric(r.resultado),
      implementacao_ferramentas:  toHealthMetric(r.implementacao_ferramentas),
      entrega_treinador_vendas:   toHealthMetric(r.entrega_treinador_vendas),
      observacoes:                r.observacoes               ?? null,
      synced_at:                  new Date().toISOString(),
    }));

    if (upsert.length > 0) {
      const { error } = await supabase
        .from('vorp_healthscores')
        .upsert(upsert, { onConflict: 'vorp_id' });
      if (error) throw error;
    }

    await logSync('vorp_healthscores', upsert.length, 'ok');
    return { ok: true, count: upsert.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('vorp_healthscores', 0, 'erro', msg);
    return { ok: false, error: msg };
  }
}

export async function syncMetas() {
  try {
    const projetoIdByName = await getProjetoIdByName();

    const todos = await getVorpMetas();

    const growthMetas = todos.filter((m) => {
      const nome = normalizeKey(resolveNome(m.Projetos));
      return nome ? projetoIdByName.has(nome) : false;
    });

    const upsert = growthMetas.map((r) => ({
      vorp_id:         String(r.Id),
      projeto_nome:    resolveNome(r.Projetos),
      projeto_vorp_id: resolveProjetoVorpId(r.Projetos, projetoIdByName),
      ano:             r.ano            ?? null,
      mes:             r.mes            ?? null,
      meta_projetada:  toNumberOrNull(r.meta_projetada),
      meta_realizada:  toNumberOrNull(r.meta_realizada),
      observacoes:     r.observacoes    ?? null,
      synced_at:       new Date().toISOString(),
    }));

    if (upsert.length > 0) {
      const { error } = await supabase
        .from('vorp_metas')
        .upsert(upsert, { onConflict: 'vorp_id' });
      if (error) throw error;
    }

    await logSync('vorp_metas', upsert.length, 'ok');
    return { ok: true, count: upsert.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('vorp_metas', 0, 'erro', msg);
    return { ok: false, error: msg };
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sync completo (todas as entidades em ordem)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SyncResult {
  colaboradores: Awaited<ReturnType<typeof syncColaboradores>>;
  produtos:      Awaited<ReturnType<typeof syncProdutos>>;
  projetos:      Awaited<ReturnType<typeof syncProjetos>>;
  churn:         Awaited<ReturnType<typeof syncChurn>>;
  healthscores:  Awaited<ReturnType<typeof syncHealthScores>>;
  metas:         Awaited<ReturnType<typeof syncMetas>>;
}

export async function syncAll(): Promise<SyncResult> {
  // Ordem importa: projetos dependem de produtos/colaboradores para filtro
  const colaboradores = await syncColaboradores();
  const produtos      = await syncProdutos();
  // Projetos precisam existir antes de cruzar IDs em churn, HS e metas.
  const projetos      = await syncProjetos();
  // Depois disso, as tabelas dependentes podem rodar em paralelo.
  const [churn, healthscores, metas] = await Promise.all([
    syncChurn(),
    syncHealthScores(),
    syncMetas(),
  ]);

  // Atualiza todas as FKs de correlação após o sync completo
  await supabase.rpc('link_vorp_fks');

  return { colaboradores, produtos, projetos, churn, healthscores, metas };
}

