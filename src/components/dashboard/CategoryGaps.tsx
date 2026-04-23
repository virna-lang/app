'use client';

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

const CATEGORY_COLORS: Record<string, string> = {
  ClickUp:       '#3b82f6',
  Drive:         '#8b5cf6',
  WhatsApp:      '#10b981',
  'Vorp System': '#f59e0b',
};

const ALL_CATEGORIES = [
  { key: 'score_clickup',  name: 'ClickUp',     icon: '⚡' },
  { key: 'score_drive',    name: 'Drive',        icon: '📁' },
  { key: 'score_whatsapp', name: 'WhatsApp',     icon: '💬' },
  { key: 'score_vorp',     name: 'Vorp System',  icon: '🎯' },
];

const tooltipStyle = {
  background: '#111827', borderRadius: 10,
  border: '1px solid #1f2d40', fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

export default function CategoryGaps({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const getNome = (id: string) =>
    consultores.find(c => c.id === id)?.nome ?? 'Consultor';

  const chartData = useMemo(() =>
    data.currentAudits.map((a: any) => ({
      name:          getNome(a.consultor_id).split(' ')[0],
      ClickUp:       a.score_clickup  ?? 0,
      Drive:         a.score_drive    ?? 0,
      WhatsApp:      a.score_whatsapp ?? 0,
      'Vorp System': a.score_vorp     ?? 0,
    })),
    [data.currentAudits, consultores],
  );

  const activeCats = selectedCat === 'all'
    ? ALL_CATEGORIES
    : ALL_CATEGORIES.filter(c => c.key === selectedCat);

  const preenchimentoRanking = useMemo(() => {
    const key = selectedCat === 'all' ? 'score_vorp' : selectedCat;
    return data.currentAudits.map((a: any) => ({
      name:  getNome(a.consultor_id),
      score: a[key] ?? 0,
    })).sort((a, b) => b.score - a.score);
  }, [data.currentAudits, consultores, selectedCat]);

  return (
    <section>
      <div className="section-anchor"><h2>Conformidade por Categoria</h2></div>

      {/* Gráfico principal */}
      <div className="main-chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">CONFORMIDADE</h3>
            <p className="chart-sub">Score por consultor e por categoria</p>
          </div>
          <div className="cat-filter-row">
            <button className={`cat-btn ${selectedCat === 'all' ? 'active' : ''}`} onClick={() => setSelectedCat('all')}>
              Todas
            </button>
            {ALL_CATEGORIES.map(c => (
              <button key={c.key} className={`cat-btn ${selectedCat === c.key ? 'active' : ''}`} onClick={() => setSelectedCat(c.key)}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 360, marginTop: 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: COLORS.textSecondary, fontSize: 12, fontWeight: 600 }} dy={10}/>
              <YAxis domain={[0,100]} axisLine={false} tickLine={false}
                tick={{ fill: COLORS.textMuted, fontSize: 11 }} tickFormatter={v=>`${v}%`} width={40}/>
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                formatter={(v: any, name: any) => [`${(v||0).toFixed(1)}%`, String(name??'')]}/>
              {selectedCat === 'all' && (
                <Legend verticalAlign="top" align="right" iconType="circle"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: COLORS.textSecondary }}/>
              )}
              {activeCats.map(cat => (
                <Bar key={cat.key} dataKey={cat.name}
                  fill={CATEGORY_COLORS[cat.name]} radius={[4,4,0,0]}
                  barSize={selectedCat === 'all' ? 10 : 32} fillOpacity={0.85}>
                  {selectedCat !== 'all' && (
                    <LabelList dataKey={cat.name} position="top"
                      formatter={(v: any) => `${(v||0).toFixed(0)}%`}
                      style={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}/>
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking + Gaps */}
      <div className="rank-gaps-grid">
        <div className="card">
          <h3 className="card-label">
            Ranking — {selectedCat === 'all' ? 'Vorp System' : ALL_CATEGORIES.find(c => c.key === selectedCat)?.name}
          </h3>
          <p className="card-sub">Score de conformidade no período selecionado.</p>
          <div className="rank-list">
            {preenchimentoRanking.map((r, i) => (
              <div key={i} className="rank-row">
                <span className="r-pos">#{i+1}</span>
                <span className="r-name">{r.name}</span>
                <div className="r-track">
                  <div className="r-fill" style={{ width: `${r.score}%`, background: getSemaphorColor(r.score) }}/>
                </div>
                <span className="r-val" style={{ color: getSemaphorColor(r.score) }}>{(r.score||0).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-label">Gaps por Categoria</h3>
          <div className="gaps-mini-grid">
            {ALL_CATEGORIES.map(cat => {
              const best = [...data.currentAudits].sort((a:any,b:any)=>(b[cat.key]??0)-(a[cat.key]??0))[0];
              const bestNome = best ? getNome(best.consultor_id).split(' ')[0] : '—';
              const avg = data.currentAudits.length
                ? data.currentAudits.reduce((s:number,a:any)=>s+(a[cat.key]??0),0)/data.currentAudits.length : 0;
              return (
                <div key={cat.key} className="gap-mini-card" style={{ borderLeft: `3px solid ${CATEGORY_COLORS[cat.name]}` }}>
                  <div className="gm-top">
                    <span className="gm-icon">{cat.icon}</span>
                    <span className="gm-name">{cat.name.toUpperCase()}</span>
                  </div>
                  <div className="gm-leader">Líder: {bestNome}</div>
                  <div className="gm-track">
                    <div className="gm-fill" style={{ width:`${avg}%`, background: CATEGORY_COLORS[cat.name] }}/>
                  </div>
                  <span className="gm-avg" style={{ color: getSemaphorColor(avg) }}>{avg.toFixed(0)}% média</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalhamento */}
      <div className="section-anchor" style={{ marginTop: 56 }}><h2>Detalhamento por Categoria</h2></div>
      <div className="detail-grid">
        {ALL_CATEGORIES.map(cat => {
          const ranking = [...data.currentAudits].sort((a:any,b:any)=>(b[cat.key]??0)-(a[cat.key]??0));
          const catColor = CATEGORY_COLORS[cat.name];
          return (
            <div key={cat.key} className="card detail-card">
              <div className="detail-header" style={{ borderBottom: `1px solid ${catColor}22` }}>
                <span className="detail-icon" style={{ background: `${catColor}18`, color: catColor }}>{cat.icon}</span>
                <span className="detail-name">{cat.name}</span>
              </div>
              <div className="detail-list">
                {ranking.map((r:any, i) => {
                  const score = r[cat.key] ?? 0;
                  return (
                    <div key={i} className="dl-row">
                      <span className="dl-name">{getNome(r.consultor_id).split(' ')[0]}</span>
                      <div className="dl-track">
                        <div className="dl-fill" style={{ width:`${score}%`, background: catColor, opacity: 0.75 }}/>
                      </div>
                      <span className="dl-val" style={{ color: getSemaphorColor(score) }}>{score.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        /* Main chart */
        .main-chart-card {
          background: #111827; border: 1px solid #1f2d40;
          border-radius: 14px; padding: 28px 32px;
          margin-bottom: 16px;
        }
        .chart-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .chart-title { font-size: 20px; font-weight: 800; color: #f1f5f9; letter-spacing: 0.04em; margin-bottom: 4px; }
        .chart-sub { font-size: 12px; color: #475569; }

        .cat-filter-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .cat-btn {
          background: rgba(255,255,255,0.03); border: 1px solid #1f2d40;
          border-radius: 7px; color: #475569; font-size: 12px; font-weight: 600;
          padding: 6px 12px; cursor: pointer; font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
        }
        .cat-btn:hover { border-color: #FC5400; color: #94a3b8; }
        .cat-btn.active { background: rgba(252,84,0,0.1); border-color: #FC5400; color: #FC5400; }

        /* Rank + Gaps grid */
        .rank-gaps-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 0; }
        .card-label { font-size: 13px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
        .card-sub { font-size: 11px; color: #475569; margin-bottom: 20px; }

        .rank-list { display: flex; flex-direction: column; gap: 11px; }
        .rank-row { display: flex; align-items: center; gap: 10px; }
        .r-pos { font-size: 11px; color: #334155; font-weight: 700; width: 20px; text-align: right; }
        .r-name { flex: 1; font-size: 12px; font-weight: 600; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .r-track { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 99px; overflow: hidden; }
        .r-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
        .r-val { font-size: 12px; font-weight: 800; width: 38px; text-align: right; }

        /* Gaps mini */
        .gaps-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .gap-mini-card { padding: 12px 14px; background: #0f1620; border-radius: 8px; border: 1px solid #1a2535; }
        .gm-top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        .gm-icon { font-size: 13px; }
        .gm-name { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: #334155; }
        .gm-leader { font-size: 11px; color: #94a3b8; font-weight: 500; margin-bottom: 8px; }
        .gm-track { height: 4px; background: rgba(255,255,255,0.05); border-radius: 99px; overflow: hidden; margin-bottom: 4px; }
        .gm-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
        .gm-avg { font-size: 11px; font-weight: 700; }

        /* Detail grid */
        .detail-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        .detail-card { padding: 20px; transition: border-color 0.2s, transform 0.2s; }
        .detail-card:hover { border-color: rgba(252,84,0,0.25); transform: translateY(-2px); }
        .detail-header { display: flex; align-items: center; gap: 10px; padding-bottom: 14px; margin-bottom: 16px; }
        .detail-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .detail-name { font-size: 13px; font-weight: 700; color: #f1f5f9; text-transform: uppercase; letter-spacing: 0.06em; }

        .detail-list { display: flex; flex-direction: column; gap: 9px; }
        .dl-row { display: flex; align-items: center; gap: 8px; }
        .dl-name { font-size: 11px; color: #94a3b8; font-weight: 600; width: 52px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dl-track { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 99px; overflow: hidden; }
        .dl-fill { height: 100%; border-radius: 99px; transition: width 0.8s ease; }
        .dl-val { font-size: 11px; font-weight: 700; width: 32px; text-align: right; }

        @media (max-width: 1200px) { .rank-gaps-grid { grid-template-columns: 1fr; } .detail-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 600px) { .detail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
