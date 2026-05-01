export const USER_ROLES = ['Administrador', 'Consultor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const APP_PERMISSIONS = [
  'dashboard.overview',
  'dashboard.evolution',
  'dashboard.conformidade',
  'dashboard.processos',
  'dashboard.reunioes',
  'dashboard.metas',
  'dashboard.nps',
  'dashboard.churn',
  'dashboard.correlacao',
  'dashboard.vorp',
  'cadastro.time',
  'cadastro.produtos',
  'cadastro.projetos',
  'cadastro.vorp',
  'auditoria.edicao',
  'auditoria.rapida',
  'auditoria.churn',
  'admin.usuarios',
  'filters.consultores.todos',
] as const;

export type AppPermission = (typeof APP_PERMISSIONS)[number];

export const DEFAULT_ADMIN_PERMISSIONS: AppPermission[] = [...APP_PERMISSIONS];

export const DEFAULT_CONSULTOR_PERMISSIONS: AppPermission[] = [
  'dashboard.overview',
  'dashboard.conformidade',
  'dashboard.processos',
  'dashboard.reunioes',
  'dashboard.metas',
  'dashboard.nps',
  'dashboard.churn',
  'dashboard.correlacao',
  'dashboard.vorp',
  'auditoria.churn',
];

export const PERMISSION_GROUPS: Array<{
  group: string;
  permissions: Array<{ key: AppPermission; label: string }>;
}> = [
  {
    group: 'Dashboard',
    permissions: [
      { key: 'dashboard.overview', label: 'Visao Geral' },
      { key: 'dashboard.evolution', label: 'Evolucao' },
      { key: 'dashboard.conformidade', label: 'Conformidade' },
      { key: 'dashboard.processos', label: 'Processos' },
      { key: 'dashboard.reunioes', label: 'Reunioes' },
      { key: 'dashboard.metas', label: 'Metas' },
      { key: 'dashboard.nps', label: 'NPS' },
      { key: 'dashboard.churn', label: 'Churn' },
      { key: 'dashboard.correlacao', label: 'Correlacao' },
      { key: 'dashboard.vorp', label: 'Vorp System' },
    ],
  },
  {
    group: 'Cadastro',
    permissions: [
      { key: 'cadastro.time', label: 'Time Completo' },
      { key: 'cadastro.produtos', label: 'Produtos' },
      { key: 'cadastro.projetos', label: 'Projetos Ativos' },
      { key: 'cadastro.vorp', label: 'Vorp System' },
      { key: 'admin.usuarios', label: 'Editar permissoes' },
    ],
  },
  {
    group: 'Auditoria',
    permissions: [
      { key: 'auditoria.edicao', label: 'Edicao Completa' },
      { key: 'auditoria.rapida', label: 'Auditoria Rapida' },
      { key: 'auditoria.churn', label: 'Churn Rapido' },
    ],
  },
  {
    group: 'Escopo de dados',
    permissions: [
      { key: 'filters.consultores.todos', label: 'Ver todos os consultores' },
    ],
  },
];

export const DASHBOARD_SECTION_PERMISSIONS: Record<string, AppPermission> = {
  'visao-geral': 'dashboard.overview',
  evolucao: 'dashboard.evolution',
  conformidade: 'dashboard.conformidade',
  processos: 'dashboard.processos',
  reunioes: 'dashboard.reunioes',
  metas: 'dashboard.metas',
  nps: 'dashboard.nps',
  churn: 'dashboard.churn',
  correlacao: 'dashboard.correlacao',
  'insights-ia': 'dashboard.correlacao',
  'vorp-system': 'dashboard.vorp',
};

export const CADASTRO_TAB_PERMISSIONS = {
  'time-completo': 'cadastro.time',
  produtos: 'cadastro.produtos',
  projetos: 'cadastro.projetos',
  'vorp-system': 'cadastro.vorp',
} as const satisfies Record<string, AppPermission>;

export const AUDITORIA_TAB_PERMISSIONS = {
  edicao: 'auditoria.edicao',
  rapida: 'auditoria.rapida',
  churn: 'auditoria.churn',
} as const satisfies Record<string, AppPermission>;

const PERMISSION_SET = new Set<string>(APP_PERMISSIONS);

export function normalizePermissions(value: unknown, fallback: AppPermission[] = []): AppPermission[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is AppPermission =>
    typeof item === 'string' && PERMISSION_SET.has(item),
  );
}

export function normalizeRole(value: unknown): UserRole {
  return value === 'Administrador' || value === 'Consultor' ? value : 'Consultor';
}
