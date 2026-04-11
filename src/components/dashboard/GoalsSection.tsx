import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { DashboardData, COLORS } from '@/types/dashboard';
import { mockConsultants, MonthlyGoal } from '@/lib/mockData';

export default function GoalsSection({ data, filterProducts }: { data: DashboardData, filterProducts: string[] }) {
  const chartData = useMemo(() => {
    return filterProducts.map(p => {
      const current = data.currentGoals.filter(g => g.produto === p);
      const prev = data.prevGoals.filter(g => g.produto === p);
      
      const currentPct = current.length > 0 ? (current.filter(g => g.bateu).length / current.length) * 100 : 0;
      const prevPct = prev.length > 0 ? (prev.filter(g => g.bateu).length / prev.length) * 100 : 0;
      
      return { name: p, atual: currentPct, anterior: prevPct };
    });
  }, [data, filterProducts]);

  const p1 = ['Aliança Pro', 'GSA'];
  const p2 = ['Aliança', 'Tração'];
  const p3 = ['Gestão de Tráfego'];

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2>Batimento de Metas dos Clientes</h2>
      </div>
      <div className="goals-expansion">
        <div className="layout-grid-2-1">
          <div className="card chart-card-p">
            <h3>Em quais produtos os clientes mais batem meta?</h3>
            <div style={{ height: 300, marginTop: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textMuted, fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                    contentStyle={{ background: COLORS.cardBg, borderRadius: '8px', border: `1px solid ${COLORS.cardBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                  />
                  <Bar dataKey="atual" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={32} name="Mês Atual">
                    <LabelList dataKey="atual" position="top" fill={COLORS.textMain} style={{ fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => `${Number(v).toFixed(0)}%`} />
                  </Bar>
                  <Bar dataKey="anterior" fill={COLORS.primary} opacity={0.2} radius={[4, 4, 0, 0]} barSize={32} name="Anterior" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card panels-preview">
            <h3>Performance por Produto</h3>
            <div className="mini-panels">
              <MiniGoalPanel title="Pro & GSA" products={p1} data={data} />
              <MiniGoalPanel title="Aliança & Tração" products={p2} data={data} />
              <MiniGoalPanel title="Tráfego" products={p3} data={data} />
            </div>
          </div>
        </div>

        <div className="card client-table-card" style={{ padding: '30px' }}>
          <h3 className="table-t">Tabela Detalhada por Cliente</h3>
          <table className="client-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Consultor</th>
                <th>Meta Projetada</th>
                <th>Meta Realizada</th>
                <th>%</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.currentGoals.map((g: MonthlyGoal, i: number) => {
                const consul = mockConsultants.find(c => c.id === g.consultor_id);
                const pct = (g.meta_realizada / g.meta_projetada) * 100;
                return (
                  <tr key={i}>
                    <td>Vorp Client {i+1}</td>
                    <td><span className="prod-tag">{g.produto}</span></td>
                    <td style={{ color: COLORS.textSecondary }}>{consul?.nome}</td>
                    <td>R$ {g.meta_projetada.toLocaleString()}</td>
                    <td>R$ {g.meta_realizada.toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>{pct.toFixed(1)}%</td>
                    <td>
                      <span className="status-badge" style={{ background: g.bateu ? COLORS.verde + '20' : COLORS.vermelho + '21', color: g.bateu ? COLORS.verde : COLORS.vermelho }}>
                        {g.bateu ? 'Bateu' : 'Não Bateu'}
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
        .layout-grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media (max-width: 1200px) { .layout-grid-2-1 { grid-template-columns: 1fr; } }
        .goals-expansion { display: flex; flex-direction: column; gap: 20px; }
        .chart-card-p { padding: 30px; }
        .chart-card-p h3 { font-size: 0.9rem; color: var(--text-secondary); }
        .panels-preview { padding: 24px; display: flex; flex-direction: column; }
        .panels-preview h3 { font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 20px; }
        .mini-panels { display: flex; flex-direction: column; gap: 16px; }
        
        .client-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .client-table th { padding: 12px; font-size: 10px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--card-border); text-align: left; }
        .client-table td { padding: 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.85rem; }
        .prod-tag { font-size: 10px; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
        .status-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; }
        .table-t { font-size: 15px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px; }
      `}</style>
    </section>
  );
}

function MiniGoalPanel({ title, products, data }: any) {
  const panelData = mockConsultants.map(c => {
    const current = data.currentGoals.filter((g: MonthlyGoal) => g.consultor_id === c.id && products.includes(g.produto));
    const val = current.length > 0 ? (current.filter((g: MonthlyGoal) => g.bateu).length / current.length) * 100 : 0;
    return { name: c.nome, val };
  }).filter(d => d.val > 0);

  return (
    <div className="mini-panel">
      <div className="mp-head">{title}</div>
      <div className="mp-bars">
        {panelData.map((d, i) => (
          <div key={i} className="mp-bar-row">
            <span className="mp-name">{d.name}</span>
            <div className="mp-bar-bg"><div className="mp-bar-fill" style={{ width: `${d.val}%` }} /></div>
            <span className="mp-val">{d.val.toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .mini-panel { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; }
        .mp-head { font-size: 10px; font-weight: 700; color: var(--laranja-vorp); margin-bottom: 10px; text-transform: uppercase; }
        .mp-bars { display: flex; flex-direction: column; gap: 6px; }
        .mp-bar-row { display: flex; align-items: center; gap: 8px; font-size: 0.6rem; }
        .mp-name { width: 50px; color: var(--text-secondary); }
        .mp-bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.03); }
        .mp-bar-fill { height: 100%; background: var(--laranja-vorp); }
        .mp-val { width: 25px; text-align: right; font-weight: 700; }
      `}</style>
    </div>
  );
}
