export interface Consultant {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface Client {
  id: number;
  nome: string;
  produto: string;
  consultor_id: number;
  status: 'ativo' | 'tratativa' | 'onboarding' | 'churn';
}

export interface MonthlyAudit {
  id: number;
  consultor_id: number;
  mes_ano: string;
  score_geral: number;
  score_clickup: number;
  score_drive: number;
  score_whatsapp: number;
  score_metas: number;
  score_flags: number;
  score_rastreabilidade: number;
}

export interface Meeting {
  id: number;
  consultor_id: number;
  mes_ano: string;
  clientes_ativos: number;
  reunioes_realizadas: number;
  pct_reunioes: number;
}

export interface MonthlyGoal {
  id: number;
  consultor_id: number;
  cliente_id: number;
  produto: string;
  mes_ano: string;
  meta_projetada: number;
  meta_realizada: number;
  bateu: boolean;
}

export interface NPSData {
  id: number;
  consultor_id: number;
  mes_ano: string;
  tipo: 'NPS' | 'CSAT';
  nota: number;
  num_respostas: number;
}

export interface ChurnData {
  id: number;
  consultor_id: number;
  cliente_id: number;
  produto: string;
  mes_ano: string;
  motivo: string;
}

export const mockConsultants: Consultant[] = [
  { id: 1, nome: 'Waldemar Lima', ativo: true },
  { id: 2, nome: 'Thyêgo Douglas', ativo: true },
  { id: 3, nome: 'Letícia Sousa', ativo: true },
  { id: 4, nome: 'Anderson Castro', ativo: true },
  { id: 5, nome: 'Vinício Rocha', ativo: true },
  { id: 6, nome: 'Mardo Morais', ativo: true },
  { id: 7, nome: 'Sávio Menezes', ativo: true },
];

export const mockProducts = [
  'Aliança',
  'Aliança Pro',
  'Gsa',
  'Tração',
  'Assessoria de Marketing',
  'Gestão de Tráfego'
];

export const mockMonths = ['Fevereiro/2026', 'Março/2026'];

export const mockAudits: MonthlyAudit[] = [
  // Março 2026
  { id: 1, consultor_id: 1, mes_ano: 'Março/2026', score_geral: 84.2, score_clickup: 58, score_drive: 94, score_whatsapp: 100, score_metas: 69, score_flags: 100, score_rastreabilidade: 75 },
  { id: 2, consultor_id: 2, mes_ano: 'Março/2026', score_geral: 88.5, score_clickup: 75, score_drive: 100, score_whatsapp: 67, score_metas: 100, score_flags: 100, score_rastreabilidade: 85 },
  { id: 3, consultor_id: 3, mes_ano: 'Março/2026', score_geral: 82.1, score_clickup: 90, score_drive: 88, score_whatsapp: 63, score_metas: 86, score_flags: 83, score_rastreabilidade: 92 },
  { id: 4, consultor_id: 4, mes_ano: 'Março/2026', score_geral: 85.0, score_clickup: 75, score_drive: 100, score_whatsapp: 67, score_metas: 80, score_flags: 100, score_rastreabilidade: 88 },
  { id: 5, consultor_id: 5, mes_ano: 'Março/2026', score_geral: 69.4, score_clickup: 59, score_drive: 42, score_whatsapp: 83, score_metas: 100, score_flags: 62, score_rastreabilidade: 71 },
  { id: 6, consultor_id: 6, mes_ano: 'Março/2026', score_geral: 83.7, score_clickup: 87, score_drive: 100, score_whatsapp: 58, score_metas: 70, score_flags: 100, score_rastreabilidade: 85 },
  
  // Fevereiro 2026
  { id: 7, consultor_id: 1, mes_ano: 'Fevereiro/2026', score_geral: 69.0, score_clickup: 60, score_drive: 65, score_whatsapp: 70, score_metas: 60, score_flags: 80, score_rastreabilidade: 70 },
  { id: 8, consultor_id: 2, mes_ano: 'Fevereiro/2026', score_geral: 65.2, score_clickup: 55, score_drive: 60, score_whatsapp: 65, score_metas: 70, score_flags: 60, score_rastreabilidade: 60 },
  { id: 9, consultor_id: 3, mes_ano: 'Fevereiro/2026', score_geral: 73.1, score_clickup: 70, score_drive: 75, score_whatsapp: 70, score_metas: 80, score_flags: 75, score_rastreabilidade: 70 },
  { id: 10, consultor_id: 4, mes_ano: 'Fevereiro/2026', score_geral: 61.8, score_clickup: 50, score_drive: 55, score_whatsapp: 60, score_metas: 70, score_flags: 65, score_rastreabilidade: 55 },
  { id: 11, consultor_id: 5, mes_ano: 'Fevereiro/2026', score_geral: 71.4, score_clickup: 65, score_drive: 70, score_whatsapp: 75, score_metas: 75, score_flags: 70, score_rastreabilidade: 75 },
  { id: 12, consultor_id: 6, mes_ano: 'Fevereiro/2026', score_geral: 69.8, score_clickup: 60, score_drive: 65, score_whatsapp: 70, score_metas: 70, score_flags: 75, score_rastreabilidade: 70 },
];

export const mockMeetings: Meeting[] = [
  { id: 1, consultor_id: 1, mes_ano: 'Março/2026', clientes_ativos: 15, reunioes_realizadas: 14, pct_reunioes: 93 },
  { id: 2, consultor_id: 2, mes_ano: 'Março/2026', clientes_ativos: 12, reunioes_realizadas: 12, pct_reunioes: 100 },
  { id: 3, consultor_id: 3, mes_ano: 'Março/2026', clientes_ativos: 18, reunioes_realizadas: 16, pct_reunioes: 88 },
  { id: 4, consultor_id: 1, mes_ano: 'Fevereiro/2026', clientes_ativos: 14, reunioes_realizadas: 12, pct_reunioes: 85 },
];

export const mockGoals: MonthlyGoal[] = [
  { id: 1, consultor_id: 1, cliente_id: 1, produto: 'GSA', mes_ano: 'Março/2026', meta_projetada: 10000, meta_realizada: 12000, bateu: true },
  { id: 2, consultor_id: 1, cliente_id: 2, produto: 'Aliança', mes_ano: 'Março/2026', meta_projetada: 5000, meta_realizada: 4800, bateu: false },
  { id: 3, consultor_id: 2, cliente_id: 3, produto: 'Tração', mes_ano: 'Março/2026', meta_projetada: 20000, meta_realizada: 22000, bateu: true },
  { id: 4, consultor_id: 1, cliente_id: 1, produto: 'GSA', mes_ano: 'Fevereiro/2026', meta_projetada: 10000, meta_realizada: 9500, bateu: false },
];

export const mockNPS: NPSData[] = [
  { id: 1, consultor_id: 1, mes_ano: 'Março/2026', tipo: 'NPS', nota: 93, num_respostas: 6 },
  { id: 2, consultor_id: 2, mes_ano: 'Março/2026', tipo: 'NPS', nota: 95, num_respostas: 12 },
  { id: 3, consultor_id: 3, mes_ano: 'Março/2026', tipo: 'NPS', nota: 88, num_respostas: 18 },
  { id: 4, consultor_id: 1, mes_ano: 'Fevereiro/2026', tipo: 'NPS', nota: 85, num_respostas: 14 },
];

export const mockChurn: ChurnData[] = [
  { id: 1, consultor_id: 1, cliente_id: 2, produto: 'Aliança', mes_ano: 'Março/2026', motivo: 'Corte de custos' },
  { id: 2, consultor_id: 2, cliente_id: 5, produto: 'GSA', mes_ano: 'Março/2026', motivo: 'Mudança de estratégia' },
];

export const mockClients: Client[] = [
  { id: 1, nome: 'Vorp Client A', produto: 'GSA', consultor_id: 1, status: 'ativo' },
  { id: 2, nome: 'Vorp Client B', produto: 'Aliança', consultor_id: 1, status: 'ativo' },
  { id: 3, nome: 'Vorp Client C', produto: 'Tração', consultor_id: 2, status: 'ativo' },
];
