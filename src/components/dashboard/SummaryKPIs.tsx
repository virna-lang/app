'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { DashboardData, getSemaphorColor, getSemaphorBg, COLORS } from '@/types/dashboard';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

// ── Variação pill ────────────────────────────────────────────────────────
function VariationPill({ val }: { val: number }) {
  const isPos = val >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 99,
      background: isPos ? COLORS.verdeDim : COLORS.vermelhoDim,
      color: isPos ? COLORS.verde : COLORS.vermelho,
      fontSize: 11, fontWeight: 700,
    }}>
      {isPos
        ? <TrendingUp size={11} strokeWidth={2.5}/>
        : <TrendingDown size={11} strokeWidth={2.5}/>
      }
      {isPos ? '+' : ''}{(val || 0).toFixed(1)}pp
    </span>
  );
}

// ── Progress track ───────────────────────────────────────────────────────
function ProgressTrack({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', marginTop: 'auto' }}>
      <div style={{
        height: '100%', width: `${Math.min(value, 100)}%`,
        background: color, borderRadius: 99,
        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
      }}/>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────
function KpiCard({
  label, children, accentColor,
}: {
  label: string;
  children: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-top-bar" style={{ background: `linear-gradient(90deg,${accentColor}99,transparent)` }}/>
      <span className="kpi-label">{label}</span>
      {children}

      <style jsx>{`
        .kpi-card {
          background: #111827;
          border: 1px solid #1f2d40;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex; flex-direction: column; gap: 10px;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .kpi-card:hover {
          border-color: rgba(252,84,0,0.25);
          box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        }
        .kpi-top-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
        }
        .kpi-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          color: #475569; text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────
export default function SummaryKPIs({ data }: { data: DashboardData }) {
  // 1. Conformidade Geral
  const currWith = data.currentAudits.filter((c: any) => (c.score_conformidade ?? 0) > 0);
  const prevWith  = data.prevAudits.filter((c: any) => (c.score_conformidade ?? 0) > 0);
  const currAvg = currWith.reduce((a: number, c: any) => a + c.score_conformidade, 0) / (currWith.length || 1);
  const prevAvg = prevWith.reduce((a: number, c: any) => a + c.score_conformidade, 0) / (prevWith.length || 1);
  const varScore = currAvg - prevAvg;

  const trendData = [
    { name: 'Anterior', value: prevAvg },
    { name: 'Atual', value: currAvg },
  ];

  // 2. Melhor Categoria
  const catMap: Record<string, string> = {
    score_clickup: 'ClickUp', score_drive: 'Drive',
    score_whatsapp: 'WhatsApp', score_metas: 'Planilhas',
    score_flags: 'Flags', score_rastreabilidade: 'Rastreabilidade',
  };
  let bestCat = 'ClickUp', bestScore = 0;
  Object.keys(catMap).forEach(cat => {
    const avg = data.currentAudits.reduce((a: number, c: any) => a + (c[cat] || 0), 0) / (data.currentAudits.length || 1);
    if (avg > bestScore) { bestScore = avg; bestCat = catMap[cat]; }
  });

  // 3. % Reuniões
  const metMeetings  = data.currentMeetings.reduce((a: number, c: any) => a + c.reunioes_realizadas, 0);
  const totalMeetings = data.currentMeetings.reduce((a: number, c: any) => a + c.clientes_ativos, 0);
  const meetingsPct = totalMeetings > 0 ? (metMeetings / totalMeetings) * 100 : 0;

  // 4. NPS
  const npsAvg = data.currentNPS.length > 0
    ? data.currentNPS.reduce((a: number, c: any) => a + c.nota, 0) / data.currentNPS.length
    : 0;
  const npsLabel = npsAvg >= 90 ? 'Excelente' : npsAvg >= 75 ? 'Bom' : 'Atenção';
  const npsColor = npsAvg >= 90 ? COLORS.verde : npsAvg >= 75 ? COLORS.primary : COLORS.vermelho;

  const conformColor = getSemaphorColor(currAvg);
  const meetColor    = getSemaphorColor(meetingsPct);

  return (
    <div className="kpi-grid">

      {/* ── 1. Conformidade Geral ── */}
      <KpiCard label="Conformidade Geral" accentColor={conformColor}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
              {(currAvg || 0).toFixed(1)}%
            </span>
            {data.prevMonth && <VariationPill val={varScore}/>}
          </div>
          <div style={{ width: 80, height: 44, marginBottom: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']}/>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2d40', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(v: any) => [`${(v || 0).toFixed(1)}%`]}
                />
                <Line
                  type="monotone" dataKey="value"
                  stroke={varScore >= 0 ? COLORS.verde : COLORS.vermelho}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: varScore >= 0 ? COLORS.verde : COLORS.vermelho, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <ProgressTrack value={currAvg} color={conformColor}/>
      </KpiCard>

      {/* ── 2. Melhor Categoria ── */}
      <KpiCard label="Melhor Categoria" accentColor={COLORS.primary}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{bestCat}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary }}>{(bestScore || 0).toFixed(0)}%</span>
        </div>
        <ProgressTrack value={bestScore} color={COLORS.primary}/>
      </KpiCard>

      {/* ── 3. Reuniões ── */}
      <KpiCard label="% de Reuniões Realizadas" accentColor={meetColor}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
            {(meetingsPct || 0).toFixed(0)}%
          </span>
          {meetingsPct < 70 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 99,
              background: COLORS.vermelhoDim, color: COLORS.vermelho,
              fontSize: 11, fontWeight: 700,
            }}>
              <AlertTriangle size={11}/> Atenção
            </div>
          )}
        </div>
        <ProgressTrack value={meetingsPct} color={meetColor}/>
      </KpiCard>

      {/* ── 4. NPS ── */}
      <KpiCard label="NPS Médio" accentColor={npsColor}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
            {(npsAvg || 0).toFixed(1)}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
            background: getSemaphorBg(npsAvg >= 90 ? 90 : npsAvg >= 75 ? 75 : 0),
            color: npsColor, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {npsLabel}
          </span>
        </div>
        <ProgressTrack value={Math.min(npsAvg, 100)} color={npsColor}/>
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
