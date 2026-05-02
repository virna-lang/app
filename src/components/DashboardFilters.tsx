'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { ChevronDown, X, Calendar, User, Package } from 'lucide-react';
import { getConsultorLabel } from '@/lib/consultor-label';

function FilterSelect({
  label, icon, value, open, onToggle, children,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="filter-wrap">
      <button className={`filter-btn ${open ? 'active' : ''}`} onClick={onToggle} aria-label={label}>
        <span className="filter-icon">{icon}</span>
        <span className="filter-val">{value}</span>
        <ChevronDown size={13} className={`filter-chevron ${open ? 'open' : ''}`} />
      </button>
      {open && <div className="filter-dropdown">{children}</div>}

      <style jsx>{`
        .filter-wrap { position: relative; }

        .filter-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 12px;
          background: #111827; border: 1px solid #1f2d40;
          border-radius: 8px; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 13px;
          color: #94a3b8; white-space: nowrap;
          transition: all 0.15s;
        }
        .filter-btn:hover { border-color: rgba(252,84,0,0.4); color: #f1f5f9; }
        .filter-btn.active {
          border-color: rgba(252,84,0,0.5);
          background: rgba(252,84,0,0.08);
          color: #FC5400;
        }

        .filter-icon { opacity: 0.5; display: flex; align-items: center; }
        .filter-btn.active .filter-icon { opacity: 1; }
        .filter-val { font-weight: 500; }
        .filter-chevron { opacity: 0.4; transition: transform 0.2s; }
        .filter-chevron.open { transform: rotate(180deg); opacity: 0.8; }

        .filter-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0;
          min-width: 200px;
          max-height: 340px;
          background: #111827; border: 1px solid #1f2d40;
          border-radius: 10px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          z-index: 200; overflow: auto;
          animation: dropIn 0.15s ease-out;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function DashboardFilters() {
  const { profile, hasPermission } = useAuth();
  const { meses, consultores, filters, setFilters, availableProducts, setCorrelationMode } = useDashboard();
  const canSeeAllConsultores = hasPermission('filters.consultores.todos');

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState({ month: '', consultant: '', product: '' });
  const toggle = (key: string) =>
    setOpen(prev => ({ month: false, consultant: false, product: false, [key]: !prev[key] }));

  const closeFilters = () => {
    setOpen({});
    setSearch({ month: '', consultant: '', product: '' });
  };

  const clearFilters = () =>
    setFilters({
      month: meses[meses.length - 1],
      consultantId: canSeeAllConsultores ? 'all' : profile?.consultor_id ?? '__sem_consultor__',
      products: availableProducts,
    });

  useEffect(() => {
    const scopedConsultorId = profile?.consultor_id ?? '__sem_consultor__';
    if (!canSeeAllConsultores && filters.consultantId !== scopedConsultorId) {
      setFilters(f => ({ ...f, consultantId: scopedConsultorId }));
    }
  }, [canSeeAllConsultores, profile?.consultor_id, filters.consultantId, setFilters]);

  const consultantLabel = filters.consultantId === 'all'
    ? 'Todos os consultores'
    : getConsultorLabel(consultores, filters.consultantId, 'full');

  const productLabel = (filters.products?.length ?? availableProducts.length) === availableProducts.length
    ? 'Todos os produtos'
    : `${filters.products?.length ?? 0} selecionados`;

  const filteredMonths = useMemo(() => {
    const term = normalizeText(search.month);
    return term ? meses.filter(m => normalizeText(m).includes(term)) : meses;
  }, [meses, search.month]);

  const consultantOptions = useMemo(
    () => [{ id: 'all', nome: 'Todos os consultores' }, ...consultores.filter(c => c.status === 'Ativo')],
    [consultores],
  );

  const filteredConsultants = useMemo(() => {
    const term = normalizeText(search.consultant);
    if (!term) return consultantOptions;
    return consultantOptions.filter(c => {
      const label = c.id === 'all' ? c.nome : getConsultorLabel(consultores, String(c.id), 'full');
      return normalizeText(label).includes(term);
    });
  }, [consultantOptions, consultores, search.consultant]);

  const filteredProducts = useMemo(() => {
    const term = normalizeText(search.product);
    return term ? availableProducts.filter(p => normalizeText(p).includes(term)) : availableProducts;
  }, [availableProducts, search.product]);

  const hasActiveFilters =
    filters.consultantId !== 'all' ||
    (filters.products?.length ?? availableProducts.length) !== availableProducts.length;

  return (
    <div className="filters-row">

      {/* Mês */}
      <FilterSelect
        label="Mês/Ano" icon={<Calendar size={13}/>}
        value={filters.month} open={!!open.month}
        onToggle={() => toggle('month')}
      >
        <input
          autoFocus
          className="drop-search"
          value={search.month}
          onChange={e => setSearch(prev => ({ ...prev, month: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Escape') closeFilters(); }}
          placeholder="Pesquisar mês..."
        />
        {filteredMonths.length === 0 && <div className="drop-empty">Nenhum mês encontrado</div>}
        {filteredMonths.map(m => (
          <div
            key={m}
            className={`drop-item ${m === filters.month ? 'selected' : ''}`}
            onClick={() => { setFilters(f => ({ ...f, month: m })); closeFilters(); }}
          >
            {m}
          </div>
        ))}
      </FilterSelect>

      {/* Consultor (admin only) */}
      {canSeeAllConsultores && (
        <FilterSelect
          label="Consultor" icon={<User size={13}/>}
          value={consultantLabel} open={!!open.consultant}
          onToggle={() => toggle('consultant')}
        >
          <input
            autoFocus
            className="drop-search"
            value={search.consultant}
            onChange={e => setSearch(prev => ({ ...prev, consultant: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Escape') closeFilters(); }}
            placeholder="Pesquisar consultor..."
          />
          {filteredConsultants.length === 0 && <div className="drop-empty">Nenhum consultor encontrado</div>}
          {filteredConsultants.map(c => (
            <div
              key={c.id}
              className={`drop-item ${String(c.id) === filters.consultantId ? 'selected' : ''}`}
              onClick={() => {
                const nextConsultantId = String(c.id);
                setFilters(f => ({ ...f, consultantId: nextConsultantId }));
                if (nextConsultantId !== 'all') {
                  setCorrelationMode('mine');
                }
                closeFilters();
              }}
            >
              {c.id === 'all' ? c.nome : getConsultorLabel(consultores, String(c.id), 'full')}
            </div>
          ))}
        </FilterSelect>
      )}

      {/* Produtos */}
      <FilterSelect
        label="Produtos" icon={<Package size={13}/>}
        value={productLabel} open={!!open.product}
        onToggle={() => toggle('product')}
      >
        <div className="drop-multi">
          <input
            autoFocus
            className="drop-search"
            value={search.product}
            onChange={e => setSearch(prev => ({ ...prev, product: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Escape') closeFilters(); }}
            placeholder="Pesquisar produto..."
          />
          {filteredProducts.length === 0 && <div className="drop-empty">Nenhum produto encontrado</div>}
          {filteredProducts.map(p => {
            const checked = (filters.products ?? availableProducts).includes(p);
            return (
              <label key={p} className="check-item">
                <div className={`check-box ${checked ? 'checked' : ''}`}>
                  {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span>{p}</span>
                <input type="checkbox" checked={checked} onChange={() =>
                  setFilters(f => ({
                    ...f,
                    products: checked
                      ? f.products.filter(x => x !== p)
                      : [...f.products, p],
                  }))
                } style={{ display: 'none' }}/>
              </label>
            );
          })}
        </div>
      </FilterSelect>

      {/* Limpar */}
      {hasActiveFilters && (
        <button className="clear-btn" onClick={clearFilters}>
          <X size={12}/> Limpar
        </button>
      )}

      <style jsx>{`
        .filters-row {
          display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;
        }

        /* Dropdown items */
        :global(.drop-item) {
          padding: 9px 16px;
          font-family: 'Outfit', sans-serif; font-size: 13px;
          color: #94a3b8; cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        :global(.drop-item:hover)    { background: rgba(252,84,0,0.08); color: #f1f5f9; }
        :global(.drop-item.selected) { color: #FC5400; font-weight: 600; background: rgba(252,84,0,0.06); }
        :global(.drop-search) {
          width: calc(100% - 12px);
          margin: 6px;
          padding: 9px 10px;
          background: rgba(255,255,255,0.035);
          border: 1px solid #1f2d40;
          border-radius: 8px;
          color: #f1f5f9;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          outline: none;
        }
        :global(.drop-search:focus) {
          border-color: rgba(252,84,0,0.6);
          background: rgba(255,255,255,0.055);
        }
        :global(.drop-search::placeholder) { color: #64748b; }
        :global(.drop-empty) {
          padding: 10px 14px 13px;
          color: #64748b;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
        }

        /* Multi-select */
        :global(.drop-multi) { padding: 6px; }
        :global(.drop-multi .drop-search) {
          width: 100%;
          margin: 0 0 6px;
        }
        :global(.check-item) {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 7px; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 13px; color: #94a3b8;
          transition: background 0.12s;
        }
        :global(.check-item:hover)   { background: rgba(255,255,255,0.04); color: #f1f5f9; }
        :global(.check-box) {
          width: 16px; height: 16px; border-radius: 4px;
          border: 1.5px solid #1f2d40; background: #0f1620;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s;
        }
        :global(.check-box.checked)  { background: #FC5400; border-color: #FC5400; }

        /* Limpar */
        .clear-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 11px; border-radius: 8px;
          background: none; border: 1px solid #1f2d40;
          font-family: 'Outfit', sans-serif; font-size: 12px;
          color: #475569; cursor: pointer; transition: all 0.15s; margin-left: 2px;
        }
        .clear-btn:hover {
          border-color: rgba(239,68,68,0.4);
          color: #ef4444; background: rgba(239,68,68,0.06);
        }
      `}</style>
    </div>
  );
}
