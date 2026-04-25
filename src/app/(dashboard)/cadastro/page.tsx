'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Package, Building2, Mail, Phone, Briefcase, RefreshCw } from 'lucide-react';
import { getVorpColaboradores, getVorpProdutos, getVorpProjetosAtivos } from '@/lib/api';
import type { VorpColaboradorRow, VorpProjetoRow } from '@/lib/supabase';
import { COLORS } from '@/types/dashboard';
import dynamic from 'next/dynamic';

const VorpSection = dynamic(() => import('@/components/dashboard/VorpSection'));

type Tab = 'time-completo' | 'produtos' | 'projetos' | 'vorp-system';

function CadastroInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const tabParam     = (searchParams.get('tab') ?? 'time-completo') as Tab;

  const [activeTab, setActiveTab] = useState<Tab>(tabParam);

  const [colabs,   setColabs]   = useState<VorpColaboradorRow[]>([]);
  const [produtos, setProdutos] = useState<string[]>([]);
  const [projetos, setProjetos] = useState<VorpProjetoRow[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [busca,      setBusca]      = useState('');
  const [filtroProj, setFiltroProj] = useState<'todos' | 'auditaveis' | 'tratativa'>('auditaveis');

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/cadastro?tab=${tab}`);
    setBusca('');
    setFiltroProj('auditaveis');
  };

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const load = async (tab: Tab) => {
    setLoading(true);
    try {
      if (tab === 'time-completo' && colabs.length === 0) {
        const data = await getVorpColaboradores();
        setColabs(data as VorpColaboradorRow[]);
      }
      if (tab === 'produtos' && produtos.length === 0) {
        const data = await getVorpProdutos();
        setProdutos(data);
      }
      if (tab === 'projetos' && projetos.length === 0) {
        const data = await getVorpProjetosAtivos();
        setProjetos(data as VorpProjetoRow[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  const refresh = async () => {
    setLoading(true);
    try {
      if (activeTab === 'time-completo') { const d = await getVorpColaboradores(); setColabs(d as VorpColaboradorRow[]); }
      if (activeTab === 'produtos')      { const d = await getVorpProdutos();      setProdutos(d); }
      if (activeTab === 'projetos')      { const d = await getVorpProjetosAtivos(); setProjetos(d as VorpProjetoRow[]); }
    } finally { setLoading(false); }
  };

  const colabsFiltrados = colabs.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.cargo ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  const produtosFiltrados = produtos.filter(p =>
    !busca || p.toLowerCase().includes(busca.toLowerCase())
  );

  const totalProjAuditaveis = projetos.filter(p => !p.tratativa_cs).length;
  const totalProjTratativa  = projetos.filter(p =>  p.tratativa_cs).length;

  const projetosFiltrados = projetos.filter(p => {
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.colaborador_nome ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.produto_nome ?? '').toLowerCase().includes(busca.toLowerCase());
    const matchFiltro =
      filtroProj === 'todos' ||
      (filtroProj === 'tratativa'  &&  p.tratativa_cs) ||
      (filtroProj === 'auditaveis' && !p.tratativa_cs);
    return matchBusca && matchFiltro;
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'time-completo', label: 'Time Completo',   icon: <Users size={15} />,     count: colabs.length },
    { id: 'produtos',      label: 'Produtos',         icon: <Package size={15} />,   count: produtos.length },
    { id: 'projetos',      label: 'Projetos Ativos',  icon: <Building2 size={15} />, count: projetos.length },
    { id: 'vorp-system',   label: 'Vorp System',      icon: <Building2 size={15} />, count: 0 },
  ];

  return (
    <div className="cad-page">
      <header className="cad-header">
        <div>
          <h1>Cadastro</h1>
          <p>Time, produtos e projetos ativos da vertical Growth.</p>
        </div>
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          Atualizar
        </button>
      </header>

      {/* Tab bar */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => changeTab(t.id)}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== 'vorp-system' && (
        <div className="search-row">
          <input
            className="search-input"
            placeholder={
              activeTab === 'time-completo' ? 'Buscar por nome ou cargo...' :
              activeTab === 'produtos'      ? 'Buscar produto...' :
              'Buscar projeto, consultor ou produto...'
            }
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {activeTab === 'projetos' && (
            <div className="filtro-chips">
              {(['auditaveis', 'tratativa', 'todos'] as const).map(f => (
                <button
                  key={f}
                  className={`chip ${filtroProj === f ? 'chip-active' : ''}`}
                  onClick={() => setFiltroProj(f)}
                >
                  {f === 'auditaveis' && `Ativos (${totalProjAuditaveis})`}
                  {f === 'tratativa'  && `Tratativa CS (${totalProjTratativa})`}
                  {f === 'todos'      && 'Todos'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="empty-state">
          <RefreshCw size={24} className="spinning" />
          <span>Carregando...</span>
        </div>
      ) : (
        <>
          {/* ── Time Completo ── */}
          {activeTab === 'time-completo' && (
            <div className="table-wrap card">
              <table className="cad-table">
                <thead>
                  <tr>
                    <th><span className="th-inner"><Users size={11} /> Nome</span></th>
                    <th><span className="th-inner"><Briefcase size={11} /> Cargo</span></th>
                    <th><span className="th-inner"><Mail size={11} /> E-mail</span></th>
                    <th><span className="th-inner"><Phone size={11} /> Telefone</span></th>
                    <th>Status</th>
                    <th>Vertical</th>
                    <th>Última Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {colabsFiltrados.length === 0 ? (
                    <tr><td colSpan={7} className="td-empty">Nenhum colaborador encontrado.</td></tr>
                  ) : colabsFiltrados.map(c => (
                    <tr key={c.vorp_id}>
                      <td className="td-bold">{c.nome}</td>
                      <td>{c.cargo ?? '—'}</td>
                      <td className="td-muted">{c.email ?? '—'}</td>
                      <td className="td-muted">{c.telefone ?? '—'}</td>
                      <td><span className={`badge ${c.status?.toLowerCase() === 'ativo' ? 'badge-green' : 'badge-gray'}`}>{c.status ?? '—'}</span></td>
                      <td><span className="badge badge-orange">{c.vertical ?? '—'}</span></td>
                      <td className="td-muted td-small">{formatDate(c.synced_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="table-footer">{colabsFiltrados.length} colaboradores</p>
            </div>
          )}

          {/* ── Produtos ── */}
          {activeTab === 'produtos' && (
            <div className="table-wrap card">
              <table className="cad-table">
                <thead>
                  <tr>
                    <th><span className="th-inner"><Package size={11} /> Produto</span></th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.length === 0 ? (
                    <tr><td className="td-empty">Nenhum produto encontrado.</td></tr>
                  ) : produtosFiltrados.map((p, i) => (
                    <tr key={i}>
                      <td className="td-bold">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="table-footer">{produtosFiltrados.length} produtos</p>
            </div>
          )}

          {/* ── Vorp System ── */}
          {activeTab === 'vorp-system' && (
            <VorpSection consultorNome="all" />
          )}

          {/* ── Projetos Ativos ── */}
          {activeTab === 'projetos' && (
            <div className="table-wrap card">
              <table className="cad-table">
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
                  {projetosFiltrados.length === 0 ? (
                    <tr><td colSpan={5} className="td-empty">Nenhum projeto encontrado.</td></tr>
                  ) : projetosFiltrados.map(p => (
                    <tr key={p.vorp_id} className={p.tratativa_cs ? 'row-dim' : ''}>
                      <td className="td-bold">{p.nome}</td>
                      <td className="td-muted">
                        {typeof p.colaborador_nome === 'string' && p.colaborador_nome.startsWith('[')
                          ? (() => { try { return JSON.parse(p.colaborador_nome)[0] ?? '—'; } catch { return p.colaborador_nome; } })()
                          : p.colaborador_nome ?? '—'}
                      </td>
                      <td>
                        {p.produto_nome && <span className="badge badge-orange">{p.produto_nome}</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {p.fee != null
                          ? p.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${p.tratativa_cs ? 'badge-yellow' : 'badge-green'}`}>
                          {p.tratativa_cs ? 'Tratativa CS' : 'Auditável'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="table-footer">{projetosFiltrados.length} de {projetos.length} projetos ativos</p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .cad-page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 80px; animation: fadeIn 0.4s ease; }

        .cad-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .cad-header h1 { font-family: var(--font-bebas); font-size: 2.2rem; color: var(--text-main); margin-bottom: 4px; }
        .cad-header p  { color: var(--text-muted); font-size: 0.88rem; }

        .btn-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-refresh:hover:not(:disabled) { color: var(--text-main); border-color: rgba(255,255,255,0.2); }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        .tab-bar {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--card-border);
          border-radius: 12px; padding: 6px;
          width: fit-content;
        }
        .tab-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          background: transparent; border: none; border-radius: 8px;
          color: var(--text-muted); font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .tab-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.04); }
        .tab-btn.active { background: var(--laranja-vorp); color: white; }

        .tab-count {
          background: rgba(255,255,255,0.2);
          border-radius: 20px; padding: 1px 7px;
          font-size: 0.72rem; font-weight: 700;
        }
        .tab-btn.active .tab-count { background: rgba(255,255,255,0.25); }

        .search-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .filtro-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
          padding: 7px 14px;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.78rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .chip:hover { border-color: var(--laranja-vorp); color: var(--laranja-vorp); }
        .chip-active { background: var(--laranja-vorp); border-color: var(--laranja-vorp); color: #fff; }
        .search-input {
          width: 100%; max-width: 420px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--card-border);
          border-radius: 8px; padding: 10px 16px;
          color: var(--text-main); font-size: 0.88rem;
          transition: all 0.2s;
        }
        .search-input:focus { border-color: var(--laranja-vorp); outline: none; background: rgba(255,255,255,0.05); }
        .search-input::placeholder { color: var(--text-muted); }

        .empty-state { display: flex; align-items: center; gap: 12px; padding: 60px; color: var(--text-muted); justify-content: center; }

        .table-wrap { padding: 0; overflow: hidden; overflow-x: auto; }
        .cad-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .cad-table thead tr { background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--card-border); }
        .cad-table th {
          padding: 13px 16px; text-align: left;
          font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-muted); white-space: nowrap;
        }
        .th-inner { display: flex; align-items: center; gap: 6px; }
        .cad-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); color: var(--text-main); vertical-align: middle; }
        .cad-table tr:last-child td { border-bottom: none; }
        .cad-table tbody tr:hover { background: rgba(255,255,255,0.02); }
        .row-dim td { opacity: 0.5; }

        .td-bold  { font-weight: 600; }
        .td-muted { color: var(--text-muted); }
        .td-small { font-size: 0.78rem; white-space: nowrap; }
        .td-empty { text-align: center; color: var(--text-muted); padding: 40px !important; }

        .badge { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
        .badge-green  { background: rgba(30,144,128,0.1); color: var(--status-verde); }
        .badge-gray   { background: rgba(255,255,255,0.05); color: var(--text-muted); }
        .badge-orange { background: rgba(255,107,0,0.1); color: var(--laranja-vorp); }
        .badge-yellow { background: rgba(245,158,11,0.1); color: #f59e0b; }

        .table-footer { padding: 10px 16px; font-size: 0.75rem; color: var(--text-muted); text-align: right; border-top: 1px solid var(--card-border); }

        :global(.spinning) { animation: spin 1s linear infinite; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-muted)' }}>Carregando...</div>}>
      <CadastroInner />
    </Suspense>
  );
}
