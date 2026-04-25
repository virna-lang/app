'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, Users, AlertCircle, CheckCircle2, Search, RefreshCw, ChevronDown } from 'lucide-react';
import { getVorpProjetosAtivos, setTrativaCS } from '@/lib/api';
import { COLORS } from '@/types/dashboard';
import type { VorpProjetoRow } from '@/lib/supabase';

interface Props {
  consultorNome?: string; // 'all' ou nome exato do colaborador
}

export default function VorpSection({ consultorNome }: Props) {
  const [projetos, setProjetos]   = useState<VorpProjetoRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busca, setBusca]         = useState('');
  const [salvando, setSalvando]   = useState<string | null>(null);
  const [filtroCS, setFiltroCS]   = useState<'todos' | 'auditaveis' | 'tratativa'>('auditaveis');
  const [dropOpen, setDropOpen]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    if (dropOpen) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [dropOpen]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const nome = consultorNome === 'all' ? undefined : consultorNome;
      const data = await getVorpProjetosAtivos(nome);
      setProjetos(data as VorpProjetoRow[]);
    } finally {
      setLoading(false);
    }
  }, [consultorNome]);

  useEffect(() => { carregar(); }, [carregar]);

  const toggleCS = async (projeto: VorpProjetoRow) => {
    setSalvando(projeto.vorp_id);
    try {
      await setTrativaCS(projeto.vorp_id, !projeto.tratativa_cs);
      setProjetos(prev =>
        prev.map(p =>
          p.vorp_id === projeto.vorp_id
            ? { ...p, tratativa_cs: !p.tratativa_cs }
            : p
        )
      );
    } finally {
      setSalvando(null);
    }
  };

  const filtrados = projetos.filter(p => {
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.colaborador_nome ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.produto_nome ?? '').toLowerCase().includes(busca.toLowerCase());

    const matchFiltro =
      filtroCS === 'todos' ||
      (filtroCS === 'tratativa' && p.tratativa_cs) ||
      (filtroCS === 'auditaveis' && !p.tratativa_cs);

    return matchBusca && matchFiltro;
  });

  const totalAtivos     = projetos.length;
  const totalTratativa  = projetos.filter(p => p.tratativa_cs).length;
  const totalAuditaveis = totalAtivos - totalTratativa;

  return (
    <div className="vorp-section section-block">
      {/* ── Cabeçalho ───────────────────────────────────── */}
      <div className="section-anchor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2>Projetos Ativos — Vorp System</h2>
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

      {/* ── KPI cards ───────────────────────────────────── */}
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

      {/* ── Controles de filtro ─────────────────────────── */}
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

        <div ref={dropRef} className="filter-wrap">
          <button
            className={`filter-btn ${filtroCS !== 'auditaveis' ? 'filter-btn-alt' : ''}`}
            onClick={() => setDropOpen(o => !o)}
          >
            <span className="filter-icon"><CheckCircle2 size={13} /></span>
            <span className="filter-val">
              {filtroCS === 'auditaveis' ? `Auditáveis (${totalAuditaveis})` :
               filtroCS === 'tratativa'  ? `Tratativa CS (${totalTratativa})` : 'Todos'}
            </span>
            <ChevronDown size={13} className={`filter-chevron ${dropOpen ? 'open' : ''}`} />
          </button>
          {dropOpen && (
            <div className="filter-dropdown">
              {([
                { key: 'auditaveis', label: `Auditáveis (${totalAuditaveis})` },
                { key: 'tratativa',  label: `Tratativa CS (${totalTratativa})` },
                { key: 'todos',      label: 'Todos' },
              ] as const).map(({ key, label }) => (
                <div
                  key={key}
                  className={`drop-item ${filtroCS === key ? 'drop-selected' : ''}`}
                  onClick={() => { setFiltroCS(key); setDropOpen(false); }}
                >
                  {label}
                </div>
              ))}
            </div>
          )}
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

        .controles-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
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

        .filter-wrap { position: relative; }
        .filter-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 12px;
          background: var(--glass-bg); border: 1px solid var(--card-border);
          border-radius: 8px; cursor: pointer;
          font-size: 0.82rem; color: var(--text-muted); white-space: nowrap;
          transition: all 0.15s;
        }
        .filter-btn:hover { border-color: rgba(252,84,0,0.4); color: var(--text-main); }
        .filter-btn-alt { border-color: rgba(252,84,0,0.5); background: rgba(252,84,0,0.08); color: var(--laranja-vorp); }
        .filter-icon { opacity: 0.5; display: flex; align-items: center; }
        .filter-btn-alt .filter-icon { opacity: 1; }
        .filter-val { font-weight: 600; }
        .filter-chevron { opacity: 0.4; transition: transform 0.2s; }
        .filter-chevron.open { transform: rotate(180deg); opacity: 0.8; }

        .filter-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0;
          min-width: 210px;
          background: #111827; border: 1px solid #1f2d40;
          border-radius: 10px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          z-index: 200; overflow: hidden;
          animation: dropIn 0.15s ease-out;
        }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .drop-item {
          padding: 9px 16px;
          font-size: 0.82rem; color: var(--text-muted);
          cursor: pointer; transition: background 0.12s, color 0.12s;
        }
        .drop-item:hover { background: rgba(252,84,0,0.08); color: var(--text-main); }
        .drop-selected { color: var(--laranja-vorp); font-weight: 600; background: rgba(252,84,0,0.06); }

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
