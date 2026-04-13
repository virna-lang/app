'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid } from 'recharts';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

export default function MeetingsSection({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();

  // Um único ranking por % da carteira — deduplica por consultor_id
  const ranking = useMemo(() => {
    const seen = new Set<string>();
    return [...data.currentMeetings]
      .filter(r => {
        if (seen.has(r.consultor_id)) return false;
        seen.add(r.consultor_id);
        return true;
      })
      .map(r => ({
        ...r,
        consulName: consultores.find(c => c.id === r.consultor_id)?.nome ?? 'Consultor',
      }))
      .sort((a, b) => b.pct_reunioes - a.pct_reunioes);
  }, [data.currentMeetings, consultores]);

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2>Ranking de Reuniões Realizadas</h2>
      </div>

      <div className="meetings-layout">
        {/* Gráfico vertical — % da carteira atendida */}
        <div className="card ranking-visual-card">
          <h3 className="card-subtitle">% da Carteira Atendida no Mês</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} margin={{ top: 30, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="consulName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textSecondary, fontSize: 11, fontWeight: 700 }}
                  dy={8}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: COLORS.cardBg, borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}` }}
                  formatter={(v: any, _: any, props: any) => [
                    `${v}% (${props.payload.reunioes_realizadas}/${props.payload.clientes_ativos} clientes)`,
                    '% Carteira'
                  ]}
                />
                <Bar dataKey="pct_reunioes" radius={[6, 6, 0, 0]} barSize={36}>
                  {ranking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSemaphorColor(entry.pct_reunioes)} fillOpacity={0.8} />
                  ))}
                  <LabelList
                    dataKey="pct_reunioes"
                    position="top"
                    fill="rgba(255,255,255,0.5)"
                    formatter={(v: any) => `${v}%`}
                    style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-bebas)' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de detalhamento */}
        <div className="table-card card">
          <div className="table-header-box">
            <h3 className="table-t">Detalhamento Mensal</h3>
            <span className="table-label">Realizado / Carteira</span>
          </div>
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Consultor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Presença</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={i} className="hover-row">
                  <td className="rank-idx">#{i + 1}</td>
                  <td className="consul-name-cell">{r.consulName}</td>
                  <td>
                    <div className="status-pill" style={{
                      background: getSemaphorColor(r.pct_reunioes) + '18',
                      color: getSemaphorColor(r.pct_reunioes)
                    }}>
                      {r.pct_reunioes >= 90 ? 'Excelente' : r.pct_reunioes >= 75 ? 'Dentro do Esperado' : 'Abaixo da Meta'}
                    </div>
                  </td>
                  <td className="val-cell">
                    <span className="abs-val">{r.reunioes_realizadas}/{r.clientes_ativos}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .meetings-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
        .ranking-visual-card { padding: 30px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .card-subtitle { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
        .chart-container { height: 380px; }

        .table-card { padding: 24px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .table-header-box { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; }
        .table-t { font-size: 1rem; color: var(--text-main); }
        .table-label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; }

        .meetings-table { width: 100%; border-collapse: collapse; }
        .meetings-table th { text-align: left; padding: 10px 12px; color: var(--text-muted); text-transform: uppercase; font-size: 0.6rem; letter-spacing: 0.1em; border-bottom: 1px solid var(--card-border); }
        .meetings-table td { padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .hover-row:hover { background: rgba(255,255,255,0.01); }

        .rank-idx { font-family: var(--font-bebas); color: var(--text-muted); font-size: 1.1rem; width: 40px; }
        .consul-name-cell { font-weight: 700; color: var(--text-secondary); font-size: 0.85rem; }
        .status-pill { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 0.62rem; font-weight: 800; text-transform: uppercase; }
        .val-cell { text-align: right; }
        .abs-val { font-family: var(--font-bebas); font-size: 1.2rem; color: var(--text-main); }

        @media (max-width: 1100px) { .meetings-layout { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
