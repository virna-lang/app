'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Package, Building2, Mail, Phone, Briefcase, RefreshCw } from 'lucide-react';
import { getVorpColaboradores, getVorpProdutosDetalhados, getVorpProjetosAtivos } from '@/lib/api';
import type { VorpColaboradorRow, VorpProdutoRow, VorpProjetoRow } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthContext';
import { CADASTRO_TAB_PERMISSIONS } from '@/lib/permissions';
import FilterCombobox from '@/components/cadastro/FilterCombobox';

const VorpSection = dynamic(() => import('@/components/dashboard/VorpSection'));
const UserPermissionsPanel = dynamic(() => import('@/components/cadastro/UserPermissionsPanel'));

type Tab = 'time-completo' | 'produtos' | 'projetos' | 'vorp-system';

function normalizeText(value?: string | number | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function fieldMatches(value: unknown, filter: string) {
  if (!filter) return true;
  return normalizeText(value as string | number | null).includes(normalizeText(filter));
}

function rowMatchesSearch(values: unknown[], search: string) {
  if (!search) return true;
  const normalizedSearch = normalizeText(search);
  return values.some(value => normalizeText(value as string | number | null).includes(normalizedSearch));
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(
    values
      .map(value => value?.trim())
      .filter((value): value is string => Boolean(value)),
  )).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function readProjetoConsultor(row: VorpProjetoRow) {
  if (typeof row.colaborador_nome === 'string' && row.colaborador_nome.startsWith('[')) {
    try {
      return JSON.parse(row.colaborador_nome)[0] ?? null;
    } catch {
      return row.colaborador_nome;
    }
  }
  return row.colaborador_nome ?? null;
}

function CadastroInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { hasPermission } = useAuth();
  const tabParam     = (searchParams.get('tab') ?? 'time-completo') as Tab;

  const [activeTab, setActiveTab] = useState<Tab>(tabParam);

  const [colabs,   setColabs]   = useState<VorpColaboradorRow[]>([]);
  const [produtos, setProdutos] = useState<VorpProdutoRow[]>([]);
  const [projetos, setProjetos] = useState<VorpProjetoRow[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [busca,    setBusca]    = useState('');
  const [colabFilters, setColabFilters] = useState({
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    status: '',
    vertical: '',
  });
  const [produtoFilters, setProdutoFilters] = useState({
    nome: '',
    vertical: '',
    status: '',
    tipo: '',
  });
  const [projetoFilters, setProjetoFilters] = useState({
    nome: '',
    consultor: '',
    produto: '',
    status: '',
    tratativa: '',
  });

  const changeTab = (tab: Tab) => {
    if (!hasPermission(CADASTRO_TAB_PERMISSIONS[tab])) return;
    setActiveTab(tab);
    router.replace(`/cadastro?tab=${tab}`);
    setBusca('');
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
        const data = await getVorpProdutosDetalhados();
        setProdutos(data);
      }
      if (tab === 'projetos' && projetos.length === 0) {
        const data = await getVorpProjetosAtivos(undefined, null);
        setProjetos(data as VorpProjetoRow[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  useEffect(() => {
    if (hasPermission(CADASTRO_TAB_PERMISSIONS[activeTab])) return;
    const fallback = (Object.keys(CADASTRO_TAB_PERMISSIONS) as Tab[])
      .find(tab => hasPermission(CADASTRO_TAB_PERMISSIONS[tab]));
    if (fallback) changeTab(fallback);
    else router.replace('/');
  }, [activeTab, hasPermission, router]);

  const refresh = async () => {
    setLoading(true);
    try {
      if (activeTab === 'time-completo') { const d = await getVorpColaboradores(); setColabs(d as VorpColaboradorRow[]); }
      if (activeTab === 'produtos')      { const d = await getVorpProdutosDetalhados(); setProdutos(d); }
      if (activeTab === 'projetos')      { const d = await getVorpProjetosAtivos(undefined, null); setProjetos(d as VorpProjetoRow[]); }
    } finally { setLoading(false); }
  };

  const colabsFiltrados = colabs.filter(c =>
    rowMatchesSearch([c.nome, c.cargo, c.email, c.telefone, c.status, c.vertical, c.synced_at], busca) &&
    fieldMatches(c.nome, colabFilters.nome) &&
    fieldMatches(c.cargo, colabFilters.cargo) &&
    fieldMatches(c.email, colabFilters.email) &&
    fieldMatches(c.telefone, colabFilters.telefone) &&
    fieldMatches(c.status, colabFilters.status) &&
    fieldMatches(c.vertical, colabFilters.vertical)
  );

  const produtosFiltrados = produtos.filter(p =>
    rowMatchesSearch([p.nome, p.vertical, p.status, p.tipo, p.synced_at], busca) &&
    fieldMatches(p.nome, produtoFilters.nome) &&
    fieldMatches(p.vertical, produtoFilters.vertical) &&
    fieldMatches(p.status, produtoFilters.status) &&
    fieldMatches(p.tipo, produtoFilters.tipo)
  );

  const projetosFiltrados = projetos.filter(p =>
    rowMatchesSearch([p.nome, readProjetoConsultor(p), p.produto_nome, p.status, p.fee, p.tratativa_cs ? 'Tratativa CS' : 'Auditavel'], busca) &&
    fieldMatches(p.nome, projetoFilters.nome) &&
    fieldMatches(readProjetoConsultor(p), projetoFilters.consultor) &&
    fieldMatches(p.produto_nome, projetoFilters.produto) &&
    fieldMatches(p.status, projetoFilters.status) &&
    fieldMatches(p.tratativa_cs ? 'Tratativa CS' : 'Auditavel', projetoFilters.tratativa)
  );

  const colabOptions = {
    nome: uniqueOptions(colabs.map(c => c.nome)),
    cargo: uniqueOptions(colabs.map(c => c.cargo)),
    email: uniqueOptions(colabs.map(c => c.email)),
    telefone: uniqueOptions(colabs.map(c => c.telefone)),
    status: uniqueOptions(colabs.map(c => c.status)),
    vertical: uniqueOptions(colabs.map(c => c.vertical)),
  };
  const produtoOptions = {
    nome: uniqueOptions(produtos.map(p => p.nome)),
    vertical: uniqueOptions(produtos.map(p => p.vertical)),
    status: uniqueOptions(produtos.map(p => p.status)),
    tipo: uniqueOptions(produtos.map(p => p.tipo)),
  };
  const projetoOptions = {
    nome: uniqueOptions(projetos.map(p => p.nome)),
    consultor: uniqueOptions(projetos.map(readProjetoConsultor)),
    produto: uniqueOptions(projetos.map(p => p.produto_nome)),
    status: uniqueOptions(projetos.map(p => p.status)),
    tratativa: ['Auditavel', 'Tratativa CS'],
  };

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
        {tabs.filter(t => hasPermission(CADASTRO_TAB_PERMISSIONS[t.id])).map(t => (
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

      {/* Search + filtros */}
      {activeTab !== 'vorp-system' && (
        <div className="filters-block">
          <div className="search-row">
            <input
              className="search-input"
              placeholder={
                activeTab === 'time-completo' ? 'Buscar em nome, cargo, e-mail, telefone, status ou vertical...' :
                activeTab === 'produtos'      ? 'Buscar produto, vertical, status ou tipo...' :
                'Buscar projeto, consultor, produto, status ou tratativa...'
              }
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {activeTab === 'time-completo' && (
            <div className="filter-row">
              <FilterCombobox label="Nome" value={colabFilters.nome} allLabel="Todos os nomes" options={colabOptions.nome} onChange={value => setColabFilters(prev => ({ ...prev, nome: value }))} />
              <FilterCombobox label="Cargo" value={colabFilters.cargo} allLabel="Todos os cargos" options={colabOptions.cargo} onChange={value => setColabFilters(prev => ({ ...prev, cargo: value }))} />
              <FilterCombobox label="E-mail" value={colabFilters.email} allLabel="Todos os e-mails" options={colabOptions.email} onChange={value => setColabFilters(prev => ({ ...prev, email: value }))} />
              <FilterCombobox label="Telefone" value={colabFilters.telefone} allLabel="Todos os telefones" options={colabOptions.telefone} onChange={value => setColabFilters(prev => ({ ...prev, telefone: value }))} />
              <FilterCombobox label="Status" value={colabFilters.status} allLabel="Todos os status" options={colabOptions.status} onChange={value => setColabFilters(prev => ({ ...prev, status: value }))} />
              <FilterCombobox label="Vertical" value={colabFilters.vertical} allLabel="Todas as verticais" options={colabOptions.vertical} onChange={value => setColabFilters(prev => ({ ...prev, vertical: value }))} />
            </div>
          )}

          {activeTab === 'produtos' && (
            <div className="filter-row">
              <FilterCombobox label="Produto" value={produtoFilters.nome} allLabel="Todos os produtos" options={produtoOptions.nome} onChange={value => setProdutoFilters(prev => ({ ...prev, nome: value }))} />
              <FilterCombobox label="Vertical" value={produtoFilters.vertical} allLabel="Todas as verticais" options={produtoOptions.vertical} onChange={value => setProdutoFilters(prev => ({ ...prev, vertical: value }))} />
              <FilterCombobox label="Status" value={produtoFilters.status} allLabel="Todos os status" options={produtoOptions.status} onChange={value => setProdutoFilters(prev => ({ ...prev, status: value }))} />
              <FilterCombobox label="Tipo" value={produtoFilters.tipo} allLabel="Todos os tipos" options={produtoOptions.tipo} onChange={value => setProdutoFilters(prev => ({ ...prev, tipo: value }))} />
            </div>
          )}

          {activeTab === 'projetos' && (
            <div className="filter-row">
              <FilterCombobox label="Projeto" value={projetoFilters.nome} allLabel="Todos os projetos" options={projetoOptions.nome} onChange={value => setProjetoFilters(prev => ({ ...prev, nome: value }))} />
              <FilterCombobox label="Consultor" value={projetoFilters.consultor} allLabel="Todos os consultores" options={projetoOptions.consultor} onChange={value => setProjetoFilters(prev => ({ ...prev, consultor: value }))} />
              <FilterCombobox label="Produto" value={projetoFilters.produto} allLabel="Todos os produtos" options={projetoOptions.produto} onChange={value => setProjetoFilters(prev => ({ ...prev, produto: value }))} />
              <FilterCombobox label="Status" value={projetoFilters.status} allLabel="Todos os status" options={projetoOptions.status} onChange={value => setProjetoFilters(prev => ({ ...prev, status: value }))} />
              <FilterCombobox label="Tratativa" value={projetoFilters.tratativa} allLabel="Todas as tratativas" options={projetoOptions.tratativa} onChange={value => setProjetoFilters(prev => ({ ...prev, tratativa: value }))} />
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
            <>
            {hasPermission('admin.usuarios') && <UserPermissionsPanel />}
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
            </>
          )}

          {/* ── Produtos ── */}
          {activeTab === 'produtos' && (
            <div className="table-wrap card">
              <table className="cad-table">
                <thead>
                  <tr>
                    <th><span className="th-inner"><Package size={11} /> Produto</span></th>
                    <th>Vertical</th>
                    <th>Status</th>
                    <th>Tipo</th>
                    <th>Última Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.length === 0 ? (
                    <tr><td colSpan={5} className="td-empty">Nenhum produto encontrado.</td></tr>
                  ) : produtosFiltrados.map(p => (
                    <tr key={p.vorp_id}>
                      <td className="td-bold">{p.nome}</td>
                      <td><span className="badge badge-orange">{p.vertical ?? '—'}</span></td>
                      <td><span className={`badge ${p.status?.toLowerCase() === 'ativo' ? 'badge-green' : 'badge-gray'}`}>{p.status ?? '—'}</span></td>
                      <td><span className="badge badge-blue">{p.tipo ?? '—'}</span></td>
                      <td className="td-muted td-small">{formatDate(p.synced_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="table-footer">{produtosFiltrados.length} de {produtos.length} produtos</p>
            </div>
          )}

          {/* ── Vorp System ── */}
          {activeTab === 'vorp-system' && (
            <VorpSection vorpColaboradorId="all" />
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
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>FEE</th>
                    <th style={{ textAlign: 'center' }}>Tratativa CS</th>
                  </tr>
                </thead>
                <tbody>
                  {projetosFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="td-empty">Nenhum projeto encontrado.</td></tr>
                  ) : projetosFiltrados.map(p => {
                    const colabNome = readProjetoConsultor(p);
                    const isAuditor = !!p.consultor_id;
                    return (
                    <tr key={p.vorp_id} className={p.tratativa_cs ? 'row-dim' : ''}>
                      <td className="td-bold">{p.nome}</td>
                      <td>
                        {colabNome ? (
                          <span className={isAuditor ? 'consultor-auditor' : 'consultor-vorp'}>
                            {colabNome}
                            {!isAuditor && <span className="badge-vorp-only">Vorp</span>}
                          </span>
                        ) : (
                          <span className="td-muted">—</span>
                        )}
                      </td>
                      <td>
                        {p.produto_nome && <span className="badge badge-orange">{p.produto_nome}</span>}
                      </td>
                      <td><span className={`badge ${p.status?.toLowerCase() === 'ativo' ? 'badge-green' : 'badge-gray'}`}>{p.status ?? '—'}</span></td>
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
                    );
                  })}
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

        .filters-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .search-row { display: flex; }
        .search-input {
          width: 100%; max-width: 560px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--card-border);
          border-radius: 8px; padding: 10px 16px;
          color: var(--text-main); font-size: 0.88rem;
          transition: all 0.2s;
        }
        .search-input:focus { border-color: var(--laranja-vorp); outline: none; background: rgba(255,255,255,0.05); }
        .search-input::placeholder { color: var(--text-muted); }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

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
        .badge-blue   { background: rgba(79,195,247,0.1); color: #4fc3f7; }

        .consultor-auditor { color: var(--text-main); font-weight: 500; }
        .consultor-vorp { color: var(--text-muted); display: inline-flex; align-items: center; gap: 8px; }
        .badge-vorp-only {
          font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
          padding: 2px 6px; border-radius: 4px; letter-spacing: 0.04em;
          background: rgba(255,255,255,0.05); color: var(--text-muted);
          border: 1px solid rgba(255,255,255,0.08);
        }

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
