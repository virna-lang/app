'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Building2, Users, AlertCircle, CheckCircle2, RefreshCw, ChevronDown, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVorpProjetosAtivos, setTrativaCS } from '@/lib/api';
import { COLORS } from '@/types/dashboard';
import type { VorpProjetoRow } from '@/lib/supabase';

interface Props {
  consultorNome?: string;
}

export default function VorpSection({ consultorNome }: Props) {
  const queryClient = useQueryClient();
  const queryKey    = ['vorpProjetos', consultorNome ?? 'all'];

  const { data: projetos = [], isPending: loading } = useQuery<VorpProjetoRow[]>({
    queryKey,
    queryFn: () => {
      const nome = consultorNome === 'all' ? undefined : consultorNome;
      return getVorpProjetosAtivos(nome) as Promise<VorpProjetoRow[]>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [salvando, setSalvando] = useState<string | null>(null);

  // Filtros multi-select
  const [filtroProjetos,    setFiltroProjetos]    = useState<string[]>([]);
  const [filtroProdutos,    setFiltroProdutos]    = useState<string[]>([]);
  const [filtroConsultores, setFiltroConsultores] = useState<string[]>([]);
  // Filtro status (single-select)
  const [filtroCS, setFiltroCS] = useState<'todos' | 'auditaveis' | 'tratativa'>('todos');

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (key: string) =>
    setOpenDropdown(prev => (prev === key ? null : key));

  // Fecha ao clicar fora
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const carregar = () => queryClient.invalidateQueries({ queryKey });

  // Opções únicas derivadas dos dados
  const opcoesProjetos = useMemo(() =>
    [...new Set(projetos.map(p => p.nome))].sort(), [projetos]);

  const opcoesProdutos = useMemo(() =>
    [...new Set(projetos.map(p => p.produto_nome).filter(Boolean) as string[])].sort(), [projetos]);

  const opcoesConsultores = useMemo(() =>
    [...new Set(projetos.map(p => p.colaborador_nome).filter(Boolean) as string[])].sort(), [projetos]);

  // Helpers de toggle multi-select
  const toggleItem = (set: string[], setFn: (v: string[]) => void, item: string) =>
    setFn(set.includes(item) ? set.filter(x => x !== item) : [...set, item]);

  // Toggle Tratativa CS com optimistic update
  const toggleCS = async (projeto: VorpProjetoRow) => {
    setSalvando(projeto.vorp_id);
    // Atualiza o cache imediatamente (sem esperar o servidor)
    queryClient.setQueryData<VorpProjetoRow[]>(queryKey, prev =>
      prev?.map(p => p.vorp_id === projeto.vorp_id ? { ...p, tratativa_cs: !p.tratativa_cs } : p)
    );
    try {
      await setTrativaCS(projeto.vorp_id, !projeto.tratativa_cs);
    } catch {
      // Reverte se der erro
      queryClient.invalidateQueries({ queryKey });
    } finally {
      setSalvando(null);
    }
  };

  // Filtragem
  const filtrados = projetos.filter(p => {
    const matchProjeto   = filtroProjetos.length === 0    || filtroProjetos.includes(p.nome);
    const matchProduto   = filtroProdutos.length === 0    || filtroProdutos.includes(p.produto_nome ?? '');
    const matchConsultor = filtroConsultores.length === 0 || filtroConsultores.includes(p.colaborador_nome ?? '');
    const matchCS =
      filtroCS === 'todos' ||
      (filtroCS === 'tratativa'  && p.tratativa_cs) ||
      (filtroCS === 'auditaveis' && !p.tratativa_cs);
    return matchProjeto && matchProduto && matchConsultor && matchCS;
  });

  const totalAtivos     = projetos.length;
  const totalTratativa  = projetos.filter(p => p.tratativa_cs).length;
  const totalAuditaveis = totalAtivos - totalTratativa;

  const temFiltroAtivo =
    filtroProjetos.length > 0 || filtroProdutos.length > 0 ||
    filtroConsultores.length > 0 || filtroCS !== 'todos';

  const limparFiltros = () => {
    setFiltroProjetos([]); setFiltroProdutos([]);
    setFiltroConsultores([]); setFiltroCS('todos');
  };

  // Label de exibição para multi-select
  const labelMulti = (selecionados: string[], totalLabel: string) =>
    selecionados.length === 0
      ? totalLabel
      : selecionados.length === 1
      ? selecionados[0]
      : `${selecionados.length} selecionados`;

  return (
    <div className="vorp-section section-block" ref={containerRef}>
      {/* ── Cabeçalho ─────────────────────────── */}
      <div className="section-anchor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2>Projetos Ativos — Vorp System</h2>
        <button onClick={carregar} className="btn-icon" disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* ── KPI cards ─────────────────────────── */}
      <div className="kpi-row">
        <div className="card kpi-card">
          <Building2 size={20} color={COLORS.primary} />
          <div>
            <p className="kpi-val">{totalAtivos}</p>
            <p className="kpi-label">Projetos Ativos</p>
          </div>
        </div>
        <div className="card kpi-card">
          <CheckCircle2 size={20} color={COLORS.verde} />
          <div>
            <p className="kpi-val" style={{ color: COLORS.verde }}>{totalAuditaveis}</p>
            <p className="kpi-label">Auditáveis</p>
          </div>
        </div>
        <div className="card kpi-card">
          <AlertCircle size={20} color={COLORS.amarelo} />
          <div>
            <p className="kpi-val" style={{ color: COLORS.amarelo }}>{totalTratativa}</p>
            <p className="kpi-label">Tratativa CS</p>
          </div>
        </div>
        <div className="card kpi-card">
          <Users size={20} color={COLORS.textMuted} />
          <div>
            <p className="kpi-val">
              {totalAtivos > 0 ? Math.round((totalAuditaveis / totalAtivos) * 100) : 0}%
            </p>
            <p className="kpi-label">Cobertura Auditoria</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────── */}
      <div className="filters-container">

        {/* Projeto — multi */}
        <div className="filter-group">
          <label>Projeto</label>
          <div className="select-custom" onClick={() => toggleDropdown('projeto')}>
            <span>{labelMulti(filtroProjetos, 'Todos os projetos')}</span>
            <ChevronDown size={14} />
            {openDropdown === 'projeto' && (
              <div className="dropdown-menu multi-menu" onClick={e => e.stopPropagation()}>
                {opcoesProjetos.map(n => (
                  <label key={n} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filtroProjetos.includes(n)}
                      onChange={() => toggleItem(filtroProjetos, setFiltroProjetos, n)}
                    />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Produto — multi */}
        <div className="filter-group">
          <label>Produto</label>
          <div className="select-custom" onClick={() => toggleDropdown('produto')}>
            <span>{labelMulti(filtroProdutos, 'Todos os produtos')}</span>
            <ChevronDown size={14} />
            {openDropdown === 'produto' && (
              <div className="dropdown-menu multi-menu" onClick={e => e.stopPropagation()}>
                {opcoesProdutos.map(n => (
                  <label key={n} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filtroProdutos.includes(n)}
                      onChange={() => toggleItem(filtroProdutos, setFiltroProdutos, n)}
                    />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Consultor — multi */}
        <div className="filter-group">
          <label>Consultor</label>
          <div className="select-custom" onClick={() => toggleDropdown('consultor')}>
            <span>{labelMulti(filtroConsultores, 'Todos os consultores')}</span>
            <ChevronDown size={14} />
            {openDropdown === 'consultor' && (
              <div className="dropdown-menu multi-menu" onClick={e => e.stopPropagation()}>
                {opcoesConsultores.map(n => (
                  <label key={n} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filtroConsultores.includes(n)}
                      onChange={() => toggleItem(filtroConsultores, setFiltroConsultores, n)}
                    />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status — single */}
        <div className="filter-group">
          <label>Status</label>
          <div className="select-custom" onClick={() => toggleDropdown('status')}>
            <span>
              {filtroCS === 'todos'      && 'Todos'}
              {filtroCS === 'auditaveis' && `Auditáveis (${totalAuditaveis})`}
              {filtroCS === 'tratativa'  && `Tratativa CS (${totalTratativa})`}
            </span>
            <ChevronDown size={14} />
            {openDropdown === 'status' && (
              <div className="dropdown-menu">
                {(['todos', 'auditaveis', 'tratativa'] as const).map(f => (
                  <div key={f} className="dropdown-item" onClick={e => { e.stopPropagation(); setFiltroCS(f); setOpenDropdown(null); }}>
                    {f === 'todos'      && 'Todos'}
                    {f === 'auditaveis' && `Auditáveis (${totalAuditaveis})`}
                    {f === 'tratativa'  && `Tratativa CS (${totalTratativa})`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {temFiltroAtivo && (
          <button className="clear-btn" onClick={limparFiltros}>
            <X size={14} /> <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      {/* ── Tabela ────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>
          Carregando projetos...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>
          Nenhum projeto encontrado.
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="vorp-table">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Consultor</th>
                <th>Produto</th>
                <th style={{ textAlign: 'right' }}>FEE</th>
                <th style={{ textAlign: 'center' }}>Tratativa CS</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.vorp_id} className={p.tratativa_cs ? 'row-tratativa' : ''}>
                  <td className="td-nome">{p.nome}</td>
                  <td className="td-muted">{p.colaborador_nome ?? '—'}</td>
                  <td>
                    {p.produto_nome && <span className="badge-produto">{p.produto_nome}</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {p.fee != null
                      ? p.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                      : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggleCS(p)}
                      disabled={salvando === p.vorp_id}
                      className={`toggle-cs ${p.tratativa_cs ? 'toggle-on' : 'toggle-off'}`}
                      title={p.tratativa_cs ? 'Remover da Tratativa CS' : 'Marcar como Tratativa CS'}
                    >
                      {salvando === p.vorp_id ? '...' : p.tratativa_cs ? 'Tratativa CS' : 'Auditável'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-footer">{filtrados.length} de {projetos.length} projetos</p>
        </div>
      )}

      <style jsx>{`
        .vorp-section { display: flex; flex-direction: column; gap: 20px; }

        /* KPIs */
        .kpi-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
        .kpi-card { display: flex; align-items: center; gap: 14px; padding: 20px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .kpi-val { font-family: var(--font-bebas); font-size: 2.2rem; line-height: 1; color: var(--text-main); }
        .kpi-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

        /* Filtros — padrão DashboardFilters */
        .filters-container { display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap; }

        .filter-group { display: flex; flex-direction: column; gap: 4px; }
        .filter-group label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 700; }

        .select-custom {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          padding: 8px 16px;
          border-radius: 6px;
          min-width: 160px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          position: relative;
          color: var(--text-main);
          transition: border-color 0.2s;
          user-select: none;
        }
        .select-custom:hover { border-color: var(--laranja-vorp); }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 100%;
          max-height: 260px;
          overflow-y: auto;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          z-index: 100;
          animation: slideDown 0.2s ease-out;
        }
        .multi-menu { min-width: 200px; padding: 8px; }

        .dropdown-item { padding: 10px 16px; font-size: 0.85rem; cursor: pointer; transition: background 0.15s; white-space: nowrap; color: var(--text-main); }
        .dropdown-item:hover { background: rgba(252, 84, 0, 0.1); color: var(--laranja-vorp); }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
          font-size: 0.85rem;
          color: var(--text-main);
          white-space: nowrap;
        }
        .checkbox-item:hover { background: rgba(255,255,255,0.03); }
        .checkbox-item input { accent-color: var(--laranja-vorp); cursor: pointer; }

        .clear-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
          margin-bottom: 1px;
        }
        .clear-btn:hover { color: var(--status-vermelho, #ef4444); background: rgba(176,48,48,0.05); }

        /* Botão atualizar */
        .btn-icon { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--card-border); background: transparent; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
        .btn-icon:hover { border-color: var(--laranja-vorp); color: var(--laranja-vorp); }

        /* Tabela */
        .table-wrap { padding: 0; overflow: hidden; }
        .vorp-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .vorp-table th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--card-border); white-space: nowrap; }
        .vorp-table td { padding: 11px 16px; border-bottom: 1px solid color-mix(in srgb, var(--card-border) 50%, transparent); color: var(--text-main); vertical-align: middle; }
        .vorp-table tr:last-child td { border-bottom: none; }
        .vorp-table tbody tr:hover { background: color-mix(in srgb, var(--laranja-vorp) 4%, transparent); }

        .row-tratativa td { opacity: 0.55; }
        .row-tratativa:hover td { opacity: 0.75; }
        .td-nome { font-weight: 600; max-width: 280px; }
        .td-muted { color: var(--text-muted); }

        .badge-produto { display: inline-block; padding: 3px 10px; border-radius: 12px; background: color-mix(in srgb, var(--laranja-vorp) 12%, transparent); color: var(--laranja-vorp); font-size: 0.72rem; font-weight: 700; white-space: nowrap; }

        .toggle-cs { padding: 4px 12px; border-radius: 12px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .toggle-off { background: color-mix(in srgb, var(--verde) 10%, transparent); border: 1px solid color-mix(in srgb, var(--verde) 40%, transparent); color: var(--verde, #22c55e); }
        .toggle-off:hover { background: color-mix(in srgb, #f59e0b 12%, transparent); border-color: #f59e0b; color: #f59e0b; }
        .toggle-on { background: color-mix(in srgb, #f59e0b 12%, transparent); border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent); color: #f59e0b; }
        .toggle-on:hover { background: color-mix(in srgb, var(--verde) 10%, transparent); border-color: color-mix(in srgb, var(--verde) 40%, transparent); color: var(--verde, #22c55e); }
        .toggle-cs:disabled { opacity: 0.5; cursor: wait; }

        .table-footer { padding: 10px 16px; font-size: 0.75rem; color: var(--text-muted); text-align: right; border-top: 1px solid var(--card-border); }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
