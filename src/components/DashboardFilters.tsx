'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import type { Consultor } from '@/lib/supabase';
import { ChevronDown, X } from 'lucide-react';

interface Filters {
  month: string;
  consultantId: string;
  products: string[];
}

interface Props {
  onFilterChange: (filters: Filters) => void;
  availableConsultants: Consultor[];
  availableProducts: string[];
}

export default function DashboardFilters({ onFilterChange, availableConsultants, availableProducts }: Props) {
  const { role } = useAuth();
  const { meses } = useDashboard();
  const isAdmin = role === 'Administrador';

  const [filters, setFilters] = useState<Filters>({
    month: meses[meses.length - 1],
    consultantId: 'all',
    products: availableProducts,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState<{ [key: string]: boolean }>({
    month: false,
    consultant: false,
    product: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vorp_dashboard_filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verifica se o mês salvo ainda existe na lista gerada dinamicamente
        if (meses.includes(parsed.month)) {
          setFilters(parsed);
          onFilterChange(parsed);
        } else {
          onFilterChange(filters);
        }
      } catch (e) {
        console.error('Error parsing filters', e);
        onFilterChange(filters);
      }
    } else {
      onFilterChange(filters);
    }
  }, []);

  // Save to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem('vorp_dashboard_filters', JSON.stringify(filters));
    onFilterChange(filters);
  }, [filters]);

  const toggleDropdown = (key: string) => {
    setIsDropdownOpen(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleProductToggle = (product: string) => {
    setFilters(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }));
  };

  const clearFilters = () => {
    const defaultFilters: Filters = {
      month: meses[meses.length - 1],
      consultantId: 'all',
      products: availableProducts,
    };
    setFilters(defaultFilters);
  };

  return (
    <div className="filters-sticky">
      <div className="filters-container">
        <div className="filter-group">
          <label>Mês/Ano</label>
          <div className="select-custom" onClick={() => toggleDropdown('month')}>
            <span>{filters.month}</span>
            <ChevronDown size={14} />
            {isDropdownOpen.month && (
              <div className="dropdown-menu">
                {meses.map(m => (
                  <div 
                    key={m} 
                    className="dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({ ...filters, month: m });
                      setIsDropdownOpen({ ...isDropdownOpen, month: false });
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="filter-group">
            <label>Consultor</label>
            <div className="select-custom" onClick={() => toggleDropdown('consultant')}>
              <span>{filters.consultantId === 'all' ? 'Todos os consultores' : availableConsultants.find(c => String(c.id) === filters.consultantId)?.nome}</span>
              <ChevronDown size={14} />
              {isDropdownOpen.consultant && (
                <div className="dropdown-menu">
                  <div 
                    className="dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({ ...filters, consultantId: 'all' });
                      setIsDropdownOpen({ ...isDropdownOpen, consultant: false });
                    }}
                  >
                    Todos os consultores
                  </div>
                  {availableConsultants.filter(c => c.status === 'Ativo').map(c => (
                    <div 
                      key={c.id} 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters({ ...filters, consultantId: String(c.id) });
                        setIsDropdownOpen({ ...isDropdownOpen, consultant: false });
                      }}
                    >
                      {c.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="filter-group">
          <label>Produtos</label>
          <div className="select-custom" onClick={() => toggleDropdown('product')}>
            <span>{filters.products.length === availableProducts.length ? 'Todos selecionados' : `${filters.products.length} selecionados`}</span>
            <ChevronDown size={14} />
            {isDropdownOpen.product && (
              <div className="dropdown-menu multi-menu" onClick={(e) => e.stopPropagation()}>
                {availableProducts.map(p => (
                  <label key={p} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={filters.products.includes(p)}
                      onChange={() => handleProductToggle(p)}
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="clear-btn" onClick={clearFilters}>
          <X size={14} /> <span>Limpar Filtros</span>
        </button>
      </div>

      <style jsx>{`
        .filters-sticky {
          position: sticky;
          top: 72px; /* Topbar height */
          z-index: 80;
          background: rgba(15, 15, 35, 0.8);
          backdrop-filter: blur(12px);
          padding: 16px 40px;
          border-bottom: 1px solid var(--card-border);
          margin: -40px -40px 40px -40px; /* Offset parent padding */
        }

        .filters-container {
          display: flex;
          align-items: center;
          gap: 24px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-group label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .select-custom {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          padding: 8px 16px;
          border-radius: 6px;
          min-width: 160px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          cursor: pointer;
          position: relative;
          color: var(--text-main);
          transition: border-color 0.2s;
        }

        .select-custom:hover {
          border-color: var(--laranja-vorp);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        .multi-menu {
          min-width: 200px;
          padding: 8px;
        }

        .dropdown-item {
          padding: 10px 16px;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: rgba(252, 84, 0, 0.1);
          color: var(--laranja-vorp);
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .checkbox-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .checkbox-item input {
          accent-color: var(--laranja-vorp);
        }

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
          margin-left: auto;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          color: var(--status-vermelho);
          background: rgba(176, 48, 48, 0.05);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
