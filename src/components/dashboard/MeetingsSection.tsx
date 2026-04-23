'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

const tooltipStyle = {
  background: '#111827', borderRadius: 10,
  border: '1px solid #1f2d40', fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

export default function MeetingsSection({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();

  const ranking = useMemo(() => {
    const source = data.rankingAtendidos.length > 0 ? data.rankingAtendidos : data.currentMeetings;
    const useAudit = data.rankingAtendidos.length > 0;

    const map: Record<string, { consultor_id: string; atendidos: number; carteira: number }> = {};
    source.forEach((r: any) => {
      const cid = r.consultor_id;
      if (!map[cid]) map[cid] = { consultor_id: cid, atendidos: 0, carteira: 0 };
      map[cid].atendidos += useAudit ? (r.atendidos ?? 0) : (r.reunioes_realizadas ?? 0);
      map[cid].carteira  += useAudit ? (r.carteira  ?? 0) : (r.clientes_ativos    ?? 0);
    });

    return Object.values(map).map(r => ({
      consultor_id:        r.consultor_id,
      reunioes_realizadas: r.atendidos,
      clientes_ativos:     r.carteira,
      pct_reunioes:        r.carteira > 0 ? Math.round((r.atendidos / r.carteira) * 100) : 0,
      consulName:          consultores.find(c => c.id === r.consultor_id)?.nome ?? 'Consultor',
    })).sort((a, b) => b.pct_reunioes - a.pct_reunioes);
  }, [data.rankingAtendidos, data.currentMeetings, consultores]);

  const getStatusLabel = (pct: number) =>
    pct >= 90 ? 'Excelente' : pct >= 75 ? 'Dentro do Esperado' : 'Abaixo da Meta';

  return (
    <section>
      <div className="section-anchor"><h2>Ranking de Reuniões Realizadas</h2></div>

      <div className="meetings-grid">
        {/* Gráfico de barras */}
        <div className="card chart-card">
          <p className="card-sub">% da Carteira Atendida no Mês</p>
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} margin={{ top: 28, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="consulName" axisLine={false} tickLine={false}
                  tick={{ fill: COLORS.textSecondary, fontSize: 11, fontWeight: 600 }} dy={8}/>
                <YAxis domain={[0,100]} axisLine={false} tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 10 }} tickFormatter={v=>`${v}%`} width={36}/>
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                  formatter={(v: any, _: any, props: any) => [
                    `${v}% (${props.payload.reunioes_realizadas}/${props.payload.clientes_ativos})`,
                    '% Carteira',
                  ]}/>
                <Bar dataKey="pct_reunioes" radius={[6,6,0,0]} barSize={36}>
                  {ranking.map((e, i) => (
                    <Cell key={i} fill={getSemaphorColor(e.pct_reunioes)} fillOpacity={0.85}/>
                  ))}
                  <LabelList dataKey="pct_reunioes" position="top"
                    fill="rgba(255,255,255,0.45)"
                    formatter={(v: any) => `${v}%`}
                    style={{ fontSize: 11, fontWeight: 700 }}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela */}
        <div className="card table-card">
          <div className="table-head-row">
            <span className="table-title">Detalhamento Mensal</span>
            <span className="table-sub">Realizado / Carteira</span>
          </div>
          <table className="meets-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Consultor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Presença</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => {
                const color = getSemaphorColor(r.pct_reunioes);
                return (
                  <tr key={i} className="t-row">
                    <td className="t-pos">#{i+1}</td>
                    <td className="t-name">{r.consulName}</td>
                    <td>
                      <span className="status-pill" style={{ background: `${color}18`, color }}>
                        {getStatusLabel(r.pct_reunioes)}
                      </span>
                    </td>
                    <td className="t-val">{r.reunioes_realizadas}/{r.clientes_ativos}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .meetings-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }

        .chart-card { padding: 24px 28px; }
        .card-sub { font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }

        .table-card { padding: 24px; }
        .table-head-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
        .table-title { font-size: 14px; font-weight: 700; color: #f1f5f9; }
        .table-sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; font-weight: 700; }

        .meets-table { width: 100%; border-collapse: collapse; }
        .meets-table th {
          text-align: left; padding: 8px 10px;
          color: #334155; font-size: 10px; text-transform: uppercase;
          letter-spacing: 0.08em; border-bottom: 1px solid #1f2d40;
          font-weight: 700;
        }
        .meets-table td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .t-row:hover { background: rgba(255,255,255,0.015); }
        .t-row:last-child td { border-bottom: none; }

        .t-pos { font-size: 11px; color: #334155; font-weight: 700; width: 32px; }
        .t-name { font-size: 13px; font-weight: 600; color: #94a3b8; }
        .t-val { text-align: right; font-size: 15px; font-weight: 800; color: #f1f5f9; }

        .status-pill {
          display: inline-block; padding: 3px 9px; border-radius: 99px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          white-space: nowrap;
        }

        @media (max-width: 1100px) { .meetings-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
