export interface AuditClient {
  id: string;
  nome: string;
  consultor_id: string;
  produto: string;
  status: string;
}

export interface AuditConsultant {
  id: string;
  nome: string;
}

export interface AuditCategory {
  id: string;
  title: string;
  target: 'client' | 'consultant';
  order: number;
}

export interface AuditQuestion {
  id: string;
  category_id: string;
  text: string;
  type: 'Sim/Não' | 'Sim/Não/N.A' | 'Lista de Opções' | 'Texto Livre';
  options?: string[];
  order: number;
}

export interface AuditResult {
  id: string;
  mes: string;
  targetId: string;
  targetType: 'client' | 'consultant';
  responses: Record<string, string>;
}

export interface Churn {
  id: string;
  cliente_id: string;
  consultor_id: string;
  data_churn: string;
  motivo: string;
}
