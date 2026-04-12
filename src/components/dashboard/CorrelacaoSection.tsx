'use client';

import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { getConsultores, getCorrelacaoConsultor } from '@/lib/api';
import type { Consultor } from '@/lib/supabase';
import { COLORS } from '@/types/dashboard';

const LINE_R = '#FC5400';
const LINE_C = '#00A3E0';
const BAR_CHURN = '#B03030';

function getSemaphor(v: number) {
  if (v >= 80) return COLORS.verde;
  if (v >= 60) return COLORS.primary;
  return COLORS.vermelho;
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
  const avgR = data.length ? data.reduce((s, d) => s + d.score_resultado, 0) / data.length : 0;
  const avgC = data.length ? data.reduce((s, d) => s + d.score_conformidade, 0) / data.length : 0;

  return (
    <div className="corr-container">
      <div className="section-anchor">
        <h2>Correlação por Consultor</h2>
      </div>
      <p className="corr-sub">
        Acompanhe a evolução de resultado, conformidade e churn de um consultor ao longo do tempo.
      </p>

      {/* Seletor de consultor */}
      <div className="card corr-filter-card">
        <div className="corr-filters">
          <div className="corr-field">
            <label>CONSULTOR</label>
            <div className="sel-wrap">
              <select
                value={selectedCons}
                onChange={e => setSelectedCons(e.target.value)}
                className="corr-select"
              >
                <option value="">Selecionar consultor...</option>
                {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown size={14} className="sel-icon" />
            </div>
          </div>
          {consultorNome && (
            <div className="corr-nome">
              {consultorNome}
            </div>
          )}
        </div>
      </div>

      {selectedCons && !loading && data.length > 0 && (
        <>
          {/* KPIs de resumo */}
          <div className="corr-kpis">
            <div className="corr-kpi">
              <span className="kpi-label">Resultado Médio</span>
              <span className="kpi-val" style={{ color: getSemaphor(avgR) }}>{avgR.toFixed(1)}%</span>
            </div>
            <div className="corr-kpi">
              <span className="kpi-label">Conformidade Média</span>
              <span className="kpi-val" style={{ color: getSemaphor(avgC) }}>{avgC.toFixed(1)}%</span>
            </div>
            <div className="corr-kpi" style={{ borderLeftColor: BAR_CHURN }}>
              <span className="kpi-label">Churns no Período</span>
              <span className="kpi-val" style={{ color: BAR_CHURN }}>{churnTotal}</span>
            </div>
            {last && (
              <div className="corr-kpi">
                <span className="kpi-label">Último mês ({last.label})</span>
                <span className="kpi-val" style={{ color: getSemaphor(last.score_resultado) }}>
                  R {last.score_resultado}% / C {last.score_conformidade}%
                </span>
              </div>
            )}
          </div>

          {/* Gráfico */}
          <div className="card corr-chart-card">
            <div className="corr-chart-title">Evolução Histórica</div>
            <div className="corr-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false} tickLine={false}
                    tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis
                    yAxisId="pct"
                    domain={[0, 100]}
                    axisLine={false} tickLine={false}
                    tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                    tickFormatter={v => `${v}%`}
                    width={36}
                  />
                  <YAxis
                    yAxisId="churn"
                    orientation="right"
                    allowDecimals={false}
                    axisLine={false} tickLine={false}
                    tick={{ fill: BAR_CHURN, fontSize: 10, fontWeight: 700 }}
                    width={30}
                    label={{ value: 'Churn', angle: 90, position: 'insideRight', fill: BAR_CHURN, fontSize: 10 }}
                  />
                  <ReferenceLine yAxisId="pct" y={80} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{ background: '#0F1020', borderRadius: '10px', border: '1px solid #1A1A38', fontSize: '12px' }}
                    formatter={(v: any, name: any) => {
                      if (name === 'Churn') return [v, name];
                      return [`${(v || 0).toFixed(1)}%`, name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                    formatter={(value) => <span style={{ color: COLORS.textSecondary, fontWeight: 700 }}>{value}</span>}
                  />
                  <Bar
                    yAxisId="churn"
                    dataKey="churn_count"
                    name="Churn"
                    fill={BAR_CHURN}
                    fillOpacity={0.5}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="score_resultado"
                    name="Resultado"
                    stroke={LINE_R}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: LINE_R, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="score_conformidade"
                    name="Conformidade"
                    stroke={LINE_C}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: LINE_C, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {selectedCons && !loading && data.length === 0 && (
        <div className="card corr-empty">
          Nenhum dado de auditoria encontrado para {consultorNome}.
        </div>
      )}

      {loading && (
        <div className="card corr-empty">Carregando dados...</div>
      )}

      <style jsx>{`
        .corr-container { margin-top: 20px; display: flex; flex-direction: column; gap: 20px; }
        .corr-sub { color: var(--text-muted); font-size: 0.85rem; margin-top: -12px; }

        .corr-filter-card { padding: 20px; }
        .corr-filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .corr-field { display: flex; flex-direction: column; gap: 6px; min-width: 220px; }
        .corr-field label { font-size: 0.55rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .sel-wrap { position: relative; }
        .corr-select {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          border-radius: 8px; padding: 10px 14px; color: var(--text-main); font-size: 0.9rem;
          appearance: none; cursor: pointer;
        }
        .corr-select:focus { border-color: var(--laranja-vorp); outline: none; }
        .corr-select option { background: #0F1020; }
        .sel-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .corr-nome {
          font-family: var(--font-bebas); font-size: 1.4rem; color: var(--laranja-vorp);
          padding: 4px 0;
        }

        .corr-kpis { display: flex; gap: 16px; flex-wrap: wrap; }
        .corr-kpi {
          background: var(--glass-bg); border: 1px solid var(--card-border);
          border-left: 3px solid var(--card-border);
          border-radius: 12px; padding: 18px 24px; flex: 1; min-width: 140px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .kpi-label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
        .kpi-val { font-family: var(--font-bebas); font-size: 1.8rem; line-height: 1; color: var(--text-main); }

        .corr-chart-card { padding: 24px; }
        .corr-chart-title { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; }
        .corr-chart { height: 300px; }

        .corr-empty {
          padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
