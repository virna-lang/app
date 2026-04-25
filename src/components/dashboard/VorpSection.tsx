'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Users, AlertCircle, CheckCircle2, Search, RefreshCw } from 'lucide-react';
import { getVorpProjetosAtivos, setTrativaCS } from '@/lib/api';
import { COLORS } from '@/types/dashboard';
import type { VorpProjetoRow } from '@/lib/supabase';

interface Props {
  vorpColaboradorId?: string | null;
}

export default function VorpSection({ vorpColaboradorId }: Props) {
  const [projetos, setProjetos]   = useState<VorpProjetoRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busca, setBusca]         = useState('');
  const [salvando, setSalvando]   = useState<string | null>(null);
  const [filtroCS, setFiltroCS]   = useState<'todos' | 'auditaveis' | 'tratativa'>('todos');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVorpProjetosAtivos(vorpColaboradorId);
      setProjetos(data as VorpProjetoRow[]);
    } finally {
      setLoading(false);
    }
  }, [vorpColaboradorId]);

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
