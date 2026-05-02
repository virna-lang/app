'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Users, AlertCircle, CheckCircle2, Search, RefreshCw } from 'lucide-react';
import { getVorpProjetosAtivos, getConsultoresParaFiltro, setTrativaCS } from '@/lib/api';
import { COLORS } from '@/types/dashboard';
import type { VorpProjetoRow } from '@/lib/supabase';
import FilterCombobox from '@/components/cadastro/FilterCombobox';

type StatusFiltro = 'Ativo' | 'Churn' | 'Concluído' | 'todos';

function normalizeText(value?: string | number | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function fieldMatches(value: unknown, filter: string) {
  if (!filter || filter === 'all' || filter === 'todos') return true;
  return normalizeText(value as string | number | null).includes(normalizeText(filter));
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(
    values
      .map(value => value?.trim())
      .filter((value): value is string => Boolean(value)),
  )).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

interface Props {
  vorpColaboradorId?: string | null;
}

export default function VorpSection({ vorpColaboradorId }: Props) {
  const [projetos, setProjetos]   = useState<VorpProjetoRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busca, setBusca]         = useState('');
  const [salvando, setSalvando]   = useState<string | null>(null);
  const [filtroCS, setFiltroCS]   = useState<'todos' | 'auditaveis' | 'tratativa'>('todos');

  // ── Novos filtros ──────────────────────────────────────
  const isAdminView = !vorpColaboradorId || vorpColaboradorId === 'all';

  const [filtroConsultor, setFiltroConsultor] = useState('all');  // vorp_colaborador_id | 'all'
  const [filtroProjeto,   setFiltroProjeto]   = useState('all');
  const [filtroProduto,   setFiltroProduto]   = useState('all');  // produto_nome | 'all'
  const [filtroStatus,    setFiltroStatus]    = useState<StatusFiltro>('Ativo');

  const [consultoresOpcoes, setConsultoresOpcoes] = useState<
    { vorp_colaborador_id: string; nome: string }[]
  >([]);

  // Opções de produto derivadas dos dados carregados (sem chamada extra)
  const produtosOpcoes = useMemo(
    () =>
      [...new Set(projetos.map(p => p.produto_nome).filter(Boolean) as string[])].sort(
        (a, b) => a.localeCompare(b, 'pt-BR'),
    ),
    [projetos],
  );
  const projetosOpcoes = useMemo(
    () => uniqueOptions(projetos.map(p => p.nome)),
    [projetos],
  );

  // Carrega opções de consultor ao montar (somente na visão admin)
  useEffect(() => {
    if (!isAdminView) return;
    getConsultoresParaFiltro()
      .then(setConsultoresOpcoes)
      .catch(console.error);
  }, [isAdminView]);

  // ── Fetch principal ────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      // Se a prop já traz um consultor específico, esse tem precedência.
      // Se estamos na visão admin, usa o filtro local.
      const colabId = isAdminView
        ? (filtroConsultor === 'all' ? undefined : filtroConsultor)
        : vorpColaboradorId;

      const statusParam: string | null =
        filtroStatus === 'todos' ? null : filtroStatus;

      const data = await getVorpProjetosAtivos(colabId, statusParam);
      setProjetos(data as VorpProjetoRow[]);
    } finally {
      setLoading(false);
    }
  }, [vorpColaboradorId, isAdminView, filtroConsultor, filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  // ── Toggle Tratativa CS ────────────────────────────────
  const toggleCS = async (projeto: VorpProjetoRow) => {
    setSalvando(projeto.vorp_id);
    try {
      await setTrativaCS(projeto.vorp_id, !projeto.tratativa_cs);
      setProjetos(prev =>
        prev.map(p =>
          p.vorp_id === projeto.vorp_id ? { ...p, tratativa_cs: !p.tratativa_cs } : p,
        ),
      );
    } finally {
      setSalvando(null);
    }
  };

  // ── Filtragem client-side ──────────────────────────────
  const filtrados = projetos.filter(p => {
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.colaborador_nome ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.produto_nome ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.status ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.canal ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      String(p.fee ?? '').toLowerCase().includes(busca.toLowerCase());

    const matchFiltroCS =
      filtroCS === 'todos' ||
      (filtroCS === 'tratativa'  && p.tratativa_cs) ||
      (filtroCS === 'auditaveis' && !p.tratativa_cs);

    const matchProduto =
      fieldMatches(p.produto_nome, filtroProduto);

    const matchProjeto =
      fieldMatches(p.nome, filtroProjeto);

    return matchBusca && matchFiltroCS && matchProduto && matchProjeto;
  });

  // ── KPIs sobre o conjunto carregado (após filtro de consultor/status) ──
  const totalAtivos     = projetos.length;
  const totalTratativa  = projetos.filter(p => p.tratativa_cs).length;
  const totalAuditaveis = totalAtivos - totalTratativa;

  // ── Helpers de UI ──────────────────────────────────────
  const temFiltroAtivo =
    filtroConsultor !== 'all' || filtroProjeto !== 'all' || filtroProduto !== 'all' || filtroStatus !== 'Ativo';

  const limparFiltros = () => {
    setFiltroConsultor('all');
    setFiltroProjeto('all');
    setFiltroProduto('all');
    setFiltroStatus('Ativo');
    setBusca('');
    setFiltroCS('todos');
  };

  return (
    <div className="vorp-section section-block">
      {/* ── Cabeçalho ───────────────────────────────────── */}
      <div className="section-anchor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2>Projetos — Vorp System</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {temFiltroAtivo && (
            <button onClick={limparFiltros} className="btn-icon btn-clear">
              Limpar filtros
            </button>
          )}
          <button
            onClick={carregar}
            className="btn-icon"
            title="Recarregar"
            style={{ opacity: loading ? 0.5 : 1 }}
            disabled={loading}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────── */}
      <div className="kpi-row">
        <div className="card kpi-card">
          <Building2 size={20} color={COLORS.primary} />
          <div>
            <p className="kpi-val">{totalAtivos}</p>
            <p className="kpi-label">
              {filtroStatus === 'todos' ? 'Total Projetos' :
               filtroStatus === 'Ativo' ? 'Projetos Ativos' : `Projetos ${filtroStatus}`}
            </p>
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

      {/* ── Filtros principais (consultor / produto / status) ── */}
      {isAdminView && (
        <div className="controles-row">
          <FilterCombobox
            label="Consultor"
            value={filtroConsultor}
            allValue="all"
            allLabel="Todos os consultores"
            allowCustom={false}
            options={consultoresOpcoes.map(c => ({ value: c.vorp_colaborador_id, label: c.nome }))}
            onChange={setFiltroConsultor}
          />

          <FilterCombobox
            label="Projeto"
            value={filtroProjeto}
            allValue="all"
            allLabel="Todos os projetos"
            options={projetosOpcoes}
            onChange={setFiltroProjeto}
          />

          <FilterCombobox
            label="Produto"
            value={filtroProduto}
            allValue="all"
            allLabel="Todos os produtos"
            options={produtosOpcoes}
            onChange={setFiltroProduto}
          />

          <FilterCombobox
            label="Status"
            value={filtroStatus}
            allValue="todos"
            allLabel="Todos os status"
            options={['Ativo', 'Churn', 'Concluído']}
            onChange={value => setFiltroStatus(value as StatusFiltro)}
          />

        </div>
      )}

      {/* ── Busca + chips Tratativa CS ───────────────────── */}
      <div className="controles-row">
        <div className="search-box">
          <Search size={14} color={COLORS.textMuted} />
          <input
            type="text"
            placeholder="Buscar projeto, consultor ou produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="filtro-chips">
          {(['todos', 'auditaveis', 'tratativa'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroCS(f)}
              className={`chip ${filtroCS === f ? 'chip-active' : ''}`}
            >
              {f === 'todos'      && 'Todos'}
              {f === 'auditaveis' && `Auditáveis (${totalAuditaveis})`}
              {f === 'tratativa'  && `Tratativa CS (${totalTratativa})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabela ──────────────────────────────────────── */}
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
                {filtroStatus !== 'Ativo' && <th>Status</th>}
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
                    {p.produto_nome && (
                      <span className="badge-produto">{p.produto_nome}</span>
                    )}
                  </td>
                  {filtroStatus !== 'Ativo' && (
                    <td>
                      <span className={`badge-status status-${(p.status ?? '').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s/g,'-')}`}>
                        {p.status ?? '—'}
                      </span>
                    </td>
                  )}
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
          <p className="table-footer">
            {filtrados.length} de {projetos.length} projetos
          </p>
        </div>
      )}

      <style jsx>{`
        .vorp-section { display: flex; flex-direction: column; gap: 20px; }

        .kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }
        .kpi-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
        }
        .kpi-val {
          font-family: var(--font-bebas);
          font-size: 2.2rem;
          line-height: 1;
          color: var(--text-main);
        }
        .kpi-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        /* ── Filtros ──────────────────────────────────── */
        .controles-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .filter-select-wrap :global(.select-arrow) {
          position: absolute;
          right: 10px;
          pointer-events: none;
          color: var(--text-muted);
        }
        .filter-select {
          appearance: none;
          background: var(--glass-bg);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 8px 32px 8px 14px;
          color: var(--text-main);
          font-size: 0.83rem;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
          min-width: 180px;
        }
        .filter-select:hover { border-color: rgba(252,84,0,0.4); }
        .filter-select:focus { border-color: rgba(252,84,0,0.6); }
        .filter-select option { background: #111827; color: var(--text-main); }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--glass-bg);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 8px 14px;
          flex: 1;
          min-width: 240px;
        }
        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-size: 0.85rem;
          width: 100%;
        }
        .search-box input::placeholder { color: var(--text-muted); }

        .filtro-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .chip:hover { border-color: var(--laranja-vorp); color: var(--laranja-vorp); }
        .chip-active { background: var(--laranja-vorp); border-color: var(--laranja-vorp); color: #fff; }

        /* ── Botões ───────────────────────────────────── */
        .btn-icon {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid var(--card-border);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-icon:hover { border-color: var(--laranja-vorp); color: var(--laranja-vorp); }
        .btn-clear {
          border-color: rgba(252,84,0,0.3);
          color: var(--laranja-vorp);
          font-size: 0.75rem;
        }
        .btn-clear:hover { background: rgba(252,84,0,0.08); }

        /* ── Tabela ───────────────────────────────────── */
        .table-wrap { padding: 0; overflow: hidden; }
        .vorp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.83rem;
        }
        .vorp-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--card-border);
          white-space: nowrap;
        }
        .vorp-table td {
          padding: 11px 16px;
          border-bottom: 1px solid color-mix(in srgb, var(--card-border) 50%, transparent);
          color: var(--text-main);
          vertical-align: middle;
        }
        .vorp-table tr:last-child td { border-bottom: none; }
        .vorp-table tbody tr:hover { background: color-mix(in srgb, var(--laranja-vorp) 4%, transparent); }

        .row-tratativa td { opacity: 0.55; }
        .row-tratativa:hover td { opacity: 0.75; }

        .td-nome { font-weight: 600; max-width: 280px; }
        .td-muted { color: var(--text-muted); }

        .badge-produto {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--laranja-vorp) 12%, transparent);
          color: var(--laranja-vorp);
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .badge-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .badge-status.status-ativo {
          background: color-mix(in srgb, var(--verde, #22c55e) 12%, transparent);
          color: var(--verde, #22c55e);
        }
        .badge-status.status-churn {
          background: color-mix(in srgb, #ef4444 12%, transparent);
          color: #ef4444;
        }
        .badge-status.status-concluido {
          background: color-mix(in srgb, #64748b 15%, transparent);
          color: #94a3b8;
        }

        .toggle-cs {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .toggle-off {
          background: color-mix(in srgb, var(--verde) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--verde) 40%, transparent);
          color: var(--verde, #22c55e);
        }
        .toggle-off:hover {
          background: color-mix(in srgb, #f59e0b 12%, transparent);
          border-color: #f59e0b;
          color: #f59e0b;
        }
        .toggle-on {
          background: color-mix(in srgb, #f59e0b 12%, transparent);
          border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent);
          color: #f59e0b;
        }
        .toggle-on:hover {
          background: color-mix(in srgb, var(--verde) 10%, transparent);
          border-color: color-mix(in srgb, var(--verde) 40%, transparent);
          color: var(--verde, #22c55e);
        }
        .toggle-cs:disabled { opacity: 0.5; cursor: wait; }

        .table-footer {
          padding: 10px 16px;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: right;
          border-top: 1px solid var(--card-border);
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
