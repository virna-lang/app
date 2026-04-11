'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
  BarChart, Bar, Cell, LabelList,
} from 'recharts';
import { DashboardData, COLORS } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

const PALETTE = [
  '#FC5400', '#00A3E0', '#1E9080', '#FFD700',
  '#9ACD32', '#C084FC', '#F472B6', '#38BDF8',
];

function getSemaphor(v: number) {
  if (v >= 80) return COLORS.verde;
  if (v >= 60) return COLORS.primary;
  return COLORS.vermelho;
}

function MiniChart({
  chartData,
  consultants,
  scoreKey,
  label,
}: {
  chartData: any[];
  consultants: { id: string; nome: string; color: string }[];
  scoreKey: string;
  label: string;
}) {
  const avg = useMemo(() => {
    if (!chartData.length) return 0;
    const last = chartData[chartData.length - 1];
    const vals = consultants.map(c => last[c.nome] ?? 0).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [chartData, consultants]);

  return (
    <div className="mini-chart-card">
      <div className="mcc-header">
        <div>
          <span className="mcc-label">{label}</span>
          <span className="mcc-avg" style={{ color: getSemaphor(avg) }}>
            Média: {avg.toFixed(1)}%
          </span>
        </div>
        <div className="mcc-legend">
          {consultants.map(c => (
            <span key={c.id} className="leg-dot">
              <i style={{ background: c.color }} />
              {c.nome.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="mcc-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 16, right: 100, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 700 }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: COLORS.textMuted, fontSize: 10 }}
              tickFormatter={v => `${v}%`}
              width={36}
            />
            <ReferenceLine y={80} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{
                background: '#0F1020',
                borderRadius: '10px',
                border: '1px solid #1A1A38',
                fontSize: '12px',
              }}
              itemStyle={{ fontWeight: 700 }}
              formatter={(v: any) => [`${(v || 0).toFixed(1)}%`]}
            />
            {consultants.map((c, i) => (
              <Line
                key={c.id}
                type="monotone"
                dataKey={c.nome}
                stroke={c.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: c.color, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                label={<EndLabel color={c.color} totalMonths={chartData.length} />}
                isAnimationActive
                animationDuration={900}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .mini-chart-card {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 28px 28px 20px;
          flex: 1;
        }
        .mcc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .mcc-label {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          font-weight: 800;
          margin-bottom: 4px;
        }
        .mcc-avg {
          font-family: var(--font-bebas);
          font-size: 1.6rem;
          line-height: 1;
        }
        .mcc-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }
        .leg-dot {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .leg-dot i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: block;
          flex-shrink: 0;
        }
        .mcc-chart { height: 280px; }
      `}</style>
    </div>
  );
}

function EndLabel({ x, y, value, index, color, totalMonths }: any) {
  if (value === undefined || index !== totalMonths - 1) return null;
  return (
    <text
      x={x + 10}
      y={y + 4}
      fill={color}
      style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-body)' }}
    >
      {(value || 0).toFixed(0)}%
    </text>
  );
}

export default function EvolutionSection({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();
  const getNome = (id: string) => consultores.find(c => c.id === id)?.nome ?? 'Consultor';

  const months = useMemo(
    () => [data.prevMonth, data.month].filter(Boolean) as string[],
    [data.month, data.prevMonth],
  );

  const consultants = useMemo(
    () =>
      (data.currentAudits as any[]).map((a, i) => ({
        id: a.consultor_id,
        nome: getNome(a.consultor_id),
        color: PALETTE[i % PALETTE.length],
      })),
    [data.currentAudits, consultores],
  );

  const buildChart = (scoreField: string) =>
    months.map(m => {
      const entry: any = { name: m };
      const audits = m === data.month ? data.currentAudits : data.prevAudits;
      consultants.forEach(c => {
        const audit = (audits as any[]).find(a => a.consultor_id === c.id);
        if (audit) entry[c.nome] = audit[scoreField] ?? 0;
      });
      return entry;
    });

  const chartResultado    = useMemo(() => buildChart('score_resultado'),    [months, data.currentAudits, data.prevAudits, consultants]);
  const chartConformidade = useMemo(() => buildChart('score_conformidade'), [months, data.currentAudits, data.prevAudits, consultants]);

  // Maior evolução geral
  const topEvolution = useMemo(() => {
    return consultants.map(c => {
      const curr = (data.currentAudits as any[]).find(a => a.consultor_id === c.id)?.score_geral ?? 0;
      const prev = (data.prevAudits as any[]).find(a => a.consultor_id === c.id)?.score_geral ?? curr;
      return { ...c, diff: curr - prev, curr };
    }).sort((a, b) => b.diff - a.diff);
  }, [data, consultants]);

  const top = topEvolution[0] ?? { nome: '—', diff: 0, curr: 0, color: COLORS.primary };

  // Dados para o gráfico de Conformidade Geral (barras horizontais)
  const geralRanking = useMemo(() => {
    return [...consultants]
      .map(c => {
        const audit = (data.currentAudits as any[]).find(a => a.consultor_id === c.id);
        return {
          nome: c.nome.split(' ')[0],
          nomeCompleto: c.nome,
          score_geral:        audit?.score_geral        ?? 0,
          score_resultado:    audit?.score_resultado    ?? 0,
          score_conformidade: audit?.score_conformidade ?? 0,
          color: c.color,
        };
      })
      .sort((a, b) => b.score_conformidade - a.score_conformidade);
  }, [consultants, data.currentAudits]);

  return (
    <div className="evo-container">
      <div className="section-anchor">
        <h2>Evolução Histórica da Conformidade</h2>
      </div>

      <div className="evo-main-grid">
        {/* Coluna esquerda: dois gráficos de linha empilhados */}
        <div className="evo-lines-col">
          <MiniChart
            chartData={chartResultado}
            consultants={consultants}
            scoreKey="score_resultado"
            label="Resultado"
          />
          <MiniChart
            chartData={chartConformidade}
            consultants={consultants}
            scoreKey="score_conformidade"
            label="Conformidade de Processo"
          />
        </div>

        {/* Coluna direita: Conformidade Geral */}
        <div className="card geral-card">
          <div className="geral-header">
            <span className="geral-label">Conformidade Geral</span>
            <span className="geral-sub">Score combinado do mês</span>
          </div>

          <div className="geral-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={geralRanking}
                layout="vertical"
                margin={{ top: 8, right: 56, bottom: 8, left: 8 }}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="nome"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12, fontWeight: 700 }}
                />
                <ReferenceLine x={80} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ background: '#0F1020', borderRadius: '10px', border: '1px solid #1A1A38', fontSize: '12px' }}
                  formatter={(v: any, name: string) => [`${(v || 0).toFixed(1)}%`, name]}
                  labelFormatter={(label) => geralRanking.find(r => r.nome === label)?.nomeCompleto ?? label}
                />
                <Bar dataKey="score_geral" radius={[0, 6, 6, 0]} barSize={28}>
                  {geralRanking.map((entry, i) => (
                    <Cell key={i} fill={getSemaphor(entry.score_geral)} fillOpacity={0.85} />
                  ))}
                  <LabelList
                    dataKey="score_geral"
                    position="right"
                    formatter={(v: any) => `${(v || 0).toFixed(1)}%`}
                    style={{ fill: '#fff', fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-bebas)' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mini detalhamento R vs C por consultor */}
          <div className="geral-breakdown">
            {geralRanking.map((r, i) => (
              <div key={i} className="gb-row">
                <span className="gb-name" style={{ color: r.color }}>{r.nome}</span>
                <div className="gb-pills">
                  <span className="gb-pill resultado">R {r.score_resultado.toFixed(0)}%</span>
                  <span className="gb-pill conformidade">C {r.score_conformidade.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Maior evolução compacto */}
          <div className="geral-top">
            <span className="te-trophy">🏆</span>
            <div className="te-info">
              <span className="te-label">Maior Evolução</span>
              <span className="te-name" style={{ color: top.color }}>{top.nome.split(' ')[0]}</span>
            </div>
            <span className="te-val" style={{ color: top.diff >= 0 ? COLORS.verde : COLORS.vermelho }}>
              {top.diff >= 0 ? '+' : ''}{(top.diff || 0).toFixed(1)}<span className="te-unit">pp</span>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .evo-container { margin-top: 20px; }

        .evo-main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 16px;
          align-items: start;
        }
        .evo-lines-col { display: flex; flex-direction: column; gap: 16px; }

        /* Card Conformidade Geral */
        .geral-card {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          padding: 28px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .geral-header { display: flex; flex-direction: column; gap: 2px; }
        .geral-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          font-weight: 800;
        }
        .geral-sub { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
        .geral-chart { height: 220px; }

        /* Breakdown R vs C */
        .geral-breakdown { display: flex; flex-direction: column; gap: 8px; }
        .gb-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .gb-name { font-size: 0.75rem; font-weight: 800; min-width: 60px; }
        .gb-pills { display: flex; gap: 6px; }
        .gb-pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: var(--font-bebas);
          font-size: 0.85rem;
        }
        .gb-pill.resultado   { background: rgba(252,84,0,0.12);  color: var(--laranja-vorp); }
        .gb-pill.conformidade { background: rgba(0,163,224,0.12); color: #00A3E0; }

        /* Maior evolução compacto */
        .geral-top {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(252, 84, 0, 0.06);
          border: 1px solid rgba(252, 84, 0, 0.15);
          border-radius: 10px;
        }
        .te-trophy { font-size: 1.5rem; }
        .te-info { flex: 1; display: flex; flex-direction: column; }
        .te-label {
          font-size: 0.55rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        .te-name { font-family: var(--font-bebas); font-size: 1.3rem; line-height: 1.1; }
        .te-val { font-family: var(--font-bebas); font-size: 1.8rem; line-height: 1; }
        .te-unit { font-size: 0.7rem; font-weight: 800; margin-left: 2px; }

        @media (max-width: 1200px) { .evo-main-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
