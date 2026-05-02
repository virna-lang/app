'use client';

import React, { useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
  BarChart, Bar, Cell, LabelList,
} from 'recharts';
import { DashboardData, COLORS } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';
import { getConsultorLabel } from '@/lib/consultor-label';

const T = {
  bg:      '#0f1117',
  bgDeep:  '#0a0b0e',
  border:  '#1a1d24',
  orange:  '#ff5c1a',
  green:   '#1d9e75',
  red:     '#e05555',
  text:    '#e2e4e9',
  textSub: '#9aa0b0',
  textDim: '#3f4455',
  mono:    "'DM Mono', monospace",
};

const PALETTE = [
  '#ff5c1a', '#4fc3f7', '#1d9e75', '#fbbf24',
  '#a78bfa', '#f472b6', '#34d399', '#60a5fa',
];

function semaphor(v: number) {
  if (v >= 80) return T.green;
  if (v >= 60) return T.orange;
  return T.red;
}

const tooltipStyle = {
  background: T.bgDeep,
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  fontSize: 12,
};

function EndLabel({ x, y, value, index, color, totalMonths }: any) {
  if (value === undefined || index !== totalMonths - 1) return null;
  return (
    <text x={x + 10} y={y + 4} fill={color}
      style={{ fontSize: '11px', fontWeight: 700, fontFamily: T.mono }}>
      {(value || 0).toFixed(0)}%
    </text>
  );
}

