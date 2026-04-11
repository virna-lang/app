'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { mockConsultants } from '@/lib/mockData';

export default function CategoryGaps({ data }: { data: DashboardData }) {
  const categories = useMemo(() => [
    { key: 'score_clickup', name: 'ClickUp', icon: '⚡' },
    { key: 'score_drive', name: 'Drive', icon: '📁' },
    { key: 'score_whatsapp', name: 'WhatsApp', icon: '💬' },
    { key: 'score_metas', name: 'Planilhas', icon: '📊' },
    { key: 'score_flags', name: 'Flags', icon: '🚩' },
    { key: 'score_rastreabilidade', name: 'Rastreabilidade', icon: '🔍' },
  ], []);

  const growthData = useMemo(() => {
    return data.currentAudits.map(a => {
      const consul = mockConsultants.find(c => c.id === a.consultor_id);
      return {
        name: consul?.nome.split(' ')[0] || 'Consul',
        ClickUp: a.score_clickup,
        'Drive: Gravação': a.score_drive,
        'Gestão de metas e flags': (a.score_metas + a.score_flags) / 2,
        Rastreabilidade: a.score_rastreabilidade
      };
    });
  }, [data.currentAudits]);

  const preenchimentoRanking = useMemo(() => {
    return data.currentAudits.map(a => {
      const consul = mockConsultants.find(c => c.id === a.consultor_id);
      const score = (a.score_metas + a.score_flags) / 2;
      return { 
        name: consul?.nome || 'Consultor', 
        score,
        metas: a.score_metas,
        flags: a.score_flags
      };
    }).sort((a, b) => b.score - a.score);
  }, [data.currentAudits]);

  const CHART_COLORS = {
    ClickUp: '#00A3E0',
    Drive: '#FC5400',
    Metas: '#FFD700',
    Rastreabilidade: '#9ACD32'
  };

  return (
    <section className="section-block">
      <div className="section-anchor">
          <h2>Conformidade por Categoria</h2>
      </div>

      <div className="card growth-card" style={{ marginBottom: '40px', padding: '40px' }}>
        <div className="growth-header" style={{ marginBottom: '30px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '24px', background: '#FC5400' }} />
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.05em', color: '#fff', margin: 0 }}>GROWTH</h1>
           </div>
           <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem', marginTop: '4px' }}>Conformidade por consultor e por categoria</p>
        </div>

        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#fff', fontSize: 13, fontWeight: 700 }} 
                dy={10}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#fff', fontSize: 11, fontWeight: 700 }}
                tickFormatter={(v) => `${v}%`}
                width={45}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ background: '#0F1020', borderRadius: '12px', border: '1px solid #1A1A38' }}
              />
              <Legend 
                verticalAlign="top" 
                align="center" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 600 }}
              />
              <Bar dataKey="ClickUp" fill={CHART_COLORS.ClickUp} radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="Drive: Gravação" fill={CHART_COLORS.Drive} radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="Gestão de metas e flags" fill={CHART_COLORS.Metas} radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="Rastreabilidade" fill={CHART_COLORS.Rastreabilidade} radius={[2, 2, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="layout-grid-rank">
        <div className="card preenchimento-card">
          <h3 className="rank-t">Ranking de Preenchimento (Metas & Flags)</h3>
          <p className="rank-sub">Conformidade no preenchimento dos dados operacionais.</p>
          <div className="rank-list">
            {preenchimentoRanking.map((r, i) => (
              <div key={i} className="rank-row-item">
                <span className="r-pos">#{i+1}</span>
                <span className="r-name">{r.name}</span>
                <span className="r-val" style={{ color: getSemaphorColor(r.score), textAlign: 'left' }}>{(r.score || 0).toFixed(0)}%</span>
                <div className="r-bar-box">
                  <div className="r-bar-fill" style={{ width: `${r.score}%`, background: getSemaphorColor(r.score) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card gaps-preview">
          <h3 className="rank-t">Gaps por Categoria</h3>
          <div className="gaps-mini-grid">
            {categories.slice(0, 4).map(cat => {
              const best = [...data.currentAudits].sort((a: any, b: any) => b[cat.key] - a[cat.key])[0];
              const bestConsul = mockConsultants.find(c => c.id === best?.consultor_id);
              return (
                <div key={cat.key} className="gap-mini-item">
                  <span className="g-icon">{cat.icon}</span>
                  <div className="g-info">
                    <label>{cat.name}</label>
                    <span className="g-best">Líder: {bestConsul?.nome.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="section-anchor" style={{ marginTop: '60px' }}>
          <h2>Detalhamento por Categoria</h2>
      </div>
      <div className="gaps-grid">
        {categories.map(cat => {
          const ranking = [...data.currentAudits].sort((a: any, b: any) => b[cat.key] - a[cat.key]);
          return (
            <div key={cat.key} className="card gap-card glow-on-hover">
              <h3 className="gap-title">
                <span style={{ marginRight: '8px' }}>{cat.icon}</span> {cat.name}
              </h3>
              <div className="gap-ranking">
                {ranking.map((r: any, i) => {
                  const consul = mockConsultants.find(c => c.id === r.consultor_id);
                  const score = r[cat.key];
                  const color = getSemaphorColor(score);
                  return (
                    <div key={i} className="rank-item">
                      <span className="rank-name">{consul?.nome}</span>
                      <span className="rank-val" style={{ color, textAlign: 'left' }}>{score}%</span>
                      <div className="rank-bar-bg"><div className="rank-bar-fill" style={{ width: `${score}%`, background: color }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .growth-card { background: var(--glass-bg); backdrop-filter: blur(10px); border: 1px solid var(--card-border); border-radius: 16px; }
        .layout-grid-rank { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        .rank-t { font-size: 1rem; color: var(--text-main); margin-bottom: 4px; }
        .rank-sub { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 24px; }
        
        .rank-list { display: flex; flex-direction: column; gap: 12px; }
        .rank-row-item { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; }
        .r-pos { width: 24px; color: var(--text-muted); font-weight: 800; }
        .r-name { flex: 1; font-weight: 600; color: var(--text-secondary); }
        .r-bar-box { width: 50%; height: 6px; background: rgba(255,255,255,0.03); border-radius: 3px; overflow: hidden; }
        .r-bar-fill { height: 100%; transition: width 1s ease-out; }
        .r-val { width: 40px; text-align: right; font-weight: 800; font-family: var(--font-bebas); font-size: 1.1rem; }

        .gaps-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .gap-mini-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; }
        .g-icon { font-size: 1.2rem; }
        .g-info { display: flex; flex-direction: column; }
        .g-info label { font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
        .g-best { font-size: 0.75rem; font-weight: 600; color: var(--laranja-vorp); }

        .gaps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .gap-card { padding: 24px; transition: all 0.3s ease; }
        .glow-on-hover:hover { box-shadow: 0 0 20px var(--glow-primary); transform: translateY(-2px); border-color: var(--laranja-vorp); }
        .gap-title { font-family: var(--font-bebas); font-size: 1.4rem; margin-bottom: 20px; color: var(--text-main); }
        .gap-ranking { display: flex; flex-direction: column; gap: 10px; }
        .rank-item { display: flex; align-items: center; gap: 10px; font-size: 0.7rem; }
        .rank-name { width: 60px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rank-bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.03); border-radius: 2px; }
        .rank-bar-fill { height: 100%; transition: width 0.8s; border-radius: 2px; }
        .rank-val { width: 35px; text-align: right; font-weight: 800; }

        @media (max-width: 1200px) { .layout-grid-rank { grid-template-columns: 1fr; } }
        @media (max-width: 1000px) { .gaps-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .gaps-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
