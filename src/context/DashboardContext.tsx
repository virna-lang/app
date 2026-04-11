'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getConsultores, gerarMeses } from '@/lib/api';
import type { Consultor } from '@/lib/supabase';

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
  consultores: Consultor[];
  setConsultores: React.Dispatch<React.SetStateAction<Consultor[]>>;
  meses: string[];
  loadingConsultores: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('Visão Geral');
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loadingConsultores, setLoadingConsultores] = useState(true);

  const meses = gerarMeses(6);

  useEffect(() => {
    getConsultores().then((data) => {
      setConsultores(data);
      setLoadingConsultores(false);
    });
  }, []);

  return (
    <DashboardContext.Provider
      value={{ activeTab, setActiveTab, consultores, setConsultores, meses, loadingConsultores }}
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
