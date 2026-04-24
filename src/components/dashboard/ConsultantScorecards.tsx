import React from 'react';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';

export default function ConsultantScorecards({ data, role }: { data: DashboardData, role: string | null }) {
  const consultantsToShow = role === 'Consultor' ? data.currentAudits.slice(0, 1) : data.currentAudits;

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2>Scorecard por Consultor</h2>
      </div>
      <div className="scorecard-grid">
        {consultantsToShow.map((audit: any) => {
          const prev = data.prevAudits.find((pa: any) => pa.consultor_id === audit.consultor_id);
          const diff = audit.score_geral - (prev?.score_geral || audit.score_geral);
          
          return (
            <div key={audit.id} className="card sc-card">
              <header className="sc-header">
                <div className="sc-header-left">
                  <span className="sc-name">{audit.consultor_nome ?? audit.consultor_id}</span>
                  <div className="dot" style={{ background: getSemaphorColor(audit.score_geral) }} />
                </div>
                <div className="sc-header-right">
                  <span className="sc-score">{(audit.score_geral || 0).toFixed(1)}%</span>
                  <span className="sc-diff" style={{ color: diff >= 0 ? COLORS.verde : COLORS.vermelho }}>
                    {diff >= 0 ? '▲' : '▼'} {(Math.abs(diff) || 0).toFixed(1)}pp
                  </span>
                </div>
              </header>
              <div className="sc-rows">
                <ScoreBar label="⚡ ClickUp" val={audit.score_clickup} />
                <ScoreBar label="📁 Drive" val={audit.score_drive} />
                <ScoreBar label="💬 WhatsApp" val={audit.score_whatsapp} />
                <ScoreBar label="📊 Planilhas" val={audit.score_metas} />
                <ScoreBar label="🚩 Flags" val={audit.score_flags} />
                <ScoreBar label="🔍 Rastreabilidade" val={audit.score_rastreabilidade} />
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .scorecard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .sc-card { padding: 0; overflow: hidden; }
        .sc-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sc-header-left { display: flex; align-items: center; gap: 8px; }
        .sc-name { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .sc-header-right { display: flex; flex-direction: column; align-items: flex-end; }
        .sc-score { font-family: var(--font-bebas); font-size: 1.5rem; line-height: 1; }
        .sc-diff { font-size: 0.65rem; font-weight: 800; }
        .sc-rows { padding: 12px 20px 20px; display: flex; flex-direction: column; gap: 8px; }
        @media (max-width: 1000px) { .scorecard-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .scorecard-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}

function ScoreBar({ label, val }: { label: string, val: number }) {
  const color = val >= 85 ? COLORS.textMuted : val >= 70 ? COLORS.primary : COLORS.vermelho;
  return (
    <div className="score-row">
      <span className="row-label">{label}</span>
      <div className="row-bar-bg"><div className="row-bar-fill" style={{ width: `${val}%`, background: color }} /></div>
      <span className="row-val" style={{ color: val < 70 ? COLORS.vermelho : 'inherit' }}>{val}%</span>
      <style jsx>{`
        .score-row { display: flex; align-items: center; gap: 10px; font-size: 0.7rem; }
        .row-label { width: 90px; color: var(--text-secondary); white-space: nowrap; }
        .row-bar-bg { flex: 1; height: 5px; background: rgba(255,255,255,0.03); border-radius: 3px; }
        .row-bar-fill { height: 100%; border-radius: 3px; transition: width 1s; }
        .row-val { width: 30px; text-align: right; font-weight: 700; }
      `}</style>
    </div>
  );
}
