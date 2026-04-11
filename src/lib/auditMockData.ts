import { AuditClient, AuditConsultant, AuditCategory, AuditQuestion, AuditResult, Churn } from '@/types/audit';

export const mockAuditConsultants: AuditConsultant[] = [
  { id: 'c1', nome: 'Waldemar Lima' },
  { id: 'c2', nome: 'Thyêgo Douglas' },
  { id: 'c3', nome: 'Letícia Sousa' },
  { id: 'c4', nome: 'Anderson Castro' },
  { id: 'c5', nome: 'Vinício Rocha' },
  { id: 'c6', nome: 'Mardo Morais' },
  { id: 'c7', nome: 'Sávio Menezes' },
];

export const mockAuditClients: AuditClient[] = [
  { id: 'cl1', nome: 'Studio Beleza Pro', consultor_id: 'c1', produto: 'Aliança', status: 'Ativo' },
  { id: 'cl2', nome: 'Max Fitness',       consultor_id: 'c1', produto: 'GSA', status: 'Ativo' },
  { id: 'cl3', nome: 'Clínica Vida',      consultor_id: 'c1', produto: 'Aliança Pro', status: 'Ativo' },
  { id: 'cl4', nome: 'Auto Center JP',    consultor_id: 'c2', produto: 'Tração', status: 'Ativo' },
  { id: 'cl5', nome: 'Padaria Nobre',     consultor_id: 'c2', produto: 'Aliança', status: 'Ativo' },
  { id: 'cl6', nome: 'Tech Solutions',    consultor_id: 'c2', produto: 'Assessoria de Marketing', status: 'Ativo' },
  { id: 'cl7', nome: 'Ótica Premium',     consultor_id: 'c3', produto: 'Aliança Pro', status: 'Ativo' },
  { id: 'cl8', nome: 'Escola Futuro',     consultor_id: 'c3', produto: 'Gestão de Tráfego', status: 'Ativo' },
  { id: 'cl9', nome: 'Restaurante Mar',   consultor_id: 'c4', produto: 'Aliança', status: 'Ativo' },
  { id: 'cl10', nome: 'Petshop Amigo',    consultor_id: 'c4', produto: 'GSA', status: 'Ativo' },
  { id: 'cl11', nome: 'Farmácia Central', consultor_id: 'c5', produto: 'Tração', status: 'Ativo' },
  { id: 'cl12', nome: 'Imobiliária Real', consultor_id: 'c5', produto: 'Vorp Elite', status: 'Ativo' },
  { id: 'cl13', nome: 'Consultório Saúde', consultor_id: 'c6', produto: 'Aliança', status: 'Ativo' },
  { id: 'cl14', nome: 'Loja Mix',         consultor_id: 'c6', produto: 'Gestão de Tráfego', status: 'Ativo' },
  { id: 'cl15', nome: 'Academia Power',   consultor_id: 'c7', produto: 'Aliança Pro', status: 'Ativo' },
  { id: 'cl16', nome: 'Bar do Chef',      consultor_id: 'c7', produto: 'Tração', status: 'Ativo' },
  { id: 'cl17', nome: 'Dental Smile',     consultor_id: 'c1', produto: 'Aliança', status: 'Cancelado' },
  { id: 'cl18', nome: 'Moda Trends',      consultor_id: 'c3', produto: 'Aliança Pro', status: 'Cancelado' },
];

export const mockAuditCategories: AuditCategory[] = [
  { id: 'cat1', title: 'Bloco A — Conformidade de Entregas', target: 'client', order: 1 },
  { id: 'cat2', title: 'Bloco B — Gestão e Processos',       target: 'consultant', order: 2 },
  { id: 'cat3', title: 'Bloco C — Saúde da Carteira',        target: 'client', order: 3 },
];

export const mockAuditQuestions: AuditQuestion[] = [
  // Bloco A — Conformidade de Entregas (client)
  { id: 'q1',  category_id: 'cat1', text: 'Tarefas do mês criadas no ClickUp?',      type: 'Sim/Não', order: 1 },
  { id: 'q2',  category_id: 'cat1', text: 'Status atualizado diariamente?',           type: 'Sim/Não', order: 2 },
  { id: 'q3',  category_id: 'cat1', text: 'Pasta do Drive organizada?',               type: 'Sim/Não', order: 3 },
  { id: 'q4',  category_id: 'cat1', text: 'Resposta no WhatsApp < 2h?',               type: 'Sim/Não/N.A', order: 4 },
  { id: 'q5',  category_id: 'cat1', text: 'Dados de tráfego atualizados?',            type: 'Sim/Não/N.A', order: 5 },

  // Bloco B — Gestão e Processos (consultant)
  { id: 'q6',  category_id: 'cat2', text: 'Reuniões mensais realizadas?',   type: 'Sim/Não', order: 1 },
  { id: 'q7',  category_id: 'cat2', text: 'Ata de reunião preenchida?',     type: 'Sim/Não', order: 2 },
  { id: 'q8',  category_id: 'cat2', text: 'Planilha de metas atualizada?',  type: 'Sim/Não', order: 3 },
  { id: 'q9',  category_id: 'cat2', text: 'Feedback semanal registrado?',   type: 'Sim/Não/N.A', order: 4 },
  { id: 'q10', category_id: 'cat2', text: 'Observações do gestor',          type: 'Texto Livre', order: 5 },

  // Bloco C — Saúde da Carteira (client)
  { id: 'q11', category_id: 'cat3', text: 'Flag atual', type: 'Lista de Opções', options: ['Safe', 'Care', 'Danger'], order: 1 },
  { id: 'q12', category_id: 'cat3', text: 'Meta batida no mês?',      type: 'Sim/Não', order: 2 },
  { id: 'q13', category_id: 'cat3', text: 'Health Score preenchido?',  type: 'Sim/Não', order: 3 },
  { id: 'q14', category_id: 'cat3', text: 'Observações de risco',     type: 'Texto Livre', order: 4 },
];

export const mockAuditResults: AuditResult[] = [];

export const mockChurns: Churn[] = [
  { id: 'ch1', cliente_id: 'cl17', consultor_id: 'c1', data_churn: '2026-02-15', motivo: 'Corte de custos' },
  { id: 'ch2', cliente_id: 'cl18', consultor_id: 'c3', data_churn: '2026-03-02', motivo: 'Insatisfação com resultados' },
];
