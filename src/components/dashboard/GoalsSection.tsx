'use client';

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid } from 'recharts';
import { DashboardData, COLORS, getSemaphorColor } from '@/types/dashboard';
import { useDashboard } from '@/context/DashboardContext';

export default function GoalsSection({ data, filterProducts }: { data: DashboardData; filterProducts: string[] }) {
  const { consultores } = useDashboard();

  // ── Filtro de produto para o ranking ──────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Produtos disponíveis — extraídos das perguntas de auditoria
  const produtos = useMemo(() => {
    const set = new Set<string>();
    (data.metasPorProduto as any[]).forEach(v => { if (v.produto) set.add(v.produto); });
    return Array.from(set).sort();
  }, [data.metasPorProduto]);

  // ── 1. Ranking por consultor — dados reais da pergunta de auditoria,
  //       filtrado pelo produto selecionado
  const consultantRanking = useMemo(() => {
    const filtered = (data.metasPorProduto as any[]).filter(v =>
      selectedProduct === 'all' || v.produto === selectedProduct
    );
    // Agrupa por consultor — usa nota_pct (média) ou qtd quando disponível
    const map: Record<string, { name: string; soma: number; count: number; qtd_conformes: number; qtd_avaliados: number }> = {};
    filtered.forEach(v => {
      const nome = consultores.find(c => c.id === v.consultor_id)?.nome ?? 'Consultor';
      if (!map[v.consultor_id]) map[v.consultor_id] = { name: nome, soma: 0, count: 0, qtd_conformes: 0, qtd_avaliados: 0 };
      map[v.consultor_id].soma          += v.nota_pct      ?? 0;
      map[v.consultor_id].count         += 1;
      map[v.consultor_id].qtd_conformes += v.qtd_conformes ?? 0;
      map[v.consultor_id].qtd_avaliados += v.qtd_avaliados ?? 0;
    });
    return Object.values(map)
      .map(r => ({
        name:    r.name,
        batidas: r.qtd_conformes,
        total:   r.qtd_avaliados,
        pct:     r.qtd_avaliados > 0
          ? Math.round((r.qtd_conformes / r.qtd_avaliados) * 100)
          : Math.round(r.soma / (r.count || 1)),
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [data.metasPorProduto, selectedProduct, consultores]);

  // ── 2. Meta de clientes por produto — dados da pergunta de auditoria:
  //       "Quantos % dos clientes estão com meta batida da operação? (Aliança Pro)"
  const productChartData = useMemo(() => {
    const map: Record<string, { conformes: number; avaliados: number; notas: number[] }> = {};
    (data.metasPorProduto as any[]).forEach(v => {
      const prod = v.produto ?? 'Sem produto';
      if (!map[prod]) map[prod] = { conformes: 0, avaliados: 0, notas: [] };
      map[prod].conformes += v.qtd_conformes ?? 0;
      map[prod].avaliados += v.qtd_avaliados ?? 0;
      if (v.nota_pct != null) map[prod].notas.push(v.nota_pct);
    });
    return Object.entries(map)
      .map(([name, r]) => ({
        name,
        value: r.avaliados > 0
          ? Math.round((r.conformes / r.avaliados) * 100)
          : r.notas.length > 0
            ? Math.round(r.notas.reduce((a, b) => a + b, 0) / r.notas.length)
            : 0,
        count:   r.avaliados,
        batidas: r.conformes,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.metasPorProduto]);

  return (
    <section className="section-block">
      <div className="section-anchor">
        <h2>Ranking de Resultados (Metas Batidas)</h2>
      </div>

      {/* ── Gráficos superiores ── */}
      <div className="goals-layout-grid">

        {/* Ranking por consultor com filtro */}
        <div className="card ranking-card">
          <div className="ranking-header">
            <h3 className="card-subtitle" style={{ marginBottom: 0 }}>Batimento de Meta por Consultor</h3>
            <select
              className="prod-filter"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="all">Todos os produtos</option>
              {produtos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="chart-box" style={{ marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consultantRanking} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 700 }} />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(v) => `${v}%`}
                  width={35}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: COLORS.cardBg, borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}` }}
                  formatter={(v: any, _: any, props: any) => [
                    `${v}% (${props.payload.batidas}/${props.payload.total})`,
                    'Meta batida'
                  ]}
                />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]} barSize={40}>
                  {consultantRanking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSemaphorColor(entry.pct)} fillOpacity={0.8} />
                  ))}
                  <LabelList dataKey="pct" position="top" fill={COLORS.textMain} formatter={(v: any) => `${(v || 0).toFixed(0)}%`} style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-bebas)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meta dos clientes por produto */}
        <div className="card product-card">
          <h3 className="card-subtitle">% de Clientes com Meta Batida por Produto</h3>
          <div className="product-list">
            {productChartData.length === 0 ? (
              <p style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>Sem dados de metas para este período.</p>
            ) : (
              productChartData.map((p, i) => (
                <div key={i} className="prod-row">
                  <div className="prod-info">
                    <span className="p-name">{p.name}</span>
                    <span className="p-count">{p.batidas}/{p.count} clientes</span>
                  </div>
                  <span className="p-val" style={{ color: getSemaphorColor(p.value) }}>{p.value}%</span>
                  <div className="p-bar-bg">
                    <div className="p-bar-fill" style={{ width: `${p.value}%`, background: getSemaphorColor(p.value) }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Ranking de metas tabela ── */}
      <div className="card ranking-table-card" style={{ marginTop: '20px' }}>
        <div className="ranking-header" style={{ marginBottom: '24px' }}>
          <h3 className="card-subtitle" style={{ marginBottom: 0 }}>Ranking de Metas — Posição por Consultor</h3>
          <select
            className="prod-filter"
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
          >
            <option value="all">Todos os produtos</option>
            {produtos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <table className="goals-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Consultor</th>
              <th>Metas Batidas</th>
              <th>Total</th>
              <th style={{ textAlign: 'right' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {consultantRanking.map((r, i) => (
              <tr key={i} className="goal-row">
                <td className="rank-num">#{i + 1}</td>
                <td className="c-name">{r.name}</td>
                <td>
                  <span style={{ color: getSemaphorColor(r.pct), fontWeight: 700 }}>{r.batidas}</span>
                </td>
                <td style={{ color: COLORS.textMuted }}>{r.total}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`status-pill ${r.pct >= 85 ? 'pos' : r.pct >= 70 ? 'med' : 'neg'}`}>
                    {r.pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Listagem detalhada de clientes ── */}
      <div className="card detailed-table-card" style={{ marginTop: '20px' }}>
        <div className="table-header">
          <h3 className="card-subtitle" style={{ marginBottom: 0 }}>Listagem Detalhada de Clientes</h3>
          <div className="table-legend">
            <span className="leg-item"><i className="dot verde" /> Bateu</span>
            <span className="leg-item"><i className="dot vermelho" /> Não Bateu</span>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="goals-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Consultor</th>
                <th>Projetado</th>
                <th>Realizado</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.currentGoals as any[]).map((g, i) => (
                <tr key={i} className="goal-row">
                  <td className="c-name">{g.cliente_nome ?? `Cliente ${i + 1}`}</td>
                  <td><span className="tag-prod">{g.produto ?? '—'}</span></td>
                  <td className="c-consul">{g.consultor_nome ?? '—'}</td>
                  <td className="c-money">R$ {(g.meta_projetada ?? 0).toLocaleString()}</td>
                  <td className="c-money" style={{ color: g.bateu_meta ? COLORS.verde : COLORS.vermelho }}>R$ {(g.meta_realizada ?? 0).toLocaleString()}</td>
                  <td className="c-status">
                    <span className={`status-pill ${g.bateu_meta ? 'pos' : 'neg'}`}>
                      {g.bateu_meta ? 'Meta Batida' : 'Abaixo da Meta'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .goals-layout-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        .ranking-card, .product-card, .detailed-table-card, .ranking-table-card {
          background: var(--glass-bg); backdrop-filter: blur(10px); padding: 30px;
        }
        .card-subtitle { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .chart-box { height: 320px; }

        .ranking-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .prod-filter {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 6px 10px;
          cursor: pointer;
          outline: none;
          font-family: var(--font-body);
        }
        .prod-filter:hover { border-color: var(--laranja-vorp); }

        .product-list { display: flex; flex-direction: column; gap: 20px; }
        .prod-row { display: flex; align-items: center; gap: 15px; }
        .prod-info { flex: 1; display: flex; flex-direction: column; }
        .p-name { font-weight: 700; color: var(--text-secondary); font-size: 0.9rem; }
        .p-count { font-size: 0.65rem; color: var(--text-muted); }
        .p-bar-bg { width: 40%; height: 6px; background: rgba(255,255,255,0.03); border-radius: 3px; overflow: hidden; }
        .p-bar-fill { height: 100%; transition: width 1s ease; }
        .p-val { width: 45px; text-align: right; font-family: var(--font-bebas); font-size: 1.2rem; font-weight: 800; }

        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .table-legend { display: flex; gap: 16px; }
        .leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .dot.verde { background: var(--status-verde); }
        .dot.vermelho { background: var(--status-vermelho); }

        .table-wrapper { overflow-x: auto; }
        .goals-table { width: 100%; border-collapse: collapse; }
        .goals-table th { text-align: left; padding: 12px; color: var(--text-muted); text-transform: uppercase; font-size: 0.65rem; border-bottom: 1px solid var(--card-border); }
        .goals-table td { padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 0.85rem; }
        .goal-row:hover { background: rgba(255,255,255,0.01); }

        .rank-num { font-family: var(--font-bebas); color: var(--text-muted); font-size: 1.1rem; width: 40px; }
        .c-name { font-weight: 600; color: var(--text-main); }
        .tag-prod { font-size: 0.65rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; color: var(--text-secondary); }
        .c-consul { color: var(--text-muted); }
        .c-money { font-weight: 500; }
        .status-pill { padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .status-pill.pos { background: rgba(30, 144, 128, 0.1); color: var(--status-verde); }
        .status-pill.med { background: rgba(252, 84, 0, 0.1); color: var(--laranja-vorp); }
        .status-pill.neg { background: rgba(176, 48, 48, 0.1); color: var(--status-vermelho); }

        @media (max-width: 1200px) { .goals-layout-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
