export type ConsultorOperacaoStatus = 'Ativo' | 'Onboarding' | 'Desativado';

export interface ConsultorOperacaoHistorico {
  id: string;
  consultor_id: string;
  mes_inicio: string;
  status_operacao: ConsultorOperacaoStatus;
  observacao?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const CONSULTOR_OPERACAO_STATUS_OPTIONS: ConsultorOperacaoStatus[] = [
  'Ativo',
  'Onboarding',
  'Desativado',
];

export function normalizeConsultorOperacaoStatus(value?: string | null): ConsultorOperacaoStatus {
  const normalized = (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (normalized === 'onboarding') return 'Onboarding';
  if (normalized === 'desativado' || normalized === 'inativo') return 'Desativado';
  return 'Ativo';
}

export function consultorEntraNaMediaOperacao(status?: string | null): boolean {
  return normalizeConsultorOperacaoStatus(status) === 'Ativo';
}

export function resolveConsultorOperacaoStatus(
  historicos: ConsultorOperacaoHistorico[],
  consultorId: string,
  mesAno: string,
): ConsultorOperacaoStatus {
  const vigente = historicos
    .filter((row) => row.consultor_id === consultorId && row.mes_inicio <= mesAno)
    .sort((a, b) => b.mes_inicio.localeCompare(a.mes_inicio))[0];

  return normalizeConsultorOperacaoStatus(vigente?.status_operacao);
}
