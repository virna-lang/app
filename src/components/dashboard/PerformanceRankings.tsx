'use client';

import React, { useMemo } from 'react';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';

export default function PerformanceRankings({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();
  const getNome = (id: string) => consultores.find(c => c.id === id)?.nome ?? 'Consultor';

  const ranking = useMemo(() =>
    (data.currentAudits as any[]).map(a => ({
      name:  getNome(a.consultor_id),
      score: a.score_drive ?? 0,
    })).sort((a, b) => b.score - a.score),
    [data.currentAudits, consultores],
  );

  const insights = [
    { type: 'ALERTA',   color: COLORS.vermelho,  bg: '#ef444415', icon: <AlertTriangle size={13}/>, text: 'Consultores com menos de 80% em encaminhamentos precisam de revisão de processos no Drive.' },
    { type: 'DESTAQUE', color: COLORS.verde,      bg: '#10b98115', icon: <TrendingUp size={13}/>,    text: 'O preenchimento de metas e flags subiu 5.2% na média geral este mês.' },
    { type: 'AÇÃO',     color: COLORS.primary,    bg: '#FC540015', icon: <Zap size={13}/>,           text: 'Reuniões de alinhamento pendentes para 4 clientes na categoria Aliança.' },
  ];

  return (
    <section>
      <div className="section-anchor"><h2>Monitoramento de Processos (Rankings)</h2></div>

      <div className="rankings-grid">
        {/* Ranking card */}
        <div className="card rank-card">
          <div className="rank-header">
            <div className="rank-icon-wrap">
              <span style={{ fontSize: 20 }}>📂</span>
            </div>
            <div>
              <h3 className="rank-title">Conformidade de Encaminhamentos</h3>
              <p className="rank-sub">Drives atualizados e preenchidos corretamente.</p>
            </div>
          </div>

          <div className="rank-list">
            {ranking.map((r, i) => (
              <div key={i} className="rank-row">
                <span className="r-pos">#{i+1}</span>
                <span className="r-name">{r.name}</span>
                <span className="r-pct" style={{ color: getSemaphorColor(r.score) }}>
                  {(r.score||0).toFixed(0)}%
                </span>
                <div className="r-track">
                  <div className="r-fill" style={{ width:`${r.score}%`, background: getSemaphorColor(r.score) }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights card */}
        <div className="card insights-card">
          <h3 className="insights-title">Insights de Auditoria</h3>
          <div className="insights-list">
            {insights.map(ins => (
              <div key={ins.type} className="insight-item" style={{ borderLeft: `2px solid ${ins.color}`, background: ins.bg }}>
                <div className="insight-tag" style={{ color: ins.color }}>
                  {ins.icon}
                  <span>{ins.type}</span>
                </div>
                <p className="insight-text">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .rankings-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }

        /* Rank card */
        .rank-card { padding: 28px; }
        .rank-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 28px; }
        .rank-icon-wrap {
          width: 44px; height: 44px; border-radius: 10px;
          background: rgba(252,84,0,0.1); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .rank-title { font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 3px; }
        .rank-sub { font-size: 11px; color: #475569; }

        .rank-list { display: flex; flex-direction: column; gap: 14px; }
        .rank-row { display: flex; align-items: center; gap: 10px; }
        .r-pos { font-size: 11px; color: #334155; font-weight: 700; width: 22px; text-align: right; flex-shrink: 0; }
        .r-name { flex: 1; font-size: 13px; font-weight: 600; color: #94a3b8; }
        .r-pct { font-size: 13px; font-weight: 800; width: 40px; text-align: right; flex-shrink: 0; }
        .r-track { width: 45%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 99px; overflow: hidden; flex-shrink: 0; }
        .r-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }

        /* Insights card */
        .insights-card { padding: 28px; display: flex; flex-direction: column; }
        .insights-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #475569; margin-bottom: 16px; }
        .insights-list { display: flex; flex-direction: column; gap: 10px; }
        .insight-item { padding: 14px 16px; border-radius: 8px; }
        .insight-tag { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
        .insight-text { font-size: 12px; color: #64748b; line-height: 1.55; }

        @media (max-width: 1000px) { .rankings-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
