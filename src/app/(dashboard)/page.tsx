'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import DashboardFilters from '@/components/DashboardFilters';
import { useDashboard } from '@/context/DashboardContext';

import {
  getAuditoriasMensais,
  getViewReunioes,
  getViewMetas,
  getMetas,
  getChurn,
  getScoresPorTipo,
  addConsultor,
  toggleConsultor,
  labelToMesAno,
  getMesAnterior,
} from '@/lib/api';

import type {
  AuditoriaMensal,
  ViewReunioesConsultor,
  ViewMetasConsultor,
  MetaMensal,
  Churn,
} from '@/lib/supabase';

import SkeletonLoader from '@/components/dashboard/SkeletonLoader';
import EmptyState from '@/components/dashboard/EmptyState';
import AdminManagement from '@/components/dashboard/AdminManagement';
import { COLORS } from '@/types/dashboard';
import type { Consultor } from '@/lib/supabase';
import { getViewConformidade } from '@/lib/api';
import type { ViewConformidadeConsultor } from '@/lib/supabase';

// Refined Components
import SummaryKPIs from '@/components/dashboard/SummaryKPIs';
import CategoryGaps from '@/components/dashboard/CategoryGaps';
import EvolutionSection from '@/components/dashboard/EvolutionSection';
import MeetingsSection from '@/components/dashboard/MeetingsSection';
import GoalsSection from '@/components/dashboard/GoalsSection';
import PerformanceRankings from '@/components/dashboard/PerformanceRankings';
import ChurnSection from '@/components/dashboard/ChurnSection';
import CorrelacaoSection from '@/components/dashboard/CorrelacaoSection';

const PRODUTOS_PADRAO = ['Aliança', 'Aliança Pro', 'GSA', 'Tração', 'Gestão de Tráfego'];

