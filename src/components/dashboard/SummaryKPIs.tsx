'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';

const Variation = ({ val, label }: { val: number, label?: string }) => {
  const isPos = val >= 0;
  return (
    <div className="variation-pill" style={{ 
      background: isPos ? 'rgba(30, 144, 128, 0.1)' : 'rgba(176, 48, 48, 0.1)',
      color: isPos ? COLORS.verde : COLORS.vermelho
    }}>
      {isPos ? '▲' : '▼'} {(Math.abs(val) || 0).toFixed(1)}pp
      {label && <span className="var-label">{label}</span>}
      <style jsx>{`
        .variation-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
        .var-label { opacity: 0.6; font-weight: 400; font-size: 0.6rem; margin-left: 2px; }
      `}</style>
    </div>
  );
};

export default function SummaryKPIs({ data }: { data: DashboardData }) {
  // 1. Conformidade Geral — média do score de conformidade de processo
  const currentAvg = data.currentAudits.reduce((acc: number, c: any) => acc + (c.score_conformidade ?? 0), 0) / (data.currentAudits.length || 1);
  const prevAvg = data.prevAudits.reduce((acc: number, c: any) => acc + (c.score_conformidade ?? 0), 0) / (data.prevAudits.length || 1);
  const varScore = currentAvg - prevAvg;

  const trendData = [
    { name: 'Anterior', value: prevAvg },
    { name: 'Atual', value: currentAvg }
  ];

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
    const avg = data.currentAudits.reduce((acc: number, c: any) => acc + (c[cat] || 0), 0) / (data.currentAudits.length || 1);
    if (avg > bestScore) { bestScore = avg; bestCat = catNames[cat]; }
  });

  // 3. % Reuniões
  const currentMeetingsVal = data.currentMeetings.reduce((acc: number, curr: any) => acc + curr.reunioes_realizadas, 0);
  const currentTotalMeetings = data.currentMeetings.reduce((acc: number, curr: any) => acc + curr.clientes_ativos, 0);
  const currentMeetingsPct = currentTotalMeetings > 0 ? (currentMeetingsVal / currentTotalMeetings) * 100 : 0;
  
  // 4. NPS
  const currentNPS = data.currentNPS.length > 0
    ? data.currentNPS.reduce((acc: number, curr: any) => acc + curr.nota, 0) / data.currentNPS.length
    : 0;

  return (
    <div className="summary-kpis">
      <div className="card kpi-card card-border-top glow-on-hover">
        <label>Conformidade Geral</label>
        <div className="kpi-main-row">
          <div className="val-col">
            <span className="val-big">{(currentAvg || 0).toFixed(1)}%</span>
            {data.prevMonth && <Variation val={varScore} />}
          </div>
          <div className="chart-mini-box">
             <ResponsiveContainer width="100%" height={50}>
                <LineChart data={trendData}>
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ background: COLORS.cardBg, borderRadius: '8px', border: `1px solid ${COLORS.cardBorder}`, fontSize: '10px' }}
                    itemStyle={{ color: COLORS.textMain }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={varScore >= 0 ? COLORS.verde : COLORS.vermelho} 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: varScore >= 0 ? COLORS.verde : COLORS.vermelho }} 
                  />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card kpi-card card-border-top glow-on-hover">
        <label>Melhor Categoria</label>
        <div className="val-row">
          <span className="val-big" style={{ fontSize: '1.6rem', fontFamily: 'DM Sans', fontWeight: 800 }}>{bestCat}</span>
          <span className="val-perc">{(bestScore || 0).toFixed(0)}%</span>
        </div>
        <div className="mini-progress">
          <div className="fill" style={{ width: `${bestScore}%`, background: COLORS.primary }} />
        </div>
      </div>

      <div className="card kpi-card card-border-top glow-on-hover">
        <label>% de Reuniões Realizadas</label>
        <div className="val-row">
          <span className="val-big">{(currentMeetingsPct || 0).toFixed(0)}%</span>
        </div>
        <div className="mini-progress">
          <div className="fill" style={{ width: `${currentMeetingsPct}%`, background: getSemaphorColor(currentMeetingsPct) }} />
        </div>
      </div>

      <div className="card kpi-card card-border-top glow-on-hover">
        <label>NPS Médio</label>
        <div className="val-row">
          <span className="val-big">{(currentNPS || 0).toFixed(1)}</span>
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
        .kpi-card { 
          display: flex; 
          flex-direction: column; 
          padding: 24px; 
          position: relative; 
          overflow: hidden; 
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .glow-on-hover:hover {
          box-shadow: 0 0 20px var(--glow-primary);
          transform: translateY(-2px);
          border-color: var(--laranja-vorp);
        }
        .kpi-card label { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.05em; }
        .val-row { display: flex; align-items: baseline; gap: 8px; justify-content: space-between; margin-bottom: 12px; }
        .kpi-main-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
        .val-col { display: flex; flex-direction: column; gap: 8px; }
        .chart-mini-box { width: 80px; margin-bottom: 4px; }
        .val-big { font-family: var(--font-bebas); font-size: 2.8rem; line-height: 1; color: var(--text-main); }
        .val-perc { color: var(--laranja-vorp); font-weight: 700; font-size: 0.9rem; }
        .mini-progress { height: 4px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: auto; overflow: hidden; }
        .fill { height: 100%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .badge { font-size: 0.6rem; font-weight: 900; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        @media (max-width: 1000px) { .summary-kpis { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
