'use client';

import React, { useState } from 'react';
import type { Consultor } from '@/lib/supabase';
import { COLORS } from '@/types/dashboard';
import { UserPlus, PackagePlus, ToggleLeft, ToggleRight, Plus } from 'lucide-react';

interface Props {
  consultants: Consultor[];
  products: string[];
  onAddConsultant: (name: string) => void;
  onToggleConsultant: (id: string, currentStatus: 'Ativo' | 'Inativo') => void;
  onAddProduct: (name: string) => void;
}

export default function AdminManagement({
  consultants, products, onAddConsultant, onToggleConsultant, onAddProduct
}: Props) {
  const [newConsultant, setNewConsultant] = useState('');
  const [newProduct, setNewProduct] = useState('');

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

  return (
    <div className="admin-mgmt">
      <header className="mgmt-header">
        <h2>Gestão de Time e Produtos</h2>
        <p>Adicione novos membros ao time ou gerencie o catálogo de produtos oferecidos.</p>
      </header>

      <div className="mgmt-grid">
        {/* Consultants Section */}
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
            {consultants.map(c => (
              <div key={c.id} className={`list-item ${c.status === 'Inativo' ? 'inactive' : ''}`}>
                <div className="item-info">
                  <span className="item-name">{c.nome}</span>
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
            ))}
          </div>
        </section>

        {/* Products Section */}
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
                <span className="product-tag">SKU-{p.substring(0,2).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .admin-mgmt { animation: fadeIn 0.5s ease-out; }
        .mgmt-header { margin-bottom: 30px; }
        .mgmt-header h2 { font-family: var(--font-bebas); font-size: 2rem; color: var(--text-main); margin-bottom: 8px; }
        .mgmt-header p { color: var(--text-muted); font-size: 0.9rem; }
        
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
        .item-name { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
        
        .status-badge { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
        .status-badge.active { background: rgba(30, 144, 128, 0.1); color: var(--status-verde); }
        .status-badge.off { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }
        
        .toggle-btn { background: transparent; border: none; cursor: pointer; display: flex; align-items: center; transition: transform 0.2s; }
        .toggle-btn:hover { transform: scale(1.1); }
        
        .product-tag { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1000px) { .mgmt-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
