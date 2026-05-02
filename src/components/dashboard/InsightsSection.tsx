'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  AlertTriangle,
  BrainCircuit,
  ListChecks,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useDashboard } from '@/context/DashboardContext';
import { labelToMesAno } from '@/lib/api';
import type { CorrelationInsights, CorrelationMode } from '@/lib/correlation';

const T = {
  bg: '#0f1117',
  border: '#1a1d24',
  orange: '#ff5c1a',
  blue: '#4fc3f7',
  green: '#1d9e75',
  yellow: '#f59e0b',
  text: '#e2e4e9',
  textSub: '#9aa0b0',
  textDim: '#3f4455',
} as const;

interface InsightsApiResponse {
  insights: CorrelationInsights;
  model: string | null;
  source: 'openai' | 'fallback';
  cached: boolean;
  snapshotId: string | null;
  generatedAt: string | null;
  promptVersion: string;
  warning: string | null;
}

interface InsightRequest {
  id: number;
  refresh: boolean;
}

function formatGeneratedAt(value: string | null) {
  if (!value) return 'agora';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'agora';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SectionCard({
  icon,
  title,
  items,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <section className="insight-card">
      <div className="insight-head">
        <span className="insight-icon" style={{ color: accent, borderColor: `${accent}33`, background: `${accent}14` }}>
          {icon}
        </span>
        <div className="insight-title">{title}</div>
      </div>
      <div className="insight-list">
        {items.length > 0 ? items.map((item, index) => (
          <div key={`${title}-${index}-${item}`} className="insight-item">{item}</div>
        )) : (
          <div className="insight-item">Ainda não há dados suficientes para este bloco.</div>
        )}
      </div>
    </section>
  );
}

function GenerateButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <button
      type="button"
      className={variant === 'primary' ? 'insights-generate-button' : 'refresh-button'}
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled}
    >
      <Sparkles size={14} />
      {children}
    </button>
  );
}

