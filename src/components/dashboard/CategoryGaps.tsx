import React from 'react';
import { DashboardData, COLORS } from '@/types/dashboard';
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

  return (
    <section className="section-block">
      <div className="section-anchor">
          <h2>Onde Estão os Gaps</h2>
      </div>
      <div className="gaps-grid">
        {categories.map(cat => {
          const ranking = [...data.currentAudits].sort((a: any, b: any) => b[cat.key] - a[cat.key]);
          return (
            <div key={cat.key} className="card gap-card">
              <h3 className="gap-title" style={{ color: COLORS.primary }}>
                <span style={{ marginRight: '8px' }}>{cat.icon}</span> {cat.name}
              </h3>
              <div className="gap-ranking">
                {ranking.map((r: any, i) => {
                  const consul = mockConsultants.find(c => c.id === r.consultor_id);
                  const score = r[cat.key];
                  const color = score >= 85 ? COLORS.textMuted : score >= 70 ? COLORS.primary : COLORS.vermelho;
                  return (
                    <div key={i} className="rank-item">
                      <span className="rank-name">{consul?.nome}</span>
                      <div className="rank-bar-bg"><div className="rank-bar-fill" style={{ width: `${score}%`, background: color }} /></div>
                      <span className="rank-val" style={{ color: score < 85 ? color : 'inherit' }}>{score}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .gaps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .gap-card { padding: 20px; }
        .gap-title { font-family: var(--font-bebas); font-size: 1.2rem; margin-bottom: 20px; }
        .gap-ranking { display: flex; flex-direction: column; gap: 8px; }
        .rank-item { display: flex; align-items: center; gap: 10px; font-size: 0.65rem; }
        .rank-name { width: 55px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; }
        .rank-bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.03); }
        .rank-bar-fill { height: 100%; transition: width 0.8s; }
        .rank-val { width: 28px; text-align: right; font-weight: 700; }
        @media (max-width: 1000px) { .gaps-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </section>
  );
}
