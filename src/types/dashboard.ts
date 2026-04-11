import { MonthlyAudit, MonthlyGoal, Meeting, NPSData, ChurnData } from '@/lib/mockData';

export interface DashboardData {
  month: string;
  prevMonth: string | undefined;
  currentAudits: MonthlyAudit[];
  prevAudits: MonthlyAudit[];
  currentGoals: MonthlyGoal[];
  prevGoals: MonthlyGoal[];
  currentMeetings: Meeting[];
  currentNPS: NPSData[];
  currentChurn: ChurnData[];
}

export const COLORS = {
  primary: '#FC5400',
  primaryDim: 'rgba(252, 84, 0, 0.4)',
  verde: '#1E9080',
  vermelho: '#B03030',
  cardBg: '#0F1020',
  cardBorder: '#1A1A38',
  textMain: '#E0E0EE',
  textSecondary: '#8080A8',
  textMuted: '#404060',
  barBg: 'rgba(255, 255, 255, 0.04)',
};

export const getSemaphorColor = (value: number) => {
  if (value >= 85) return COLORS.verde;
  if (value >= 70) return COLORS.primary;
  return COLORS.vermelho;
};
