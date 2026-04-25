'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { DashboardData, getSemaphorColor, getSemaphorBg, COLORS } from '@/types/dashboard';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const T = {
  bg:        '#0f1117',
  bgDeep:    '#0a0b0e',
  border:    '#1a1d24',
  borderHov: 'rgba(255,92,26,0.22)',
  text:      '#e2e4e9',
  textMuted: '#6b7280',
  textDim:   '#3f4455',
  orange:    '#ff5c1a',
  orangeDim: 'rgba(255,92,26,0.12)',
  green:     '#1d9e75',
  greenDim:  'rgba(29,158,117,0.12)',
  red:       '#e05555',
  redDim:    'rgba(220,53,69,0.13)',
  amber:     '#e8a020',
  amberDim:  'rgba(232,160,32,0.12)',
} as const;

function accentForValue(v: number): string {
  if (v >= 80) return T.green;
  if (v >= 60) return T.orange;
  return T.red;
}

function VariationPill({ val }: { val: number }) {
  const pos = val >= 0;
  const bg  = pos ? T.greenDim : T.redDim;
  const fg  = pos ? T.green    : T.red;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 99,
      background: bg, color: fg,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      {pos
        ? <TrendingUp size={10} strokeWidth={2.5} />
        : <TrendingDown size={10} strokeWidth={2.5} />
      }
      {pos ? '+' : ''}{(val || 0).toFixed(1)}pp
    </span>
  );
}

