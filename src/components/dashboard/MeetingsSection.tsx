'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts';
import { DashboardData, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

const T = {
  bg: '#0f1117', bgDeep: '#0a0b0e', border: '#1a1d24',
  orange: '#ff5c1a', green: '#1d9e75', red: '#e05555',
  text: '#e2e4e9', textSub: '#9aa0b0', textDim: '#3f4455',
  mono: "'DM Mono', monospace",
};

const tooltipStyle = { background: T.bgDeep, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 };

// Cor da barra no gráfico: Onboarding usa laranja atenuado independente do %
function getBarColor(pct: number, statusOperacao: string): string {
  if (statusOperacao === 'Onboarding') return T.orange;
  return getSemaphorColor(pct);
}

export default function MeetingsSection({ data }: { data: DashboardData }) {
  const { consultores } = useDashboard();

  const ranking = useMemo(() => {
    const source = data.rankingAtendidos.length > 0 ? data.rankingAtendidos : data.currentMeetings;
    const useAudit = data.rankingAtendidos.length > 0;

    // Inicializa mapa com todos os consultores Ativos em 0 para garantir presença mesmo sem dados
    const map: Record<string, {
      consultor_id: string;
      atendidos: number;
      carteira: number;
      status_operacao: string;
    }> = {};

    consultores
      .filter(c => c.status === 'Ativo')
      .forEach(c => {
        map[c.id] = { consultor_id: c.id, atendidos: 0, carteira: 0, status_operacao: 'Ativo' };
      });

    source.forEach((r: any) => {
      const cid = r.consultor_id;
      if (!cid) return;
      if (!map[cid]) map[cid] = { consultor_id: cid, atendidos: 0, carteira: 0, status_operacao: 'Ativo' };
      map[cid].atendidos       += useAudit ? (r.atendidos ?? 0) : (r.reunioes_realizadas ?? 0);
      map[cid].carteira        += useAudit ? (r.carteira  ?? 0) : (r.clientes_ativos    ?? 0);
      // status_operacao vem da view; última linha vence (todos os meses do consultor têm o mesmo valor)
      if (useAudit && r.status_operacao) map[cid].status_operacao = r.status_operacao;
    });

    return Object.values(map).map(r => ({
      consultor_id:        r.consultor_id,
      reunioes_realizadas: r.atendidos,
      clientes_ativos:     r.carteira,
      pct_reunioes:        r.carteira > 0 ? Math.round((r.atendidos / r.carteira) * 100) : 0,
      status_operacao:     r.status_operacao,
      consulName:          consultores.find(c => c.id === r.consultor_id)?.nome?.split(' ')[0] ?? 'Consultor',
      consulNameFull:      consultores.find(c => c.id === r.consultor_id)?.nome ?? 'Consultor',
    })).sort((a, b) => {
      // Onboarding vai ao final, depois ordena por % decrescente
      if (a.status_operacao === 'Onboarding' && b.status_operacao !== 'Onboarding') return 1;
      if (b.status_operacao === 'Onboarding' && a.status_operacao !== 'Onboarding') return -1;
      return b.pct_reunioes - a.pct_reunioes;
    });
  }, [data.rankingAtendidos, data.currentMeetings, consultores]);

  const getStatusLabel = (pct: number, statusOperacao: string) => {
    if (statusOperacao === 'Onboarding') return 'Onboarding';
    return pct >= 90 ? 'Excelente' : pct >= 75 ? 'Dentro do Esperado' : 'Abaixo da Meta';
  };

  const getStatusBadgeStyle = (pct: number, statusOperacao: string) => {
    if (statusOperacao === 'Onboarding') {
      return {
        display: 'inline-block', padding: '3px 8px', borderRadius: 5,
        background: `${T.orange}20`, color: T.orange,
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const,
        letterSpacing: '0.05em', whiteSpace: 'nowrap' as const,
      };
    }
    const color = getSemaphorColor(pct);
    return {
      display: 'inline-block', padding: '3px 8px', borderRadius: 5,
      background: `${color}18`, color,
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const,
      letterSpacing: '0.05em', whiteSpace: 'nowrap' as const,
    };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }} className="meet-grid">
      {/* Gráfico */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim }}>
            % da Carteira Atendida no Mês
          </span>
          {ranking.some(r => r.status_operacao === 'Onboarding') && (
            <span style={{ fontSize: 9, color: T.orange, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: T.orange, display: 'inline-block' }} />
              Onboarding
            </span>
          )}
        </div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking} margin={{ top: 22, right: 16, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="consulName" axisLine={false} tickLine={false}
                tick={{ fill: T.textSub, fontSize: 10, fontWeight: 600 }} dy={8} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={v => `${v}%`} width={34} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                formatter={(v: any, _: any, props: any) => {
                  const isOnboarding = props.payload.status_operacao === 'Onboarding';
                  return [
                    `${v}% (${props.payload.reunioes_realizadas}/${props.payload.clientes_ativos})${isOnboarding ? ' · Onboarding' : ''}`,
                    props.payload.consulNameFull,
                  ];
                }} />
              <Bar dataKey="pct_reunioes" radius={[5, 5, 0, 0]} barSize={32}>
                {ranking.map((e, i) => (
                  <Cell
                    key={i}
                    fill={getBarColor(e.pct_reunioes, e.status_operacao)}
                    fillOpacity={e.status_operacao === 'Onboarding' ? 0.45 : 0.85}
                  />
                ))}
                <LabelList dataKey="pct_reunioes" position="top"
                  formatter={(v: any) => `${v}%`}
                  style={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Detalhamento Mensal</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textDim }}>
            Realizado / Carteira
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Pos', 'Consultor', 'Status', 'Presença'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 3 ? 'right' : 'left', padding: '7px 8px',
                  color: T.textDim, fontSize: 9, textTransform: 'uppercase',
                  letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}`, fontWeight: 700,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: '11px 8px', fontSize: 10, color: T.textDim, fontWeight: 700 }}>#{i + 1}</td>
                <td style={{ padding: '11px 8px', fontSize: 12, fontWeight: 600, color: T.textSub }}>
                  {r.consulNameFull}
                </td>
                <td style={{ padding: '11px 8px' }}>
                  <span style={getStatusBadgeStyle(r.pct_reunioes, r.status_operacao)}>
                    {getStatusLabel(r.pct_reunioes, r.status_operacao)}
                  </span>
                </td>
                <td style={{
                  padding: '11px 8px', textAlign: 'right', fontSize: 14, fontWeight: 700,
                  color: r.status_operacao === 'Onboarding' ? T.orange : T.text,
                  fontFamily: T.mono,
                }}>
                  {r.reunioes_realizadas}/{r.clientes_ativos}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) { .meet-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
