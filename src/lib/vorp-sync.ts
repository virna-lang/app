/**
 * Sincronização Vorp System → Supabase
 *
 * Cada função busca os dados do NocoDB e faz upsert nas tabelas
 * vorp_* do Supabase, usando o Id do NocoDB como chave primária.
 * Um log de execução é gravado em vorp_sync_log.
 */

import { supabase } from './supabase';
import {
  getVorpColaboradores,
  getVorpProjetos,
  getVorpProdutos,
  getVorpChurn,
  getVorpHealthScores,
  getVorpMetas,
  resolveNome,
  type VorpProjeto,
} from './vorp-api';

const VERTICAL = process.env.VORP_VERTICAL ?? 'Growth';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Sync individual por entidade
// ─────────────────────────────────────────────

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
    const upsert = rows.map((r) => ({
      vorp_id:          String(r.Id),
      projeto_nome:     resolveNome(r.Projetos),
      status:           r.Status   ?? null,
      tipo:             r.Tipo     ?? null,
      vertical:         r.Vertical ?? null,
      vorp_created_at:  r.created_at ?? null,
      synced_at:        new Date().toISOString(),
    }));

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

export async function syncProjetos() {
  try {
    const todos = await getVorpProjetos();

    // Filtra projetos da vertical Growth via produto ou colaborador vinculado
    const growthProjetos = todos.filter((p) => {
      const produtos = Array.isArray(p.Produtos) ? p.Produtos : [];
      const colabs   = Array.isArray(p.Colaboradores) ? p.Colaboradores : [];
      const porProduto = produtos.some(
        (pr) => typeof pr === 'object' && pr.Vertical === VERTICAL,
      );
      const porColab = colabs.some(
        (c) => typeof c === 'object' && c.Vertical === VERTICAL,
      );
      return porProduto || porColab;
    });

    const upsert = growthProjetos.map((r: VorpProjeto) => ({
      vorp_id:          String(r.Id),
      nome:             r.Nome,
      empresa_nome:     resolveNome(r.Empresas as { Nome?: string }[]),
      status:           r.Status ?? null,
      produto_nome:     resolveNome(r.Produtos  as { Nome?: string }[]),
      colaborador_nome: resolveNome(r.Colaboradores as { Nome?: string }[]),
      fee:              r.FEE    ?? null,
      canal:            r.Canal  ?? null,
      synced_at:        new Date().toISOString(),
    }));

    if (upsert.length > 0) {
      const { error } = await supabase
        .from('vorp_projetos')
        .upsert(upsert, { onConflict: 'vorp_id' });
      if (error) throw error;
    }

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
    // Busca IDs dos projetos Growth já sincronizados
    const { data: projetosGrowth } = await supabase
      .from('vorp_projetos')
      .select('nome');
    const nomesGrowth = new Set(
      (projetosGrowth ?? []).map((p: { nome: string }) => p.nome),
    );

    const todos = await getVorpHealthScores();

    const growthHS = todos.filter((hs) => {
      const nome = resolveNome(hs.Projetos);
      return nome ? nomesGrowth.has(nome) : false;
    });

    const upsert = growthHS.map((r) => ({
      vorp_id:                    String(r.Id),
      projeto_nome:               resolveNome(r.Projetos),
      ano:                        r.ano                       ?? null,
      mes:                        r.mes                       ?? null,
      pontuacao:                  r.pontuacao                 ?? null,
      classificacao:              r.classificacao             ?? null,
      engajamento_cliente:        r.engajamento_cliente       ?? null,
      entregas:                   r.entregas                  ?? null,
      relacionamento:             r.relacionamento            ?? null,
      resultado:                  r.resultado                 ?? null,
      implementacao_ferramentas:  r.implementacao_ferramentas ?? null,
      entrega_treinador_vendas:   r.entrega_treinador_vendas  ?? null,
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
    const { data: projetosGrowth } = await supabase
      .from('vorp_projetos')
      .select('nome');
    const nomesGrowth = new Set(
      (projetosGrowth ?? []).map((p: { nome: string }) => p.nome),
    );

    const todos = await getVorpMetas();

    const growthMetas = todos.filter((m) => {
      const nome = resolveNome(m.Projetos);
      return nome ? nomesGrowth.has(nome) : false;
    });

    const upsert = growthMetas.map((r) => ({
      vorp_id:         String(r.Id),
      projeto_nome:    resolveNome(r.Projetos),
      ano:             r.ano            ?? null,
      mes:             r.mes            ?? null,
      meta_projetada:  r.meta_projetada ?? null,
      meta_realizada:  r.meta_realizada ?? null,
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

// ─────────────────────────────────────────────
// Sync completo (todas as entidades em ordem)
// ─────────────────────────────────────────────

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
  // Projetos em paralelo com churn (independentes após colab/produtos)
  const [projetos, churn] = await Promise.all([syncProjetos(), syncChurn()]);
  // HS e Metas dependem dos projetos já sincronizados
  const [healthscores, metas] = await Promise.all([
    syncHealthScores(),
    syncMetas(),
  ]);

  // Atualiza todas as FKs de correlação após o sync completo
  await supabase.rpc('link_vorp_fks');

  return { colaboradores, produtos, projetos, churn, healthscores, metas };
}
