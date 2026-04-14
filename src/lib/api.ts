import { supabase } from './supabase';
import type {
  Consultor,
  Cliente,
  AuditoriaMensal,
  AuditoriaItem,
  Reuniao,
  MetaMensal,
  FlagHealthScore,
  Churn,
  ViewReunioesConsultor,
  ViewMetasConsultor,
  ViewFlagsConsultor,
  ViewConformidadeConsultor,
} from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTORES
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsultores(): Promise<Consultor[]> {
  const { data, error } = await supabase
    .from('consultores')
    .select('*')
    .order('nome');
  if (error) { console.error('getConsultores:', error); return []; }
  return data ?? [];
}

export async function addConsultor(nome: string): Promise<Consultor | null> {
  const { data, error } = await supabase
    .from('consultores')
    .insert({ nome, status: 'Ativo' })
    .select()
    .single();
  if (error) { console.error('addConsultor:', error); return null; }
  return data;
}

export async function toggleConsultor(id: string, status: 'Ativo' | 'Inativo'): Promise<void> {
  const { error } = await supabase
    .from('consultores')
    .update({ status })
    .eq('id', id);
  if (error) console.error('toggleConsultor:', error);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientes(consultorId?: string): Promise<Cliente[]> {
  let query = supabase.from('clientes').select('*').order('nome');
  if (consultorId && consultorId !== 'all') {
    query = query.eq('consultor_id', consultorId);
  }
  const { data, error } = await query;
  if (error) { console.error('getClientes:', error); return []; }
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDITORIA — cabeçalho
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditoriasMensais(
  mesAno: string,
  consultorId?: string,
): Promise<AuditoriaMensal[]> {
  let query = supabase
    .from('auditoria_mensal')
    .select('*')
    .eq('mes_ano', mesAno);
  if (consultorId && consultorId !== 'all') {
    query = query.eq('consultor_id', consultorId);
  }
  const { data, error } = await query;
  if (error) { console.error('getAuditoriasMensais:', error); return []; }
  return data ?? [];
}

export async function getAuditoriaItens(auditoriaId: string): Promise<AuditoriaItem[]> {
  const { data, error } = await supabase
    .from('auditoria_itens')
    .select('*')
    .eq('auditoria_id', auditoriaId);
  if (error) { console.error('getAuditoriaItens:', error); return []; }
  return data ?? [];
}

export async function upsertAuditoriaMensal(
  payload: Omit<AuditoriaMensal, 'id' | 'clientes_ativos_real' | 'created_at'>,
): Promise<AuditoriaMensal | null> {
  const { data, error } = await supabase
    .from('auditoria_mensal')
    .upsert(payload, { onConflict: 'consultor_id,mes_ano' })
    .select()
    .single();
  if (error) { console.error('upsertAuditoriaMensal:', error); return null; }
  return data;
}

export async function updateAuditoriaItem(
  id: string,
  payload: {
    qtd_avaliados: number;
    qtd_conformes: number;
    observacao?: string | null;
    evidencia_url?: string | null;
    tipo?: string | null;
  },
): Promise<boolean> {
  const { error } = await supabase
    .from('auditoria_itens')
    .update(payload)
    .eq('id', id);
  if (error) { console.error('updateAuditoriaItem:', error); return false; }
  return true;
}

export async function deleteAuditoriaItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('auditoria_itens')
    .delete()
    .eq('id', id);
  if (error) { console.error('deleteAuditoriaItem:', error); return false; }
  return true;
}

export async function upsertAuditoriaItem(
  payload: Omit<AuditoriaItem, 'nota_pct' | 'conforme' | 'created_at'>,
): Promise<AuditoriaItem | null> {
  const { data, error } = await supabase
    .from('auditoria_itens')
    .upsert(payload) // Supabase uses 'id' by default if present
    .select()
    .single();
  if (error) { console.error('upsertAuditoriaItem:', error); return null; }
  return data;
}

export async function addAuditoriaItem(
  payload: Omit<AuditoriaItem, 'id' | 'nota_pct' | 'conforme' | 'created_at'>,
): Promise<AuditoriaItem | null> {
  const { data, error } = await supabase
    .from('auditoria_itens')
    .insert(payload)
    .select()
    .single();
  if (error) { console.error('addAuditoriaItem:', error); return null; }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// REUNIÕES
// ─────────────────────────────────────────────────────────────────────────────

export async function getReunioes(
  mesAno: string,
  consultorId?: string,
): Promise<Reuniao[]> {
  let query = supabase
    .from('reunioes')
    .select('*')
    .eq('mes_ano', mesAno);
  if (consultorId && consultorId !== 'all') {
    query = query.eq('consultor_id', consultorId);
  }
  const { data, error } = await query;
  if (error) { console.error('getReunioes:', error); return []; }
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// METAS
// ─────────────────────────────────────────────────────────────────────────────

export async function getMetas(mesAno: string): Promise<MetaMensal[]> {
  const { data, error } = await supabase
    .from('metas_mensais')
    .select('*, clientes(nome, produto, consultor_id)')
    .eq('mes_ano', mesAno);
  if (error) { console.error('getMetas:', error); return []; }
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAGS / HEALTH SCORE
// ─────────────────────────────────────────────────────────────────────────────

export async function getFlags(mesAno: string): Promise<FlagHealthScore[]> {
  const { data, error } = await supabase
    .from('flags_health_score')
    .select('*')
    .eq('mes_ano', mesAno);
  if (error) { console.error('getFlags:', error); return []; }
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// CHURN
// ─────────────────────────────────────────────────────────────────────────────

export async function getChurn(mesAno?: string): Promise<Churn[]> {
  let query = supabase.from('churn').select('*').order('created_at', { ascending: false });
  if (mesAno) query = query.eq('mes_churn', mesAno);
  const { data, error } = await query;
  if (error) { console.error('getChurn:', error); return []; }
  return data ?? [];
}

export async function addChurn(
  payload: Omit<Churn, 'id' | 'created_at'>,
): Promise<Churn | null> {
  const { data, error } = await supabase
    .from('churn')
    .insert(payload)
    .select()
    .single();
  if (error) { console.error('addChurn:', error); return null; }
  return data;
}

export async function deleteChurn(id: string): Promise<boolean> {
  const { error } = await supabase.from('churn').delete().eq('id', id);
  if (error) { console.error('deleteChurn:', error); return false; }
  return true;
}

export async function getChurnComClientes(
  mesAno: string,
  consultorId: string,
): Promise<Array<Churn & { cliente_nome: string }>> {
  const { data, error } = await supabase
    .from('churn')
    .select('*, clientes(nome)')
    .eq('mes_churn', mesAno)
    .eq('consultor_id', consultorId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getChurnComClientes:', error); return []; }
  return (data ?? []).map((d: any) => ({ ...d, cliente_nome: d.clientes?.nome ?? '—' }));
}

export async function getTemplatePerguntasAbril(): Promise<
  Array<{ pergunta: string; categoria: string; tipo: string; tipo_amostragem: string }>
> {
  const { data, error } = await supabase
    .from('auditoria_itens')
    .select('pergunta, categoria, tipo, tipo_amostragem, auditoria_mensal!inner(mes_ano)')
    .eq('auditoria_mensal.mes_ano', '2026-04')
    .gt('qtd_avaliados', 0);
  if (error) { console.error('getTemplatePerguntasAbril:', error); return []; }
  const seen = new Set<string>();
  return (data ?? [])
    .filter((d: any) => { if (seen.has(d.pergunta)) return false; seen.add(d.pergunta); return true; })
    .map((d: any) => ({
      pergunta:       d.pergunta,
      categoria:      d.categoria,
      tipo:           d.tipo ?? 'Conformidade',
      tipo_amostragem: d.tipo_amostragem,
    }));
}

function formatMesLabel(mesAno: string): string {
  const short = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const [year, month] = mesAno.split('-');
  return `${short[parseInt(month) - 1]}/${year.slice(2)}`;
}

export async function getCorrelacaoConsultor(consultorId: string): Promise<
  Array<{ mes_ano: string; label: string; score_resultado: number; score_conformidade: number; churn_count: number }>
> {
  const [{ data: items }, { data: churns }] = await Promise.all([
    supabase
      .from('auditoria_itens')
      .select('tipo, nota_pct, auditoria_mensal!inner(mes_ano, consultor_id)')
      .eq('auditoria_mensal.consultor_id', consultorId)
      .not('tipo', 'is', null)
      .gt('qtd_avaliados', 0),
    supabase.from('churn').select('mes_churn').eq('consultor_id', consultorId),
  ]);

  const mesMap: Record<string, { r: number[]; c: number[] }> = {};
  (items ?? []).forEach((row: any) => {
    const mes = row.auditoria_mensal?.mes_ano;
    if (!mes) return;
    if (!mesMap[mes]) mesMap[mes] = { r: [], c: [] };
    if (row.tipo === 'Resultado')    mesMap[mes].r.push(row.nota_pct);
    if (row.tipo === 'Conformidade') mesMap[mes].c.push(row.nota_pct);
  });

  const churnMap: Record<string, number> = {};
  (churns ?? []).forEach((ch: any) => { churnMap[ch.mes_churn] = (churnMap[ch.mes_churn] ?? 0) + 1; });

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;

  return Object.entries(mesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, scores]) => ({
      mes_ano:            mes,
      label:              formatMesLabel(mes),
      score_resultado:    avg(scores.r),
      score_conformidade: avg(scores.c),
      churn_count:        churnMap[mes] ?? 0,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function getViewReunioes(
  mesAno: string,
  consultorId?: string,
): Promise<ViewReunioesConsultor[]> {
  let query = supabase
    .from('view_reunioes_consultor')
    .select('*')
    .eq('mes_ano', mesAno);
  if (consultorId && consultorId !== 'all') {
    query = query.eq('consultor_id', consultorId);
  }
  const { data, error } = await query;
  if (error) { console.error('getViewReunioes:', error); return []; }
  return data ?? [];
}

export async function getViewMetas(
  mesAno: string,
  consultorId?: string,
): Promise<ViewMetasConsultor[]> {
  let query = supabase
    .from('view_metas_consultor')
    .select('*')
    .eq('mes_ano', mesAno);
  if (consultorId && consultorId !== 'all') {
    query = query.eq('consultor_id', consultorId);
  }
  const { data, error } = await query;
  if (error) { console.error('getViewMetas:', error); return []; }
  return data ?? [];
}

export async function getViewFlags(
  mesAno: string,
  consultorId?: string,
): Promise<ViewFlagsConsultor[]> {
  let query = supabase
    .from('view_flags_consultor')
    .select('*')
    .eq('mes_ano', mesAno);
  if (consultorId && consultorId !== 'all') {
    query = query.eq('consultor_id', consultorId);
  }
  const { data, error } = await query;
  if (error) { console.error('getViewFlags:', error); return []; }
  return data ?? [];
}

/** Retorna score médio por consultor separado por tipo (Resultado / Conformidade).
 *  Usa média simples das notas de cada item — cada pergunta tem peso igual,
 *  independentemente do número de clientes avaliados. */
export async function getScoresPorTipo(
  mesAno: string,
  consultorId?: string,
): Promise<{ consultor_id: string; tipo: string; score: number }[]> {
  let query = supabase
    .from('auditoria_itens')
    .select('tipo, nota_pct, qtd_avaliados, auditoria_mensal!inner(consultor_id, mes_ano)')
    .eq('auditoria_mensal.mes_ano', mesAno)
    .not('tipo', 'is', null)
    .gt('qtd_avaliados', 0); // exclui linhas sem avaliados (ex: #DIV/0!)

  if (consultorId && consultorId !== 'all') {
    query = query.eq('auditoria_mensal.consultor_id', consultorId);
  }

  const { data, error } = await query;
  if (error) { console.error('getScoresPorTipo:', error); return []; }
  if (!data) return [];

  // Agrupa por consultor+tipo → coleta todas as notas para média simples
  // Normaliza o tipo para PascalCase (ex: 'conformidade' → 'Conformidade')
  const normalizeTipo = (t: string) => {
    const lower = t.toLowerCase();
    if (lower === 'resultado')    return 'Resultado';
    if (lower === 'conformidade') return 'Conformidade';
    return t;
  };

  const map: Record<string, number[]> = {};
  for (const row of data as any[]) {
    const cid  = row.auditoria_mensal?.consultor_id;
    const tipo = row.tipo ? normalizeTipo(row.tipo) : null;
    const nota = row.nota_pct;
    if (!cid || !tipo || nota == null) continue;
    const key = `${cid}|${tipo}`;
    if (!map[key]) map[key] = [];
    map[key].push(nota);
  }

  return Object.entries(map).map(([key, notas]) => {
    const [consultor_id, tipo] = key.split('|');
    const score = notas.length > 0
      ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
      : 0;
    return { consultor_id, tipo, score };
  });
}

export async function getViewConformidade(
  mesAno: string,
  consultorId?: string,
): Promise<ViewConformidadeConsultor[]> {
  let query = supabase
    .from('view_conformidade_consultor')
    .select('*')
    .eq('mes_ano', mesAno);
  if (consultorId && consultorId !== 'all') {
    query = query.eq('consultor_id', consultorId);
  }
  const { data, error } = await query;
  if (error) { console.error('getViewConformidade:', error); return []; }
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// PERGUNTAS ESPECÍFICAS DA AUDITORIA
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna, por consultor, quantos clientes da carteira foram atendidos no mês.
 *  Busca a pergunta "Quantas clientes da carteira foram atendidos dentro do mês?"
 *  em auditoria_itens → qtd_conformes = atendidos, qtd_avaliados = carteira total. */
export async function getRankingAtendidosMes(
  mesAno: string,
  consultorId?: string,
): Promise<{ consultor_id: string; atendidos: number; carteira: number }[]> {
  let query = supabase
    .from('auditoria_itens')
    .select('qtd_conformes, qtd_avaliados, auditoria_mensal!inner(consultor_id, mes_ano)')
    .eq('auditoria_mensal.mes_ano', mesAno)
    .ilike('pergunta', '%atendidos dentro do mês%');

  if (consultorId && consultorId !== 'all') {
    query = query.eq('auditoria_mensal.consultor_id', consultorId);
  }

  const { data, error } = await query;
  if (error) { console.error('getRankingAtendidosMes:', error); return []; }

  return (data ?? []).map((row: any) => ({
    consultor_id: row.auditoria_mensal?.consultor_id ?? '',
    atendidos:    row.qtd_conformes  ?? 0,
    carteira:     row.qtd_avaliados  ?? 0,
  }));
}

/** Retorna % de clientes com meta batida por produto, extraindo o produto
 *  do parêntese na pergunta: "...meta batida da operação? (Aliança Pro)" */
export async function getMetasBatidasPorProduto(
  mesAno: string,
  consultorId?: string,
): Promise<{ consultor_id: string; produto: string; nota_pct: number; qtd_avaliados: number; qtd_conformes: number }[]> {
  let query = supabase
    .from('auditoria_itens')
    .select('pergunta, nota_pct, qtd_avaliados, qtd_conformes, auditoria_mensal!inner(consultor_id, mes_ano)')
    .eq('auditoria_mensal.mes_ano', mesAno)
    .ilike('pergunta', '%meta batida da operação%');

  if (consultorId && consultorId !== 'all') {
    query = query.eq('auditoria_mensal.consultor_id', consultorId);
  }

  const { data, error } = await query;
  if (error) { console.error('getMetasBatidasPorProduto:', error); return []; }

  // Normaliza variações de nome de produto
  const normalizeProduto = (p: string): string => {
    const map: Record<string, string> = {
      'gsa': 'GSA',
      'alianca': 'Aliança',
      'aliança pro': 'Aliança Pro',
      'tracao': 'Tração',
      'tração': 'Tração',
      'gestão de tráfego': 'Gestão de Tráfego',
      'gestao de trafego': 'Gestão de Tráfego',
    };
    return map[p.toLowerCase()] ?? p;
  };

  return (data ?? []).map((row: any) => {
    // Extrai o nome do produto entre parênteses, ex: "(Aliança Pro)"
    const match = (row.pergunta as string).match(/\(([^)]+)\)/);
    const produto = match ? normalizeProduto(match[1].trim()) : 'Sem produto';
    return {
      consultor_id:  row.auditoria_mensal?.consultor_id ?? '',
      produto,
      nota_pct:      row.nota_pct      ?? 0,
      qtd_avaliados: row.qtd_avaliados ?? 0,
      qtd_conformes: row.qtd_conformes ?? 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — formata mês para o padrão 'YYYY-MM' usado no banco
// ─────────────────────────────────────────────────────────────────────────────

const MES_MAP: Record<string, string> = {
  'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
  'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
  'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12',
};

/** "Março/2026" → "2026-03" */
export function labelToMesAno(label: string): string {
  const [mes, ano] = label.split('/');
  return `${ano}-${MES_MAP[mes] ?? '01'}`;
}

/** "2026-03" → "Março/2026" */
const MES_NOME: Record<string, string> = Object.fromEntries(
  Object.entries(MES_MAP).map(([k, v]) => [v, k]),
);
export function mesAnoToLabel(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  return `${MES_NOME[mes] ?? mes}/${ano}`;
}

/** Gera os últimos N meses no formato "Mês/Ano" (mais recente por último) */
export function gerarMeses(n = 6): string[] {
  const meses: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mes = d.toLocaleString('pt-BR', { month: 'long' });
    const nome = mes.charAt(0).toUpperCase() + mes.slice(1);
    meses.push(`${nome}/${d.getFullYear()}`);
  }
  return meses;
}

/** Retorna o mês anterior no formato "Mês/Ano" */
export function getMesAnterior(label: string): string | undefined {
  const meses = gerarMeses(12);
  const idx = meses.indexOf(label);
  return idx > 0 ? meses[idx - 1] : undefined;
}
