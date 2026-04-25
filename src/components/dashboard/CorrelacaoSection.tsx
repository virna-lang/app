'use client';

import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { getConsultores, getCorrelacaoConsultor } from '@/lib/api';
import type { Consultor } from '@/lib/supabase';

const T = {
  bg: '#0f1117', bgDeep: '#0a0b0e', border: '#1a1d24',
  orange: '#ff5c1a', green: '#1d9e75', red: '#e05555', blue: '#4fc3f7',
  text: '#e2e4e9', textSub: '#9aa0b0', textDim: '#3f4455',
  mono: "'DM Mono', monospace",
};

const LINE_R    = T.orange;
const LINE_C    = T.blue;
const BAR_CHURN = '#b03030';

function semaphor(v: number) {
  if (v >= 80) return T.green;
  if (v >= 60) return T.orange;
  return T.red;
}

type CorrelacaoItem = {
  mes_ano: string; label: string;
  score_resultado: number; score_conformidade: number; churn_count: number;
};

export default function CorrelacaoSection() {
  const [consultores,  setConsultores]  = useState<Consultor[]>([]);
  const [selectedCons, setSelectedCons] = useState('');
  const [data,         setData]         = useState<CorrelacaoItem[]>([]);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { getConsultores().then(setConsultores); }, []);
  useEffect(() => {
    if (!selectedCons) { setData([]); return; }
    setLoading(true);
    getCorrelacaoConsultor(selectedCons).then(d => { setData(d); setLoading(false); });
  }, [selectedCons]);

  const consultorNome = consultores.find(c => c.id === selectedCons)?.nome ?? '';
  const last = data[data.length - 1];
  const churnTotal = data.reduce((s, d) => s + d.churn_count, 0);
  const avgR = data.length ? data.reduce((s, d) => s + d.score_resultado,    0) / data.length : 0;
  const avgC = data.length ? data.reduce((s, d) => s + d.score_conformidade, 0) / data.length : 0;

  const tooltipStyle = { background: T.bgDeep, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 };

  const kpi = (label: string, value: string, color: string) => (
    <div style={{
      background: T.bg, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 130,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textDim, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, fontFamily: T.mono }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 12, color: T.textDim, marginTop: -8 }}>
        Acompanhe a evolução de resultado, conformidade e churn de um consultor ao longo do tempo.
      </p>

      {/* Filtro */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 200 }}>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.textDim }}>
              Consultor
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedCons}
                onChange={e => setSelectedCons(e.target.value)}
                style={{
                  width: '100%', appearance: 'none',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${T.border}`, borderRadius: 7,
                  padding: '9px 32px 9px 12px', color: T.text,
                  fontSize: 13, cursor: 'pointer', outline: 'none',
                  transition: 'border-color 0.15s',
                }}>
                <option value="">Selecionar consultor...</option>
                {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: T.textDim, pointerEvents: 'none' }} />
            </div>
          </div>
          {consultorNome && (
            <span style={{ fontSize: 20, fontWeight: 700, color: T.orange, paddingTop: 18 }}>
              {consultorNome}
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      {selectedCons && !loading && data.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {kpi('Resultado Médio',    `${avgR.toFixed(1)}%`, semaphor(avgR))}
            {kpi('Conformidade Média', `${avgC.toFixed(1)}%`, semaphor(avgC))}
            {kpi('Churns no Período',  `${churnTotal}`,       BAR_CHURN)}
            {last && kpi(`Último mês (${last.label})`, `R ${last.score_resultado}% / C ${last.score_conformidade}%`, semaphor(last.score_resultado))}
          </div>

          {/* Gráfico composto */}
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim, marginBottom: 16 }}>
              Evolução Histórica
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 12, right: 24, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false}
                    tick={{ fill: T.textDim, fontSize: 11, fontWeight: 600 }} />
                  <YAxis yAxisId="pct" domain={[0, 100]} axisLine={false} tickLine={false}
                    tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={v => `${v}%`} width={34} />
                  <YAxis yAxisId="churn" orientation="right" allowDecimals={false}
                    axisLine={false} tickLine={false}
                    tick={{ fill: BAR_CHURN, fontSize: 10, fontWeight: 700 }} width={28}
                    label={{ value: 'Churn', angle: 90, position: 'insideRight', fill: BAR_CHURN, fontSize: 10 }} />
                  <ReferenceLine yAxisId="pct" y={80} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(v: any, name: any) => name === 'Churn' ? [v, name] : [`${(v || 0).toFixed(1)}%`, name]} />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                    formatter={(value) => <span style={{ color: T.textSub, fontWeight: 700 }}>{value}</span>} />
                  <Bar yAxisId="churn" dataKey="churn_count" name="Churn"
                    fill={BAR_CHURN} fillOpacity={0.45} radius={[4, 4, 0, 0]} barSize={22} />
                  <Line yAxisId="pct" type="monotone" dataKey="score_resultado" name="Resultado"
                    stroke={LINE_R} strokeWidth={2}
                    dot={{ r: 3, fill: LINE_R, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line yAxisId="pct" type="monotone" dataKey="score_conformidade" name="Conformidade"
                    stroke={LINE_C} strokeWidth={2}
                    dot={{ r: 3, fill: LINE_C, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {selectedCons && !loading && data.length === 0 && (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '40px', textAlign: 'center', color: T.textDim, fontSize: 13 }}>
          Nenhum dado de auditoria encontrado para {consultorNome}.
        </div>
      )}

      {loading && (
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '40px', textAlign: 'center', color: T.textDim, fontSize: 13 }}>
          Carregando dados...
        </div>
      )}
    </div>
  );
}
