'use client';

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

const CATEGORY_COLORS: Record<string, string> = {
  ClickUp:       '#5B8DEF',
  Drive:         '#8B7EC8',
  WhatsApp:      '#5BBFA0',
  'Vorp System': '#A0A0C0',
};

const ALL_CATEGORIES = [
  { key: 'score_clickup',   name: 'ClickUp',      icon: '⚡' },
  { key: 'score_drive',     name: 'Drive',         icon: '📁' },
  { key: 'score_whatsapp',  name: 'WhatsApp',      icon: '💬' },
  { key: 'score_vorp',      name: 'Vorp System',   icon: '🎯' },
];

export default function CategoryGaps({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const getNome = (consultor_id: string) =>
    consultores.find(c => c.id === consultor_id)?.nome ?? 'Consultor';

  // Dados para o gráfico agrupado (todas as categorias) ou filtrado (uma categoria)
  const chartData = useMemo(() => {
    return data.currentAudits.map((a: any) => ({
      name: getNome(a.consultor_id).split(' ')[0],
      ClickUp:       a.score_clickup  ?? 0,
      Drive:         a.score_drive    ?? 0,
      WhatsApp:      a.score_whatsapp ?? 0,
      'Vorp System': a.score_vorp     ?? 0,
    }));
  }, [data.currentAudits, consultores]);

  const activeCats = selectedCat === 'all'
    ? ALL_CATEGORIES
    : ALL_CATEGORIES.filter(c => c.key === selectedCat);

  const preenchimentoRanking = useMemo(() => {
    const key = selectedCat === 'all' ? 'score_vorp' : selectedCat;
    return data.currentAudits.map((a: any) => ({
      name: getNome(a.consultor_id),
      score: a[key] ?? 0,
    })).sort((a, b) => b.score - a.score);
  }, [data.currentAudits, consultores, selectedCat]);

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2>Conformidade por Categoria</h2>
      </div>

      {/* Gráfico principal */}
      <div className="card growth-card" style={{ marginBottom: '40px', padding: '40px' }}>
        <div className="growth-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '24px', background: '#FC5400' }} />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.05em', color: '#fff', margin: 0 }}>
              CONFORMIDADE
            </h1>
          </div>
          <p style={{ color: COLORS.textSecondary, fontSize: '0.85rem', marginTop: '4px' }}>
            Score por consultor e por categoria
          </p>

          {/* Filtro de categoria */}
          <div className="cat-filter-row">
            <button
              className={`cat-btn ${selectedCat === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCat('all')}
            >
              Todas
            </button>
            {ALL_CATEGORIES.map(c => (
              <button
                key={c.key}
                className={`cat-btn ${selectedCat === c.key ? 'active' : ''}`}
                onClick={() => setSelectedCat(c.key)}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '380px', marginTop: '24px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 24, right: 30, left: 10, bottom: 20 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.textSecondary, fontSize: 12, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ background: '#0F1020', borderRadius: '12px', border: '1px solid #1A1A38', fontSize: '12px' }}
                formatter={(v: any, name: any) => [`${(v || 0).toFixed(1)}%`, String(name ?? '')]}
              />
              {selectedCat === 'all' && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', color: COLORS.textSecondary }}
                />
              )}
              {activeCats.map(cat => (
                <Bar
                  key={cat.key}
                  dataKey={cat.name}
                  fill={CATEGORY_COLORS[cat.name]}
                  radius={[3, 3, 0, 0]}
                  barSize={selectedCat === 'all' ? 10 : 32}
                  fillOpacity={0.85}
                >
                  {selectedCat !== 'all' && (
                    <LabelList
                      dataKey={cat.name}
                      position="top"
                      formatter={(v: any) => `${(v || 0).toFixed(0)}%`}
                      style={{ fill: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 700 }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking + Gaps */}
      <div className="layout-grid-rank">
        <div className="card preenchimento-card">
          <h3 className="rank-t">
            Ranking — {selectedCat === 'all' ? 'Vorp System' : ALL_CATEGORIES.find(c => c.key === selectedCat)?.name}
          </h3>
          <p className="rank-sub">Score de conformidade no período selecionado.</p>
          <div className="rank-list">
            {preenchimentoRanking.map((r, i) => (
              <div key={i} className="rank-row-item">
                <span className="r-pos">#{i + 1}</span>
                <span className="r-name">{r.name}</span>
                <span className="r-val" style={{ color: getSemaphorColor(r.score) }}>{(r.score || 0).toFixed(0)}%</span>
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
            {ALL_CATEGORIES.map(cat => {
              const best = [...data.currentAudits].sort((a: any, b: any) => (b[cat.key] ?? 0) - (a[cat.key] ?? 0))[0];
              const bestNome = best ? getNome(best.consultor_id).split(' ')[0] : '—';
              const avg = data.currentAudits.length
                ? data.currentAudits.reduce((s: number, a: any) => s + (a[cat.key] ?? 0), 0) / data.currentAudits.length
                : 0;
              return (
                <div key={cat.key} className="gap-mini-item" style={{ borderLeft: `3px solid ${CATEGORY_COLORS[cat.name]}` }}>
                  <div className="g-info">
                    <label>{cat.icon} {cat.name}</label>
                    <span className="g-best">Líder: {bestNome}</span>
                    <span className="g-avg" style={{ color: getSemaphorColor(avg) }}>{avg.toFixed(0)}% média</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalhamento por categoria */}
      <div className="section-anchor" style={{ marginTop: '60px' }}>
        <h2>Detalhamento por Categoria</h2>
      </div>
      <div className="gaps-grid">
        {ALL_CATEGORIES.map(cat => {
          const ranking = [...data.currentAudits].sort((a: any, b: any) => (b[cat.key] ?? 0) - (a[cat.key] ?? 0));
          return (
            <div key={cat.key} className="card gap-card glow-on-hover">
              <h3 className="gap-title" style={{ borderBottom: `2px solid ${CATEGORY_COLORS[cat.name]}30`, paddingBottom: '12px' }}>
                <span style={{ marginRight: '8px' }}>{cat.icon}</span>{cat.name}
              </h3>
              <div className="gap-ranking">
                {ranking.map((r: any, i) => {
                  const score = r[cat.key] ?? 0;
                  const color = getSemaphorColor(score);
                  return (
                    <div key={i} className="rank-item">
                      <span className="rank-name">{getNome(r.consultor_id).split(' ')[0]}</span>
                      <div className="rank-bar-bg">
                        <div className="rank-bar-fill" style={{ width: `${score}%`, background: CATEGORY_COLORS[cat.name], opacity: 0.7 }} />
                      </div>
                      <span className="rank-val" style={{ color }}>{score.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .growth-card { background: var(--glass-bg); backdrop-filter: blur(10px); border-radius: 16px; }
        .growth-header { display: flex; flex-direction: column; }

        .cat-filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px; }
        .cat-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--card-border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 6px 12px;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
        }
        .cat-btn:hover { border-color: var(--laranja-vorp); color: var(--text-secondary); }
        .cat-btn.active { background: rgba(252,84,0,0.1); border-color: var(--laranja-vorp); color: var(--laranja-vorp); }

        .layout-grid-rank { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 20px; }
        .rank-t { font-size: 1rem; color: var(--text-main); margin-bottom: 4px; }
        .rank-sub { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 24px; }

        .rank-list { display: flex; flex-direction: column; gap: 12px; }
        .rank-row-item { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; }
        .r-pos { width: 24px; color: var(--text-muted); font-weight: 800; }
        .r-name { flex: 1; font-weight: 600; color: var(--text-secondary); }
        .r-bar-box { width: 50%; height: 5px; background: rgba(255,255,255,0.03); border-radius: 3px; overflow: hidden; }
        .r-bar-fill { height: 100%; transition: width 1s ease-out; border-radius: 3px; }
        .r-val { width: 40px; text-align: right; font-weight: 800; font-family: var(--font-bebas); font-size: 1.1rem; }

        .gaps-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .gap-mini-item { padding: 10px 14px; background: rgba(255,255,255,0.02); border-radius: 8px; }
        .g-info { display: flex; flex-direction: column; gap: 2px; }
        .g-info label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
        .g-best { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
        .g-avg { font-size: 0.72rem; font-weight: 700; }

        .gaps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .gap-card { padding: 24px; transition: all 0.3s ease; }
        .glow-on-hover:hover { box-shadow: 0 0 20px var(--glow-primary); transform: translateY(-2px); border-color: var(--laranja-vorp); }
        .gap-title { font-family: var(--font-bebas); font-size: 1.3rem; margin-bottom: 16px; color: var(--text-main); }
        .gap-ranking { display: flex; flex-direction: column; gap: 10px; }
        .rank-item { display: flex; align-items: center; gap: 8px; font-size: 0.72rem; }
        .rank-name { width: 60px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
        .rank-bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.04); border-radius: 2px; overflow: hidden; }
        .rank-bar-fill { height: 100%; transition: width 0.8s; border-radius: 2px; }
        .rank-val { width: 35px; text-align: right; font-weight: 800; }

        @media (max-width: 1200px) { .layout-grid-rank { grid-template-columns: 1fr; } .gaps-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .gaps-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
