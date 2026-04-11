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

    const [auds, reunioes, vMetas, mt, ch] = await Promise.all([
      getAuditoriasMensais(mesAno, consultantId),
      getViewReunioes(mesAno, consultantId),
      getViewMetas(mesAno, consultantId),
      getMetas(mesAno),
      getChurn(mesAno),
    ]);

    let prevAuds: AuditoriaMensal[] = [];
    let prevMt: MetaMensal[] = [];
    if (prevMesAno) {
      [prevAuds, prevMt] = await Promise.all([
        getAuditoriasMensais(prevMesAno, consultantId),
        getMetas(prevMesAno),
      ]);
    }

    setAuditorias(auds);
    setPrevAuds(prevAuds);
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
      // Auditorias
      currentAudits: auditorias,
      prevAudits: prevAuditorias,
      // Metas
      currentGoals: metas,
      prevGoals: prevMetas,
      // Reuniões (view)
      viewReunioes,
      pctReunioes,
      // Metas (view)
      viewMetas,
      // NPS
      npsMedia,
      npsItems,
      // Churn
      currentChurn: churn,
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
    data.viewReunioes.length === 0 &&
    activeTab !== 'Time Completo';

  const renderContent = () => {
    if (isEmpty) return <EmptyState />;

    switch (activeTab) {
      case 'Visão Geral':
        return <SummaryKPIsSupabase data={data} />;
      case 'Conformidade':
        return <ConformidadeSupabase auditorias={data.currentAudits} consultores={consultores} mesAno={labelToMesAno(activeFilters.month)} />;
      case 'Reuniões':
        return <ReunioesSupabase viewReunioes={data.viewReunioes} consultores={consultores} />;
      case 'Metas':
        return <MetasSupabase viewMetas={data.viewMetas} filteredProducts={activeFilters.products} />;
      case 'NPS / CSAT':
        return <NPSSupabase auditorias={data.currentAudits} />;
      case 'Churn':
        return <ChurnSupabase churn={data.currentChurn} />;
      case 'Time Completo':
        return (
          <AdminManagement
            consultants={consultores}
            products={products}
            onAddConsultant={handleAddConsultant}
            onToggleConsultant={handleToggleConsultant}
            onAddProduct={handleAddProduct}
          />
        );
      default:
        return <SummaryKPIsSupabase data={data} />;
    }
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
        .dashboard-body { display: flex; flex-direction: column; gap: 40px; padding-bottom: 80px; }
      `}</style>
    </div>
  );
}

// ─── Mini-componentes inline de KPIs ─────────────────────────────────────────

function getSemaphorColor(v: number) {
  if (v >= 85) return COLORS.verde;
  if (v >= 70) return COLORS.primary;
  return COLORS.vermelho;
}

function SummaryKPIsSupabase({ data }: { data: any }) {
  const pctReunioes: number = data.pctReunioes ?? 0;
  const nps: number = data.npsMedia ?? 0;

  // Conformidade: média dos scores calculados pela view_conformidade (quando populado)
  // Por ora, exibe "--" se não há auditorias
  const hasAudits = data.currentAudits.length > 0;

  return (
    <div className="summary-kpis">
      <div className="card kpi-card card-border-top">
        <label>Conformidade Geral</label>
        <div className="val-row">
          <span className="val-big">{hasAudits ? '—' : '—'}</span>
          <span style={{ color: COLORS.textMuted, fontSize: '0.75rem' }}>
            {hasAudits ? `${data.currentAudits.length} auditorias` : 'Sem dados'}
          </span>
        </div>
      </div>

      <div className="card kpi-card card-border-top">
        <label>Clientes Ativos</label>
        <div className="val-row">
          <span className="val-big">
            {data.currentAudits.reduce((s: number, a: AuditoriaMensal) => s + a.clientes_ativos_real, 0) || '—'}
          </span>
        </div>
      </div>

      <div className="card kpi-card card-border-top">
        <label>% de Reuniões Realizadas</label>
        <div className="val-row">
          <span className="val-big">{pctReunioes > 0 ? `${pctReunioes.toFixed(0)}%` : '—'}</span>
        </div>
        <div className="mini-progress">
          <div className="fill" style={{ width: `${pctReunioes}%`, background: getSemaphorColor(pctReunioes) }} />
        </div>
      </div>

      <div className="card kpi-card card-border-top">
        <label>NPS Médio do Mês</label>
        <div className="val-row">
          <span className="val-big">{nps > 0 ? nps.toFixed(0) : '—'}</span>
          {nps > 0 && (
            <span className="badge" style={{
              background: nps >= 90 ? COLORS.verde + '20' : nps >= 75 ? COLORS.primary + '20' : COLORS.vermelho + '20',
              color: nps >= 90 ? COLORS.verde : nps >= 75 ? COLORS.primary : COLORS.vermelho,
            }}>
              {nps >= 90 ? 'Excelente' : nps >= 75 ? 'Bom' : 'Atenção'}
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .summary-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .kpi-card { display: flex; flex-direction: column; padding: 24px; position: relative; overflow: hidden; }
        .kpi-card label { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; }
        .val-row { display: flex; align-items: baseline; gap: 8px; justify-content: space-between; }
        .val-big { font-family: var(--font-bebas); font-size: 2.8rem; line-height: 1; color: var(--text-main); }
        .mini-progress { height: 4px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 12px; overflow: hidden; }
        .fill { height: 100%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .badge { font-size: 0.6rem; font-weight: 900; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        @media (max-width: 1000px) { .summary-kpis { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}

function ReunioesSupabase({ viewReunioes, consultores }: {
  viewReunioes: ViewReunioesConsultor[];
  consultores: import('@/lib/supabase').Consultor[];
}) {
  if (!viewReunioes.length) return (
    <div className="card empty-section">
      <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: '40px' }}>
        Nenhuma reunião registrada neste mês.
      </p>
    </div>
  );

  return (
    <div className="reunioes-section">
      <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', marginBottom: '16px' }}>Reuniões por Consultor</h3>
      <div className="reunioes-grid">
        {viewReunioes.map(r => (
          <div key={r.consultor_id} className="card reuniao-card">
            <p className="cons-nome">{r.consultor}</p>
            <p className="pct-val" style={{ color: getSemaphorColor(r.pct_reunioes) }}>
              {r.pct_reunioes.toFixed(0)}%
            </p>
            <p className="sub">{r.clientes_com_reuniao}/{r.total_clientes} clientes</p>
            <div className="prog-bar">
              <div style={{ width: `${r.pct_reunioes}%`, background: getSemaphorColor(r.pct_reunioes) }} />
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .reunioes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
        .reuniao-card { padding: 20px; }
        .cons-nome { font-weight: 700; font-size: 0.9rem; margin-bottom: 8px; color: var(--text-main); }
        .pct-val { font-family: var(--font-bebas); font-size: 2.4rem; line-height: 1; }
        .sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
        .prog-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 12px; overflow: hidden; }
        .prog-bar div { height: 100%; transition: width 0.5s; }
      `}</style>
    </div>
  );
}

