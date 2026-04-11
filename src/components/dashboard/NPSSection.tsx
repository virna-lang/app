import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardData, COLORS } from '@/types/dashboard';
import { mockConsultants, mockMonths, mockNPS } from '@/lib/mockData';

export default function NPSSection({ data }: { data: DashboardData }) {
  const ranking = [...data.currentNPS].sort((a, b) => b.nota - a.nota);

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2>NPS / CSAT</h2>
      </div>
      <div className="layout-grid-2-1">
        <div className="card nps-ranking-card">
          {ranking.map((r, i) => {
            const consul = mockConsultants.find(c => c.id === r.consultor_id);
            const tag = r.nota >= 90 ? 'Excelente' : r.nota >= 75 ? 'Bom' : 'Atenção';
            const color = r.nota >= 90 ? COLORS.verde : r.nota >= 75 ? COLORS.primary : COLORS.vermelho;
            return (
              <div key={i} className="nps-rank-item">
                <div className="ri-pos">#{i+1}</div>
                <div className="ri-content">
                  <div className="ri-up">
                    <span className="ri-name">{consul?.nome}</span>
                    <span className="ri-tag" style={{ color: color }}>{tag}</span>
                  </div>
                  <div className="ri-down">
                    <div className="nps-progress">
                      <div className="nps-fill" style={{ width: `${r.nota}%`, background: `linear-gradient(90deg, ${COLORS.primary}80, ${COLORS.primary})` }} />
                    </div>
                    <span className="ri-responses">{r.num_respostas} respostas</span>
                  </div>
                </div>
                <div className="ri-score" style={{ color: color }}>{r.nota}</div>
              </div>
            );
          })}
        </div>
        <div className="card nps-evolution card-border-top" style={{ padding: '30px', background: 'transparent', border: 'none' }}>
           <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: COLORS.textMuted, fontWeight: 800, letterSpacing: '0.1em', marginBottom: '30px' }}>Evolução Histórica do NPS</h3>
           <div style={{ height: 260 }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={mockMonths.map(m => ({ 
                 name: m, 
                 score: mockNPS.filter(n => n.mes_ano === m).reduce((a,b)=>a+b.nota,0)/(mockNPS.filter(n => n.mes_ano === m).length||1) 
               }))} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                 <Tooltip 
                  cursor={{ stroke: COLORS.primary, strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ background: COLORS.cardBg, borderRadius: '8px', border: `1px solid ${COLORS.cardBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 700, color: COLORS.primary }}
                  formatter={(v: any) => [`${Number(v).toFixed(1)} NPS`, 'Média']}
                 />
                 <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke={COLORS.primary} 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: COLORS.primary, strokeWidth: 0 }}
                  activeDot={{ r: 8, fill: COLORS.textMain, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={1500}
                 />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
      <style jsx>{`
        .layout-grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media (max-width: 1200px) { .layout-grid-2-1 { grid-template-columns: 1fr; } }
        .nps-ranking-card { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
        .nps-rank-item { display: flex; align-items: center; gap: 20px; }
        .ri-pos { font-family: var(--font-bebas); font-size: 1.5rem; color: var(--text-muted); width: 30px; }
        .ri-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .ri-up { display: flex; align-items: center; gap: 10px; }
        .ri-name { font-weight: 700; font-size: 0.95rem; }
        .ri-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .ri-down { display: flex; align-items: center; gap: 12px; }
        .nps-progress { flex: 1; height: 6px; background: rgba(252, 84, 0, 0.05); border-radius: 3px; overflow: hidden; }
        .nps-fill { height: 100%; border-radius: 3px; }
        .ri-responses { font-size: 0.65rem; color: var(--text-muted); white-space: nowrap; }
        .ri-score { font-family: var(--font-bebas); font-size: 2.5rem; }
      `}</style>
    </section>
  );
}
