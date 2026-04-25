'use client';

import React, { useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { addConsultor, toggleConsultor, getMesAnterior } from '@/lib/api';
import type { AuditoriaMensal, ViewConformidadeConsultor } from '@/lib/supabase';

import SkeletonLoader from '@/components/dashboard/SkeletonLoader';
import EmptyState from '@/components/dashboard/EmptyState';
import { COLORS } from '@/types/dashboard';
import type { Consultor } from '@/lib/supabase';

import SummaryKPIs from '@/components/dashboard/SummaryKPIs';

const EvolutionSection    = dynamic(() => import('@/components/dashboard/EvolutionSection'));
const CategoryGaps        = dynamic(() => import('@/components/dashboard/CategoryGaps'));
const PerformanceRankings = dynamic(() => import('@/components/dashboard/PerformanceRankings'));
const MeetingsSection     = dynamic(() => import('@/components/dashboard/MeetingsSection'));
const GoalsSection        = dynamic(() => import('@/components/dashboard/GoalsSection'));
const ChurnSection        = dynamic(() => import('@/components/dashboard/ChurnSection'));
const CorrelacaoSection   = dynamic(() => import('@/components/dashboard/CorrelacaoSection'));
const AdminManagement     = dynamic(() => import('@/components/dashboard/AdminManagement'));

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg:        '#0f1117',
  bgDeep:    '#0a0b0e',
  border:    '#1a1d24',
  orange:    '#ff5c1a',
  textMuted: '#6b7280',
  textDim:   '#3f4455',
} as const;

