'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts';
import { DashboardData, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';
import { ChevronDown } from 'lucide-react';

const T = {
  bg: '#0f1117', bgDeep: '#0a0b0e', border: '#1a1d24',
  orange: '#ff5c1a', green: '#1d9e75', red: '#e05555',
  text: '#e2e4e9', textSub: '#9aa0b0', textDim: '#3f4455',
  mono: "'DM Mono', monospace",
};

const tooltipStyle = { background: T.bgDeep, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 };

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
      selectedProduct === 'all' || v.produto === selectedProduct,
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

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px', ...style }}>
      {children}
    </div>
  );

  const pillStyle = (pct: number): React.CSSProperties => {
    const c = getSemaphorColor(pct);
    return { padding: '3px 9px', borderRadius: 5, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: `${c}18`, color: c };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header com filtro */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim }}>
          Ranking de Resultados (Metas Batidas)
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            style={{
              appearance: 'none', background: T.bg,
              border: `1px solid ${T.border}`, borderRadius: 7,
              color: T.textSub, fontSize: 12, padding: '6px 28px 6px 10px',
              cursor: 'pointer', outline: 'none', transition: 'border-color 0.15s',
            }}>
            <option value="all">Todos os produtos</option>
            {produtos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, color: T.textDim, pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Gráfico barras + Produtos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }} className="goals-top-grid">
        {card(
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim, marginBottom: 16 }}>
              Batimento de Meta por Consultor
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantRanking} margin={{ top: 18, right: 24, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: T.textDim, fontSize: 10, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                    tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={v => `${v}%`} width={34} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={tooltipStyle}
                    formatter={(v: any, _: any, props: any) => [
                      `${v}% (${props.payload.batidas}/${props.payload.total})`, 'Meta batida',
                    ]} />
                  <Bar dataKey="pct" radius={[5, 5, 0, 0]} barSize={36}>
                    {consultantRanking.map((e, i) => (
                      <Cell key={i} fill={getSemaphorColor(e.pct)} fillOpacity={0.85} />
                    ))}
                    <LabelList dataKey="pct" position="top"
                      formatter={(v: any) => `${(v || 0).toFixed(0)}%`}
                      style={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {card(
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim, marginBottom: 16 }}>
              % de Clientes com Meta Batida por Produto
            </div>
            {productChartData.length === 0 ? (
              <p style={{ color: T.textDim, fontSize: 13, marginTop: 16 }}>Sem dados para este período.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {productChartData.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 1 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: T.textDim }}>{p.batidas}/{p.count} clientes</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, width: 38, textAlign: 'right', color: getSemaphorColor(p.value), fontFamily: T.mono, flexShrink: 0 }}>
                      {p.value}%
                    </span>
                    <div style={{ width: '35%', height: 4, background: T.border, borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ width: `${p.value}%`, height: '100%', background: getSemaphorColor(p.value), borderRadius: 99, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Ranking tabela */}
      {card(
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim, marginBottom: 16 }}>
            Ranking de Metas — Posição por Consultor
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Pos', 'Consultor', 'Metas Batidas', 'Total', '%'].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 4 ? 'right' : 'left', padding: '8px 10px',
                    color: T.textDim, fontSize: 9, textTransform: 'uppercase',
                    letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}`, fontWeight: 700,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consultantRanking.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <td style={{ padding: '10px 10px', fontSize: 10, color: T.textDim, fontWeight: 700 }}>#{i + 1}</td>
                  <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 600, color: T.text }}>{r.name}</td>
                  <td style={{ padding: '10px 10px', fontSize: 13, fontWeight: 700, color: getSemaphorColor(r.pct), fontFamily: T.mono }}>{r.batidas}</td>
                  <td style={{ padding: '10px 10px', fontSize: 12, color: T.textDim }}>{r.total}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                    <span style={pillStyle(r.pct)}>{r.pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Listagem detalhada */}
      {card(
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim }}>
              Listagem Detalhada de Clientes
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ label: 'Bateu', color: T.green }, { label: 'Não Bateu', color: T.red }].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.textDim, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                  <i style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, display: 'block' }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Cliente', 'Produto', 'Consultor', 'Projetado', 'Realizado', 'Status'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 10px',
                      color: T.textDim, fontSize: 9, textTransform: 'uppercase',
                      letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}`, fontWeight: 700,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.currentGoals as any[]).map((g, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 600, color: T.text }}>{g.cliente_nome ?? `Cliente ${i + 1}`}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 99, color: T.textSub }}>
                        {g.produto ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', fontSize: 11, color: T.textDim }}>{g.consultor_nome ?? '—'}</td>
                    <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 500, color: T.textSub }}>R$ {(g.meta_projetada ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 700, color: g.bateu_meta ? T.green : T.red }}>
                      R$ {(g.meta_realizada ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={pillStyle(g.bateu_meta ? 100 : 0)}>
                        {g.bateu_meta ? 'Meta Batida' : 'Abaixo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx>{`
        @media (max-width: 1200px) { .goals-top-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
