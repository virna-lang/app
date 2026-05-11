'use client';

import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Database,
  Flag,
  FolderKanban,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Target,
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { labelToMesAno } from '@/lib/api';
import { getConsultorLabel } from '@/lib/consultor-label';
import {
  getCorrelationOverview,
  type CorrelationMode,
  type CorrelationCoverageMetric,
  type CorrelationOverview,
  type CorrelationProjectRiskItem,
  type CorrelationConsultorScore,
  type CorrelationWeakPointConsultor,
} from '@/lib/correlation';

const T = {
  bg: '#0f1117',
  bgDeep: '#0a0b0e',
  border: '#1a1d24',
  orange: '#ff5c1a',
  green: '#1d9e75',
  red: '#e05555',
  blue: '#4fc3f7',
  yellow: '#f59e0b',
  text: '#e2e4e9',
  textSub: '#9aa0b0',
  textDim: '#3f4455',
  mono: "'DM Mono', monospace",
} as const;

function pct(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(1)}%`;
}

function deltaLabel(value: number | null) {
  if (value == null) return 'Sem base anterior';
  const signal = value > 0 ? '+' : '';
  return `${signal}${value.toFixed(1)} p.p. vs. mês anterior`;
}

function currency(value: number | null | undefined) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function healthLabel(value: number | null) {
  if (value == null) return 'Sem score';
  return value <= 4 ? `${value.toFixed(1)}/4` : `${value.toFixed(1)} pts`;
}

function statusTone(status: CorrelationOverview['resumoStatus']) {
  if (status === 'Saudavel') return { color: T.green, bg: 'rgba(29,158,117,0.14)', border: 'rgba(29,158,117,0.28)' };
  if (status === 'Critica') return { color: T.red, bg: 'rgba(224,85,85,0.12)', border: 'rgba(224,85,85,0.24)' };
  return { color: T.yellow, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.24)' };
}

function riskTone(score: number) {
  if (score >= 5) return { color: T.red, label: 'Crítico' };
  if (score >= 3) return { color: T.yellow, label: 'Atenção' };
  return { color: T.green, label: 'Controlado' };
}

function coverageTone(value: number) {
  if (value >= 85) return T.green;
  if (value >= 60) return T.yellow;
  return T.red;
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  helper,
  breakdown,
  consultores: consultoresBreakdown,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  helper?: string;
  breakdown?: CorrelationConsultorScore[];
  consultores?: { id: string; nome: string }[];
}) {
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasBreakdown = breakdown && breakdown.length > 0 && consultoresBreakdown && consultoresBreakdown.length > 0;

  const rows = hasBreakdown
    ? [...breakdown!]
        .filter(r => r.score_conformidade != null)
        .map(r => ({
          nome: consultoresBreakdown!.find(c => c.id === r.consultor_id)?.nome ?? r.consultor_id,
          score: r.score_conformidade!,
        }))
        .sort((a, b) => b.score - a.score)
    : [];

  return (
    <div
      className="kpi-card"
      style={{ position: 'relative', cursor: hasBreakdown ? 'default' : undefined }}
      onMouseEnter={() => {
        if (hasBreakdown) {
          if (timerRef.current) clearTimeout(timerRef.current);
          setHovered(true);
        }
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => setHovered(false), 120);
      }}
    >
      <div className="kpi-icon" style={{ color: accent }}>{icon}</div>
      <div className="kpi-copy">
        <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {label}
          {hasBreakdown && (
            <span style={{ fontSize: 9, color: T.textDim, fontWeight: 500, letterSpacing: '0.03em' }}>
              (passe o cursor)
            </span>
          )}
        </div>
        <div className="kpi-value" style={{ color: accent }}>{value}</div>
        {helper && <div className="kpi-helper">{helper}</div>}
      </div>

      {hasBreakdown && hovered && rows.length > 0 && (
        <div
          onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current); setHovered(true); }}
          onMouseLeave={() => { timerRef.current = setTimeout(() => setHovered(false), 120); }}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            background: T.bgDeep, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: '12px 0', minWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '0 14px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textDim }}>
            % Conformidade por Consultor
          </div>
          {rows.map((r, i) => {
            const barColor = r.score >= 80 ? T.green : r.score >= 60 ? '#f59e0b' : T.red;
            return (
              <div key={i} style={{ padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: T.textSub, minWidth: 130, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.nome}
                </span>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(r.score, 100)}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: barColor, minWidth: 40, textAlign: 'right', fontFamily: T.mono }}>
                  {r.score.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CoverageCard({
  label,
  metric,
  icon,
  helper,
}: {
  label: string;
  metric: CorrelationCoverageMetric;
  icon: React.ReactNode;
  helper: string;
}) {
  const accent = coverageTone(metric.coberturaPct);

  return (
    <div className="coverage-card">
      <div className="coverage-top">
        <span className="coverage-icon" style={{ color: accent }}>{icon}</span>
        <span className="coverage-label">{label}</span>
        <span className="coverage-pct" style={{ color: accent }}>{metric.coberturaPct.toFixed(1)}%</span>
      </div>
      <div className="coverage-track">
        <div className="coverage-fill" style={{ width: `${Math.max(metric.coberturaPct, 2)}%`, background: accent }} />
      </div>
      <div className="coverage-helper">{helper}</div>
    </div>
  );
}

function WeakPointRow({
  categoria,
  pergunta,
  notaPct,
  qtdAvaliados,
  qtdConformes,
  impactoHeadline,
  consequencias = [],
  consultoresDetalhe = [],
  consultoresLabel,
}: {
  categoria: string;
  pergunta: string;
  notaPct: number;
  qtdAvaliados: number;
  qtdConformes: number;
  impactoHeadline?: string;
  consequencias?: string[];
  /** Detalhe ordenado por consultor (já vem desc por naoConformesPct). */
  consultoresDetalhe?: CorrelationWeakPointConsultor[];
  /** Função para resolver consultor_id → nome legível. */
  consultoresLabel: (id: string) => string;
}) {
  const [origemAberta, setOrigemAberta] = useState(false);
  // % de NÃO-conformidade — é essa a leitura "impacto" da carteira.
  const naoConformesPct = qtdAvaliados > 0
    ? ((qtdAvaliados - qtdConformes) / qtdAvaliados) * 100
    : Math.max(0, 100 - notaPct);

  return (
    <div className="weak-row">
      <div className="weak-row-top">
        <span className="weak-cat">{categoria}</span>
        <span className="weak-pct" title={`Conformidade do item: ${notaPct.toFixed(1)}%`}>
          {naoConformesPct.toFixed(0)}% fora
        </span>
      </div>

      <div className="weak-bar-track">
        <div className="weak-bar-fill" style={{ width: `${Math.max(naoConformesPct, 2)}%` }} />
      </div>

      {impactoHeadline ? (
        <div className="weak-headline">{impactoHeadline}</div>
      ) : (
        <div className="weak-pergunta">{pergunta}</div>
      )}

      {qtdAvaliados > 0 && (
        <div
          className="weak-evidencia"
          title={`Pergunta original na auditoria:\n"${pergunta}"`}
          style={{ cursor: 'help' }}
        >
          Base: <strong>{qtdAvaliados - qtdConformes}</strong> de <strong>{qtdAvaliados}</strong> avaliado(s) fora de conformidade <span className="weak-help-icon">ⓘ</span>
        </div>
      )}

      {consequencias.length > 0 && (
        <div className="weak-consequencias">
          <span className="weak-consequencias-label">Isso pode causar:</span>
          <ul>
            {consequencias.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {consultoresDetalhe.length > 0 && (
        <div className="weak-ranking">
          <div className="weak-ranking-label">% fora por consultor (maior → menor):</div>
          <ul className="weak-ranking-list">
            {consultoresDetalhe.map((c) => (
              <li key={c.consultorId}>
                <span className="weak-ranking-nome">{consultoresLabel(c.consultorId)}</span>
                <span className="weak-ranking-num">
                  <strong>{c.naoConformesPct.toFixed(0)}%</strong>
                  <span className="weak-ranking-base"> · {c.qtdAvaliados - c.qtdConformes} de {c.qtdAvaliados}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {consultoresDetalhe.length > 0 && (
        <button
          type="button"
          className="weak-ver-origem"
          onClick={() => setOrigemAberta((v) => !v)}
        >
          {origemAberta ? '▲ Ocultar origem' : '▼ Ver origem'}
        </button>
      )}

      {origemAberta && consultoresDetalhe.length > 0 && (
        <div className="weak-origem">
          <div className="weak-origem-head">Linhas de auditoria que compõem este card</div>
          <div className="weak-origem-meta">
            Pergunta original: <em>"{pergunta}"</em><br />
            Categoria: <strong>{categoria}</strong>
          </div>
          <table className="weak-origem-table">
            <thead>
              <tr>
                <th>Consultor</th>
                <th>Mês</th>
                <th className="num">Avaliados</th>
                <th className="num">Conformes</th>
                <th className="num">Nota</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {consultoresDetalhe.map((c) => (
                <tr key={c.consultorId}>
                  <td>{consultoresLabel(c.consultorId)}</td>
                  <td className="mono">{c.mesAno}</td>
                  <td className="num mono">{c.qtdAvaliados}</td>
                  <td className="num mono">{c.qtdConformes}</td>
                  <td className="num mono">{c.notaPct.toFixed(1)}%</td>
                  <td className="obs">
                    {c.observacoes.length > 0 ? c.observacoes.join(' · ') : <span className="weak-origem-empty">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {impactoHeadline && (
        <div className="weak-fonte" title={pergunta}>
          Fonte: {categoria} · "{pergunta.length > 70 ? pergunta.slice(0, 70) + '…' : pergunta}"
        </div>
      )}
    </div>
  );
}

function ProjectRiskRow({
  item,
  consultorNome,
  showConsultor,
}: {
  item: CorrelationProjectRiskItem;
  consultorNome: string;
  showConsultor: boolean;
}) {
  const tone = riskTone(item.riscoScore);

  return (
    <div className="project-row">
      <div className="project-main">
        <div className="project-topline">
          <span className="project-name">{item.nome}</span>
          <span className="project-risk" style={{ color: tone.color, borderColor: `${tone.color}33`, background: `${tone.color}14` }}>
            {tone.label} · {item.riscoScore}
          </span>
        </div>
        <div className="project-meta">
          <span>{item.produto ?? 'Sem produto'}</span>
          <span>{item.status ?? 'Sem status'}</span>
          {showConsultor && <span>{consultorNome}</span>}
          <span>{item.auditoriaStatus}</span>
        </div>
      </div>
      <div className="project-stats">
        <span>Healthscore: {healthLabel(item.healthscore)}</span>
        <span>Meta: {currency(item.metaRealizada)} / {currency(item.metaProjetada)}</span>
      </div>
      <div className="project-reasons">
        {item.motivos.map((motivo) => (
          <span key={motivo} className="project-reason-chip">{motivo}</span>
        ))}
      </div>
    </div>
  );
}

export default function CorrelacaoSection() {
  const { profile, hasPermission } = useAuth();
  const { consultores, filters, correlationMode, setCorrelationMode } = useDashboard();
  const canViewOperation = hasPermission('filters.consultores.todos');

  const ownConsultorId = profile?.consultor_id ?? null;
  const filteredConsultorId = canViewOperation && filters.consultantId !== 'all'
    ? filters.consultantId
    : null;
  const scopedConsultorId = filteredConsultorId ?? ownConsultorId;
  const scopedConsultor = consultores.find((consultor) => consultor.id === scopedConsultorId) ?? null;
  const vorpColaboradorId = scopedConsultor?.vorp_colaborador_id ?? null;
  const mesAno = labelToMesAno(filters.month);
  const isConsultorFilterActive = Boolean(filteredConsultorId);

  React.useEffect(() => {
    if (isConsultorFilterActive && correlationMode !== 'mine') {
      setCorrelationMode('mine');
    }
  }, [isConsultorFilterActive, correlationMode, setCorrelationMode]);

  const resolvedMode: CorrelationMode = isConsultorFilterActive
    ? 'mine'
    : !ownConsultorId && canViewOperation
      ? 'operation'
      : correlationMode === 'operation' && canViewOperation
        ? 'operation'
        : 'mine';
  const canLoadMine = resolvedMode === 'mine' ? Boolean(scopedConsultorId && vorpColaboradorId) : true;

  const { data, isLoading } = useSWR(
    canLoadMine ? ['correlation-overview', resolvedMode, mesAno, scopedConsultorId ?? 'none', vorpColaboradorId ?? 'none'] : null,
    () => getCorrelationOverview({
      mode: resolvedMode,
      mesAno,
      consultorId: scopedConsultorId,
      vorpColaboradorId,
      scopeType: resolvedMode === 'operation' ? 'operation' : 'consultant',
      scopeLabel: scopedConsultor?.nome ?? (resolvedMode === 'operation' ? 'Operação' : 'Consultor'),
    }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    },
  );

  if (!canLoadMine) {
    return (
      <div className="state-card">
        {isConsultorFilterActive
          ? 'Esse consultor ainda não está vinculado a um colaborador do Vorp. Assim que o vínculo existir, a central de correlação passa a cruzar auditoria, carteira e projetos automaticamente.'
          : 'Seu perfil ainda não está vinculado a um consultor do Vorp. Assim que esse vínculo existir, a central de correlação vai cruzar auditoria, carteira e projetos automaticamente.'}
        <style jsx>{baseStyles}</style>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="state-card">
        Carregando a leitura da carteira e das correlações do período...
        <style jsx>{baseStyles}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="state-card">
        Não encontrei dados suficientes para montar a correlação desse recorte.
        <style jsx>{baseStyles}</style>
      </div>
    );
  }

  const tone = statusTone(data.resumoStatus);
  const weakPoints = data.weakPoints.slice(0, 12);
  const projectRisks = data.projetosPrioritarios.slice(0, 8);
  const showConsultor = resolvedMode === 'operation';
  const flagsDistribuicao = data.dataCoverage.flags.distribuicao.slice(0, 4);
  const handleOperationProjectsClick = () => {
    if (ownConsultorId) setCorrelationMode('mine');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="correlation-root">
      <div className="hero-card">
        <div className="hero-top">
          <div>
            <div className="eyebrow">Central de Correlação</div>
            <h3>{data.scopeType === 'operation' ? 'Operação' : `Consultor · ${data.scopeLabel}`} · {filters.month}</h3>
          </div>
          <div className="hero-actions">
            {canViewOperation && !isConsultorFilterActive && (
              <div className="mode-toggle">
                <button
                  className={resolvedMode === 'mine' ? 'mode-active' : ''}
                  onClick={() => setCorrelationMode('mine')}
                >
                  Minha carteira
                </button>
                <button
                  className={resolvedMode === 'operation' ? 'mode-active' : ''}
                  onClick={() => setCorrelationMode('operation')}
                >
                  Operação
                </button>
              </div>
            )}
            <div className="status-pill" style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}>
              {data.resumoStatus === 'Saudavel' && <ShieldCheck size={14} />}
              {data.resumoStatus === 'Em atencao' && <ShieldAlert size={14} />}
              {data.resumoStatus === 'Critica' && <Siren size={14} />}
              {data.resumoStatus.replace('Em atencao', 'Em atenção')}
            </div>
          </div>
        </div>
        <p className="hero-text">{data.resumoTexto}</p>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Conformidade da carteira"
          value={pct(data.conformidadeCarteira)}
          icon={<ShieldCheck size={18} />}
          accent={tone.color}
          helper={deltaLabel(data.deltaConformidade)}
          breakdown={data.scopeType === 'operation' ? data.consultorBreakdown : undefined}
          consultores={consultores}
        />
        <KpiCard
          label="Score de resultado"
          value={pct(data.resultadoCarteira)}
          icon={<BarChart3 size={18} />}
          accent={T.blue}
          helper={deltaLabel(data.deltaResultado)}
        />
        <KpiCard
          label="Projetos ativos"
          value={String(data.projetosAtivos)}
          icon={<FolderKanban size={18} />}
          accent={T.orange}
        />
        <KpiCard
          label="Projetos prioritários"
          value={String(data.projetosEmRisco)}
          icon={<AlertTriangle size={18} />}
          accent={data.projetosEmRisco > 0 ? T.yellow : T.green}
        />
        <KpiCard
          label="Churns no período"
          value={String(data.churnsPeriodo)}
          icon={<ArrowDownRight size={18} />}
          accent={data.churnsPeriodo > 0 ? T.red : T.green}
        />
        <KpiCard
          label="Healthscore médio"
          value={data.healthscoreMedio == null
            ? 'Sem score'
            : data.healthscoreMedio <= 4
              ? `${data.healthscoreMedio.toFixed(1)}/4`
              : `${data.healthscoreMedio.toFixed(1)} pts`}
          icon={<ArrowUpRight size={18} />}
          accent={T.blue}
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Cobertura dos dados do Vorp</div>
            <div className="panel-subtitle">Mostra o quanto metas, healthscore e flags/classificações sustentam a leitura da carteira.</div>
          </div>
          <span className="panel-badge">{data.dataCoverage.totalProjetos} projetos</span>
        </div>

        <div className="coverage-grid">
          <CoverageCard
            label="Metas completas"
            metric={data.dataCoverage.metas}
            icon={<Target size={16} />}
            helper={`${data.dataCoverage.metas.preenchidos}/${data.dataCoverage.metas.total} projeto(s) com meta projetada e realizada · ${data.dataCoverage.metas.abaixoDoProjetado} abaixo do projetado`}
          />
          <CoverageCard
            label="Healthscore"
            metric={data.dataCoverage.healthscore}
            icon={<Database size={16} />}
            helper={`${data.dataCoverage.healthscore.preenchidos}/${data.dataCoverage.healthscore.total} projeto(s) com score ou classificação · ${data.dataCoverage.healthscore.emAlerta} em alerta`}
          />
          <CoverageCard
            label="Flags / classificação"
            metric={data.dataCoverage.flags}
            icon={<Flag size={16} />}
            helper={`${data.dataCoverage.flags.preenchidos}/${data.dataCoverage.flags.total} projeto(s) com classificação no mês`}
          />
        </div>

        {flagsDistribuicao.length > 0 && (
          <div className="flag-distribution">
            {flagsDistribuicao.map((flag) => (
              <span key={flag.classificacao} className="flag-chip">
                {flag.classificacao}: {flag.total} ({flag.pct.toFixed(1)}%)
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Impactos críticos na operação</div>
              <div className="panel-subtitle">Itens com mais de 20% fora de conformidade — leitura traduzida para risco operacional.</div>
            </div>
            <span className="panel-badge">{weakPoints.length} itens</span>
          </div>

          {weakPoints.length === 0 ? (
            <div className="empty-inline">Nenhum item abaixo de 80% neste recorte.</div>
          ) : (
            <div className="weak-grid">
              {weakPoints.map((item) => {
                const labelFor = (id: string) => {
                  const nome = getConsultorLabel(consultores, id, 'full');
                  return nome === 'Consultor' ? `Consultor ${id.slice(0, 8)}` : nome;
                };

                return (
                  <WeakPointRow
                    key={`${item.categoria}:${item.pergunta}`}
                    categoria={item.categoria}
                    pergunta={item.pergunta}
                    notaPct={item.notaPct}
                    qtdAvaliados={item.qtdAvaliados}
                    qtdConformes={item.qtdConformes}
                    impactoHeadline={item.impactoNarrativa?.headline}
                    consequencias={item.impactoNarrativa?.consequencias ?? []}
                    consultoresDetalhe={resolvedMode === 'operation' ? item.consultoresDetalhe ?? [] : []}
                    consultoresLabel={labelFor}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Conformidade por categoria</div>
              <div className="panel-subtitle">Onde a operação está mais forte e onde ainda falta consistência.</div>
            </div>
          </div>

          <div className="category-list">
            {data.categoryScores.map((category) => (
              <div key={category.categoria} className="category-row">
                <div className="category-copy">
                  <span className="category-name">{category.categoria}</span>
                  <span className="category-items">{category.totalItens} item(ns)</span>
                </div>
                <div className="category-bar">
                  <div className="category-track">
                    <div className="category-fill" style={{ width: `${Math.max(category.score, 2)}%` }} />
                  </div>
                  <span className="category-score">{category.score.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {resolvedMode === 'operation' ? (
        <section className="panel projects-cta-panel">
          <div className="projects-cta-copy">
            <div className="panel-title">Projetos prioritários da carteira</div>
            <div className="panel-subtitle">
              Na visão de operação, a lista detalhada fica concentrada no recorte por consultor para evitar duplicidade.
            </div>
          </div>
          <button
            type="button"
            className="projects-cta-button"
            onClick={handleOperationProjectsClick}
          >
            <FolderKanban size={18} />
            <span>Ver projetos por consultor</span>
          </button>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Projetos prioritários da carteira</div>
              <div className="panel-subtitle">Os projetos abaixo combinam sinais operacionais e sinais externos de risco.</div>
            </div>
            <span className="panel-badge">{projectRisks.length} em destaque</span>
          </div>

          {projectRisks.length === 0 ? (
            <div className="empty-inline">Nenhum projeto ativo com risco relevante neste recorte.</div>
          ) : (
            <div className="project-list">
              {projectRisks.map((item) => (
                <ProjectRiskRow
                  key={item.projetoVorpId}
                  item={item}
                  consultorNome={getConsultorLabel(consultores, item.consultorId, 'full')}
                  showConsultor={showConsultor}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Alertas e próximos passos</div>
            <div className="panel-subtitle">Leitura rápida para orientar a prioridade imediata do consultor.</div>
          </div>
        </div>

        <div className="alerts-grid">
          {data.alertas.length === 0 ? (
            <div className="empty-inline">Sem alertas relevantes neste recorte.</div>
          ) : (
            data.alertas.map((alerta) => (
              <div key={alerta} className="alert-card">
                <AlertTriangle size={15} color={T.orange} />
                <span>{alerta}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <style jsx>{baseStyles}</style>
    </div>
  );
}

const baseStyles = `
  .correlation-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hero-card,
  .panel,
  .state-card {
    background: ${T.bg};
    border: 1px solid ${T.border};
    border-radius: 12px;
    padding: 20px;
  }

  .state-card {
    color: ${T.textSub};
    font-size: 14px;
    line-height: 1.6;
  }

  .hero-top,
  .panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .eyebrow,
  .panel-title,
  .kpi-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .eyebrow,
  .panel-subtitle,
  .kpi-helper,
  .kpi-label,
  .category-items,
  .panel-badge {
    color: ${T.textDim};
  }

  .hero-card h3 {
    margin: 6px 0 0;
    font-size: 28px;
    color: ${T.text};
    line-height: 1.1;
  }

  .hero-text {
    margin: 14px 0 0;
    color: ${T.textSub};
    line-height: 1.6;
    max-width: 920px;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .mode-toggle {
    display: inline-flex;
    background: ${T.bgDeep};
    border: 1px solid ${T.border};
    border-radius: 999px;
    padding: 4px;
    gap: 4px;
  }

  .mode-toggle button {
    border: none;
    background: transparent;
    color: ${T.textSub};
    padding: 8px 14px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
  }

  .mode-toggle button.mode-active {
    background: rgba(255,255,255,0.08);
    color: ${T.text};
  }

  .status-pill,
  .panel-badge,
  .weak-cat,
  .project-risk,
  .project-reason-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .panel-title {
    color: ${T.text};
    margin-bottom: 4px;
  }

  .panel-subtitle {
    font-size: 13px;
    line-height: 1.5;
  }

  .panel-badge {
    background: rgba(255,255,255,0.03);
  }

  .projects-cta-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    background:
      radial-gradient(circle at 12% 20%, rgba(255,92,26,0.12), transparent 32%),
      ${T.bg};
  }

  .projects-cta-copy {
    max-width: 720px;
  }

  .projects-cta-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 22px;
    border: 1px solid rgba(255,156,69,0.46);
    border-radius: 16px;
    background: linear-gradient(135deg, ${T.orange}, #ff8a3d);
    color: #fff;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 16px 34px rgba(255,92,26,0.18);
    transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  }

  .projects-cta-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 20px 44px rgba(255,92,26,0.25);
    filter: saturate(1.06);
  }

  .projects-cta-button:focus-visible {
    outline: 2px solid rgba(255,156,69,0.55);
    outline-offset: 3px;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
  }

  .kpi-card {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 18px;
    background: ${T.bg};
    border: 1px solid ${T.border};
    border-radius: 12px;
  }

  .kpi-icon {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
  }

  .kpi-copy {
    min-width: 0;
  }

  .kpi-value {
    margin-top: 6px;
    font-size: 28px;
    line-height: 1;
    font-weight: 700;
    font-family: ${T.mono};
  }

  .kpi-helper {
    margin-top: 8px;
    font-size: 12px;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: 16px;
  }

  .weak-grid,
  .project-list,
  .category-list,
  .alerts-grid,
  .flag-distribution {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }

  .weak-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .weak-row,
  .project-row,
  .coverage-card,
  .alert-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px;
    padding: 14px;
  }

  .coverage-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .coverage-top {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }

  .coverage-icon {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
  }

  .coverage-label {
    color: ${T.text};
    font-size: 12px;
    font-weight: 700;
  }

  .coverage-pct {
    font-family: ${T.mono};
    font-size: 14px;
    font-weight: 700;
  }

  .coverage-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
    overflow: hidden;
    margin: 12px 0 10px;
  }

  .coverage-fill {
    height: 100%;
    border-radius: 999px;
  }

  .coverage-helper {
    color: ${T.textSub};
    font-size: 12px;
    line-height: 1.5;
  }

  .flag-distribution {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .flag-chip {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.04);
    color: ${T.textSub};
    font-size: 11px;
    font-weight: 700;
  }

  .weak-row-top,
  .project-topline,
  .category-row,
  .category-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .weak-cat {
    background: rgba(79,195,247,0.12);
    color: ${T.blue};
  }

  .weak-pct,
  .category-score {
    color: ${T.orange};
    font-family: ${T.mono};
    font-size: 13px;
    font-weight: 700;
  }

  .weak-bar-track,
  .category-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
    overflow: hidden;
    margin: 10px 0;
  }

  .weak-bar-fill,
  .category-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, ${T.orange}, #ff9c45);
  }

  .weak-pergunta,
  .project-name,
  .alert-card span,
  .category-name {
    color: ${T.text};
  }

  .weak-headline {
    color: ${T.text};
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 4px;
  }

  .weak-evidencia {
    margin-top: 6px;
    font-size: 12px;
    color: ${T.textSub};
  }
  .weak-evidencia strong {
    color: ${T.text};
    font-family: ${T.mono};
    font-weight: 700;
  }
  .weak-help-icon {
    color: ${T.textDim};
    font-size: 11px;
    margin-left: 2px;
  }

  .weak-ranking {
    margin-top: 10px;
    padding: 10px 12px;
    background: rgba(255,255,255,0.02);
    border: 1px solid ${T.border};
    border-radius: 6px;
  }
  .weak-ranking-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${T.textSub};
    margin-bottom: 8px;
  }
  .weak-ranking-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .weak-ranking-list li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    color: ${T.text};
    padding: 2px 0;
  }
  .weak-ranking-nome {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .weak-ranking-num {
    flex-shrink: 0;
    color: ${T.orange};
    font-family: ${T.mono};
  }
  .weak-ranking-num strong { font-weight: 700; }
  .weak-ranking-base { color: ${T.textSub}; font-size: 11px; }

  .weak-ver-origem {
    margin-top: 8px;
    background: transparent;
    border: 1px solid ${T.border};
    border-radius: 6px;
    color: ${T.textSub};
    font-size: 11px;
    font-weight: 600;
    padding: 6px 10px;
    cursor: pointer;
    font-family: inherit;
    align-self: flex-start;
    transition: all 0.15s;
  }
  .weak-ver-origem:hover {
    color: ${T.orange};
    border-color: ${T.orange};
    background: rgba(255,92,26,0.06);
  }

  .weak-origem {
    margin-top: 8px;
    padding: 12px;
    background: ${T.bgDeep};
    border: 1px solid ${T.border};
    border-radius: 6px;
    font-size: 12px;
  }
  .weak-origem-head {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${T.orange};
    margin-bottom: 8px;
  }
  .weak-origem-meta {
    font-size: 11px;
    color: ${T.textSub};
    line-height: 1.5;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${T.border};
  }
  .weak-origem-meta em {
    color: ${T.text};
    font-style: italic;
  }
  .weak-origem-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .weak-origem-table th {
    text-align: left;
    color: ${T.textDim};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 6px 8px;
    border-bottom: 1px solid ${T.border};
  }
  .weak-origem-table th.num { text-align: right; }
  .weak-origem-table td {
    padding: 6px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: ${T.text};
    vertical-align: top;
  }
  .weak-origem-table td.num { text-align: right; }
  .weak-origem-table td.mono { font-family: ${T.mono}; }
  .weak-origem-table td.obs {
    color: ${T.textSub};
    font-size: 11px;
    max-width: 280px;
  }
  .weak-origem-empty { color: ${T.textDim}; }

  .weak-consequencias {
    margin-top: 10px;
    padding: 10px 12px;
    background: rgba(224,85,85,0.06);
    border-left: 2px solid ${T.red};
    border-radius: 4px;
  }

  .weak-consequencias-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${T.red};
    margin-bottom: 6px;
  }

  .weak-consequencias ul {
    margin: 0;
    padding-left: 16px;
    list-style: disc;
  }

  .weak-consequencias li {
    color: ${T.textSub};
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 2px;
  }

  .weak-fonte {
    margin-top: 8px;
    font-size: 11px;
    color: ${T.textDim};
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .weak-impacto,
  .project-meta,
  .project-stats,
  .empty-inline {
    color: ${T.textSub};
    font-size: 12px;
    line-height: 1.5;
  }

  .project-main,
  .project-stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .project-name {
    font-weight: 700;
  }

  .project-meta,
  .project-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
  }

  .project-reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .project-reason-chip {
    background: rgba(255,255,255,0.04);
    color: ${T.textSub};
    padding: 5px 9px;
  }

  .category-row {
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .category-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .category-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .alert-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .empty-inline {
    margin-top: 16px;
  }

  @media (max-width: 1100px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .coverage-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .hero-card,
    .panel,
    .state-card,
    .kpi-card {
      padding: 16px;
    }

    .hero-top,
    .panel-head {
      flex-direction: column;
    }

    .hero-actions {
      justify-content: flex-start;
    }

    .projects-cta-panel {
      align-items: flex-start;
      flex-direction: column;
    }

    .projects-cta-button {
      width: 100%;
    }

    .weak-grid {
      grid-template-columns: 1fr;
    }
  }
`;
