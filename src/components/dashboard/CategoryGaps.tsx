'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { mockConsultants } from '@/lib/mockData';

export default function CategoryGaps({ data }: { data: DashboardData }) {
  const categories = [
    { key: 'score_clickup', name: 'ClickUp', icon: '⚡' },
    { key: 'score_drive', name: 'Drive', icon: '📁' },
    { key: 'score_whatsapp', name: 'WhatsApp', icon: '💬' },
    { key: 'score_metas', name: 'Planilhas', icon: '📊' },
    { key: 'score_flags', name: 'Flags', icon: '🚩' },
    { key: 'score_rastreabilidade', name: 'Rastreabilidade', icon: '🔍' },
  ];

  // 1. Médias por Categoria
  const categoryAverages = useMemo(() => {
    return categories.map(cat => {
      const avg = data.currentAudits.reduce((acc: number, c: any) => acc + (c[cat.key] || 0), 0) / (data.currentAudits.length || 1);
      return { name: cat.name, value: avg, fullObject: cat };
    });
  }, [data.currentAudits]);

  // 2. Ranking de Preenchimento (Conformidade Metas e Flags) - "Conformidade"
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

  return (
    <section className="section-block">
      <div className="section-anchor">
          <h2>Conformidade por Categoria</h2>
      </div>

      <div className="card chart-card-category" style={{ marginBottom: '40px', padding: '30px' }}>
        <h3 style={{ fontSize: '0.9rem', color: COLORS.textSecondary, marginBottom: '24px' }}>Média Geral de Conformidade por Bloco</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryAverages} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 700 }} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ background: COLORS.cardBg, borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}`, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: COLORS.textMain, fontWeight: 700 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                {categoryAverages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSemaphorColor(entry.value)} fillOpacity={0.8} />
                ))}
                <LabelList dataKey="value" position="top" fill={COLORS.textMain} formatter={(v: number) => `${v.toFixed(0)}%`} style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-bebas)' }} />
              </Bar>
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
                <div className="r-bar-box">
                  <div className="r-bar-fill" style={{ width: `${r.score}%`, background: getSemaphorColor(r.score) }} />
                </div>
                <span className="r-val" style={{ color: getSemaphorColor(r.score) }}>{r.score.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card gaps-preview">
          <h3 className="rank-t">Gaps por Categoria</h3>
          <div className="gaps-mini-grid">
            {categories.slice(0, 4).map(cat => {
              const best = [...data.currentAudits].sort((a: any, b: any) => b[cat.key] - a[cat.key])[0];
              const worst = [...data.currentAudits].sort((a: any, b: any) => a[cat.key] - b[cat.key])[0];
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
                      <div className="rank-bar-bg"><div className="rank-bar-fill" style={{ width: `${score}%`, background: color }} /></div>
                      <span className="rank-val" style={{ color }}>{score}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .chart-card-category { background: var(--glass-bg); backdrop-filter: blur(10px); border: 1px solid var(--card-border); border-radius: 16px; }
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
