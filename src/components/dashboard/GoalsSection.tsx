'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid } from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { mockConsultants, MonthlyGoal } from '@/lib/mockData';

export default function GoalsSection({ data, filterProducts }: { data: DashboardData, filterProducts: string[] }) {
  // 1. Ranking de Batimento por Consultor (RESULTADO)
  const consultantRanking = useMemo(() => {
    return data.currentAudits.map(a => {
      const consul = mockConsultants.find(c => c.id === a.consultor_id);
      const goals = data.currentGoals.filter(g => g.consultor_id === a.consultor_id);
      const batidas = goals.filter(g => g.bateu).length;
      const pct = goals.length > 0 ? (batidas / goals.length) * 100 : 0;
      return { 
        name: consul?.nome || 'Consultor', 
        pct,
        total: goals.length,
        batidas
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [data.currentAudits, data.currentGoals]);

  // 2. Ranking por Produto
  const productChartData = useMemo(() => {
    return filterProducts.map(p => {
      const current = data.currentGoals.filter(g => g.produto === p);
      const batidas = current.filter(g => g.bateu).length;
      const currentPct = current.length > 0 ? (batidas / current.length) * 100 : 0;
      return { name: p, value: currentPct, count: current.length };
    }).sort((a, b) => b.value - a.value);
  }, [data.currentGoals, filterProducts]);

  return (
    <section className="section-block">
      <div className="section-anchor">
          <h2>Ranking de Resultados (Metas Batidas)</h2>
      </div>

      <div className="goals-layout-grid">
        <div className="card ranking-card">
          <h3 className="card-subtitle">Batimento de Meta da Operação por Consultor</h3>
          <div className="chart-box">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantRanking} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 700 }} />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: COLORS.textMuted, fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(v) => `${v}%`}
                    width={35}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: COLORS.cardBg, borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}` }}
                  />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]} barSize={40}>
                    {consultantRanking.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSemaphorColor(entry.pct)} fillOpacity={0.8} />
                    ))}
                    <LabelList dataKey="pct" position="top" fill={COLORS.textMain} formatter={(v: any) => `${(v || 0).toFixed(0)}%`} style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-bebas)' }} />
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="card product-card">
          <h3 className="card-subtitle">Efetividade por Produto</h3>
          <div className="product-list">
            {productChartData.map((p, i) => (
              <div key={i} className="prod-row">
                <div className="prod-info">
                  <span className="p-name">{p.name}</span>
                  <span className="p-count">{p.count} clientes</span>
                </div>
                <div className="p-bar-bg">
                  <div className="p-bar-fill" style={{ width: `${p.value}%`, background: getSemaphorColor(p.value) }} />
                </div>
                <span className="p-val" style={{ color: getSemaphorColor(p.value) }}>{(p.value || 0).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card detailed-table-card" style={{ marginTop: '40px' }}>
        <div className="table-header">
           <h3 className="card-subtitle" style={{ marginBottom: 0 }}>Listagem Detalhada de Clientes</h3>
           <div className="table-legend">
              <span className="leg-item"><i className="dot verde" /> Bateu</span>
              <span className="leg-item"><i className="dot vermelho" /> Não Bateu</span>
           </div>
        </div>
        <div className="table-wrapper">
          <table className="goals-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Consultor</th>
                <th>Projetado</th>
                <th>Realizado</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.currentGoals.map((g: MonthlyGoal, i: number) => {
                const consul = mockConsultants.find(c => c.id === g.consultor_id);
                return (
                  <tr key={i} className="goal-row">
                    <td className="c-name">Vorp Client {i+1}</td>
                    <td><span className="tag-prod">{g.produto}</span></td>
                    <td className="c-consul">{consul?.nome}</td>
                    <td className="c-money">R$ {g.meta_projetada.toLocaleString()}</td>
                    <td className="c-money" style={{ color: g.bateu ? COLORS.verde : COLORS.vermelho }}>R$ {g.meta_realizada.toLocaleString()}</td>
                    <td className="c-status">
                       <span className={`status-pill ${g.bateu ? 'pos' : 'neg'}`}>
                          {g.bateu ? 'Meta Batida' : 'Abaixo da Meta'}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .goals-layout-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        .ranking-card, .product-card, .detailed-table-card { background: var(--glass-bg); backdrop-filter: blur(10px); padding: 30px; }
        .card-subtitle { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 30px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .chart-box { height: 320px; }

        .product-list { display: flex; flex-direction: column; gap: 20px; }
        .prod-row { display: flex; align-items: center; gap: 15px; }
        .prod-info { flex: 1; display: flex; flex-direction: column; }
        .p-name { font-weight: 700; color: var(--text-secondary); font-size: 0.9rem; }
        .p-count { font-size: 0.65rem; color: var(--text-muted); }
        .p-bar-bg { width: 40%; height: 6px; background: rgba(255,255,255,0.03); border-radius: 3px; overflow: hidden; }
        .p-bar-fill { height: 100%; transition: width 1s ease; }
        .p-val { width: 45px; text-align: right; font-family: var(--font-bebas); font-size: 1.2rem; font-weight: 800; }

        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .table-legend { display: flex; gap: 16px; }
        .leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.verde { background: var(--status-verde); }
        .dot.vermelho { background: var(--status-vermelho); }

        .table-wrapper { overflow-x: auto; }
        .goals-table { width: 100%; border-collapse: collapse; }
        .goals-table th { text-align: left; padding: 12px; color: var(--text-muted); text-transform: uppercase; font-size: 0.65rem; border-bottom: 1px solid var(--card-border); }
        .goals-table td { padding: 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 0.85rem; }
        
        .c-name { font-weight: 600; color: var(--text-main); }
        .tag-prod { font-size: 0.65rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; color: var(--text-secondary); }
        .c-consul { color: var(--text-muted); }
        .c-money { font-family: 'DM Sans'; font-weight: 500; }
        .status-pill { padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .status-pill.pos { background: rgba(30, 144, 128, 0.1); color: var(--status-verde); }
        .status-pill.neg { background: rgba(176, 48, 48, 0.1); color: var(--status-vermelho); }

        @media (max-width: 1200px) { .goals-layout-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