export default function Dashboard() {
  const { role } = useAuth();
  const { activeTab, consultores, setConsultores, meses, loadingConsultores } = useDashboard();

  const [products] = useState<string[]>(PRODUTOS_PADRAO);
  const [loading, setLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    month: meses[meses.length - 1],
    consultantId: 'all',
    products: PRODUTOS_PADRAO,
  });

  // ─── Dados do Supabase ──────────────────────────────────────────────────────
  const [auditorias, setAuditorias]     = useState<AuditoriaMensal[]>([]);
  const [prevAuditorias, setPrevAuds]   = useState<AuditoriaMensal[]>([]);
  const [viewReunioes, setViewReunioes] = useState<ViewReunioesConsultor[]>([]);
  const [viewMetas, setViewMetas]       = useState<ViewMetasConsultor[]>([]);
  const [metas, setMetas]               = useState<MetaMensal[]>([]);
  const [prevMetas, setPrevMetas]       = useState<MetaMensal[]>([]);
  const [churn, setChurn]               = useState<Churn[]>([]);

  // ─── Fetch de dados ao mudar filtros ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { month, consultantId } = activeFilters;
    const mesAno     = labelToMesAno(month);
    const prevLabel  = getMesAnterior(month);
    const prevMesAno = prevLabel ? labelToMesAno(prevLabel) : null;

    const [auds, reunioes, vMetas, mt, ch, conf, tipoScores] = await Promise.all([
      getAuditoriasMensais(mesAno, consultantId),
      getViewReunioes(mesAno, consultantId),
      getViewMetas(mesAno, consultantId),
      getMetas(mesAno),
      getChurn(mesAno),
      getViewConformidade(mesAno, consultantId),
      getScoresPorTipo(mesAno, consultantId),
    ]);

    let prevAuds: AuditoriaMensal[] = [];
    let prevMt: MetaMensal[] = [];
    let prevConf: ViewConformidadeConsultor[] = [];
    let prevTipoScores: { consultor_id: string; tipo: string; score: number }[] = [];
    if (prevMesAno) {
      const results = await Promise.all([
        getAuditoriasMensais(prevMesAno, consultantId),
        getMetas(prevMesAno),
        getViewConformidade(prevMesAno, consultantId),
        getScoresPorTipo(prevMesAno, consultantId),
      ]);
      prevAuds = results[0];
      prevMt   = results[1];
      prevConf = results[2];
      prevTipoScores = results[3];
    }

    // Merge Conformidade into Audits
    const mapConf = (a: AuditoriaMensal, cData: ViewConformidadeConsultor[]) => {
      const items = cData.filter(c => c.consultor_id === a.consultor_id);
      const obj: any = { ...a };
      const catMap: Record<string, string> = {
        'ClickUp': 'score_clickup',
        'Drive': 'score_drive',
        'WhatsApp': 'score_whatsapp',
        'Vorp System': 'score_vorp',
        'Dados': 'score_metas',
        'Flags': 'score_flags',
        'Rastreabilidade': 'score_rastreabilidade'
      };
      let total = 0;
      let count = 0;
      items.forEach(i => {
        const key = catMap[i.categoria];
        if (key) {
          obj[key] = i.score_categoria;
          total += i.score_categoria;
          count++;
        }
      });
      obj.score_geral = count > 0 ? total / count : 0;
      return obj;
    };

    const withExtra = (a: AuditoriaMensal, cData: ViewConformidadeConsultor[], tScores: typeof tipoScores) => {
      const consultor    = consultores.find(c => c.id === a.consultor_id);
      const resultado    = tScores.find(t => t.consultor_id === a.consultor_id && t.tipo === 'Resultado');
      const conformidade = tScores.find(t => t.consultor_id === a.consultor_id && t.tipo === 'Conformidade');
      const scoreR = resultado?.score   ?? 0;
      const scoreC = conformidade?.score ?? 0;
      // score_geral = média simples dos dois tipos (cada tipo tem peso igual)
      const scoreGeral = (scoreR > 0 && scoreC > 0)
        ? Math.round(((scoreR + scoreC) / 2) * 10) / 10
        : scoreR || scoreC;
      return {
        ...mapConf(a, cData),
        consultor_nome: consultor?.nome ?? 'Consultor',
        score_resultado:    scoreR,
        score_conformidade: scoreC,
        score_geral:        scoreGeral,
      };
    };
    setAuditorias(auds.map(a => withExtra(a, conf, tipoScores)));
    setPrevAuds(prevAuds.map(a => withExtra(a, prevConf, prevTipoScores)));
    setViewReunioes(reunioes);
    setViewMetas(vMetas);
    setMetas(mt);
    setPrevMetas(prevMt);
    setChurn(ch);
    setLoading(false);
  }, [activeFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Handlers de admin ─────────────────────────────────────────────────────
  const handleAddConsultant = async (name: string) => {
    const novo = await addConsultor(name);
    if (novo) setConsultores(prev => [...prev, novo]);
  };

  const handleToggleConsultant = async (id: string, currentStatus: 'Ativo' | 'Inativo') => {
    const novoStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    await toggleConsultor(id, novoStatus);
    setConsultores(prev =>
      prev.map(c => c.id === id ? { ...c, status: novoStatus } : c)
    );
  };

  const handleAddProduct = (_name: string) => {
    // Produtos são fixos no sistema; reservado para expansão futura
  };

  // ─── Dados computados ──────────────────────────────────────────────────────
  const data = useMemo(() => {
    const prevLabel = getMesAnterior(activeFilters.month);

    // Reuniões: soma dos percentuais das views
    const totalReunioes = viewReunioes.reduce((a, v) => a + v.clientes_com_reuniao, 0);
    const totalClientes = viewReunioes.reduce((a, v) => a + v.total_clientes, 0);
    const pctReunioes = totalClientes > 0 ? (totalReunioes / totalClientes) * 100 : 0;

    // NPS: vem da tabela auditoria_mensal
    const npsItems = auditorias.filter(a => a.nps_nota != null);
    const npsMedia = npsItems.length > 0
      ? npsItems.reduce((s, a) => s + (a.nps_nota ?? 0), 0) / npsItems.length
      : 0;


    return {
      month: activeFilters.month,
      prevMonth: prevLabel,
      currentAudits: auditorias,
      prevAudits: prevAuditorias,
      currentGoals: metas,
      prevGoals: prevMetas,
      currentMeetings: viewReunioes.map(v => ({
        consultor_id: v.consultor_id,
        clientes_ativos: v.total_clientes,
        reunioes_realizadas: v.clientes_com_reuniao,
        pct_reunioes: v.pct_reunioes
      })),
      currentNPS: auditorias
        .filter(a => a.nps_nota != null)
        .map(a => ({
          id: a.id,
          consultor_id: a.consultor_id,
          nota: a.nps_nota ?? 0,
          mes_ano: a.mes_ano
        })),
      currentChurn: churn,
      viewMetas,
    };
  }, [auditorias, prevAuditorias, metas, prevMetas, viewReunioes, viewMetas, churn, activeFilters.month]);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loadingConsultores || loading) {
    return (
      <div className="dashboard-wrapper">
        <DashboardFilters
          onFilterChange={() => {}}
          availableConsultants={consultores}
          availableProducts={products}
        />
        <div className="dashboard-body"><SkeletonLoader /></div>
      </div>
    );
  }

  const isEmpty =
    data.currentAudits.length === 0 &&
    data.currentGoals.length === 0 &&
    data.currentMeetings.length === 0 &&
    activeTab !== 'Time Completo';

  const renderContent = () => {
    if (isEmpty) return <EmptyState />;

    return (
      <div className="unified-dashboard">
        <section id="visao-geral" className="dashboard-section">
          <SummaryKPIs data={data} />
        </section>

        <div className="section-separator" />

        <section id="evolucao" className="dashboard-section">
           <EvolutionSection data={data} />
        </section>

        <div className="section-separator" />

        <section id="conformidade" className="dashboard-section">
           <CategoryGaps data={data} />
        </section>

        <div className="section-separator" />

        <section id="processos" className="dashboard-section">
           <PerformanceRankings data={data} />
        </section>

        <div className="section-separator" />

        <section id="reunioes" className="dashboard-section">
           <MeetingsSection data={data} />
        </section>

        <div className="section-separator" />

        <section id="metas" className="dashboard-section">
           <GoalsSection data={data} filterProducts={activeFilters.products} />
        </section>

        <div className="section-separator" />

        <section id="nps" className="dashboard-section">
           <NPSSupabase auditorias={data.currentAudits} />
        </section>

        <div className="section-separator" />

        <section id="churn" className="dashboard-section">
           <ChurnSection churn={data.currentChurn} />
        </section>

        <div className="section-separator" />

        <section id="correlacao" className="dashboard-section">
           <CorrelacaoSection />
        </section>

        {role === 'Administrador' && (
          <>
            <div className="section-separator" />
            <section id="time-completo" className="dashboard-section">
               <div className="section-anchor"><h2>Gestão de Time Completo</h2></div>
               <AdminManagement
                consultants={consultores}
                products={products}
                onAddConsultant={handleAddConsultant}
                onToggleConsultant={handleToggleConsultant}
                onAddProduct={handleAddProduct}
              />
            </section>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper">
      <DashboardFilters
        availableConsultants={consultores}
        availableProducts={products}
        onFilterChange={(f) => setActiveFilters({ month: f.month, consultantId: f.consultantId, products: f.products })}
      />
      <div className="dashboard-body">{renderContent()}</div>
      <style jsx>{`
        .dashboard-wrapper { display: flex; flex-direction: column; }
        .dashboard-body { display: flex; flex-direction: column; padding-bottom: 100px; }
        .unified-dashboard { display: flex; flex-direction: column; gap: 0; }
        .dashboard-section { padding-top: 40px; }
        .section-separator { height: 1px; background: linear-gradient(90deg, transparent, var(--card-border), transparent); margin: 60px 0; opacity: 0.5; }
      `}</style>
    </div>
  );
}

function getSemaphorColor(v: number) {
  if (v >= 85) return COLORS.verde;
  if (v >= 70) return COLORS.primary;
  return COLORS.vermelho;
}

function NPSSupabase({ auditorias }: { auditorias: AuditoriaMensal[] }) {
  const { consultores } = useDashboard();
  const comNPS = auditorias.filter(a => a.nps_nota != null);

  if (!comNPS.length) return (
    <div className="card" style={{ padding: '40px', textAlign: 'center', color: COLORS.textMuted }}>
      Nenhum NPS registrado neste mês.
    </div>
  );

  return (
    <div className="nps-section section-block">
      <div className="section-anchor">
          <h2>NPS por Consultor</h2>
      </div>
      <div className="nps-grid">
        {comNPS.map(a => (
          <div key={a.id} className="card nps-card glow-on-hover">
            <p className="cons-nome">{consultores.find(c => c.id === a.consultor_id)?.nome ?? 'Consultor'}</p>
            <p className="nps-val" style={{ color: getSemaphorColor((a.nps_nota ?? 0)) }}>
              {a.nps_nota}
            </p>
            <p className="sub">{a.nps_respostas ?? 0} respostas</p>
          </div>
        ))}
      </div>
      <style jsx>{`
        .nps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
        .nps-card { padding: 30px; background: var(--glass-bg); backdrop-filter: blur(10px); }
        .glow-on-hover:hover { box-shadow: 0 0 20px rgba(252, 84, 0, 0.1); transform: translateY(-2px); border-color: var(--laranja-vorp); }
        .cons-nome { font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-bottom: 8px; }
        .nps-val { font-family: var(--font-bebas); font-size: 3.5rem; line-height: 1; }
        .sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; font-weight: 600; }
      `}</style>
    </div>
  );
}
