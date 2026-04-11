'use client';

import React from 'react';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';
import { MonthlyAudit } from '@/lib/mockData';

const Variation = ({ val }: { val: number }) => {
  const isPos = val >= 0;
  return (
    <span style={{ color: isPos ? COLORS.verde : COLORS.vermelho, fontSize: '0.75rem', fontWeight: 700, marginLeft: '8px' }}>
      {isPos ? '▲' : '▼'} {Math.abs(val).toFixed(1)}pp
    </span>
  );
};

export default function SummaryKPIs({ data }: { data: DashboardData }) {
  // 1. Conformidade Geral
  const currentAvg = data.currentAudits.reduce((acc, c) => acc + c.score_geral, 0) / (data.currentAudits.length || 1);
  const prevAvg = data.prevAudits.reduce((acc, c) => acc + c.score_geral, 0) / (data.prevAudits.length || 1);
  const varScore = currentAvg - prevAvg;

  // 2. Melhor Categoria
  const categories = ['score_clickup', 'score_drive', 'score_whatsapp', 'score_metas', 'score_flags', 'score_rastreabilidade'];
  const catNames: { [key: string]: string } = { 
    score_clickup: 'ClickUp', 
    score_drive: 'Drive', 
    score_whatsapp: 'WhatsApp', 
    score_metas: 'Planilhas', 
    score_flags: 'Flags', 
    score_rastreabilidade: 'Rastreabilidade' 
  };
  
  let bestCat = 'ClickUp';
  let bestScore = 0;
  categories.forEach(cat => {
    const avg = data.currentAudits.reduce((acc, c: any) => acc + (c[cat] || 0), 0) / (data.currentAudits.length || 1);
    if (avg > bestScore) { bestScore = avg; bestCat = catNames[cat]; }
  });

  // 3. % Reuniões
  const currentMeetingsVal = data.currentMeetings.reduce((acc, curr) => acc + curr.reunioes_realizadas, 0);
  const currentTotalMeetings = data.currentMeetings.reduce((acc, curr) => acc + curr.clientes_ativos, 0);
  const currentMeetingsPct = currentTotalMeetings > 0 ? (currentMeetingsVal / currentTotalMeetings) * 100 : 0;
  
  // For meetings pp diff, we'd need prev meetings from mock but let's keep it simple or use currentMeetingsPct for now
  const meetingsDiff = 0; // Simplified for now since prevMeetings data is deeper in mock

  // 4. NPS
  const currentNPS = data.currentNPS.length > 0
    ? data.currentNPS.reduce((acc, curr) => acc + curr.nota, 0) / data.currentNPS.length
    : 0;

  return (
    <div className="summary-kpis">
      <div className="card kpi-card card-border-top">
        <label>Conformidade Geral</label>
        <div className="val-row">
          <span className="val-big">{currentAvg.toFixed(1)}%</span>
          {data.prevMonth && <Variation val={varScore} />}
        </div>
      </div>

      <div className="card kpi-card card-border-top">
        <label>Melhor Categoria</label>
        <div className="val-row">
          <span className="val-big" style={{ fontSize: '1.6rem', fontFamily: 'DM Sans', fontWeight: 800 }}>{bestCat}</span>
          <span className="val-perc">{bestScore.toFixed(0)}%</span>
        </div>
      </div>

      <div className="card kpi-card card-border-top">
        <label>% de Reuniões Realizadas</label>
        <div className="val-row">
          <span className="val-big">{currentMeetingsPct.toFixed(0)}%</span>
          {/* <Variation val={meetingsDiff} /> */}
        </div>
        <div className="mini-progress">
          <div className="fill" style={{ width: `${currentMeetingsPct}%`, background: getSemaphorColor(currentMeetingsPct) }} />
        </div>
      </div>

      <div className="card kpi-card card-border-top">
        <label>NPS do Mês</label>
        <div className="val-row">
          <span className="val-big">{currentNPS.toFixed(0)}</span>
          <span className="badge" style={{ 
            background: currentNPS >= 90 ? COLORS.verde + '20' : currentNPS >= 75 ? COLORS.primary + '20' : COLORS.vermelho + '20',
            color: currentNPS >= 90 ? COLORS.verde : currentNPS >= 75 ? COLORS.primary : COLORS.vermelho 
          }}>
            {currentNPS >= 90 ? 'Excelente' : currentNPS >= 75 ? 'Bom' : 'Atenção'}
          </span>
        </div>
      </div>

      <style jsx>{`
        .summary-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .kpi-card { display: flex; flex-direction: column; padding: 24px; position: relative; overflow: hidden; }
        .kpi-card label { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; }
        .val-row { display: flex; align-items: baseline; gap: 8px; justify-content: space-between; }
        .val-big { font-family: var(--font-bebas); font-size: 2.8rem; line-height: 1; color: var(--text-main); }
        .val-perc { color: var(--laranja-vorp); font-weight: 700; font-size: 0.9rem; }
        .mini-progress { height: 4px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 12px; overflow: hidden; }
        .fill { height: 100%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .badge { font-size: 0.6rem; font-weight: 900; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        @media (max-width: 1000px) { .summary-kpis { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
