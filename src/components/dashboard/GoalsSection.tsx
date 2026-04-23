'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';
import { ChevronDown } from 'lucide-react';

const tooltipStyle = {
  background: '#111827', borderRadius: 10,
  border: '1px solid #1f2d40', fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

export default function GoalsSection({ data, filterProducts }: { data: DashboardData; filterProducts: string[] }) {
  const { consultores } = useDashboard();
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const produtos = useMemo(() => {
    const set = new Set<string>();
    (data.metasPorProduto as any[]).forEach(v => {
      if (v.produto && v.produto.toLowerCase() !== 'todos os produtos') set.add(v.produto);
    });
    return Array.from(set).sort();
  }, [data.metasPorProduto]);

  const consultantRanking = useMemo(() => {
    const filtered = (data.metasPorProduto as any[]).filter(v =>
      selectedProduct === 'all' || v.produto === selectedProduct
    );
    const map: Record<string, { name: string; soma: number; count: number; qtd_conformes: number; qtd_avaliados: number }> = {};
    filtered.forEach(v => {
      const nome = consultores.find(c => c.id === v.consultor_id)?.nome ?? 'Consultor';
      if (!map[v.consultor_id]) map[v.consultor_id] = { name: nome, soma: 0, count: 0, qtd_conformes: 0, qtd_avaliados: 0 };
      map[v.consultor_id].soma          += v.nota_pct      ?? 0;
      map[v.consultor_id].count         += 1;
      map[v.consultor_id].qtd_conformes += v.qtd_conformes ?? 0;
      map[v.consultor_id].qtd_avaliados += v.qtd_avaliados ?? 0;
    });
    return Object.values(map).map(r => ({
      name:    r.name,
      batidas: r.qtd_conformes,
      total:   r.qtd_avaliados,
      pct:     r.qtd_avaliados > 0
        ? Math.round((r.qtd_conformes / r.qtd_avaliados) * 100)
        : Math.round(r.soma / (r.count || 1)),
    })).sort((a, b) => b.pct - a.pct);
  }, [data.metasPorProduto, selectedProduct, consultores]);

  const productChartData = useMemo(() => {
    const map: Record<string, { conformes: number; avaliados: number; notas: number[] }> = {};
    (data.metasPorProduto as any[]).forEach(v => {
      const prod = v.produto ?? 'Sem produto';
      if (!map[prod]) map[prod] = { conformes: 0, avaliados: 0, notas: [] };
      map[prod].conformes += v.qtd_conformes ?? 0;
      map[prod].avaliados += v.qtd_avaliados ?? 0;
      if (v.nota_pct != null) map[prod].notas.push(v.nota_pct);
    });
    return Object.entries(map).map(([name, r]) => ({
      name,
      value: r.avaliados > 0
        ? Math.round((r.conformes / r.avaliados) * 100)
        : r.notas.length > 0
          ? Math.round(r.notas.reduce((a, b) => a + b, 0) / r.notas.length)
          : 0,
      count:   r.avaliados,
      batidas: r.conformes,
    })).sort((a, b) => b.value - a.value);
  }, [data.metasPorProduto]);

  return (
    <section>
      {/* Header com filtro */}
      <div className="goals-header">
        <div className="section-anchor" style={{ margin: 0 }}>
          <h2>Ranking de Resultados (Metas Batidas)</h2>
        </div>
        <div className="prod-select-wrap">
          <select className="prod-select" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
            <option value="all">Todos os produtos</option>
            {produtos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={13} className="select-icon"/>
        </div>
      </div>

      {/* Gráficos */}
      <div className="goals-top-grid">
        {/* Ranking por consultor */}
        <div className="card">
          <p className="card-sub">Batimento de Meta por Consultor</p>
          <div style={{ height: 300, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consultantRanking} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 600 }}/>
                <YAxis domain={[0,100]} axisLine={false} tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                  tickFormatter={v=>`${v}%`} width={35}/>
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                  formatter={(v: any, _: any, props: any) => [
                    `${v}% (${props.payload.batidas}/${props.payload.total})`, 'Meta batida',
                  ]}/>
                <Bar dataKey="pct" radius={[6,6,0,0]} barSize={40}>
                  {consultantRanking.map((e, i) => (
                    <Cell key={i} fill={getSemaphorColor(e.pct)} fillOpacity={0.85}/>
                  ))}
                  <LabelList dataKey="pct" position="top" fill={COLORS.textMain}
                    formatter={(v: any) => `${(v||0).toFixed(0)}%`}
                    style={{ fontSize: 11, fontWeight: 700 }}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por produto */}
        <div className="card product-card">
          <p className="card-sub">% de Clientes com Meta Batida por Produto</p>
          {productChartData.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 20 }}>Sem dados para este período.</p>
          ) : (
            <div className="prod-list">
              {productChartData.map((p, i) => (
                <div key={i} className="prod-row">
                  <div className="prod-info">
                    <span className="p-name">{p.name}</span>
                    <span className="p-count">{p.batidas}/{p.count} clientes</span>
                  </div>
                  <span className="p-val" style={{ color: getSemaphorColor(p.value) }}>{p.value}%</span>
                  <div className="p-track">
                    <div className="p-fill" style={{ width:`${p.value}%`, background: getSemaphorColor(p.value) }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabela ranking */}
      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-sub" style={{ marginBottom: 20 }}>Ranking de Metas — Posição por Consultor</p>
        <table className="goals-table">
          <thead>
            <tr>
              <th>Pos</th><th>Consultor</th><th>Metas Batidas</th><th>Total</th>
              <th style={{ textAlign: 'right' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {consultantRanking.map((r, i) => (
              <tr key={i} className="t-row">
                <td className="t-pos">#{i+1}</td>
                <td className="t-name">{r.name}</td>
                <td><span style={{ color: getSemaphorColor(r.pct), fontWeight: 700 }}>{r.batidas}</span></td>
                <td style={{ color: COLORS.textMuted }}>{r.total}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`s-pill ${r.pct>=85?'pos':r.pct>=70?'med':'neg'}`}>{r.pct}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Listagem detalhada */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="detail-head">
          <p className="card-sub" style={{ margin: 0 }}>Listagem Detalhada de Clientes</p>
          <div className="legend">
            <span className="leg"><i className="dot" style={{ background: COLORS.verde }}/> Bateu</span>
            <span className="leg"><i className="dot" style={{ background: COLORS.vermelho }}/> Não Bateu</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="goals-table">
            <thead>
              <tr><th>Cliente</th><th>Produto</th><th>Consultor</th><th>Projetado</th><th>Realizado</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(data.currentGoals as any[]).map((g, i) => (
                <tr key={i} className="t-row">
                  <td className="t-name">{g.cliente_nome ?? `Cliente ${i+1}`}</td>
                  <td><span className="tag-prod">{g.produto ?? '—'}</span></td>
                  <td style={{ color: COLORS.textMuted, fontSize: 12 }}>{g.consultor_nome ?? '—'}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>R$ {(g.meta_projetada ?? 0).toLocaleString()}</td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: g.bateu_meta ? COLORS.verde : COLORS.vermelho }}>
                    R$ {(g.meta_realizada ?? 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`s-pill ${g.bateu_meta ? 'pos' : 'neg'}`}>
                      {g.bateu_meta ? 'Meta Batida' : 'Abaixo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .goals-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
        .prod-select-wrap { position: relative; display: flex; align-items: center; }
        .prod-select {
          appearance: none; background: #111827; border: 1px solid #1f2d40;
          border-radius: 8px; color: #94a3b8; font-family: 'Outfit', sans-serif;
          font-size: 13px; padding: 7px 32px 7px 12px; cursor: pointer; outline: none;
          transition: border-color 0.15s;
        }
        .prod-select:hover { border-color: #FC5400; }
        .select-icon { position: absolute; right: 10px; color: #475569; pointer-events: none; }

        .goals-top-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
        .card-sub { font-size: 11px; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

        .product-card { padding: 24px; }
        .prod-list { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
        .prod-row { display: flex; align-items: center; gap: 12px; }
        .prod-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
        .p-name { font-size: 13px; font-weight: 600; color: #94a3b8; }
        .p-count { font-size: 10px; color: #475569; }
        .p-val { font-size: 15px; font-weight: 800; width: 42px; text-align: right; flex-shrink: 0; }
        .p-track { width: 38%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 99px; overflow: hidden; flex-shrink: 0; }
        .p-fill { height: 100%; border-radius: 99px; transition: width 0.8s ease; }

        .goals-table { width: 100%; border-collapse: collapse; }
        .goals-table th {
          text-align: left; padding: 10px 12px; color: #334155;
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
          border-bottom: 1px solid #1f2d40; font-weight: 700;
        }
        .goals-table td { padding: 12px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; }
        .t-row:hover { background: rgba(255,255,255,0.015); }
        .t-row:last-child td { border-bottom: none; }
        .t-pos { font-size: 11px; color: #334155; font-weight: 700; width: 36px; }
        .t-name { font-weight: 600; color: #f1f5f9; }
        .tag-prod { font-size: 11px; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 99px; color: #94a3b8; }

        .s-pill { padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
        .s-pill.pos { background: rgba(16,185,129,0.12); color: #10b981; }
        .s-pill.med { background: rgba(252,84,0,0.12); color: #FC5400; }
        .s-pill.neg { background: rgba(239,68,68,0.12); color: #ef4444; }

        .detail-head { display: flex; align-items: center; justify-content: space-between; }
        .legend { display: flex; gap: 14px; }
        .leg { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; }
        .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

        @media (max-width: 1200px) { .goals-top-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
