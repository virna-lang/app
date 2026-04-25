'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getConsultores, gerarMeses, getVorpProdutos } from '@/lib/api';
import type { Consultor } from '@/lib/supabase';

export const PRODUTOS_PADRAO = ['Aliança', 'Aliança Pro', 'GSA', 'Tração', 'Gestão de Tráfego'];

export interface DashboardFilters {
  month:       string;
  consultantId: string;
  products:    string[];
}

type DashboardTab =
  | 'Visão Geral'
  | 'Conformidade'
  | 'Reuniões'
  | 'Metas'
  | 'NPS / CSAT'
  | 'Churn'
  | 'Time Completo';

interface DashboardContextType {
  activeTab:         DashboardTab;
  setActiveTab:      (tab: DashboardTab) => void;
  consultores:       Consultor[];
  setConsultores:    React.Dispatch<React.SetStateAction<Consultor[]>>;
  meses:             string[];
  loadingConsultores: boolean;
  filters:           DashboardFilters;
  setFilters:        React.Dispatch<React.SetStateAction<DashboardFilters>>;
  availableProducts: string[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeTab,          setActiveTab]          = useState<DashboardTab>('Visão Geral');
  const [consultores,        setConsultores]        = useState<Consultor[]>([]);
  const [loadingConsultores, setLoadingConsultores] = useState(true);
  const [availableProducts,  setAvailableProducts]  = useState<string[]>(PRODUTOS_PADRAO);

  const meses = gerarMeses(6);

  const [filters, setFilters] = useState<DashboardFilters>({
    month:        meses[meses.length - 1],
    consultantId: 'all',
    products:     PRODUTOS_PADRAO,
  });

  // Carrega filtros salvos após mount (evita problema SSR com localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vorp_dashboard_filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (meses.includes(parsed.month)) {
          setFilters({
            month:        parsed.month,
            consultantId: parsed.consultantId ?? 'all',
            products:     parsed.products     ?? PRODUTOS_PADRAO,
          });
        }
      }
    } catch {}
  }, []);

  // Persiste filtros no localStorage sempre que mudam
  useEffect(() => {
    localStorage.setItem('vorp_dashboard_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    getConsultores().then((data) => {
      setConsultores(data);
      setLoadingConsultores(false);
    });
    getVorpProdutos().then((nomes) => {
      if (nomes.length > 0) {
        setAvailableProducts(nomes);
        setFilters(f => ({ ...f, products: nomes }));
      }
    }).catch(() => {});
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        activeTab, setActiveTab,
        consultores, setConsultores,
        meses, loadingConsultores,
        filters, setFilters,
        availableProducts,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
}
