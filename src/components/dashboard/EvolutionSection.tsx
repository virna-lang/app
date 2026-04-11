'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DashboardData, COLORS } from '@/types/dashboard';
import { mockConsultants } from '@/lib/mockData';

export default function EvolutionSection({ data }: { data: DashboardData }) {
  const months = useMemo(() => {
    return [data.prevMonth, data.month].filter(Boolean) as string[];
  }, [data.month, data.prevMonth]);

  const chartData = useMemo(() => {
    return months.map(m => {
      const entry: any = { name: m };
      const audits = m === data.month ? data.currentAudits : data.prevAudits;
      
      data.currentAudits.forEach(curr => {
        const consul = mockConsultants.find(c => c.id === curr.consultor_id);
        if (consul) {
          const audit = (m === data.month) 
            ? curr 
            : data.prevAudits.find(pa => pa.consultor_id === curr.consultor_id);
          
          if (audit) entry[consul.nome] = audit.score_geral;
        }
      });
      return entry;
    });
  }, [months, data.currentAudits, data.prevAudits]);

  const activeConsultants = useMemo(() => {
    return data.currentAudits.map(a => mockConsultants.find(c => c.id === a.consultor_id)).filter(Boolean);
  }, [data.currentAudits]);

  return (
    <div className="evolution-container">
      <div className="section-anchor">
        <h2>Evolução Histórica da Conformidade</h2>
      </div>
      
      <div className="layout-grid-2-1">
        <section className="section-block card chart-card-bg">
          <h3 className="chart-t">Desempenho Geral por Consultor</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 120, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 700 }} 
                />
                <YAxis hide domain={[0, 110]} />
                <Tooltip 
                  contentStyle={{ background: COLORS.cardBg, borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}`, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                {activeConsultants.map((c: any) => {
                  const currentScore = data.currentAudits.find(a => a.consultor_id === c.id)?.score_geral || 0;
                  const color = currentScore >= 85 ? COLORS.textMuted : currentScore >= 70 ? COLORS.primary : COLORS.vermelho;
                  return (
                    <Line 
                      key={c.id} 
                      type="monotone" 
                      dataKey={c.nome} 
                      stroke={color} 
                      strokeWidth={currentScore < 85 ? 4 : 2}
                      strokeOpacity={currentScore < 85 ? 1 : 0.4}
                      dot={{ r: 5, fill: color, strokeWidth: 0 }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                      label={<DirectLabel name={c.nome} color={color} monthsCount={months.length} />}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <TopGrowth data={data} consultants={activeConsultants} />
      </div>

      <style jsx>{`
        .evolution-container { margin-top: 40px; }
        .layout-grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .chart-card-bg { background: var(--glass-bg); backdrop-filter: blur(10px); padding: 30px; }
        .chart-t { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 24px; }
        .chart-box { height: 400px; width: 100%; }
        @media (max-width: 1200px) { .layout-grid-2-1 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function DirectLabel({ x, y, value, name, color, index, monthsCount }: any) {
  if (value === undefined || index !== monthsCount - 1) return null;
  return (
    <text x={x + 12} y={y + 4} fill={color} style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
      {name} {value.toFixed(1)}%
    </text>
  );
}

function TopGrowth({ data, consultants }: { data: DashboardData, consultants: any[] }) {
  const growths = useMemo(() => {
    return consultants.map(c => {
      const curr = data.currentAudits.find(a => a.consultor_id === c.id)?.score_geral || 0;
      const prev = data.prevAudits.find(a => a.consultor_id === c.id)?.score_geral || curr;
      return { name: c.nome, diff: curr - prev, curr };
    }).sort((a, b) => b.diff - a.diff);
  }, [data, consultants]);

  const top = growths[0] || { name: '---', diff: 0, curr: 0 };

  return (
    <div className="card growth-card glow-on-hover">
      <div className="top-winner">
        <div className="trophy-box">
          <span className="trophy">🏆</span>
          <div className="glow-effect" />
        </div>
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
        <h4 className="list-t">Variação Mensal</h4>
        {growths.map((g, i) => (
          <div key={i} className="growth-row">
            <span className="row-name">{g.name}</span>
            <div className="bar-container">
               <div className="bar-bg">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${Math.min(Math.abs(g.diff) * 5, 100)}%`, 
                    background: g.diff >= 0 ? COLORS.verde : COLORS.vermelho,
                    marginLeft: g.diff < 0 ? 'auto' : '0',
                    marginRight: g.diff >= 0 ? 'auto' : '0'
                  }} 
                />
              </div>
            </div>
            <span className="row-val" style={{ color: g.diff >= 0 ? COLORS.verde : COLORS.vermelho }}>
              {g.diff >= 0 ? '+' : ''}{g.diff.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .growth-card { padding: 30px; display: flex; flex-direction: column; gap: 30px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .glow-on-hover:hover { box-shadow: 0 0 20px var(--glow-primary); transform: translateY(-2px); border-color: var(--laranja-vorp); }
        
        .top-winner { display: flex; align-items: center; gap: 16px; background: rgba(252, 84, 0, 0.08); padding: 20px; border-radius: 12px; position: relative; overflow: hidden; }
        .trophy-box { position: relative; z-index: 1; }
        .trophy { font-size: 2.8rem; }
        .glow-effect { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: var(--laranja-vorp); filter: blur(25px); opacity: 0.4; z-index: -1; }
        
        .winner-info { flex: 1; display: flex; flex-direction: column; }
        .wn-label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.05em; }
        .wn-name { font-family: var(--font-bebas); font-size: 1.8rem; color: var(--text-main); line-height: 1.1; }
        
        .winner-val { display: flex; flex-direction: column; align-items: flex-end; color: var(--laranja-vorp); }
        .winner-val .val { font-family: var(--font-bebas); font-size: 2.5rem; line-height: 1; }
        .winner-val .unit { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-top: -4px; }
        
        .growth-list { display: flex; flex-direction: column; gap: 16px; }
        .list-t { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.1em; margin-bottom: 4px; }
        .growth-row { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; }
        .row-name { width: 70px; color: var(--text-secondary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bar-container { flex: 1; }
        .bar-bg { height: 6px; background: rgba(255,255,255,0.03); border-radius: 3px; overflow: hidden; position: relative; }
        .bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease-out; }
        .row-val { width: 45px; text-align: right; font-weight: 800; font-family: var(--font-bebas); font-size: 1.1rem; }
      `}</style>
    </div>
  );
}
