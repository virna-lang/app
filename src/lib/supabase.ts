import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://euivfkoulfaslbypmqyl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_IUh06W472gFWIUdfTtrJ8w_Sa6vp1-v';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession:     true,
    autoRefreshToken:   true,
    storageKey:         'vorp-auth-session',
  },
});

// ──────────────────────────────────────────────
// Tipos — espelham exatamente as tabelas do banco
// ──────────────────────────────────────────────

export type StatusConsultor = 'Ativo' | 'Inativo';
export type StatusCliente   = 'Ativo' | 'Tratativa' | 'Churn';
export type StatusReuniao   = 'Concluída' | 'Sem reunião' | 'Cancelada';
export type StatusFlag      = 'Safe' | 'Care' | 'Danger' | 'Não preenchida';
export type MotivoChurn     = 'Preço' | 'Resultado' | 'Sumiu' | 'Concorrente' | 'Outro';
export type CategoriaAudit  = 'ClickUp' | 'Drive' | 'WhatsApp' | 'Dados' | 'Flags';
export type TipoAmostragem  = 'Totalidade' | '30% da carteira';
export type StatusItem      = 'Conforme' | 'Não conforme';

export interface Consultor {
  id: string;
  nome: string;
  status: StatusConsultor;
  vorp_colaborador_id?: string | null;
  data_entrada?: string;
  created_at?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  consultor_id: string;
  vorp_projeto_id?: string | null;
  produto: string;
  status: StatusCliente;
  data_entrada?: string;
  data_churn?: string;
  link_drive?: string;
  link_clickup?: string;
  link_whatsapp?: string;
  created_at?: string;
}

export interface MetaMensal {
  id: string;
  cliente_id: string;
  mes_ano: string;
  meta_projetada: number;
  meta_realizada: number;
  bateu_meta: boolean;
  preenchido_ate_dia5: boolean;
  preenchido_em?: string;
  created_at?: string;
}

export interface Reuniao {
  id: string;
  cliente_id: string;
  consultor_id: string;
  data_reuniao?: string;
  mes_ano: string;
  status: StatusReuniao;
  gravacao_no_drive: boolean;
  resumo_enviado_wpp: boolean;
  motivo_ausencia?: string;
  clickup_task_id?: string;
  created_at?: string;
}

export interface FlagHealthScore {
  id: string;
  cliente_id: string;
  mes_ano: string;
  status_flag: StatusFlag;
  criterios_seguidos: boolean;
  preenchido_por?: string;
  data_preenchimento?: string;
  observacao?: string;
  created_at?: string;
}

export interface AuditoriaMensal {
  id: string;
  consultor_id: string;
  mes_ano: string;
  data_auditoria?: string;
  auditora?: string;
  tamanho_carteira: number;
  clientes_tratativa: number;
  clientes_ativos_real: number;
  nps_nota?: number;
  nps_respostas?: number;
  inadimplencia_pct?: number;
  observacoes_gerais?: string;
  created_at?: string;
}

export interface AuditoriaItem {
  id: string;
  auditoria_id: string;
  categoria: CategoriaAudit;
  pergunta: string;
  tipo?: string; // Resultado ou Conformidade
  tipo_amostragem: TipoAmostragem;
  conforme: StatusItem;
  qtd_avaliados: number;
  qtd_conformes: number;
  nota_pct: number;
  observacao?: string;
  evidencia_url?: string;
  created_at?: string;
}

export interface Churn {
  id: string;
  cliente_id: string;
  consultor_id: string;
  mes_churn: string;
  motivo: MotivoChurn;
  detalhes?: string;
  receita_perdida?: number;
  created_at?: string;
}

// ──────────────────────────────────────────────────────────
// Tabelas espelho do Vorp System (NocoDB) — Vertical Growth
// ──────────────────────────────────────────────────────────

export interface VorpColaboradorRow {
  vorp_id:   string;
  nome:      string;
  email?:    string | null;
  telefone?: string | null;
  cargo?:    string | null;
  status?:   string | null;
  vertical?: string | null;
  synced_at: string;
}

export interface VorpProjetoRow {
  vorp_id:              string;
  nome:                 string;
  empresa_nome?:        string | null;
  status?:              string | null;
  produto_nome?:        string | null;
  colaborador_nome?:    string | null;
  colaborador_vorp_id?: string | null;
  produto_vorp_id?:     string | null;
  consultor_id?:        string | null;
  fee?:                 number | null;
  canal?:               string | null;
  tratativa_cs:         boolean;
  tratativa_cs_obs?:    string | null;
  synced_at:            string;
}

export interface VorpProdutoRow {
  vorp_id:   string;
  nome:      string;
  tipo?:     string | null;
  vertical?: string | null;
  synced_at: string;
}

export interface VorpChurnRow {
  vorp_id:           string;
  projeto_nome?:     string | null;
  projeto_vorp_id?:  string | null;
  status?:           string | null;
  tipo?:             string | null;
  vertical?:         string | null;
  vorp_created_at?:  string | null;
  synced_at:         string;
}

export interface VorpHealthScoreRow {
  vorp_id:                    string;
  projeto_nome?:              string | null;
  projeto_vorp_id?:           string | null;
  ano?:                       number | null;
  mes?:                       number | null;
  pontuacao?:                 number | null;
  classificacao?:             string | null;
  engajamento_cliente?:       number | null;
  entregas?:                  number | null;
  relacionamento?:            number | null;
  resultado?:                 number | null;
  implementacao_ferramentas?: number | null;
  entrega_treinador_vendas?:  number | null;
  observacoes?:               string | null;
  synced_at:                  string;
}

export interface VorpMetaRow {
  vorp_id:          string;
  projeto_nome?:    string | null;
  projeto_vorp_id?: string | null;
  ano?:             number | null;
  mes?:             number | null;
  meta_projetada?:  number | null;
  meta_realizada?:  number | null;
  observacoes?:     string | null;
  synced_at:        string;
}

export interface VorpSyncLog {
  id:           number;
  tabela:       string;
  registros:    number;
  status:       'ok' | 'erro';
  mensagem?:    string | null;
  executado_em: string;
}

// ──────────────────────────────────────────
// Views calculadas pelo banco
// ──────────────────────────────────────────

export interface ViewReunioesConsultor {
  consultor_id: string;
  consultor: string;
  mes_ano: string;
  clientes_com_reuniao: number;
  total_clientes: number;
  pct_reunioes: number;
}

export interface ViewMetasConsultor {
  consultor_id: string;
  consultor: string;
  produto: string;
  mes_ano: string;
  metas_batidas: number;
  total_metas: number;
  pct_batimento: number;
}

export interface ViewFlagsConsultor {
  consultor_id: string;
  consultor: string;
  mes_ano: string;
  safe: number;
  care: number;
  danger: number;
  nao_preenchida: number;
  total: number;
}

export interface ViewConformidadeConsultor {
  consultor_id: string;
  consultor: string;
  mes_ano: string;
  categoria: CategoriaAudit;
  score_categoria: number;
  total_itens: number;
}
