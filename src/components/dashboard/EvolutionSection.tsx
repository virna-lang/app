import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardData, COLORS } from '@/types/dashboard';
import { mockConsultants, mockAudits, mockMonths } from '@/lib/mockData';

export default function EvolutionSection({ data }: { data: DashboardData }) {
  return (
    <div className="layout-grid-2-1">
      <section className="section-block">
        <div className="section-anchor">
          <h2>Consultores abaixo de 85% precisam de atenção este mês</h2>
        </div>
        <div className="card chart-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', background: 'transparent', border: 'none' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockMonths.map(m => {
              const entry: any = { name: m };
              mockConsultants.forEach(c => {
                const audit = mockAudits.find(a => a.mes_ano === m && a.consultor_id === c.id);
                if (audit) entry[c.nome] = audit.score_geral;
              });
              return entry;
            })} margin={{ top: 20, right: 120, bottom: 20, left: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textMuted, fontSize: 10, fontWeight: 700 }} />
              <YAxis hide domain={[0, 110]} />
              <Tooltip 
                contentStyle={{ background: COLORS.cardBg, borderRadius: '8px', border: `1px solid ${COLORS.cardBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
              />
              {mockConsultants.map(c => {
                const currentScore = data.currentAudits.find((a: any) => a.consultor_id === c.id)?.score_geral || 0;
                const color = currentScore >= 85 ? COLORS.textMuted : currentScore >= 70 ? COLORS.primary : COLORS.vermelho;
                return (
                  <Line 
                    key={c.id} 
                    type="monotone" 
                    dataKey={c.nome} 
                    stroke={color} 
                    strokeWidth={currentScore < 85 ? 4 : 1.5}
                    strokeOpacity={currentScore < 85 ? 1 : 0.3}
                    dot={{ r: 4, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    label={<DirectLabel name={c.nome} color={color} />}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <TopGrowth data={data} />
      <style jsx>{`
        .layout-grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media (max-width: 1200px) { .layout-grid-2-1 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function DirectLabel({ x, y, value, name, color, index }: any) {
  if (value === undefined || index !== mockMonths.length - 1) return null;
  return (
    <text x={x + 10} y={y + 4} fill={color} style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'DM Sans' }}>
      {name} {value.toFixed(1)}%
    </text>
  );
}

function TopGrowth({ data }: { data: DashboardData }) {
  const growths = useMemo(() => {
    return mockConsultants.map(c => {
      const curr = data.currentAudits.find((a: any) => a.consultor_id === c.id)?.score_geral || 0;
      const prev = data.prevAudits.find((a: any) => a.consultor_id === c.id)?.score_geral || curr;
      return { name: c.nome, diff: curr - prev, curr };
    }).sort((a, b) => b.diff - a.diff);
  }, [data]);

  const top = growths[0];

  return (
    <div className="card growth-card" style={{ marginTop: '54px' }}>
      <div className="top-winner">
        <span className="trophy">🏆</span>
        <div className="winner-info">
          <span className="wn-label">Maior Evolução</span>
          <span className="wn-name">{top.name}</span>
        </div>
        <div className="winner-val">
          <span className="val">{top.diff >= 0 ? '+' : ''}{top.diff.toFixed(1)}</span>
          <span className="unit">pp</span>
        </div>
      </div>
      <div className="growth-list">
        {growths.map((g, i) => (
          <div key={i} className="growth-row">
            <span className="row-name">{g.name}</span>
            <div className="bar-bg">
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${Math.min(Math.abs(g.diff) * 4, 100)}%`, 
                  background: g.diff >= 0 ? COLORS.verde : COLORS.vermelho,
                  marginLeft: g.diff < 0 ? 'auto' : '0',
                  marginRight: g.diff >= 0 ? 'auto' : '0'
                }} 
              />
            </div>
            <span className="row-val" style={{ color: g.diff >= 0 ? COLORS.verde : COLORS.vermelho }}>
              {g.diff >= 0 ? '+' : ''}{g.diff.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .growth-card { padding: 30px; display: flex; flex-direction: column; gap: 30px; height: fit-content; }
        .top-winner { display: flex; align-items: center; gap: 16px; background: rgba(252, 84, 0, 0.05); padding: 16px; border-radius: 12px; }
        .trophy { font-size: 2.5rem; }
        .winner-info { flex: 1; display: flex; flex-direction: column; }
        .wn-label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
        .wn-name { font-family: var(--font-bebas); font-size: 1.5rem; color: var(--text-main); }
        .winner-val { display: flex; flex-direction: column; align-items: flex-end; color: var(--laranja-vorp); }
        .winner-val .val { font-family: var(--font-bebas); font-size: 2.5rem; line-height: 1; }
        .winner-val .unit { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .growth-list { display: flex; flex-direction: column; gap: 12px; }
        .growth-row { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; }
        .row-name { width: 60px; color: var(--text-secondary); }
        .bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; position: relative; }
        .bar-fill { height: 100%; border-radius: 3px; }
        .row-val { width: 35px; text-align: right; font-weight: 700; }
      `}</style>
    </div>
  );
}
