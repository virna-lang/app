'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

export default function MeetingsSection({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();

  const ranking = useMemo(() => {
    return [...data.currentMeetings]
      .map(r => ({
        ...r,
        consulName: consultores.find(c => c.id === r.consultor_id)?.nome ?? 'Consultor'
      }))
      .sort((a, b) => b.pct_reunioes - a.pct_reunioes);
  }, [data.currentMeetings, consultores]);

  // Ranking por clientes atendidos (absoluto) — responde à pergunta:
  // "Quantas clientes da carteira foram atendidos dentro do mês?"
  const rankingAtendidos = useMemo(() => {
    return [...data.currentMeetings]
      .map(r => ({
        ...r,
        consulName: consultores.find(c => c.id === r.consultor_id)?.nome ?? 'Consultor'
      }))
      .sort((a, b) => b.reunioes_realizadas - a.reunioes_realizadas);
  }, [data.currentMeetings, consultores]);

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2>Ranking de Reuniões Realizadas</h2>
      </div>

      {/* Gráfico principal — % de atendimento */}
      <div className="meetings-layout">
        <div className="card ranking-visual-card">
          <h3 className="card-subtitle">Performance de Atendimento — % da Carteira</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ top: 5, right: 60, left: 20, bottom: 5 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="consulName"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tick={{ fill: COLORS.textSecondary, fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: COLORS.cardBg, borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}` }}
                  formatter={(v: any) => [`${v}%`, 'Concluído']}
                />
                <Bar dataKey="pct_reunioes" radius={[0, 4, 4, 0]} barSize={24}>
                  {ranking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSemaphorColor(entry.pct_reunioes)} fillOpacity={0.8} />
                  ))}
                  <LabelList dataKey="pct_reunioes" position="insideLeft" fill="#fff" formatter={(v: any) => `${v}%`} style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-bebas)' }} offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

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
                      background: getSemaphorColor(r.pct_reunioes) + '15',
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

      {/* Ranking por clientes atendidos — absoluto */}
      <div className="atendidos-section">
        <div className="card atendidos-card">
          <h3 className="card-subtitle">Clientes da Carteira Atendidos no Mês (Absoluto)</h3>
          <div className="atendidos-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingAtendidos} layout="vertical" margin={{ top: 5, right: 60, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="consulName"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tick={{ fill: COLORS.textSecondary, fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: COLORS.cardBg, borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}` }}
                  formatter={(v: any, _: any, props: any) => [
                    `${v} de ${props.payload.clientes_ativos} clientes`,
                    'Atendidos'
                  ]}
                />
                <Bar dataKey="reunioes_realizadas" radius={[0, 4, 4, 0]} barSize={24} fill={COLORS.primary} fillOpacity={0.7}>
                  {rankingAtendidos.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary} fillOpacity={index === 0 ? 1 : 0.5 + index * 0.05} />
                  ))}
                  <LabelList dataKey="reunioes_realizadas" position="insideLeft" fill="#fff" style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-bebas)' }} offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Tabela de ranking absoluto */}
          <table className="meetings-table" style={{ marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Consultor</th>
                <th style={{ textAlign: 'right' }}>Atendidos</th>
                <th style={{ textAlign: 'right' }}>Carteira</th>
              </tr>
            </thead>
            <tbody>
              {rankingAtendidos.map((r, i) => (
                <tr key={i} className="hover-row">
                  <td className="rank-idx">#{i + 1}</td>
                  <td className="consul-name-cell">{r.consulName}</td>
                  <td className="val-cell">
                    <span className="abs-val" style={{ color: COLORS.primary }}>{r.reunioes_realizadas}</span>
                  </td>
                  <td className="val-cell">
                    <span style={{ color: COLORS.textMuted, fontFamily: 'var(--font-bebas)', fontSize: '1.1rem' }}>{r.clientes_ativos}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .meetings-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
        .ranking-visual-card { padding: 30px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .card-subtitle { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 30px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .chart-container { height: 400px; }

        .table-card { padding: 24px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .table-header-box { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; }
        .table-t { font-size: 1rem; color: var(--text-main); }
        .table-label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; }

        .meetings-table { width: 100%; border-collapse: collapse; }
        .meetings-table th { text-align: left; padding: 12px; color: var(--text-muted); text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.1em; border-bottom: 1px solid var(--card-border); }
        .meetings-table td { padding: 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .hover-row:hover { background: rgba(255,255,255,0.01); }

        .rank-idx { font-family: var(--font-bebas); color: var(--text-muted); font-size: 1.1rem; width: 40px; }
        .consul-name-cell { font-weight: 700; color: var(--text-secondary); font-size: 0.85rem; }
        .status-pill { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .val-cell { text-align: right; }
        .abs-val { font-family: var(--font-bebas); font-size: 1.2rem; color: var(--text-main); }

        .atendidos-section { margin-top: 20px; }
        .atendidos-card { padding: 30px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .atendidos-chart { height: 260px; }

        @media (max-width: 1100px) { .meetings-layout { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
