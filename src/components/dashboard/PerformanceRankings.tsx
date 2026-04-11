'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { mockConsultants } from '@/lib/mockData';

export default function PerformanceRankings({ data }: { data: DashboardData }) {
  // 1. Ranking de Encaminhamentos (CONFORMIDADE)
  // Pergunta: "Os encaminhamentos estão nos drives dos clientes, atualizados e preenchidos corretamente?"
  // Usaremos o score_rastreabilidade como proxy ou se houver um campo específico. 
  // Baseado na lógica anterior, score_rastreabilidade representa essa conformidade de drive/processo.
  const encaminhamentosRanking = useMemo(() => {
    return data.currentAudits.map(a => {
      const consul = mockConsultants.find(c => c.id === a.consultor_id);
      const score = a.score_rastreabilidade; // Proxy para encaminhamentos conforme mapeado no plano
      return { 
        name: consul?.nome || 'Consultor', 
        score
      };
    }).sort((a, b) => b.score - a.score);
  }, [data.currentAudits]);

  return (
    <section className="section-block ranking-section">
      <div className="section-anchor">
          <h2>Monitoramento de Processos (Rankings)</h2>
      </div>

      <div className="rankings-grid">
        <div className="card ranking-card-p glow-on-hover">
           <div className="r-header">
              <span className="r-icon">📂</span>
              <div className="r-tit-box">
                 <h3>Conformidade de Encaminhamentos</h3>
                 <p>Drives atualizados e preenchidos corretamente.</p>
              </div>
           </div>
           
           <div className="r-list">
             {encaminhamentosRanking.map((r, i) => (
                <div key={i} className="r-item">
                  <div className="r-main">
                    <span className="r-idx">#{i+1}</span>
                    <span className="r-name">{r.name}</span>
                  </div>
                  <div className="r-bar-box">
                    <div className="r-bar-fill" style={{ width: `${r.score}%`, background: getSemaphorColor(r.score) }} />
                  </div>
                  <span className="r-val" style={{ color: getSemaphorColor(r.score) }}>{r.score.toFixed(0)}%</span>
                </div>
             ))}
           </div>
        </div>

        <div className="card highlight-info">
           <h3>Insights de Auditoria</h3>
           <div className="insight-item">
              <span className="i-tag">Alerta</span>
              <p>Consultores com menos de 80% em encaminhamentos precisam de revisão de processos no Drive.</p>
           </div>
           <div className="insight-item">
              <span className="i-tag success">Destaque</span>
              <p>O preenchimento de metas e flags subiu 5.2% na média geral este mês.</p>
           </div>
           <div className="insight-item">
              <span className="i-tag warning">Ação</span>
              <p>Reuniões de alinhamento pendentes para 4 clientes na categoria Aliança.</p>
           </div>
        </div>
      </div>

      <style jsx>{`
        .rankings-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        .ranking-card-p { padding: 30px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .glow-on-hover:hover { box-shadow: 0 0 20px var(--glow-primary); transform: translateY(-2px); border-color: var(--laranja-vorp); }
        
        .r-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 30px; }
        .r-icon { font-size: 2rem; background: rgba(252, 84, 0, 0.1); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
        .r-tit-box h3 { font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px; }
        .r-tit-box p { font-size: 0.75rem; color: var(--text-muted); }

        .r-list { display: flex; flex-direction: column; gap: 16px; }
        .r-item { display: flex; align-items: center; gap: 12px; }
        .r-main { flex: 1; display: flex; align-items: center; gap: 12px; }
        .r-idx { width: 24px; font-family: var(--font-bebas); font-size: 1.2rem; color: var(--text-muted); }
        .r-name { font-weight: 700; color: var(--text-secondary); font-size: 0.85rem; }
        .r-bar-box { width: 50%; height: 6px; background: rgba(255,255,255,0.03); border-radius: 3px; overflow: hidden; }
        .r-bar-fill { height: 100%; transition: width 1s cubic-bezier(0.1, 0, 0.4, 1); }
        .r-val { width: 45px; text-align: right; font-family: var(--font-bebas); font-size: 1.2rem; font-weight: 800; }

        .highlight-info { padding: 30px; display: flex; flex-direction: column; gap: 20px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .highlight-info h3 { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.1em; margin-bottom: 10px; }
        .insight-item { padding: 16px; background: rgba(255,255,255,0.02); border-radius: 12px; border-left: 3px solid var(--laranja-vorp); }
        .i-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; background: rgba(252, 84, 0, 0.1); color: var(--laranja-vorp); }
        .i-tag.success { background: rgba(30, 144, 128, 0.1); color: var(--status-verde); }
        .i-tag.warning { background: rgba(176, 48, 48, 0.1); color: var(--status-vermelho); }
        .insight-item p { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; font-weight: 500; }

        @media (max-width: 1000px) { .rankings-grid { grid-template-columns: 1fr; } }
      `}</style>Section
    </section>
  );
}