export default function InsightsSection() {
  const { profile, session, hasPermission } = useAuth();
  const { consultores, filters, correlationMode } = useDashboard();
  const [generationRequest, setGenerationRequest] = useState<InsightRequest | null>(null);
  const canViewOperation = hasPermission('filters.consultores.todos');
  const ownConsultorId = profile?.consultor_id ?? null;
  const filteredConsultorId = canViewOperation && filters.consultantId !== 'all'
    ? filters.consultantId
    : null;
  const scopedConsultorId = filteredConsultorId ?? ownConsultorId;
  const vorpColaboradorId = consultores.find((consultor) => consultor.id === scopedConsultorId)?.vorp_colaborador_id ?? null;
  const mode: CorrelationMode = filteredConsultorId
    ? 'mine'
    : !ownConsultorId && canViewOperation
      ? 'operation'
      : correlationMode === 'operation' && canViewOperation
        ? 'operation'
        : 'mine';
  const mesAno = labelToMesAno(filters.month);
  const canLoadMine = mode === 'mine' ? Boolean(scopedConsultorId && vorpColaboradorId) : true;
  const hasRequestedInsights = generationRequest !== null;
  const insightsKey = hasRequestedInsights && canLoadMine
    ? ['ai-insights', mode, mesAno, scopedConsultorId ?? 'none', generationRequest.id, generationRequest.refresh] as const
    : null;

  const { data, error, isLoading, isValidating } = useSWR(
    insightsKey,
    async ([, currentMode, currentMesAno, currentConsultorId, , shouldRefresh]) => {
      const params = new URLSearchParams({
        mode: currentMode,
        mesAno: currentMesAno,
      });

      if (currentMode === 'mine' && currentConsultorId && currentConsultorId !== 'none') {
        params.set('consultorId', currentConsultorId);
      }

      if (shouldRefresh) {
        params.set('refresh', '1');
      }

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/insights?${params.toString()}`, { headers });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel carregar os Insights IA.');
      }

      return payload as InsightsApiResponse;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    },
  );

  const requestInsights = (refresh = false) => {
    setGenerationRequest((current) => ({
      id: (current?.id ?? 0) + 1,
      refresh,
    }));
  };

  if (!session?.access_token) {
    return (
      <div className="state-card">
        Sua sessão expirou. Entre novamente para carregar os insights.
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!canLoadMine) {
    return (
      <div className="state-card">
        {filteredConsultorId
          ? 'Esse consultor ainda não está vinculado a um colaborador do Vorp, então a leitura estratégica da IA ainda não pode ser montada para ele.'
          : 'A leitura estratégica da IA depende do vínculo do seu usuário com um consultor do Vorp.'}
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!hasRequestedInsights && !data) {
    return (
      <div className="insights-root">
        <div className="cta-card">
          <div>
            <div className="hero-eyebrow">Insights IA</div>
            <h3>Gerar leitura estratégica da carteira</h3>
            <p className="hero-text">
              A IA vai montar pontos críticos da conformidade, projetos prioritários e estratégias de ação para este recorte.
            </p>
          </div>
          <GenerateButton onClick={() => requestInsights(false)}>
            Gerar insights IA
          </GenerateButton>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="insights-root">
        <div className="state-card status-row">
          <RefreshCw size={16} className="spin" />
          Gerando os insights da carteira...
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="insights-root">
        <div className="state-card state-stack">
          <span>{error instanceof Error ? error.message : 'Não foi possível gerar os Insights IA.'}</span>
          <GenerateButton onClick={() => requestInsights(true)} variant="secondary">
            Tentar novamente
          </GenerateButton>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="state-card">
        Ainda não há dados suficientes para gerar os insights deste recorte.
        <style jsx>{styles}</style>
      </div>
    );
  }

  const insights = data.insights;
  const estrategiasIa = [...insights.planoDeAcao, ...insights.hipotesesDeCausa].slice(0, 6);
  const sourceLabel = data.cached
    ? `Snapshot salvo · ${formatGeneratedAt(data.generatedAt)}`
    : data.source === 'openai'
      ? `Gerado via ${data.model ?? 'OpenAI'}`
      : 'Fallback local';

  return (
    <div className="insights-root">
      <div className="hero-card">
        <div className="hero-eyebrow">Insights IA</div>
        <div className="hero-title-row">
          <h3>{insights.titulo}</h3>
          <div className="hero-actions">
            <span className="hero-badge">
              <Sparkles size={14} />
              {sourceLabel}
            </span>
            <GenerateButton onClick={() => requestInsights(true)} disabled={isValidating}>
              {isValidating ? 'Gerando...' : 'Gerar insights IA'}
            </GenerateButton>
          </div>
        </div>
        <p className="hero-text">{insights.resumoExecutivo}</p>
      </div>

      <div className="insights-grid">
        <SectionCard
          icon={<BrainCircuit size={16} />}
          title="Pontos críticos da conformidade"
          items={insights.conformidadeNarrativa}
          accent={T.orange}
        />
        <SectionCard
          icon={<Target size={16} />}
          title="Projetos prioritários da carteira"
          items={insights.projetosPrioritarios}
          accent={T.yellow}
        />
        <SectionCard
          icon={<ListChecks size={16} />}
          title="Estratégias de IA"
          items={estrategiasIa}
          accent={T.green}
        />
      </div>

      {(data.warning || insights.limitesDaLeitura.length > 0) && (
        <section className="limits-card">
          <div className="limits-head">
            <span className="limits-icon">
              <AlertTriangle size={16} />
            </span>
            <div className="insight-title">Limites da leitura</div>
          </div>

          {data.warning && <div className="warning-copy">{data.warning}</div>}

          <div className="insight-list">
            {insights.limitesDaLeitura.map((item, index) => (
              <div key={`limite-${index}-${item}`} className="insight-item">{item}</div>
            ))}
          </div>
        </section>
      )}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .insights-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hero-card,
  .cta-card,
  .insight-card,
  .limits-card,
  .state-card {
    background: ${T.bg};
    border: 1px solid ${T.border};
    border-radius: 12px;
    padding: 20px;
  }

  .cta-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .state-card {
    color: ${T.textSub};
    font-size: 14px;
    line-height: 1.6;
  }

  .status-row {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .state-stack {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .hero-eyebrow,
  .insight-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .hero-eyebrow {
    color: ${T.textDim};
  }

  .hero-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .hero-card h3,
  .cta-card h3 {
    margin: 0;
    color: ${T.text};
    font-size: 26px;
    line-height: 1.15;
  }

  .cta-card h3 {
    margin-top: 8px;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .hero-badge,
  .refresh-button,
  :global(.insights-generate-button) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: ${T.textSub};
    font-size: 11px;
    font-weight: 700;
  }

  .refresh-button,
  :global(.insights-generate-button) {
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, opacity 0.15s, transform 0.15s;
  }

  :global(.insights-generate-button) {
    padding: 11px 16px;
    background: linear-gradient(135deg, rgba(255,92,26,0.95), rgba(245,158,11,0.88));
    border-color: rgba(255,255,255,0.12);
    color: #08090d;
    box-shadow: 0 12px 30px rgba(255,92,26,0.16);
    white-space: nowrap;
  }

  .refresh-button:hover:not(:disabled) {
    border-color: rgba(255,92,26,0.35);
    color: ${T.orange};
  }

  :global(.insights-generate-button:hover:not(:disabled)) {
    transform: translateY(-1px);
  }

  .refresh-button:disabled,
  :global(.insights-generate-button:disabled) {
    cursor: wait;
    opacity: 0.55;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  .hero-text {
    margin: 14px 0 0;
    color: ${T.textSub};
    line-height: 1.65;
    max-width: 900px;
  }

  .insights-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .insight-head,
  .limits-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .insight-icon,
  .limits-icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
  }

  .insight-icon {
    border: 1px solid transparent;
  }

  .limits-icon {
    border: 1px solid rgba(245,158,11,0.22);
    background: rgba(245,158,11,0.12);
    color: ${T.yellow};
  }

  .insight-title {
    color: ${T.text};
  }

  .insight-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .insight-item {
    color: ${T.textSub};
    font-size: 13px;
    line-height: 1.65;
    padding: 12px 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px;
  }

  .warning-copy {
    color: ${T.yellow};
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1100px) {
    .insights-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .hero-card,
    .cta-card,
    .insight-card,
    .limits-card,
    .state-card {
      padding: 16px;
    }

    .hero-actions {
      justify-content: flex-start;
    }

    .cta-card {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;
