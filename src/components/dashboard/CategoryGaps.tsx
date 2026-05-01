'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, Legend,
} from 'recharts';
import { DashboardData, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';
import { getConsultorLabel } from '@/lib/consultor-label';

const T = {
  bg:      '#0f1117',
  bgDeep:  '#0a0b0e',
  bgDark:  '#0d0f14',
  border:  '#1a1d24',
  orange:  '#ff5c1a',
  green:   '#1d9e75',
  red:     '#e05555',
  text:    '#e2e4e9',
  textSub: '#9aa0b0',
  textDim: '#3f4455',
  mono:    "'DM Mono', monospace",
};

const CATEGORY_COLORS: Record<string, string> = {
  ClickUp:       '#ff5c1a',
  Drive:         '#e8a020',
  WhatsApp:      '#1d9e75',
  'Vorp System': '#7864dc',
};

const ALL_CATEGORIES = [
  { key: 'score_clickup',  name: 'ClickUp',      icon: '⚡' },
  { key: 'score_drive',    name: 'Drive',         icon: '📁' },
  { key: 'score_whatsapp', name: 'WhatsApp',      icon: '💬' },
  { key: 'score_vorp',     name: 'Vorp System',   icon: '🎯' },
];

const tooltipStyle = {
  background: '#0a0b0e', borderRadius: 8,
  border: '1px solid #1a1d24', fontSize: 12,
};

export default function CategoryGaps({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const chartData = useMemo(() =>
    data.currentAudits.map((a: any) => ({
      name:          getConsultorLabel(consultores, a.consultor_id, 'first'),
      consultor_id:  a.consultor_id,
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
      name:  getConsultorLabel(consultores, a.consultor_id, 'full'),
      score: a[key] ?? 0,
    })).sort((a, b) => b.score - a.score);
  }, [data.currentAudits, consultores, selectedCat]);

  return (
    <div style={{ marginTop: 4 }}>
      {/* Gráfico principal */}
      <div style={{
        background: T.bg, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: '20px 24px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '0.04em', marginBottom: 3 }}>
              CONFORMIDADE
            </div>
            <div style={{ fontSize: 11, color: T.textDim }}>Score por consultor e por categoria</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCat('all')}
              style={{
                background: selectedCat === 'all' ? 'rgba(255,92,26,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedCat === 'all' ? T.orange : T.border}`,
                borderRadius: 6, color: selectedCat === 'all' ? T.orange : T.textDim,
                fontSize: 11, fontWeight: 600, padding: '5px 10px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              Todas
            </button>
            {ALL_CATEGORIES.map(c => (
              <button key={c.key}
                onClick={() => setSelectedCat(c.key)}
                style={{
                  background: selectedCat === c.key ? `${CATEGORY_COLORS[c.name]}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedCat === c.key ? CATEGORY_COLORS[c.name] : T.border}`,
                  borderRadius: 6,
                  color: selectedCat === c.key ? CATEGORY_COLORS[c.name] : T.textDim,
                  fontSize: 11, fontWeight: 600, padding: '5px 10px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 20, left: 0, bottom: 16 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: T.textSub, fontSize: 11, fontWeight: 600 }} dy={8} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                tick={{ fill: T.textDim, fontSize: 10 }}
                tickFormatter={v => `${v}%`} width={36} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                formatter={(v: any, name: any, p: any) => [
                  `${(v || 0).toFixed(1)}%`,
                  `${String(name ?? '')} • ${getConsultorLabel(consultores, p?.payload?.consultor_id ?? '', 'full')}`,
                ]} />
              {selectedCat === 'all' && (
                <Legend verticalAlign="top" align="right" iconType="circle"
                  wrapperStyle={{ paddingBottom: 8, fontSize: 10, color: T.textDim }} />
              )}
              {activeCats.map(cat => (
                <Bar key={cat.key} dataKey={cat.name}
                  fill={CATEGORY_COLORS[cat.name]}
                  radius={[4, 4, 0, 0]}
                  barSize={selectedCat === 'all' ? 10 : 28}
                  fillOpacity={0.85}>
                  {selectedCat !== 'all' && (
                    <LabelList dataKey={cat.name} position="top"
                      formatter={(v: any) => `${(v || 0).toFixed(0)}%`}
                      style={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700 }} />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking + Gaps */}
      <div className="rank-gaps-grid">
        {/* Ranking */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 3 }}>
            Ranking — {selectedCat === 'all' ? 'Vorp System' : ALL_CATEGORIES.find(c => c.key === selectedCat)?.name}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 16 }}>Score de conformidade no período selecionado.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {preenchimentoRanking.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: T.textDim, width: 18, textAlign: 'right', fontFamily: T.mono }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12, color: T.textSub, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </span>
                <div style={{ width: 80, height: 4, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${r.score}%`, height: '100%', background: getSemaphorColor(r.score), borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, width: 36, textAlign: 'right', color: getSemaphorColor(r.score), fontFamily: T.mono }}>
                  {(r.score || 0).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gaps por Categoria */}
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 16 }}>Gaps por Categoria</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ALL_CATEGORIES.map(cat => {
              const best = [...data.currentAudits].sort((a: any, b: any) => (b[cat.key] ?? 0) - (a[cat.key] ?? 0))[0];
              const bestNome = best ? getConsultorLabel(consultores, (best as any).consultor_id, 'first') : '—';
              const avg = data.currentAudits.length
                ? data.currentAudits.reduce((s: number, a: any) => s + (a[cat.key] ?? 0), 0) / data.currentAudits.length
                : 0;
              const catColor = CATEGORY_COLORS[cat.name];
              return (
                <div key={cat.key} style={{
                  background: T.bgDark, borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  borderLeft: `3px solid ${catColor}`,
                  padding: '11px 13px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <span style={{ fontSize: 12 }}>{cat.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: T.textDim, textTransform: 'uppercase' }}>
                      {cat.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 7 }}>Líder: {bestNome}</div>
                  <div style={{ height: 3, background: T.border, borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                    <div style={{ width: `${avg}%`, height: '100%', background: catColor, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: getSemaphorColor(avg), fontFamily: T.mono }}>
                    {avg.toFixed(0)}% média
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalhamento por categoria */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 14, background: T.orange, borderRadius: 2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim }}>
            Detalhamento por Categoria
          </span>
        </div>
        <div className="detail-grid">
          {ALL_CATEGORIES.map(cat => {
            const ranking = [...data.currentAudits].sort((a: any, b: any) => (b[cat.key] ?? 0) - (a[cat.key] ?? 0));
            const catColor = CATEGORY_COLORS[cat.name];
            return (
              <div key={cat.key} style={{
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '16px 18px',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${catColor}44`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: `${catColor}18`, color: catColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0,
                  }}>
                    {cat.icon}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {cat.name}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ranking.map((r: any, i) => {
                    const score = r[cat.key] ?? 0;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 11, color: T.textSub, fontWeight: 600, width: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getConsultorLabel(consultores, r.consultor_id, 'first')}
                        </span>
                        <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: catColor, opacity: 0.8, borderRadius: 99, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, width: 30, textAlign: 'right', color: getSemaphorColor(score), fontFamily: T.mono }}>
                          {score.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .rank-gaps-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
        .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 1200px) { .rank-gaps-grid { grid-template-columns: 1fr; } .detail-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .detail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
