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

export async function upsertAuditoriaItem(
  payload: Omit<AuditoriaItem, 'id' | 'nota_pct' | 'created_at'>,
): Promise<AuditoriaItem | null> {
  const { data, error } = await supabase
    .from('auditoria_itens')
    .upsert(payload, { onConflict: 'auditoria_id,categoria,pergunta' })
    .select()
    .single();
  if (error) { console.error('upsertAuditoriaItem:', error); return null; }
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