function ProgressTrack({ value, color }: { value: number; color: string }) {
  return (
    <div style={{
      height: 3, background: T.border,
      borderRadius: 99, overflow: 'hidden',
      marginTop: 'auto',
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min(Math.max(value, 0), 100)}%`,
        background: color,
        borderRadius: 99,
        transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 6,
      background: bg, color,
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      <AlertTriangle size={10} strokeWidth={2.5} />
      {label}
    </span>
  );
}

function KpiCard({
  label,
  accentColor,
  children,
  index = 0,
}: {
  label: string;
  accentColor: string;
  children: React.ReactNode;
  index?: number;
}) {
  return (
    <div className="kpi-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2, background: accentColor,
        borderRadius: '10px 10px 0 0',
      }} />

      <span style={{
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: T.textDim,
      }}>
        {label}
      </span>

      {children}

      <style jsx>{`
        .kpi-card {
          background: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          animation: fadeUp 0.4s ease both;
        }
        .kpi-card:hover {
          border-color: ${T.borderHov};
          box-shadow: 0 6px 28px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}

export default function SummaryKPIs({ data }: { data: DashboardData }) {

  // 1. Conformidade Geral
  const currWith = data.currentAudits.filter((c: any) => (c.score_conformidade ?? 0) > 0);
  const prevWith  = data.prevAudits.filter((c: any) => (c.score_conformidade ?? 0) > 0);
  const currAvg  = currWith.reduce((a: number, c: any) => a + c.score_conformidade, 0) / (currWith.length || 1);
  const prevAvg  = prevWith.reduce((a: number, c: any) => a + c.score_conformidade, 0) / (prevWith.length || 1);
  const varScore = currAvg - prevAvg;

  const trendData = [
    { name: 'Anterior', value: prevAvg },
    { name: 'Atual',    value: currAvg  },
  ];

  // 2. Melhor Categoria
  const catMap: Record<string, string> = {
    score_clickup:        'ClickUp',
    score_drive:          'Drive',
    score_whatsapp:       'WhatsApp',
    score_metas:          'Planilhas',
    score_flags:          'Flags',
    score_rastreabilidade:'Rastreabilidade',
  };
  let bestCat = 'ClickUp', bestScore = 0;
  Object.keys(catMap).forEach(cat => {
    const avg = data.currentAudits.reduce((a: number, c: any) => a + (c[cat] || 0), 0) / (data.currentAudits.length || 1);
    if (avg > bestScore) { bestScore = avg; bestCat = catMap[cat]; }
  });

  // 3. % Reuniões
  const metMeetings   = data.currentMeetings.reduce((a: number, c: any) => a + c.reunioes_realizadas, 0);
  const totalMeetings = data.currentMeetings.reduce((a: number, c: any) => a + c.clientes_ativos, 0);
  const meetingsPct   = totalMeetings > 0 ? (metMeetings / totalMeetings) * 100 : 0;

  // 4. NPS
  const npsAvg   = data.currentNPS.length > 0
    ? data.currentNPS.reduce((a: number, c: any) => a + c.nota, 0) / data.currentNPS.length
    : 0;
  const npsLabel = npsAvg >= 90 ? 'Excelente' : npsAvg >= 75 ? 'Bom' : 'Atenção';
  const npsColor = npsAvg >= 90 ? T.green : npsAvg >= 75 ? T.orange : T.red;
  const npsBg    = npsAvg >= 90 ? T.greenDim : npsAvg >= 75 ? T.orangeDim : T.redDim;

  const conformColor = accentForValue(currAvg);
  const meetColor    = accentForValue(meetingsPct);
  const sparkColor   = varScore >= 0 ? T.green : T.red;

  return (
    <div className="kpi-grid">

      {/* ── 1. Conformidade Geral ── */}
      <KpiCard label="Conformidade Geral" accentColor={conformColor} index={0}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{
              fontSize: 36, fontWeight: 700, color: T.text,
              lineHeight: 1, fontFamily: "'DM Mono', monospace",
            }}>
              {(currAvg || 0).toFixed(1)}%
            </span>
            {data.prevMonth && <VariationPill val={varScore} />}
          </div>
          <div style={{ width: 72, height: 40, marginBottom: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{
                    background: T.bgDeep, border: `1px solid ${T.border}`,
                    borderRadius: 8, fontSize: 11,
                  }}
                  itemStyle={{ color: T.text }}
                  formatter={(v: any) => [`${(v || 0).toFixed(1)}%`]}
                />
                <Line
                  type="monotone" dataKey="value"
                  stroke={sparkColor} strokeWidth={2}
                  dot={{ r: 3, fill: sparkColor, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <ProgressTrack value={currAvg} color={conformColor} />
      </KpiCard>

      {/* ── 2. Melhor Categoria ── */}
      <KpiCard label="Melhor Categoria" accentColor={T.orange} index={1}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 24, fontWeight: 700, color: T.text, lineHeight: 1,
          }}>
            {bestCat}
          </span>
          <span style={{
            fontSize: 22, fontWeight: 700, color: T.orange,
            fontFamily: "'DM Mono', monospace",
          }}>
            {(bestScore || 0).toFixed(0)}%
          </span>
        </div>
        <ProgressTrack value={bestScore} color={T.orange} />
      </KpiCard>

      {/* ── 3. Reuniões ── */}
      <KpiCard label="% de Reuniões Realizadas" accentColor={meetColor} index={2}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 36, fontWeight: 700, color: T.text,
            lineHeight: 1, fontFamily: "'DM Mono', monospace",
          }}>
            {(meetingsPct || 0).toFixed(0)}%
          </span>
          {meetingsPct < 70 && (
            <StatusBadge label="Atenção" color={T.red} bg={T.redDim} />
          )}
        </div>
        <ProgressTrack value={meetingsPct} color={meetColor} />
      </KpiCard>

      {/* ── 4. NPS ── */}
      <KpiCard label="NPS Médio" accentColor={npsColor} index={3}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 36, fontWeight: 700, color: T.text,
            lineHeight: 1, fontFamily: "'DM Mono', monospace",
          }}>
            {(npsAvg || 0).toFixed(1)}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
            background: npsBg, color: npsColor,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {npsLabel}
          </span>
        </div>
        <ProgressTrack value={Math.min(npsAvg, 100)} color={npsColor} />
      </KpiCard>

      <style jsx>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .kpi-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
