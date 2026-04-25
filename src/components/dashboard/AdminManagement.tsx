'use client';

import React, { useState, useEffect } from 'react';
import type { Consultor, VorpColaboradorRow } from '@/lib/supabase';
import { getVorpColaboradores } from '@/lib/api';
import { UserPlus, PackagePlus, ToggleLeft, ToggleRight, Plus, Users, Mail, Phone, Briefcase, RefreshCw } from 'lucide-react';

const T = {
  bg: '#0f1117', bgDark: '#0d0f14', border: '#1a1d24', borderHov: '#2a2f3d',
  orange: '#ff5c1a', orangeDim: 'rgba(255,92,26,0.12)',
  green: '#1d9e75', greenDim: 'rgba(29,158,117,0.1)',
  text: '#e2e4e9', textSub: '#9aa0b0', textDim: '#3f4455',
};

interface Props {
  consultants: Consultor[];
  products: string[];
  onAddConsultant: (name: string) => void;
  onToggleConsultant: (id: string, currentStatus: 'Ativo' | 'Inativo') => void;
  onAddProduct: (name: string) => void;
}

type Tab = 'gestao' | 'time-completo';

export default function AdminManagement({ consultants, products, onAddConsultant, onToggleConsultant, onAddProduct }: Props) {
  const [activeTab,     setActiveTab]     = useState<Tab>('gestao');
  const [newConsultant, setNewConsultant] = useState('');
  const [newProduct,    setNewProduct]    = useState('');
  const [vorpColabs,    setVorpColabs]    = useState<VorpColaboradorRow[]>([]);
  const [loadingColabs, setLoadingColabs] = useState(false);

  useEffect(() => {
    setLoadingColabs(true);
    getVorpColaboradores().then(d => setVorpColabs(d as VorpColaboradorRow[])).catch(console.error).finally(() => setLoadingColabs(false));
  }, []);

  const cargoMap = Object.fromEntries(vorpColabs.map(c => [c.nome.trim().toLowerCase(), c.cargo ?? null]));

  const handleAddConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newConsultant.trim()) { onAddConsultant(newConsultant.trim()); setNewConsultant(''); }
  };
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.trim()) { onAddProduct(newProduct.trim()); setNewProduct(''); }
  };
  const handleRefresh = async () => {
    setLoadingColabs(true);
    try { setVorpColabs((await getVorpColaboradores()) as VorpColaboradorRow[]); } catch (e) { console.error(e); } finally { setLoadingColabs(false); }
  };

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
    borderRadius: 7, padding: '10px 14px', color: T.text, fontSize: 13, outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 6 }}>Gestão de Time e Produtos</h2>
        <p style={{ fontSize: 13, color: T.textDim }}>Gerencie o time da vertical Growth e o catálogo de produtos.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 9, padding: 5, width: 'fit-content' }}>
        {([['gestao', <UserPlus key="up" size={14}/>, 'Gestão'], ['time-completo', <Users key="us" size={14}/>, 'Time Completo']] as const).map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as Tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab ? T.orange : 'transparent',
              color: activeTab === tab ? 'white' : T.textDim,
            }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {activeTab === 'gestao' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="mgmt-grid">
          {[
            { icon: <UserPlus size={18} color={T.orange}/>, title: 'Consultores', placeholder: 'Nome do novo consultor...', val: newConsultant, setVal: setNewConsultant, onSubmit: handleAddConsultant,
              list: consultants.map(c => ({
                key: c.id, name: c.nome, sub: cargoMap[c.nome.trim().toLowerCase()] ?? undefined,
                badge: c.status, badgeColor: c.status === 'Ativo' ? T.green : T.textDim,
                right: (
                  <button onClick={() => onToggleConsultant(c.id, c.status)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}>
                    {c.status === 'Ativo'
                      ? <ToggleRight size={22} color={T.green} />
                      : <ToggleLeft size={22} color={T.textDim} />}
                  </button>
                ),
                inactive: c.status === 'Inativo',
              }))
            },
            { icon: <PackagePlus size={18} color={T.orange}/>, title: 'Produtos', placeholder: 'Nome do novo produto...', val: newProduct, setVal: setNewProduct, onSubmit: handleAddProduct,
              list: products.map((p, i) => ({
                key: String(i), name: p, sub: undefined,
                badge: undefined, badgeColor: T.textDim,
                right: <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace' }}>SKU-{p.substring(0, 2).toUpperCase()}</span>,
                inactive: false,
              }))
            },
          ].map(section => (
            <div key={section.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {section.icon}
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{section.title}</h3>
              </div>
              <form onSubmit={section.onSubmit} style={{ display: 'flex', gap: 10 }}>
                <input type="text" placeholder={section.placeholder} value={section.val}
                  onChange={e => section.setVal(e.target.value)} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = T.orange)}
                  onBlur={e => (e.target.style.borderColor = T.border)} />
                <button type="submit" style={{
                  background: T.orange, color: 'white', border: 'none',
                  borderRadius: 7, padding: '0 16px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                  transition: 'filter 0.2s, transform 0.2s', whiteSpace: 'nowrap',
                }}>
                  <Plus size={14} /> Adicionar
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 380, overflowY: 'auto' }}>
                {section.list.map(item => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: T.bgDark,
                    border: `1px solid ${T.border}`, borderRadius: 8,
                    opacity: item.inactive ? 0.5 : 1, transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</div>
                        {item.sub && <div style={{ fontSize: 11, color: T.textDim }}>{item.sub}</div>}
                      </div>
                      {item.badge && (
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: `${item.badgeColor}18`, color: item.badgeColor }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.right}
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      )}

      {activeTab === 'time-completo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={18} color={T.orange} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Colaboradores — Vertical Growth</h3>
              <span style={{ fontSize: 11, color: T.textDim, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRadius: 20, padding: '2px 10px' }}>
                {vorpColabs.length} colaboradores
              </span>
            </div>
            <button onClick={handleRefresh} disabled={loadingColabs}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', background: T.bgDark,
                border: `1px solid ${T.border}`, borderRadius: 7,
                color: T.textDim, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', opacity: loadingColabs ? 0.5 : 1,
              }}>
              <RefreshCw size={12} style={{ animation: loadingColabs ? 'spin 1s linear infinite' : 'none' }} />
              Atualizar
            </button>
          </div>

          {loadingColabs ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', color: T.textDim, fontSize: 13 }}>
              <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: T.orange }} />
              Carregando colaboradores do Vorp System...
            </div>
          ) : vorpColabs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', color: T.textDim, fontSize: 13, textAlign: 'center' }}>
              <Users size={36} color={T.textDim} />
              <p>Nenhum colaborador encontrado.<br />Execute a sincronização com o Vorp System.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${T.border}` }}>
                    {[
                      [<Users key="u" size={11}/>, 'Nome'],
                      [<Briefcase key="b" size={11}/>, 'Cargo'],
                      [<Mail key="m" size={11}/>, 'E-mail'],
                      [<Phone key="p" size={11}/>, 'Telefone'],
                      [null, 'Status'],
                      [null, 'Vertical'],
                      [null, 'Última Sync'],
                    ].map(([icon, label]) => (
                      <th key={String(label)} style={{ padding: '12px 14px', textAlign: 'left', color: T.textDim, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vorpColabs.map(c => (
                    <tr key={c.vorp_id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: T.text }}>{c.nome}</td>
                      <td style={{ padding: '12px 14px', color: T.textSub }}>{c.cargo ?? '—'}</td>
                      <td style={{ padding: '12px 14px', color: T.textSub }}>{c.email ?? '—'}</td>
                      <td style={{ padding: '12px 14px', color: T.textSub }}>{c.telefone ?? '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: c.status?.toLowerCase() === 'ativo' ? T.greenDim : 'rgba(255,255,255,0.05)', color: c.status?.toLowerCase() === 'ativo' ? T.green : T.textDim }}>
                          {c.status ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: T.orangeDim, color: T.orange, textTransform: 'uppercase' }}>
                          {c.vertical ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: T.textDim, fontSize: 11, whiteSpace: 'nowrap' }}>{formatDate(c.synced_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1000px) { .mgmt-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
