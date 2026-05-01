'use client';

import React, { useMemo } from 'react';
import { DashboardData, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { getConsultorLabel } from '@/lib/consultor-label';

const T = {
  bg: '#0f1117', border: '#1a1d24', orange: '#ff5c1a',
  green: '#1d9e75', red: '#e05555', text: '#e2e4e9',
  textSub: '#9aa0b0', textDim: '#3f4455', mono: "'DM Mono', monospace",
};

export default function PerformanceRankings({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();

  const ranking = useMemo(() =>
    (data.currentAudits as any[]).map(a => ({
      name:  getConsultorLabel(consultores, a.consultor_id, 'full'),
      score: a.score_drive ?? 0,
    })).sort((a, b) => b.score - a.score),
    [data.currentAudits, consultores],
  );

  const insights = [
    { type: 'ALERTA',   color: T.red,    bg: 'rgba(220,53,69,0.1)',    icon: <AlertTriangle size={11} />, text: 'Consultores com menos de 80% em encaminhamentos precisam de revisão de processos no Drive.' },
    { type: 'DESTAQUE', color: T.green,  bg: 'rgba(29,158,117,0.1)',   icon: <TrendingUp size={11} />,    text: 'O preenchimento de metas e flags subiu 5.2% na média geral este mês.' },
    { type: 'AÇÃO',     color: T.orange, bg: 'rgba(255,92,26,0.08)',   icon: <Zap size={11} />,           text: 'Reuniões de alinhamento pendentes para 4 clientes na categoria Aliança.' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }} className="perf-grid">
      {/* Ranking */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(255,92,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            📂
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Conformidade de Encaminhamentos</div>
            <div style={{ fontSize: 11, color: T.textDim }}>Drives atualizados e preenchidos corretamente.</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {ranking.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: T.textDim, width: 20, textAlign: 'right', fontFamily: T.mono }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.textSub }}>{r.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, width: 38, textAlign: 'right', color: getSemaphorColor(r.score), fontFamily: T.mono, flexShrink: 0 }}>
                {(r.score || 0).toFixed(0)}%
              </span>
              <div style={{ width: '40%', height: 4, background: T.border, borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ width: `${r.score}%`, height: '100%', background: getSemaphorColor(r.score), borderRadius: 99, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '20px 22px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim, marginBottom: 14 }}>
          Insights de Auditoria
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {insights.map(ins => (
            <div key={ins.type} style={{
              padding: '11px 13px', borderRadius: 8,
              background: ins.bg, borderLeft: `2px solid ${ins.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ins.color, marginBottom: 5 }}>
                {ins.icon} {ins.type}
              </div>
              <p style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.55, margin: 0 }}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1000px) { .perf-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