function MiniChart({ chartData, consultants, label }: {
  chartData: any[];
  consultants: { id: string; nome: string; nomeCompleto: string; color: string }[];
  label: string;
}) {
  const avg = useMemo(() => {
    if (!chartData.length) return 0;
    const last = chartData[chartData.length - 1];
    const vals = consultants.map(c => last[c.id] ?? 0).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [chartData, consultants]);

  return (
    <div style={{
      background: T.bg,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: '20px 20px 16px',
      flex: 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: semaphor(avg), fontFamily: T.mono, lineHeight: 1 }}>
            Média: {avg.toFixed(1)}%
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', justifyContent: 'flex-end', maxWidth: 280 }}>
          {consultants.map(c => (
            <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.textSub }}>
              <i style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'block', flexShrink: 0 }} />
              {c.nome}
            </span>
          ))}
        </div>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 80, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fill: T.textDim, fontSize: 11, fontWeight: 600 }} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
              tick={{ fill: T.textDim, fontSize: 10 }}
              tickFormatter={v => `${v}%`} width={34} />
            <ReferenceLine y={80} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }}
              formatter={(v: any) => [`${(v || 0).toFixed(1)}%`]} />
            {consultants.map((c) => (
              <Line key={c.id} type="monotone" dataKey={c.id} name={c.nomeCompleto}
                stroke={c.color} strokeWidth={2}
                dot={{ r: 3, fill: c.color, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                label={<EndLabel color={c.color} totalMonths={chartData.length} />}
                isAnimationActive animationDuration={700} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function EvolutionSection({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();

  const months = useMemo(
    () => [data.prevMonth, data.month].filter(Boolean) as string[],
    [data.month, data.prevMonth],
  );

  const consultants = useMemo(
    () => (data.currentAudits as any[]).map((a, i) => ({
      id: a.consultor_id,
      nome: getConsultorLabel(consultores, a.consultor_id, 'first'),
      nomeCompleto: getConsultorLabel(consultores, a.consultor_id, 'full'),
      color: PALETTE[i % PALETTE.length],
    })),
    [data.currentAudits, consultores],
  );

  const buildChart = useCallback((scoreField: string) =>
    months.map(m => {
      const entry: any = { name: m };
      const audits = m === data.month ? data.currentAudits : data.prevAudits;
      consultants.forEach(c => {
        const audit = (audits as any[]).find(a => a.consultor_id === c.id);
        if (audit) entry[c.id] = audit[scoreField] ?? 0;
      });
      return entry;
    }), [consultants, data.currentAudits, data.month, data.prevAudits, months]);

  const chartResultado    = useMemo(() => buildChart('score_resultado'),    [buildChart]);
  const chartConformidade = useMemo(() => buildChart('score_conformidade'), [buildChart]);

  const topEvolution = useMemo(() =>
    consultants.map(c => {
      const curr = (data.currentAudits as any[]).find(a => a.consultor_id === c.id)?.score_geral ?? 0;
      const prev = (data.prevAudits as any[]).find(a => a.consultor_id === c.id)?.score_geral ?? curr;
      return { ...c, diff: curr - prev, curr };
    }).sort((a, b) => b.diff - a.diff),
    [data, consultants],
  );

  const top = topEvolution[0] ?? { nome: '—', diff: 0, curr: 0, color: T.orange };

  const geralRanking = useMemo(() =>
    [...consultants].map(c => {
      const audit = (data.currentAudits as any[]).find(a => a.consultor_id === c.id);
      return {
        nome:               c.nome,
        nomeCompleto:       c.nomeCompleto,
        score_conformidade: audit?.score_conformidade ?? 0,
        score_resultado:    audit?.score_resultado    ?? 0,
        color:              c.color,
      };
    }).sort((a, b) => b.score_conformidade - a.score_conformidade),
    [consultants, data.currentAudits],
  );

  return (
    <div style={{ marginTop: 4 }}>
      <div className="evo-main-grid">
        {/* Gráficos de linha */}
        <div className="evo-charts-grid">
          <MiniChart chartData={chartResultado}    consultants={consultants} label="Resultado" />
          <MiniChart chartData={chartConformidade} consultants={consultants} label="Conformidade de Processo" />
        </div>

        {/* Ranking lateral */}
        <div style={{
          background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '20px 18px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim, marginBottom: 2 }}>
              Conformidade de Processo
            </div>
            <div style={{ fontSize: 11, color: T.textDim }}>Score de conformidade do mês</div>
          </div>

          {/* Barras horizontais */}
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geralRanking} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false}
                  width={56} tick={{ fill: T.textSub, fontSize: 11, fontWeight: 600 }} />
                <ReferenceLine x={80} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                  formatter={(v: any, _: any, props: any) => [
                    `${(v || 0).toFixed(1)}%`,
                    props.payload?.nomeCompleto ?? '',
                  ]} />
                <Bar dataKey="score_conformidade" radius={[0, 4, 4, 0]} barSize={14}>
                  {geralRanking.map((e, i) => (
                    <Cell key={i} fill={semaphor(e.score_conformidade)} fillOpacity={0.9} />
                  ))}
                  <LabelList dataKey="score_conformidade" position="right"
                    formatter={(v: any) => `${(v || 0).toFixed(1)}%`}
                    style={{ fill: T.textSub, fontSize: 11, fontWeight: 700, fontFamily: T.mono }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown R vs C */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            {geralRanking.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.color, minWidth: 52 }}>
                  {r.nome}
                </span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(255,92,26,0.1)', color: T.orange, fontFamily: T.mono,
                  }}>
                    R {r.score_resultado.toFixed(0)}%
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(79,195,247,0.1)', color: '#4fc3f7', fontFamily: T.mono,
                  }}>
                    C {r.score_conformidade.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Maior Evolução */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            background: 'rgba(255,92,26,0.06)',
            border: `1px solid rgba(255,92,26,0.15)`,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textDim }}>
                Maior Evolução
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: top.color, lineHeight: 1.2 }}>
                {top.nome}
              </div>
            </div>
            <span style={{
              fontSize: 20, fontWeight: 700, fontFamily: T.mono,
              color: top.diff >= 0 ? T.green : T.red,
            }}>
              {top.diff >= 0 ? '+' : ''}{(top.diff || 0).toFixed(1)}<span style={{ fontSize: 11 }}>pp</span>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .evo-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 12px;
          align-items: start;
        }

        .evo-charts-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 1400px) { .evo-main-grid { grid-template-columns: 1fr; } }
        @media (max-width: 900px) { .evo-charts-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
