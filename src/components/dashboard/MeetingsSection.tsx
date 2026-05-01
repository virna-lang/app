'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts';
import { DashboardData, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';
import { getConsultorLabel } from '@/lib/consultor-label';

const T = {
  bg: '#0f1117', bgDeep: '#0a0b0e', border: '#1a1d24',
  orange: '#ff5c1a', green: '#1d9e75', red: '#e05555',
  text: '#e2e4e9', textSub: '#9aa0b0', textDim: '#3f4455',
  mono: "'DM Mono', monospace",
};

const tooltipStyle = { background: T.bgDeep, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 };

export default function MeetingsSection({ data }: { data: DashboardData }) {
  const { consultores, filters } = useDashboard();

  const ranking = useMemo(() => {
    const source = data.rankingAtendidos.length > 0 ? data.rankingAtendidos : data.currentMeetings;
    const useAudit = data.rankingAtendidos.length > 0;
    const map: Record<string, { consultor_id: string; atendidos: number; carteira: number }> = {};

    const consultoresBase = filters.consultantId === 'all'
      ? consultores.filter(c => c.status === 'Ativo')
      : consultores.filter(c => c.id === filters.consultantId);

    consultoresBase.forEach(c => {
      map[c.id] = { consultor_id: c.id, atendidos: 0, carteira: 0 };
    });

    source.forEach((r: any) => {
      const cid = r.consultor_id;
      if (!cid) return;
      if (!map[cid]) map[cid] = { consultor_id: cid, atendidos: 0, carteira: 0 };
      map[cid].atendidos += useAudit ? (r.atendidos ?? 0) : (r.reunioes_realizadas ?? 0);
      map[cid].carteira  += useAudit ? (r.carteira  ?? 0) : (r.clientes_ativos    ?? 0);
    });
    return Object.values(map).map(r => ({
      consultor_id:        r.consultor_id,
      reunioes_realizadas: r.atendidos,
      clientes_ativos:     r.carteira,
      pct_reunioes:        r.carteira > 0 ? Math.round((r.atendidos / r.carteira) * 100) : 0,
      consulName:          getConsultorLabel(consultores, r.consultor_id, 'first'),
      consulNameFull:      getConsultorLabel(consultores, r.consultor_id, 'full'),
    })).sort((a, b) => b.pct_reunioes - a.pct_reunioes);
  }, [data.rankingAtendidos, data.currentMeetings, consultores, filters.consultantId]);

  const getStatusLabel = (pct: number) =>
    pct >= 90 ? 'Excelente' : pct >= 75 ? 'Dentro do Esperado' : 'Abaixo da Meta';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }} className="meet-grid">
      {/* Gráfico */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '20px 22px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim, marginBottom: 16 }}>
          % da Carteira Atendida no Mês
        </div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking} margin={{ top: 22, right: 16, left: 0, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="consulName" axisLine={false} tickLine={false}
                interval={0} minTickGap={0}
                tick={{ fill: T.textSub, fontSize: 10, fontWeight: 600 }} dy={8} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={v => `${v}%`} width={34} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                formatter={(v: any, _: any, props: any) => [
                  `${v}% (${props.payload.reunioes_realizadas}/${props.payload.clientes_ativos})`,
                  props.payload.consulNameFull,
                ]} />
              <Bar dataKey="pct_reunioes" radius={[5, 5, 0, 0]} barSize={32}>
                {ranking.map((e, i) => (
                  <Cell key={i} fill={getSemaphorColor(e.pct_reunioes)} fillOpacity={0.85} />
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
            {ranking.map((r, i) => {
              const color = getSemaphorColor(r.pct_reunioes);
              return (
                <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '11px 8px', fontSize: 10, color: T.textDim, fontWeight: 700 }}>#{i + 1}</td>
                  <td style={{ padding: '11px 8px', fontSize: 12, fontWeight: 600, color: T.textSub }}>{r.consulNameFull}</td>
                  <td style={{ padding: '11px 8px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 5,
                      background: `${color}18`, color,
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>
                      {getStatusLabel(r.pct_reunioes)}
                    </span>
                  </td>
                  <td style={{ padding: '11px 8px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.mono }}>
                    {r.reunioes_realizadas}/{r.clientes_ativos}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) { .meet-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
