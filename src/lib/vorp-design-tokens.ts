/**
 * vorp-design-tokens.ts
 * ─────────────────────
 * Design tokens centralizados do sistema Vorp redesenhado.
 * Importe onde precisar: import { DT, accentForValue } from '@/lib/vorp-design-tokens';
 */

// ── Paleta base ────────────────────────────────────────────────────────────
export const DT = {
  // Backgrounds (do mais escuro ao mais claro)
  bgBase:    '#0a0b0e',   // fundo raiz da aplicação
  bgSurface: '#0d0f14',   // sidebar, topbar
  bgCard:    '#0f1117',   // cards, painéis

  // Bordas
  border:    '#1a1d24',   // borda padrão
  borderHov: 'rgba(255,92,26,0.22)', // borda no hover

  // Texto
  text:      '#e2e4e9',   // texto primário
  textSub:   '#9aa0b0',   // texto secundário
  textMuted: '#6b7280',   // texto terciário / labels
  textDim:   '#3f4455',   // rótulos de seção / nav labels

  // Laranja — cor primária Vorp
  orange:    '#ff5c1a',
  orangeHov: '#ff7a40',
  orangeDim: 'rgba(255,92,26,0.12)',

  // Verde — conformidade alta / excelente
  green:     '#1d9e75',
  greenDim:  'rgba(29,158,117,0.12)',

  // Vermelho — atenção / baixo score
  red:       '#e05555',
  redDim:    'rgba(220,53,69,0.13)',

  // Âmbar — NPS / aviso médio
  amber:     '#e8a020',
  amberDim:  'rgba(232,160,32,0.12)',

  // Roxo — Vorp System
  purple:    '#7864dc',
  purpleDim: 'rgba(120,100,220,0.12)',

  // Tipografia
  fontMono:  "'DM Mono', monospace",
  fontSans:  "'DM Sans', sans-serif",

  // Bordas arredondadas
  radiusSm:  '6px',
  radiusMd:  '8px',
  radiusLg:  '10px',
  radiusXl:  '14px',

  // Transições
  transBase: 'all 0.2s ease',
} as const;

// ── Semáforo de score ──────────────────────────────────────────────────────
export function accentForValue(v: number): string {
  if (v >= 80) return DT.green;
  if (v >= 60) return DT.orange;
  return DT.red;
}

export function bgForValue(v: number): string {
  if (v >= 80) return DT.greenDim;
  if (v >= 60) return DT.orangeDim;
  return DT.redDim;
}

export function labelForValue(v: number): string {
  if (v >= 90) return 'Excelente';
  if (v >= 75) return 'Bom';
  if (v >= 60) return 'Regular';
  return 'Atenção';
}

// ── Cores por categoria ────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  ClickUp:     DT.orange,
  Drive:       DT.amber,
  WhatsApp:    DT.green,
  'Vorp System': DT.purple,
  Planilhas:   '#60a5fa',
  Flags:       '#f472b6',
  Rastreabilidade: '#34d399',
};
