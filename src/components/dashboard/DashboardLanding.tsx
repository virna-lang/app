'use client';

import React from 'react';
import { DashboardData, getSemaphorColor, COLORS } from '@/types/dashboard';
import { 
  ClipboardCheck, Users, Target, MessageSquare, AlertTriangle, 
  ArrowRight, ShieldCheck, BarChart3
} from 'lucide-react';

interface Props {
  data: DashboardData;
  onNavigate: (tab: string) => void;
}

export default function DashboardLanding({ data, onNavigate }: Props) {
  // 1. Conformidade Geral
  const currentAvg = data.currentAudits.reduce((acc, c) => acc + c.score_geral, 0) / (data.currentAudits.length || 1);
  const prevAvg = data.prevAudits.reduce((acc, c) => acc + c.score_geral, 0) / (data.prevAudits.length || 1);
  const varScore = currentAvg - prevAvg;

  // 2. % Reuniões
  const currentMeetingsVal = data.currentMeetings.reduce((acc, curr) => acc + curr.reunioes_realizadas, 0);
  const currentTotalMeetings = data.currentMeetings.reduce((acc, curr) => acc + curr.clientes_ativos, 0);
  const currentMeetingsPct = currentTotalMeetings > 0 ? (currentMeetingsVal / currentTotalMeetings) * 100 : 0;

  // 3. NPS
  const currentNPS = data.currentNPS.length > 0
    ? data.currentNPS.reduce((acc, curr) => acc + curr.nota, 0) / data.currentNPS.length
    : 0;

  // 4. Churn
  const churnCount = data.currentChurn.length;

  const navItems = [
    { id: 'Conformidade', label: 'Conformidade', icon: <ClipboardCheck size={28} />, desc: 'Auditoria de drive, clickup e whatsapp.', value: `${(currentAvg || 0).toFixed(1)}%` },
    { id: 'Reuniões', label: 'Reuniões', icon: <Users size={28} />, desc: 'Métricas de atendimento e clientes ativos.', value: `${(currentMeetingsPct || 0).toFixed(0)}%` },
    { id: 'Metas', label: 'Metas', icon: <Target size={28} />, desc: 'Desempenho projetado vs realizado.', value: 'Ver Detalhes' },
    { id: 'NPS / CSAT', label: 'NPS / CSAT', icon: <MessageSquare size={28} />, desc: 'Qualidade percebida pelos clientes.', value: (currentNPS || 0).toFixed(1) },
    { id: 'Churn', label: 'Churn', icon: <AlertTriangle size={28} />, desc: 'Registro e motivos de perdas.', value: churnCount },
  ];

  return (
    <div className="dashboard-landing">
      {/* KPI Top Row */}
      <div className="kpi-grid">
        <div className="kpi-card mini-card">
          <label>Conformidade Geral</label>
          <span className="val">{(currentAvg || 0).toFixed(1)}%</span>
        </div>
        <div className="kpi-card mini-card">
          <label>% Reuniões</label>
          <span className="val">{(currentMeetingsPct || 0).toFixed(0)}%</span>
        </div>
        <div className="kpi-card mini-card">
          <label>Média NPS</label>
          <span className="val">{(currentNPS || 0).toFixed(1)}</span>
        </div>
        <div className="kpi-card mini-card">
          <label>Churn do Mês</label>
          <span className="val" style={{ color: churnCount > 0 ? COLORS.vermelho : 'inherit' }}>{churnCount}</span>
        </div>
      </div>

      <div className="landing-title">
        <h1>BEM-VINDO AO <span>HUB VORP</span></h1>
        <p>Acesse rapidamente as informações da Auditoria nos botões abaixo.</p>
      </div>

      {/* Button Grid (Hub) */}
      <div className="hub-grid">
        {navItems.map(item => (
          <button 
            key={item.id} 
            className="hub-card"
            onClick={() => onNavigate(item.id)}
          >
            <div className="hub-icon">{item.icon}</div>
            <div className="hub-content">
              <h3>{item.label}</h3>
              <p>{item.desc}</p>
            </div>
            <div className="hub-footer">
              <span className="hub-val">{item.value}</span>
              <ArrowRight size={18} />
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .dashboard-landing { animation: fadeIn 0.5s ease-out; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 60px; }
        .kpi-card { padding: 16px 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--card-border); border-radius: 12px; display: flex; flex-direction: column; gap: 4px; }
        .kpi-card label { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
        .kpi-card .val { font-family: var(--font-bebas); font-size: 1.5rem; color: var(--text-main); }
        
        .landing-title { margin-bottom: 40px; text-align: center; }
        .landing-title h1 { font-family: var(--font-bebas); font-size: 2.5rem; letter-spacing: 0.05em; color: var(--text-main); }
        .landing-title h1 span { color: var(--laranja-vorp); }
        .landing-title p { color: var(--text-muted); font-size: 0.95rem; }

        .hub-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
        
        .hub-card { 
          background: var(--card-bg); 
          border: 1px solid var(--card-border); 
          border-radius: 16px; 
          padding: 24px; 
          text-align: left; 
          cursor: pointer; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .hub-card:hover { 
          transform: translateY(-8px); 
          border-color: var(--laranja-vorp); 
          box-shadow: 0 10px 40px rgba(252, 84, 0, 0.15); 
          background: rgba(252, 84, 0, 0.03);
        }

        .hub-icon { color: var(--laranja-vorp); }
        
        .hub-content h3 { font-family: var(--font-dm-sans); font-size: 1.1rem; color: var(--text-main); margin-bottom: 8px; }
        .hub-content p { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; }
        
        .hub-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.03); color: var(--laranja-vorp); }
        .hub-val { font-family: var(--font-bebas); font-size: 1.25rem; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1400px) { .hub-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 1000px) { .hub-grid { grid-template-columns: repeat(2, 1fr); } .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .hub-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
