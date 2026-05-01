import type { Consultor } from './supabase';

export function getConsultorIdShort(consultorId?: string | null): string {
  return (consultorId ?? '').slice(0, 8);
}

export function getConsultorNome(consultores: Consultor[], consultorId?: string | null): string {
  return consultores.find(c => c.id === consultorId)?.nome ?? 'Consultor';
}

export function getConsultorLabel(
  consultores: Consultor[],
  consultorId?: string | null,
  mode: 'first' | 'full' = 'first',
): string {
  const nome = getConsultorNome(consultores, consultorId);
  return mode === 'first' ? nome.split(' ')[0] : nome;
}

export function getConsultorBackofficeLabel(
  consultores: Consultor[],
  consultorId?: string | null,
  mode: 'first' | 'full' = 'full',
): string {
  const nome = getConsultorLabel(consultores, consultorId, mode);
  const idShort = getConsultorIdShort(consultorId);
  return idShort ? `${nome} #${idShort}` : nome;
}
