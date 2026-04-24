'use client';

import React, { useState, useEffect } from 'react';
import type { Consultor } from '@/lib/supabase';
import type { VorpColaboradorRow } from '@/lib/supabase';
import { getVorpColaboradores } from '@/lib/api';
import { COLORS } from '@/types/dashboard';
import { UserPlus, PackagePlus, ToggleLeft, ToggleRight, Plus, Users, Mail, Phone, Briefcase, RefreshCw } from 'lucide-react';

interface Props {
  consultants: Consultor[];
  products: string[];
  onAddConsultant: (name: string) => void;
  onToggleConsultant: (id: string, currentStatus: 'Ativo' | 'Inativo') => void;
  onAddProduct: (name: string) => void;
}

type Tab = 'gestao' | 'time-completo';

export default function AdminManagement({
  consultants, products, onAddConsultant, onToggleConsultant, onAddProduct
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('gestao');
  const [newConsultant, setNewConsultant] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [vorpColabs, setVorpColabs] = useState<VorpColaboradorRow[]>([]);
  const [loadingColabs, setLoadingColabs] = useState(false);

  useEffect(() => {
    setLoadingColabs(true);
    getVorpColaboradores()
      .then(data => setVorpColabs(data as VorpColaboradorRow[]))
      .catch(console.error)
      .finally(() => setLoadingColabs(false));
  }, []);

  const cargoMap = Object.fromEntries(
    vorpColabs.map(c => [c.nome.trim().toLowerCase(), c.cargo ?? null])
  );

  const handleRefreshColabs = async () => {
    setLoadingColabs(true);
    try {
      const data = await getVorpColaboradores();
      setVorpColabs(data as VorpColaboradorRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingColabs(false);
    }
  };

  const handleAddConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newConsultant.trim()) {
      onAddConsultant(newConsultant.trim());
      setNewConsultant('');
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.trim()) {
      onAddProduct(newProduct.trim());
      setNewProduct('');
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="admin-mgmt">
      <header className="mgmt-header">
        <h2>Gestão de Time e Produtos</h2>
        <p>Gerencie o time da vertical Growth e o catálogo de produtos.</p>
      </header>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'gestao' ? 'active' : ''}`}
          onClick={() => setActiveTab('gestao')}
        >
          <UserPlus size={16} /> Gestão
        </button>
        <button
          className={`tab-btn ${activeTab === 'time-completo' ? 'active' : ''}`}
          onClick={() => setActiveTab('time-completo')}
        >
          <Users size={16} /> Time Completo
        </button>
      </div>

      {/* Gestão Tab */}
      {activeTab === 'gestao' && (
        <div className="mgmt-grid">
          <section className="card mgmt-section">
            <div className="section-title">
              <UserPlus size={20} color={COLORS.primary} />
              <h3>Consultores</h3>
            </div>

            <form className="add-form" onSubmit={handleAddConsultant}>
              <input
                type="text"
                placeholder="Nome do novo consultor..."
                value={newConsultant}
                onChange={(e) => setNewConsultant(e.target.value)}
              />
              <button type="submit" className="add-btn">
                <Plus size={16} /> Adicionar
              </button>
            </form>

            <div className="list-container">
              {consultants.map(c => {
                const cargo = cargoMap[c.nome.trim().toLowerCase()] ?? null;
                return (
                  <div key={c.id} className={`list-item ${c.status === 'Inativo' ? 'inactive' : ''}`}>
                    <div className="item-info">
                      <div className="item-main">
                        <span className="item-name">{c.nome}</span>
                        {cargo && <span className="item-cargo">{cargo}</span>}
                      </div>
                      <span className={`status-badge ${c.status === 'Ativo' ? 'active' : 'off'}`}>
                        {c.status}
                      </span>
                    </div>
                    <button
                      className="toggle-btn"
                      onClick={() => onToggleConsultant(c.id, c.status)}
                      title={c.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                    >
                      {c.status === 'Ativo'
                        ? <ToggleRight size={24} color={COLORS.verde} />
                        : <ToggleLeft size={24} color={COLORS.textMuted} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card mgmt-section">
            <div className="section-title">
              <PackagePlus size={20} color={COLORS.primary} />
              <h3>Produtos</h3>
            </div>

            <form className="add-form" onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="Nome do novo produto..."
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
              />
              <button type="submit" className="add-btn">
                <Plus size={16} /> Adicionar
              </button>
            </form>

            <div className="list-container">
              {products.map((p, i) => (
                <div key={i} className="list-item">
                  <span className="item-name">{p}</span>
                  <span className="product-tag">SKU-{p.substring(0, 2).toUpperCase()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Time Completo Tab */}
      {activeTab === 'time-completo' && (
        <div className="time-completo-section">
          <div className="tc-header">
            <div className="tc-meta">
              <Users size={20} color={COLORS.primary} />
              <h3>Colaboradores — Vertical Growth</h3>
              <span className="tc-count">{vorpColabs.length} colaboradores</span>
            </div>
            <button className="refresh-btn" onClick={handleRefreshColabs} disabled={loadingColabs}>
              <RefreshCw size={14} className={loadingColabs ? 'spinning' : ''} />
              Atualizar
            </button>
          </div>

          {loadingColabs ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spinning" />
              <span>Carregando colaboradores do Vorp System...</span>
            </div>
          ) : vorpColabs.length === 0 ? (
            <div className="empty-state">
              <Users size={40} color={COLORS.textMuted} />
              <p>Nenhum colaborador encontrado.<br />Execute a sincronização com o Vorp System.</p>
            </div>
          ) : (
            <div className="tc-table-wrapper">
              <table className="tc-table">
                <thead>
                  <tr>
                    <th><span className="th-inner"><Users size={12} /> Nome</span></th>
                    <th><span className="th-inner"><Briefcase size={12} /> Cargo</span></th>
                    <th><span className="th-inner"><Mail size={12} /> E-mail</span></th>
                    <th><span className="th-inner"><Phone size={12} /> Telefone</span></th>
                    <th>Status</th>
                    <th>Vertical</th>
                    <th>Última Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {vorpColabs.map((c) => (
                    <tr key={c.vorp_id}>
                      <td className="td-nome">{c.nome}</td>
                      <td>{c.cargo ?? '—'}</td>
                      <td>{c.email ?? '—'}</td>
                      <td>{c.telefone ?? '—'}</td>
                      <td>
                        <span className={`status-badge ${c.status?.toLowerCase() === 'ativo' ? 'active' : 'off'}`}>
                          {c.status ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className="vertical-tag">{c.vertical ?? '—'}</span>
                      </td>
                      <td className="td-sync">{formatDate(c.synced_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .admin-mgmt { animation: fadeIn 0.5s ease-out; }
        .mgmt-header { margin-bottom: 24px; }
        .mgmt-header h2 { font-family: var(--font-bebas); font-size: 2rem; color: var(--text-main); margin-bottom: 8px; }
        .mgmt-header p { color: var(--text-muted); font-size: 0.9rem; }

        /* Tabs */
        .tab-bar {
          display: flex;
          gap: 4px;
          margin-bottom: 28px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 6px;
          width: fit-content;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.04); }
        .tab-btn.active { background: var(--laranja-vorp); color: white; }

        /* Gestão grid */
        .mgmt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .mgmt-section { padding: 30px; display: flex; flex-direction: column; gap: 24px; }

        .section-title { display: flex; align-items: center; gap: 12px; }
        .section-title h3 { font-family: var(--font-dm-sans); font-size: 1.1rem; color: var(--text-main); }

        .add-form { display: flex; gap: 12px; }
        .add-form input {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--text-main);
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .add-form input:focus { border-color: var(--laranja-vorp); outline: none; background: rgba(255,255,255,0.05); }

        .add-btn {
          background: var(--laranja-vorp);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s;
        }
        .add-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

        .list-container { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; padding-right: 8px; }
        .list-container::-webkit-scrollbar { width: 4px; }
        .list-container::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 2px; }

        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          transition: all 0.2s;
        }
        .list-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
        .list-item.inactive { opacity: 0.5; }

        .item-info { display: flex; align-items: center; gap: 12px; }
        .item-main { display: flex; flex-direction: column; gap: 2px; }
        .item-name { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
        .item-cargo { font-size: 0.75rem; color: var(--text-muted); }

        .status-badge { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
        .status-badge.active { background: rgba(30, 144, 128, 0.1); color: var(--status-verde); }
        .status-badge.off { background: rgba(255,255,255,0.05); color: var(--text-muted); }

        .toggle-btn { background: transparent; border: none; cursor: pointer; display: flex; align-items: center; transition: transform 0.2s; }
        .toggle-btn:hover { transform: scale(1.1); }

        .product-tag { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; }

        /* Time Completo */
        .time-completo-section { display: flex; flex-direction: column; gap: 20px; }

        .tc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .tc-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tc-meta h3 { font-size: 1rem; font-weight: 700; color: var(--text-main); }
        .tc-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 2px 10px;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .refresh-btn:hover:not(:disabled) { color: var(--text-main); border-color: rgba(255,255,255,0.2); }
        .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 20px;
          color: var(--text-muted);
          font-size: 0.9rem;
          text-align: center;
        }
        .empty-state p { line-height: 1.6; }

        .tc-table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--card-border);
          border-radius: 12px;
        }
        .tc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .tc-table thead tr {
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--card-border);
        }
        .tc-table th {
          padding: 14px 16px;
          text-align: left;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .th-inner { display: flex; align-items: center; gap: 6px; }

        .tc-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .tc-table tbody tr:last-child { border-bottom: none; }
        .tc-table tbody tr:hover { background: rgba(255,255,255,0.03); }

        .tc-table td {
          padding: 14px 16px;
          color: var(--text-main);
          vertical-align: middle;
        }
        .td-nome { font-weight: 600; }
        .td-sync { color: var(--text-muted); font-size: 0.78rem; white-space: nowrap; }

        .vertical-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255, 107, 0, 0.1);
          color: var(--laranja-vorp);
          text-transform: uppercase;
        }

        :global(.spinning) { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1000px) { .mgmt-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
