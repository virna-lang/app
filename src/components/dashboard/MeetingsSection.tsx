import React from 'react';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';
import { mockConsultants } from '@/lib/mockData';

export default function MeetingsSection({ data }: { data: DashboardData }) {
  const ranking = [...data.currentMeetings].sort((a, b) => b.pct_reunioes - a.pct_reunioes);
  
  return (
    <section className="section-block">
      <div className="section-anchor">
          <h2>Reuniões com Clientes</h2>
      </div>
      <div className="meetings-layout">
        <div className="podium-container card">
          <h3>Quem mais atendeu clientes este mês?</h3>
          <div className="podium-bars">
            {ranking.map((r, i) => {
              const consul = mockConsultants.find(c => c.id === r.consultor_id);
              const opacity = 1 - (i * 0.15);
              const tooltipText = `${r.reunioes_realizadas} de ${r.clientes_ativos} clientes atendidos`;
              return (
                <div key={i} className="podium-column" title={tooltipText}>
                  <span className="podium-name">{consul?.nome}</span>
                  <div className="podium-bar" style={{ height: `${r.pct_reunioes}%`, background: COLORS.primary, opacity: opacity }}>
                    <span className="rank-pos">#{i+1}</span>
                    <span className="rank-pct">{r.pct_reunioes}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="table-card card">
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Consultor</th>
                <th>Progresso</th>
                <th>%</th>
                <th style={{ textAlign: 'right' }}>Absoluto</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => {
                const consul = mockConsultants.find(c => c.id === r.consultor_id);
                return (
                  <tr key={i}>
                    <td className="text-muted">#{i+1}</td>
                    <td style={{ fontWeight: 700 }}>{consul?.nome}</td>
                    <td style={{ width: '40%' }}>
                      <div className="mini-bar-bg"><div className="mini-bar-fill" style={{ width: `${r.pct_reunioes}%`, background: getSemaphorColor(r.pct_reunioes) }} /></div>
                    </td>
                    <td style={{ color: getSemaphorColor(r.pct_reunioes), fontWeight: 700 }}>{r.pct_reunioes}%</td>
                    <td style={{ textAlign: 'right', fontSize: '0.8rem', color: COLORS.textMuted }}>{r.reunioes_realizadas}/{r.clientes_ativos}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style jsx>{`
        .meetings-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .podium-container { padding: 30px; display: flex; flex-direction: column; align-items: center; }
        .podium-container h3 { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 40px; }
        .podium-bars { display: flex; align-items: flex-end; gap: 20px; height: 260px; width: 100%; justify-content: center; }
        .podium-column { display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 60px; }
        .podium-name { font-size: 0.7rem; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); }
        .podium-bar { width: 100%; border-radius: 6px 6px 0 0; display: flex; flex-direction: column; justify-content: space-between; padding: 12px 0; color: white; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .rank-pos { font-family: var(--font-bebas); font-size: 1.2rem; }
        .rank-pct { font-size: 0.75rem; font-weight: 800; writing-mode: vertical-rl; transform: rotate(180deg); }
        
        .meetings-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .meetings-table th { text-align: left; padding: 12px; color: var(--text-muted); text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.05em; }
        .meetings-table td { padding: 15px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .mini-bar-bg { height: 4px; background: rgba(255,255,255,0.03); border-radius: 2px; }
        .mini-bar-fill { height: 100%; border-radius: 2px; }
        @media (max-width: 1000px) { .meetings-layout { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