// ── Section wrapper com header padronizado ─────────────────────────────────
function SectionWrapper({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-screen-label={label} className="dash-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-accent" />
          <span className="section-title">{title}</span>
        </div>
      </div>
      {children}

      <style jsx>{`
        .dash-section { padding-top: 48px; }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-accent {
          width: 3px; height: 16px;
          background: ${T.orange};
          border-radius: 2px;
        }
        .section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${T.textDim};
        }
      `}</style>
    </section>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { role } = useAuth();
  const {
    activeTab, consultores, setConsultores,
    loadingConsultores, filters: activeFilters,
    availableProducts: products,
  } = useDashboard();

  const { data: raw, isLoading } = useDashboardData(
    activeFilters.month,
    activeFilters.consultantId,
  );

  const enrich = useCallback(
    (
      auds: AuditoriaMensal[] | undefined,
      conf: ViewConformidadeConsultor[] | undefined,
      tScores: any[] | undefined,
    ) => {
      if (!auds) return [];
      const safeConf    = conf    ?? [];
      const safeTScores = tScores ?? [];
      const catMap: Record<string, string> = {
        'ClickUp':         'score_clickup',
        'Drive':           'score_drive',
        'WhatsApp':        'score_whatsapp',
        'Vorp System':     'score_vorp',
        'Dados':           'score_metas',
        'Flags':           'score_flags',
        'Rastreabilidade': 'score_rastreabilidade',
      };

      return auds.map(a => {
        const items = safeConf.filter(c => c.consultor_id === a.consultor_id);
        const obj: any = { ...a };
        items.forEach(i => {
          const k = catMap[i.categoria];
          if (k) obj[k] = i.score_categoria;
        });

        const consultor    = consultores.find(c => c.id === a.consultor_id);
        const resultado    = safeTScores.find(t => t.consultor_id === a.consultor_id && t.tipo === 'Resultado');
        const conformidade = safeTScores.find(t => t.consultor_id === a.consultor_id && t.tipo === 'Conformidade');
        const scoreR = resultado?.score    ?? 0;
        const scoreC = conformidade?.score ?? 0;
        const scoreGeral = (scoreR > 0 && scoreC > 0)
          ? Math.round(((scoreR + scoreC) / 2) * 10) / 10
          : scoreR || scoreC;

        return {
          ...obj,
          consultor_nome:    consultor?.nome ?? 'Consultor',
          score_resultado:   scoreR,
          score_conformidade: scoreC,
          score_geral:       scoreGeral,
        };
      });
    },
    [consultores],
  );

  const data = useMemo(() => {
    if (!raw) return null;
    const auditorias     = enrich(raw.auds,     raw.conf,     raw.tipoScores);
    const prevAuditorias = enrich(raw.prevAuds, raw.prevConf, raw.prevTipoScores);

    return {
      month:           activeFilters.month,
      prevMonth:       getMesAnterior(activeFilters.month),
      currentAudits:   auditorias,
      prevAudits:      prevAuditorias,
      currentGoals:    raw.metas     ?? [],
      prevGoals:       raw.prevMetas ?? [],
      currentMeetings: Object.values(
        (raw.reunioes ?? []).reduce((acc: Record<string, any>, v: any) => {
          if (!acc[v.consultor_id]) acc[v.consultor_id] = {
            consultor_id:        v.consultor_id,
            clientes_ativos:     v.total_clientes,
            reunioes_realizadas: v.clientes_com_reuniao,
            pct_reunioes:        v.pct_reunioes,
          };
          return acc;
        }, {}),
      ),
      currentNPS: auditorias
        .filter((a: any) => a.nps_nota != null)
        .map((a: any) => ({
          id:          a.id,
          consultor_id: a.consultor_id,
          nota:        a.nps_nota ?? 0,
          mes_ano:     a.mes_ano,
        })),
      currentChurn:     raw.churn    ?? [],
      viewMetas:        raw.vMetas   ?? [],
      rankingAtendidos: raw.rankAtend ?? [],
      metasPorProduto:  raw.metasProd ?? [],
    };
  }, [raw, enrich, activeFilters.month]);

  const handleAddConsultant = async (name: string) => {
    const novo = await addConsultor(name);
    if (novo) setConsultores(prev => [...prev, novo]);
  };

  const handleToggleConsultant = async (id: string, currentStatus: 'Ativo' | 'Inativo') => {
    const novoStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    await toggleConsultor(id, novoStatus);
    setConsultores(prev =>
      prev.map(c => c.id === id ? { ...c, status: novoStatus } : c),
    );
  };

  if (loadingConsultores || (isLoading && !data)) {
    return (
      <div className="dash-wrapper">
        <div className="dash-body"><SkeletonLoader /></div>
      </div>
    );
  }

  const isEmpty =
    !data ||
    ((data.currentAudits?.length    ?? 0) === 0 &&
     (data.currentGoals?.length     ?? 0) === 0 &&
     (data.currentMeetings?.length  ?? 0) === 0 &&
     activeTab !== 'Time Completo');

  return (
    <div className="dash-wrapper">
      <div className="dash-body">
        {isEmpty ? <EmptyState /> : (
          <div className="dash-sections">

            {/* 01 Visão Geral — KPIs sem header (são o topo da página) */}
            <section id="visao-geral" data-screen-label="01 Visão Geral" style={{ paddingTop: 32 }}>
              <SummaryKPIs data={data!} />
            </section>

            <div className="section-divider" />

            <SectionWrapper id="evolucao" label="02 Evolução" title="Evolução Histórica da Conformidade">
              <EvolutionSection data={data!} />
            </SectionWrapper>

            <div className="section-divider" />

            <SectionWrapper id="conformidade" label="03 Conformidade" title="Conformidade por Categoria">
              <CategoryGaps data={data!} />
            </SectionWrapper>

            <div className="section-divider" />

            <SectionWrapper id="processos" label="04 Processos" title="Monitoramento de Processos">
              <PerformanceRankings data={data!} />
            </SectionWrapper>

            <div className="section-divider" />

            <SectionWrapper id="reunioes" label="05 Reuniões" title="Ranking de Reuniões Realizadas">
              <MeetingsSection data={data!} />
            </SectionWrapper>

            <div className="section-divider" />

            <SectionWrapper id="metas" label="06 Metas" title="Batimento de Metas">
              <GoalsSection data={data!} filterProducts={activeFilters.products} />
            </SectionWrapper>

            <div className="section-divider" />

            <SectionWrapper id="nps" label="07 NPS" title="NPS por Consultor">
              <NPSSection auditorias={data!.currentAudits} />
            </SectionWrapper>

            <div className="section-divider" />

            <SectionWrapper id="churn" label="08 Churn" title="Monitoramento de Churn">
              <ChurnSection churn={data!.currentChurn} />
            </SectionWrapper>

            <div className="section-divider" />

            <SectionWrapper id="correlacao" label="09 Correlação" title="Correlação por Consultor">
              <CorrelacaoSection />
            </SectionWrapper>

            {role === 'Administrador' && (
              <>
                <div className="section-divider" />
                <SectionWrapper id="time-completo" label="11 Time Completo" title="Gestão de Time e Produtos">
                  <AdminManagement
                    consultants={consultores}
                    products={products}
                    onAddConsultant={handleAddConsultant}
                    onToggleConsultant={handleToggleConsultant}
                    onAddProduct={() => {}}
                  />
                </SectionWrapper>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .dash-wrapper { display: flex; flex-direction: column; }

        .dash-body { padding-bottom: 120px; }

        .dash-sections { display: flex; flex-direction: column; }

        .section-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            ${T.border} 15%,
            ${T.border} 85%,
            transparent 100%
          );
          margin: 40px 0 0;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

// ── NPS inline component ──────────────────────────────────────────────────
function npsAccent(v: number): string {
  if (v >= 85) return '#1d9e75';
  if (v >= 70) return '#ff5c1a';
  return '#e05555';
}
function npsBgFor(v: number): string {
  if (v >= 85) return 'rgba(29,158,117,0.12)';
  if (v >= 70) return 'rgba(255,92,26,0.12)';
  return 'rgba(220,53,69,0.12)';
}

function NPSSection({ auditorias }: { auditorias: any[] }) {
  const { consultores } = useDashboard();
  const comNPS = auditorias.filter(a => a.nps_nota != null);

  if (!comNPS.length) return (
    <div style={{
      background: '#0f1117',
      border: '1px solid #1a1d24',
      borderRadius: 10,
      padding: '40px',
      textAlign: 'center',
      color: '#6b7280',
      fontSize: 14,
    }}>
      Nenhum NPS registrado neste mês.
    </div>
  );

  return (
    <div className="nps-grid">
      {comNPS.map(a => {
        const nota  = a.nps_nota ?? 0;
        const color = npsAccent(nota);
        const bg    = npsBgFor(nota);
        const nome  = consultores.find(c => c.id === a.consultor_id)?.nome ?? 'Consultor';

        return (
          <div key={a.id} className="nps-card">
            {/* barra de semáforo no topo */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 2, background: color,
              borderRadius: '10px 10px 0 0',
            }} />

            <p style={{
              fontSize: 11, fontWeight: 700, color: '#6b7280',
              marginBottom: 10, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {nome}
            </p>

            <p style={{
              fontSize: 44, fontWeight: 700, lineHeight: 1,
              color, marginBottom: 8,
              fontFamily: "'DM Mono', monospace",
            }}>
              {nota}
            </p>

            <span style={{
              display: 'inline-block',
              fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 5,
              background: bg, color,
              letterSpacing: '0.06em',
            }}>
              {a.nps_respostas ?? 0} respostas
            </span>
          </div>
        );
      })}

      <style jsx>{`
        .nps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        .nps-card {
          background: #0f1117;
          border: 1px solid #1a1d24;
          border-radius: 10px;
          padding: 20px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .nps-card:hover {
          border-color: rgba(255,92,26,0.22);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
