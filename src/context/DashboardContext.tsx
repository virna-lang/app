'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConsultores, gerarMeses, getVorpProdutos } from '@/lib/api';
import type { Consultor } from '@/lib/supabase';

export const PRODUTOS_PADRAO = ['Aliança', 'Aliança Pro', 'GSA', 'Tração', 'Gestão de Tráfego'];

export interface DashboardFilters {
  month: string;
  consultantId: string;
  products: string[];
}

export type DashboardCorrelationMode = 'mine' | 'operation';

type DashboardTab =
  | 'Visão Geral'
  | 'Conformidade'
  | 'Reuniões'
  | 'Metas'
  | 'NPS / CSAT'
  | 'Churn'
  | 'Time Completo';

interface DashboardContextType {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  correlationMode: DashboardCorrelationMode;
  setCorrelationMode: React.Dispatch<React.SetStateAction<DashboardCorrelationMode>>;
  consultores: Consultor[];
  setConsultores: React.Dispatch<React.SetStateAction<Consultor[]>>;
  meses: string[];
  loadingConsultores: boolean;
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  availableProducts: string[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const meses = gerarMeses(6);

  const [activeTab, setActiveTab] = useState<DashboardTab>('Visão Geral');
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loadingConsultores, setLoadingConsultores] = useState(true);
  const [availableProducts, setAvailableProducts] = useState<string[]>(PRODUTOS_PADRAO);
  const [correlationMode, setCorrelationMode] = useState<DashboardCorrelationMode>(() => {
    if (typeof window === 'undefined') return 'mine';
    try {
      const savedMode = localStorage.getItem('vorp_dashboard_correlation_mode');
      return savedMode === 'operation' ? 'operation' : 'mine';
    } catch {
      return 'mine';
    }
  });
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const fallback: DashboardFilters = {
      month: meses[meses.length - 1],
      consultantId: 'all',
      products: PRODUTOS_PADRAO,
    };

    if (typeof window === 'undefined') return fallback;

    try {
      const saved = localStorage.getItem('vorp_dashboard_filters');
      if (!saved) return fallback;

      const parsed = JSON.parse(saved);
      if (!meses.includes(parsed.month)) return fallback;

      return {
        month: parsed.month,
        consultantId: parsed.consultantId ?? 'all',
        products: parsed.products ?? PRODUTOS_PADRAO,
      };
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    localStorage.setItem('vorp_dashboard_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('vorp_dashboard_correlation_mode', correlationMode);
  }, [correlationMode]);

  useEffect(() => {
    getConsultores().then((data) => {
      setConsultores(data);
      setLoadingConsultores(false);
    });

    getVorpProdutos()
      .then((nomes) => {
        if (nomes.length > 0) {
          setAvailableProducts(nomes);
          setFilters((current) => ({ ...current, products: nomes }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        activeTab,
        setActiveTab,
        correlationMode,
        setCorrelationMode,
        consultores,
        setConsultores,
        meses,
        loadingConsultores,
        filters,
        setFilters,
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
