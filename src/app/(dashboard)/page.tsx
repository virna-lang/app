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
const VorpSection         = dynamic(() => import('@/components/dashboard/VorpSection'));
const AdminManagement     = dynamic(() => import('@/components/dashboard/AdminManagement'));

export default function Dashboard() {
  const { role } = useAuth();
  const { activeTab, consultores, setConsultores, loadingConsultores, filters: activeFilters, availableProducts: products } = useDashboard();

  const { data: raw, isLoading } = useDashboardData(
    activeFilters.month,
    activeFilters.consultantId,
  );

  const enrich = useCallback(
    (auds: AuditoriaMensal[] | undefined, conf: ViewConformidadeConsultor[] | undefined, tScores: any[] | undefined) => {
      if (!auds) return [];
      const safeConf    = conf     ?? [];
      const safeTScores = tScores  ?? [];
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
        items.forEach(i => { const k = catMap[i.categoria]; if (k) obj[k] = i.score_categoria; });

        const consultor    = consultores.find(c => c.id === a.consultor_id);
        const resultado    = safeTScores.find(t => t.consultor_id === a.consultor_id && t.tipo === 'Resultado');
        const conformidade = safeTScores.find(t => t.consultor_id === a.consultor_id && t.tipo === 'Conformidade');
        const scoreR = resultado?.score ?? 0;
        const scoreC = conformidade?.score ?? 0;
        const scoreGeral = (scoreR > 0 && scoreC > 0)
          ? Math.round(((scoreR + scoreC) / 2) * 10) / 10
          : scoreR || scoreC;

        return { ...obj, consultor_nome: consultor?.nome ?? 'Consultor', score_resultado: scoreR, score_conformidade: scoreC, score_geral: scoreGeral };
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
      currentGoals:    raw.metas ?? [],
      prevGoals:       raw.prevMetas ?? [],
      currentMeetings: Object.values(
        (raw.reunioes ?? []).reduce((acc: Record<string, any>, v: any) => {
          if (!acc[v.consultor_id]) acc[v.consultor_id] = {
            consultor_id: v.consultor_id,
            clientes_ativos: v.total_clientes,
            reunioes_realizadas: v.clientes_com_reuniao,
            pct_reunioes: v.pct_reunioes,
          };
          return acc;
        }, {}),
      ),
      currentNPS: auditorias
        .filter((a: any) => a.nps_nota != null)
        .map((a: any) => ({ id: a.id, consultor_id: a.consultor_id, nota: a.nps_nota ?? 0, mes_ano: a.mes_ano })),
      currentChurn:     raw.churn ?? [],
      viewMetas:        raw.vMetas ?? [],
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
    setConsultores(prev => prev.map(c => c.id === id ? { ...c, status: novoStatus } : c));
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
    ((data.currentAudits?.length ?? 0) === 0 &&
      (data.currentGoals?.length ?? 0) === 0 &&
      (data.currentMeetings?.length ?? 0) === 0 &&
      activeTab !== 'Time Completo');

  return (
    <div className="dash-wrapper">
      <div className="dash-body">
        {isEmpty ? <EmptyState /> : (
          <div className="dash-sections">

            <section id="visao-geral" data-screen-label="01 Visão Geral">
              <SummaryKPIs data={data!} />
            </section>

            <div className="section-divider"/>

            <section id="evolucao" data-screen-label="02 Evolução">
              <EvolutionSection data={data!} />
            </section>

            <div className="section-divider"/>

            <section id="conformidade" data-screen-label="03 Conformidade">
              <CategoryGaps data={data!} />
            </section>

            <div className="section-divider"/>

            <section id="processos" data-screen-label="04 Processos">
              <PerformanceRankings data={data!} />
            </section>

            <div className="section-divider"/>

            <section id="reunioes" data-screen-label="05 Reuniões">
              <MeetingsSection data={data!} />
            </section>

            <div className="section-divider"/>

            <section id="metas" data-screen-label="06 Metas">
              <GoalsSection data={data!} filterProducts={activeFilters.products} />
            </section>

            <div className="section-divider"/>

            <section id="nps" data-screen-label="07 NPS">
              <NPSSection auditorias={data!.currentAudits} />
            </section>

            <div className="section-divider"/>

            <section id="churn" data-screen-label="08 Churn">
              <ChurnSection churn={data!.currentChurn} />
            </section>

            <div className="section-divider"/>

            <section id="correlacao" data-screen-label="09 Correlação">
              <CorrelacaoSection />
            </section>

            <div className="section-divider"/>

            <section id="vorp-system" data-screen-label="10 Vorp System">
              <VorpSection
                consultorNome={activeFilters.consultantId === 'all'
                  ? 'all'
                  : consultores.find(c => c.id === activeFilters.consultantId)?.nome}
              />
            </section>

            {role === 'Administrador' && (
              <>
                <div className="section-divider"/>
                <section id="time-completo" data-screen-label="11 Time Completo">
                  <div className="section-anchor"><h2>Gestão de Time Completo</h2></div>
                  <AdminManagement
                    consultants={consultores}
                    products={products}
                    onAddConsultant={handleAddConsultant}
                    onToggleConsultant={handleToggleConsultant}
                    onAddProduct={() => {}}
                  />
                </section>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .dash-wrapper { display: flex; flex-direction: column; }

        .dash-body {
          padding-bottom: 120px;
        }

        .dash-sections {
          display: flex; flex-direction: column;
        }

        section {
          padding-top: 48px;
        }

        .section-divider {
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            #1f2d40 20%,
            #1f2d40 80%,
            transparent 100%
          );
          margin: 40px 0 0;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

// ── NPS inline component ─────────────────────────────────────────────────
function getSemaphorColor(v: number) {
  if (v >= 85) return COLORS.verde;
  if (v >= 70) return COLORS.primary;
  return COLORS.vermelho;
}

function NPSSection({ auditorias }: { auditorias: any[] }) {
  const { consultores } = useDashboard();
  const comNPS = auditorias.filter(a => a.nps_nota != null);

  if (!comNPS.length) return (
    <div style={{
      background: '#111827', border: '1px solid #1f2d40',
      borderRadius: 14, padding: '40px',
      textAlign: 'center', color: COLORS.textMuted,
      fontFamily: "'Outfit', sans-serif", fontSize: 14,
    }}>
      Nenhum NPS registrado neste mês.
    </div>
  );

  return (
    <div>
      <div className="section-anchor"><h2>NPS por Consultor</h2></div>
      <div className="nps-grid">
        {comNPS.map(a => {
          const npsColor = getSemaphorColor(a.nps_nota ?? 0);
          return (
            <div key={a.id} className="nps-card">
              <div className="nps-top-bar" style={{ background: npsColor }}/>
              <p className="nps-name">
                {consultores.find(c => c.id === a.consultor_id)?.nome ?? 'Consultor'}
              </p>
              <p className="nps-val" style={{ color: npsColor }}>
                {a.nps_nota}
              </p>
              <p className="nps-sub">{a.nps_respostas ?? 0} respostas</p>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .nps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .nps-card {
          background: #111827; border: 1px solid #1f2d40;
          border-radius: 14px; padding: 24px 20px;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .nps-card:hover {
          border-color: rgba(252,84,0,0.25);
          transform: translateY(-2px);
        }
        .nps-top-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 2px; opacity: 0.7;
        }
        .nps-name {
          font-size: 12px; font-weight: 700; color: #94a3b8;
          margin-bottom: 10px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .nps-val {
          font-size: 44px; font-weight: 800; line-height: 1;
          font-family: 'Outfit', sans-serif; margin-bottom: 6px;
        }
        .nps-sub { font-size: 11px; color: #475569; font-weight: 500; }
      `}</style>
    </div>
  );
}
