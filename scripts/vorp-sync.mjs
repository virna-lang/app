/**
 * Sync Vorp System (NocoDB) → Supabase — Vertical Growth
 * Execute: node scripts/vorp-sync.mjs
 */

import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://nocodb-p0k4gk4cs0g40gkg00gcko0w.31.97.254.12.sslip.io';
const API_KEY  = 'ZYax7yU9Rho0v2lNjezmIL6vC_-wWi2auiojayns';
const BASE_ID  = 'pd90pmw26pxw28p';
const VERTICAL = 'Growth';

const SUPABASE_URL = 'https://euivfkoulfaslbypmqyl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v';

const TABLES = {
  colaboradores: 'mgfth3rkiui6cqe',
  projetos:      'm1ncqs230heea1j',
  produtos:      'mb8stqr8kjzjf2n',
  churn:         'mw3njb9laen7fa7',
  healthscores:  'mtq9gdiibpu49nc',
  metas:         'mlstarc6ceajj6b',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── fetch com paginação ───────────────────────────────────

async function fetchNoco(tableId, where) {
  const url = new URL(`/api/v3/data/${BASE_ID}/${tableId}/records`, BASE_URL);
  url.searchParams.set('limit', '1000');
  if (where) url.searchParams.set('where', where);

  const res = await fetch(url.toString(), { headers: { 'xc-token': API_KEY } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NocoDB ${tableId}: HTTP ${res.status} — ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  // NocoDB v3 retorna { records: [{id, fields}] } ou { list: [...] }
  return (data.records ?? data.list ?? []).map(r => ({ _id: r.id ?? r.Id, ...(r.fields ?? r) }));
}

async function logSync(tabela, registros, status, mensagem) {
  await supabase.from('vorp_sync_log').insert({ tabela, registros, status, mensagem: mensagem ?? null });
}

// ─── Colaboradores ────────────────────────────────────────

async function syncColaboradores() {
  console.log('→ Colaboradores...');
  const rows = await fetchNoco(TABLES.colaboradores, `(Vertical,eq,${VERTICAL})`);

  const upsert = rows.map(r => ({
    vorp_id:   String(r._id),
    nome:      r['Nome completo'] ?? r['Nome'] ?? '(sem nome)',
    email:     r['Email']    ?? null,
    telefone:  r['Telefone'] ?? null,
    cargo:     r['Cargo']    ?? null,
    status:    r['Status']   ?? null,
    vertical:  r['Vertical'] ?? null,
    synced_at: new Date().toISOString(),
  }));

  if (upsert.length > 0) {
    const { error } = await supabase.from('vorp_colaboradores').upsert(upsert, { onConflict: 'vorp_id' });
    if (error) throw error;
  }
  await logSync('vorp_colaboradores', upsert.length, 'ok');
  console.log(`  ✓ ${upsert.length} colaboradores`);
  return upsert.length;
}

// ─── Produtos ─────────────────────────────────────────────

async function syncProdutos() {
  console.log('→ Produtos...');
  const rows = await fetchNoco(TABLES.produtos, `(Vertical,eq,${VERTICAL})`);

  const upsert = rows.map(r => ({
    vorp_id:   String(r._id),
    nome:      r['Nome']     ?? '(sem nome)',
    tipo:      r['Tipo']     ?? null,
    vertical:  r['Vertical'] ?? null,
    synced_at: new Date().toISOString(),
  }));

  if (upsert.length > 0) {
    const { error } = await supabase.from('vorp_produtos').upsert(upsert, { onConflict: 'vorp_id' });
    if (error) throw error;
  }
  await logSync('vorp_produtos', upsert.length, 'ok');
  console.log(`  ✓ ${upsert.length} produtos`);
  return upsert.length;
}

// ─── Projetos ─────────────────────────────────────────────

async function syncProjetos() {
  console.log('→ Projetos...');
  // Busca todos, filtra vertical Growth e apenas status Ativo
  const rows = await fetchNoco(TABLES.projetos);
  const allRows = rows.filter(r => {
    const vertical = r['Vertical (from Produtos)'];
    const isGrowth = vertical === VERTICAL ||
      (Array.isArray(vertical) && vertical.includes(VERTICAL));
    return isGrowth && r['Status'] === 'Ativo';
  });

  // Busca quais projetos já têm tratativa_cs marcado para não sobrescrever
  const { data: existentes } = await supabase
    .from('vorp_projetos')
    .select('vorp_id, tratativa_cs, tratativa_cs_obs');
  const mapaExistentes = Object.fromEntries(
    (existentes ?? []).map(p => [p.vorp_id, p])
  );

  const upsert = allRows.map(r => {
    const id = String(r._id);
    const existente = mapaExistentes[id];
    return {
      vorp_id:          id,
      nome:             r['Nome do projeto']            ?? '(sem nome)',
      empresa_nome:     r['Empresas']?.[0]?.['Nome']   ?? r['Empresas'] ?? null,
      status:           r['Status']                    ?? null,
      produto_nome:     r['Nome (from Produtos)']      ?? null,
      colaborador_nome: r['Nome colaborador']           ?? null,
      fee:              r['FEE'] != null ? Number(r['FEE']) : null,
      canal:            r['Canal']                     ?? null,
      // Preserva tratativa_cs se já foi marcado manualmente
      tratativa_cs:     existente?.tratativa_cs     ?? false,
      tratativa_cs_obs: existente?.tratativa_cs_obs ?? null,
      synced_at:        new Date().toISOString(),
    };
  });

  if (upsert.length > 0) {
    const { error } = await supabase.from('vorp_projetos').upsert(upsert, { onConflict: 'vorp_id' });
    if (error) throw error;
  }
  await logSync('vorp_projetos', upsert.length, 'ok');
  console.log(`  ✓ ${upsert.length} projetos`);
  return upsert.length;
}

// ─── Churn ────────────────────────────────────────────────

async function syncChurn(nomesGrowth) {
  console.log('→ Churn...');
  const rows = await fetchNoco(TABLES.churn);

  // Filtra pelos projetos já identificados como Growth
  const filtered = rows.filter(r => {
    const nome = r['Nome do projeto'] ?? r['Projeto'];
    return nome ? nomesGrowth.has(nome) : false;
  });

  const upsert = filtered.map(r => ({
    vorp_id:          String(r._id),
    projeto_nome:     r['Nome do projeto']        ?? r['Projeto'] ?? null,
    status:           r['Status']                 ?? null,
    tipo:             r['Motivo Macro do Churn']  ?? null,
    vertical:         VERTICAL,
    vorp_created_at:  r['Data da solicitação']    ?? r['created_at'] ?? null,
    synced_at:        new Date().toISOString(),
  }));

  if (upsert.length > 0) {
    const { error } = await supabase.from('vorp_churn').upsert(upsert, { onConflict: 'vorp_id' });
    if (error) throw error;
  }
  await logSync('vorp_churn', upsert.length, 'ok');
  console.log(`  ✓ ${upsert.length} churns`);
  return upsert.length;
}

// ─── HealthScores ─────────────────────────────────────────

async function syncHealthScores(nomesGrowth) {
  console.log('→ HealthScores...');
  const rows = await fetchNoco(TABLES.healthscores);

  const getNomeProjeto = (p) => p?.fields?.['Nome do projeto'] ?? p?.['Nome do projeto'] ?? p?.Nome ?? null;

  const filtered = rows.filter(r => {
    const p = r['Projetos'];
    if (!p) return false;
    if (Array.isArray(p)) return p.some(x => nomesGrowth.has(getNomeProjeto(x) ?? ''));
    return nomesGrowth.has(getNomeProjeto(p) ?? '');
  });

  const upsert = filtered.map(r => {
    const p = r['Projetos'];
    const projetoNome = Array.isArray(p) ? getNomeProjeto(p[0]) : getNomeProjeto(p);

    return {
      vorp_id:                    String(r._id),
      projeto_nome:               projetoNome,
      ano:                        r['ano']  != null ? Number(r['ano'])  : null,
      mes:                        r['mes']  != null ? Number(r['mes'])  : null,
      pontuacao:                  r['pontuacao']                 != null ? Number(r['pontuacao'])                 : null,
      classificacao:              r['classificacao']             ?? null,
      engajamento_cliente:        r['engajamento_cliente']       != null ? Number(r['engajamento_cliente'])       : null,
      entregas:                   r['entregas']                  != null ? Number(r['entregas'])                  : null,
      relacionamento:             r['relacionamento']            != null ? Number(r['relacionamento'])            : null,
      resultado:                  r['resultado']                 != null ? Number(r['resultado'])                 : null,
      implementacao_ferramentas:  r['implementacao_ferramentas'] != null ? Number(r['implementacao_ferramentas']) : null,
      entrega_treinador_vendas:   r['entrega_treinador_vendas']  != null ? Number(r['entrega_treinador_vendas'])  : null,
      observacoes:                r['observacoes'] ?? null,
      synced_at:                  new Date().toISOString(),
    };
  });

  if (upsert.length > 0) {
    const { error } = await supabase.from('vorp_healthscores').upsert(upsert, { onConflict: 'vorp_id' });
    if (error) throw error;
  }
  await logSync('vorp_healthscores', upsert.length, 'ok');
  console.log(`  ✓ ${upsert.length} healthscores`);
  return upsert.length;
}

// ─── Metas ────────────────────────────────────────────────

async function syncMetas(nomesGrowth) {
  console.log('→ Metas...');
  const rows = await fetchNoco(TABLES.metas);

  const getNomeProjeto2 = (p) => p?.fields?.['Nome do projeto'] ?? p?.['Nome do projeto'] ?? p?.Nome ?? null;

  const filtered = rows.filter(r => {
    const p = r['Projetos'];
    if (!p) return false;
    if (Array.isArray(p)) return p.some(x => nomesGrowth.has(getNomeProjeto2(x) ?? ''));
    return nomesGrowth.has(getNomeProjeto2(p) ?? '');
  });

  const upsert = filtered.map(r => {
    const p = r['Projetos'];
    const projetoNome = Array.isArray(p) ? getNomeProjeto2(p[0]) : getNomeProjeto2(p);

    return {
      vorp_id:         String(r._id),
      projeto_nome:    projetoNome,
      ano:             r['ano'] != null ? Number(r['ano']) : null,
      mes:             r['mes'] != null ? Number(r['mes']) : null,
      meta_projetada:  r['meta_projetada'] != null ? Number(r['meta_projetada']) : null,
      meta_realizada:  r['meta_realizada'] != null ? Number(r['meta_realizada']) : null,
      observacoes:     r['observacoes'] ?? null,
      synced_at:       new Date().toISOString(),
    };
  });

  if (upsert.length > 0) {
    const { error } = await supabase.from('vorp_metas').upsert(upsert, { onConflict: 'vorp_id' });
    if (error) throw error;
  }
  await logSync('vorp_metas', upsert.length, 'ok');
  console.log(`  ✓ ${upsert.length} metas`);
  return upsert.length;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log('🔄 Iniciando sync Vorp System → Supabase\n');
  try {
    await syncColaboradores();
    await syncProdutos();
    await syncProjetos();

    // Carrega nomes dos projetos Growth para filtrar churn/hs/metas
    const { data: projetosGrowth } = await supabase.from('vorp_projetos').select('nome');
    const nomesGrowth = new Set((projetosGrowth ?? []).map(p => p.nome));
    console.log(`  (${nomesGrowth.size} projetos Growth identificados)`);

    await syncChurn(nomesGrowth);
    await syncHealthScores(nomesGrowth);
    await syncMetas(nomesGrowth);

    console.log('\n✅ Sync concluído com sucesso!');
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
}

main();