function MetasSupabase({ viewMetas, filteredProducts }: {
  viewMetas: ViewMetasConsultor[];
  filteredProducts: string[];
}) {
  const filtered = viewMetas.filter(m => filteredProducts.includes(m.produto));

  if (!filtered.length) return (
    <div className="card" style={{ padding: '40px', textAlign: 'center', color: COLORS.textMuted }}>
      Nenhuma meta registrada neste mês.
    </div>
  );

  return (
    <div className="metas-section">
      <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', marginBottom: '16px' }}>Metas por Consultor</h3>
      <div className="metas-grid">
        {filtered.map((m, i) => (
          <div key={`${m.consultor_id}-${m.produto}-${i}`} className="card meta-card">
            <p className="cons-nome">{m.consultor}</p>
            <p className="produto-badge">{m.produto}</p>
            <p className="pct-val" style={{ color: getSemaphorColor(m.pct_batimento) }}>
              {m.pct_batimento.toFixed(0)}%
            </p>
            <p className="sub">{m.metas_batidas}/{m.total_metas} metas batidas</p>
          </div>
        ))}
      </div>
      <style jsx>{`
        .metas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
        .meta-card { padding: 20px; }
        .cons-nome { font-weight: 700; font-size: 0.9rem; color: var(--text-main); margin-bottom: 4px; }
        .produto-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--laranja-vorp); letter-spacing: 0.08em; margin-bottom: 8px; }
        .pct-val { font-family: var(--font-bebas); font-size: 2.4rem; line-height: 1; }
        .sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
      `}</style>
    </div>
  );
}

