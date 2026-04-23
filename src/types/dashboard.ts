export interface DashboardData {
  month: string;
  prevMonth: string | undefined;
  currentAudits: any[];
  prevAudits: any[];
  currentGoals: any[];
  prevGoals: any[];
  currentMeetings: any[];
  currentNPS: any[];
  currentChurn: any[];
  viewMetas: any[];
  rankingAtendidos: any[];
  metasPorProduto: any[];
}

export const COLORS = {
  // ── Marca ──
  primary:    '#FC5400',
  primaryDim: 'rgba(252, 84, 0, 0.15)',

  // ── Semáforo refinado ──
  verde:    '#10b981',
  verdeDim: 'rgba(16, 185, 129, 0.12)',
  vermelho:    '#ef4444',
  vermelhoDim: 'rgba(239, 68, 68, 0.12)',
  amarelo:    '#f59e0b',
  amareloDim: 'rgba(245, 158, 11, 0.12)',

  // ── Superfície ──
  cardBg:     '#111827',
  cardBgRaised: '#141e2e',
  cardBorder: '#1f2d40',

  // ── Texto ──
  textMain:      '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted:     '#475569',
  textFaint:     '#334155',

  // ── Misc ──
  barBg: 'rgba(255, 255, 255, 0.05)',
};

export const getSemaphorColor = (value: number) => {
  if (value >= 80) return COLORS.verde;
  if (value >= 60) return COLORS.primary;
  return COLORS.vermelho;
};

export const getSemaphorBg = (value: number) => {
  if (value >= 80) return COLORS.verdeDim;
  if (value >= 60) return COLORS.primaryDim;
  return COLORS.vermelhoDim;
};