function NPSSupabase({ auditorias }: { auditorias: AuditoriaMensal[] }) {
  const comNPS = auditorias.filter(a => a.nps_nota != null);

  if (!comNPS.length) return (
    <div className="card" style={{ padding: '40px', textAlign: 'center', color: COLORS.textMuted }}>
      Nenhum NPS registrado neste mês.
    </div>
  );

  return (
    <div className="nps-section">
      <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', marginBottom: '16px' }}>NPS por Consultor</h3>
      <div className="nps-grid">
        {comNPS.map(a => (
          <div key={a.id} className="card nps-card">
            <p className="cons-nome">{a.consultor_id}</p>
            <p className="nps-val" style={{ color: getSemaphorColor((a.nps_nota ?? 0)) }}>
              {a.nps_nota}
            </p>
            <p className="sub">{a.nps_respostas ?? 0} respostas</p>
          </div>
        ))}
      </div>
      <style jsx>{`
        .nps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 16px; }
        .nps-card { padding: 20px; }
        .cons-nome { font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-bottom: 8px; }
        .nps-val { font-family: var(--font-bebas); font-size: 2.8rem; line-height: 1; }
        .sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
      `}</style>
    </div>
  );
}

function ChurnSupabase({ churn }: { churn: Churn[] }) {
  if (!churn.length) return (
    <div className="card" style={{ padding: '40px', textAlign: 'center', color: COLORS.textMuted }}>
      Nenhum churn registrado neste mês. 🎉
    </div>
  );

  return (
    <div className="churn-section">
      <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', marginBottom: '16px' }}>
        Churn — {churn.length} {churn.length === 1 ? 'ocorrência' : 'ocorrências'}
      </h3>
      <div className="churn-list">
        {churn.map(c => (
          <div key={c.id} className="card churn-card">
            <div className="churn-header">
              <span className="motivo-badge">{c.motivo}</span>
              {c.receita_perdida && (
                <span className="receita">
                  R$ {c.receita_perdida.toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            {c.detalhes && <p className="detalhes">{c.detalhes}</p>}
          </div>
        ))}
      </div>
      <style jsx>{`
        .churn-list { display: flex; flex-direction: column; gap: 12px; }
        .churn-card { padding: 20px; }
        .churn-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .motivo-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; background: rgba(176,48,48,0.15); color: var(--status-vermelho); letter-spacing: 0.08em; }
        .receita { font-family: var(--font-bebas); font-size: 1.2rem; color: var(--status-vermelho); }
        .detalhes { font-size: 0.85rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

function ConformidadeSupabase({ auditorias, consultores, mesAno }: {
  auditorias: AuditoriaMensal[];
  consultores: Consultor[];
  mesAno: string;
}) {
  const [viewData, setViewData] = React.useState<ViewConformidadeConsultor[]>([]);

  React.useEffect(() => {
    getViewConformidade(mesAno).then(setViewData);
  }, [mesAno]);

  if (!viewData.length && !auditorias.length) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: COLORS.textMuted }}>
        Nenhuma auditoria registrada neste mês.
      </div>
    );
  }

  const porConsultor: Record<string, ViewConformidadeConsultor[]> = {};
  viewData.forEach(v => {
    if (!porConsultor[v.consultor_id]) porConsultor[v.consultor_id] = [];
    porConsultor[v.consultor_id].push(v);
  });

  return (
    <div className="conformidade-section">
      <h3 style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.8rem', marginBottom: '16px' }}>Conformidade por Consultor</h3>
      {Object.entries(porConsultor).map(([consultorId, itens]) => (
        <div key={consultorId} className="card cons-block">
          <p className="cons-nome">{itens[0]?.consultor ?? consultorId}</p>
          <div className="cat-grid">
            {itens.map(i => (
              <div key={i.categoria} className="cat-item">
                <span className="cat-label">{i.categoria}</span>
                <span className="cat-score" style={{ color: getSemaphorColor(i.score_categoria) }}>
                  {i.score_categoria.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!viewData.length && auditorias.length > 0 && (
        <div className="card" style={{ padding: '24px', color: COLORS.textMuted, fontSize: '0.85rem' }}>
          {auditorias.length} auditoria(s) registrada(s). A view de conformidade será exibida após o banco processar os dados.
        </div>
      )}
      <style jsx>{`
        .cons-block { padding: 20px; margin-bottom: 12px; }
        .cons-nome { font-weight: 700; font-size: 1rem; color: var(--text-main); margin-bottom: 16px; }
        .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap: 12px; }
        .cat-item { display: flex; flex-direction: column; gap: 4px; }
        .cat-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.08em; }
        .cat-score { font-family: var(--font-bebas); font-size: 2rem; line-height: 1; }
      `}</style>
    </div>
  );
}
