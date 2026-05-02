import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { getCorrelationOverview, type CorrelationMode } from '@/lib/correlation';
import { checkRateLimit } from '@/lib/rate-limit';
import { authenticateRequest } from '@/lib/server-auth';
import { getOpenAiApiKey, getPublicSupabaseEnv, getSupabaseServiceRoleKey } from '@/lib/server-env';
import {
  INSIGHTS_AI_MODEL,
  INSIGHTS_PROMPT_VERSION,
  buildFallbackInsights,
  buildInsightsDeveloperPrompt,
  buildInsightsUserPrompt,
  correlationInsightsSchema,
  extractResponseText,
  normalizeCorrelationInsights,
} from '@/lib/insights-ai';

function getInsightsOpenAiKey() {
  return getOpenAiApiKey();
}

function getInsightsSupabaseUrl() {
  return getPublicSupabaseEnv().url;
}

function getInsightsSupabaseKey() {
  return getSupabaseServiceRoleKey();
}

type InsightsSource = 'openai' | 'fallback';

interface SnapshotRow {
  id: string;
  insights: unknown;
  source: InsightsSource;
  model: string | null;
  warning: string | null;
  generated_at: string;
}

interface PersistSnapshotResult {
  id: string | null;
  generated_at: string | null;
  warning: string | null;
}

function parseMode(value: string | null): CorrelationMode | null {
  return value === 'mine' || value === 'operation' ? value : null;
}

async function resolveConsultorScope(consultorId: string) {
  const supabase = createClient(getInsightsSupabaseUrl(), getInsightsSupabaseKey());
  const { data, error } = await supabase
    .from('consultores')
    .select('nome, vorp_colaborador_id')
    .eq('id', consultorId)
    .maybeSingle();

  if (error) {
    throw new Error(`Nao foi possivel resolver o consultor: ${error.message}`);
  }

  return {
    nome: data?.nome ?? null,
    vorpColaboradorId: data?.vorp_colaborador_id ?? null,
  };
}

function createInsightsPayloadHash(payload: unknown) {
  return createHash('sha256')
    .update(JSON.stringify({
      promptVersion: INSIGHTS_PROMPT_VERSION,
      model: INSIGHTS_AI_MODEL,
      payload,
    }))
    .digest('hex');
}

function getSnapshotClient() {
  return createClient(getInsightsSupabaseUrl(), getInsightsSupabaseKey());
}

async function readSnapshot(params: {
  mode: CorrelationMode;
  mesAno: string;
  consultorId?: string | null;
  payloadHash: string;
  hasOpenAiKey: boolean;
}) {
  const supabase = getSnapshotClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('insights_ia_snapshots')
    .select('id, insights, source, model, warning, generated_at')
    .eq('mode', params.mode)
    .eq('mes_ano', params.mesAno)
    .eq('payload_hash', params.payloadHash)
    .is('consultor_id', null)
    .order('generated_at', { ascending: false })
    .limit(1);

  if (error) return null;

  let row = (data?.[0] ?? null) as SnapshotRow | null;

  if (params.consultorId) {
    const scoped = await supabase
      .from('insights_ia_snapshots')
      .select('id, insights, source, model, warning, generated_at')
      .eq('mode', params.mode)
      .eq('mes_ano', params.mesAno)
      .eq('payload_hash', params.payloadHash)
      .eq('consultor_id', params.consultorId)
      .order('generated_at', { ascending: false })
      .limit(1);

    if (!scoped.error) {
      row = (scoped.data?.[0] ?? null) as SnapshotRow | null;
    }
  }

  if (!row) return null;

  // If a fallback snapshot exists but OpenAI is now available, generate a richer one.
  if (row.source === 'fallback' && params.hasOpenAiKey) return null;

  return row;
}

async function persistSnapshot(params: {
  mode: CorrelationMode;
  mesAno: string;
  consultorId?: string | null;
  payloadHash: string;
  overview: unknown;
  insights: unknown;
  source: InsightsSource;
  model: string | null;
  warning: string | null;
  errorMessage?: string | null;
}): Promise<PersistSnapshotResult> {
  const supabase = getSnapshotClient();
  if (!supabase) {
    return {
      id: null,
      generated_at: null,
      warning: 'Snapshots IA não foram persistidos porque as credenciais do Supabase não estão configuradas no ambiente.',
    };
  }

  const { data, error } = await supabase
    .from('insights_ia_snapshots')
    .upsert({
      mode: params.mode,
      consultor_id: params.consultorId ?? null,
      mes_ano: params.mesAno,
      payload_hash: params.payloadHash,
      prompt_version: INSIGHTS_PROMPT_VERSION,
      overview: params.overview,
      insights: params.insights,
      source: params.source,
      model: params.model,
      warning: params.warning,
      status: params.errorMessage ? 'erro' : 'ok',
      error_message: params.errorMessage ?? null,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'mode,mes_ano,scope_key,payload_hash',
    })
    .select('id, generated_at')
    .maybeSingle();

  if (error) {
    return {
      id: null,
      generated_at: null,
      warning: `Snapshots IA não foram persistidos. ${error.message}`,
    };
  }

  return {
    id: data?.id ?? null,
    generated_at: data?.generated_at ?? null,
    warning: null,
  };
}

async function buildInsightsResponse(
  mode: CorrelationMode,
  mesAno: string,
  consultorId?: string | null,
  refresh = false,
) {
  const consultorScope = mode === 'mine' && consultorId
    ? await resolveConsultorScope(consultorId)
    : null;

  const overview = await getCorrelationOverview({
    mode,
    mesAno,
    consultorId: consultorId ?? null,
    vorpColaboradorId: consultorScope?.vorpColaboradorId ?? null,
    scopeType: mode === 'operation' ? 'operation' : 'consultant',
    scopeLabel: consultorScope?.nome ?? (mode === 'operation' ? 'Operação' : 'Consultor'),
  });

  const fallback = buildFallbackInsights(overview);
  const payloadHash = createInsightsPayloadHash(overview);
  const cached = refresh ? null : await readSnapshot({
    mode,
    mesAno,
    consultorId,
    payloadHash,
    hasOpenAiKey: Boolean(getInsightsOpenAiKey()),
  });

  if (cached) {
    return {
      ok: true,
      source: cached.source,
      cached: true,
      snapshotId: cached.id,
      generatedAt: cached.generated_at,
      overview,
      insights: normalizeCorrelationInsights(cached.insights, fallback),
      warning: cached.warning,
      model: cached.model,
      payloadHash,
      promptVersion: INSIGHTS_PROMPT_VERSION,
    };
  }

  const openAiApiKey = getInsightsOpenAiKey();

  if (!openAiApiKey) {
    const warning = 'OPENAI_API_KEY ausente. Exibindo leitura local de fallback.';
    const snapshot = await persistSnapshot({
      mode,
      mesAno,
      consultorId,
      payloadHash,
      overview,
      insights: fallback,
      source: 'fallback',
      warning,
      model: null,
    });

    return {
      ok: true,
      source: 'fallback' as const,
      cached: false,
      snapshotId: snapshot.id,
      generatedAt: snapshot.generated_at,
      overview,
      insights: fallback,
      warning: snapshot.warning ? `${warning} ${snapshot.warning}` : warning,
      model: null,
      payloadHash,
      promptVersion: INSIGHTS_PROMPT_VERSION,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: INSIGHTS_AI_MODEL,
        reasoning: { effort: 'medium' },
        input: [
          {
            role: 'developer',
            content: [
              { type: 'input_text', text: buildInsightsDeveloperPrompt() },
            ],
          },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildInsightsUserPrompt(overview) },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'correlation_insights',
            schema: correlationInsightsSchema,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI ${response.status}: ${errorText}`);
    }

    const payload = await response.json();
    const rawText = extractResponseText(payload);

    if (!rawText) {
      throw new Error('A resposta da OpenAI veio sem conteudo estruturado.');
    }

    const parsed = JSON.parse(rawText);
    const insights = normalizeCorrelationInsights(parsed, fallback);
    const snapshot = await persistSnapshot({
      mode,
      mesAno,
      consultorId,
      payloadHash,
      overview,
      insights,
      source: 'openai',
      warning: null,
      model: INSIGHTS_AI_MODEL,
    });

    return {
      ok: true,
      source: 'openai' as const,
      cached: false,
      snapshotId: snapshot.id,
      generatedAt: snapshot.generated_at,
      overview,
      insights,
      warning: snapshot.warning,
      model: INSIGHTS_AI_MODEL,
      payloadHash,
      promptVersion: INSIGHTS_PROMPT_VERSION,
    };
  } catch (error) {
    const warning = error instanceof Error
      ? `Falha ao gerar Insights IA pela OpenAI. Exibindo fallback local. ${error.message}`
      : 'Falha ao gerar Insights IA pela OpenAI. Exibindo fallback local.';
    const snapshot = await persistSnapshot({
      mode,
      mesAno,
      consultorId,
      payloadHash,
      overview,
      insights: fallback,
      source: 'fallback',
      warning,
      model: INSIGHTS_AI_MODEL,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return {
      ok: true,
      source: 'fallback' as const,
      cached: false,
      snapshotId: snapshot.id,
      generatedAt: snapshot.generated_at,
      overview,
      insights: fallback,
      warning: snapshot.warning ? `${warning} ${snapshot.warning}` : warning,
      model: INSIGHTS_AI_MODEL,
      payloadHash,
      promptVersion: INSIGHTS_PROMPT_VERSION,
    };
  }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req, {
    requiredPermissions: ['dashboard.correlacao'],
  });
  if (!auth.ok) return auth.response;

  const mode = parseMode(req.nextUrl.searchParams.get('mode'));
  const mesAno = req.nextUrl.searchParams.get('mesAno');
  const consultorId = req.nextUrl.searchParams.get('consultorId');
  const refresh = req.nextUrl.searchParams.get('refresh') === '1';

  if (!mode || !mesAno) {
    return NextResponse.json({ ok: false, error: 'Parametros obrigatorios: mode e mesAno.' }, { status: 400 });
  }

  if (mode === 'mine' && !consultorId) {
    return NextResponse.json({ ok: false, error: 'consultorId e obrigatorio quando mode=mine.' }, { status: 400 });
  }

  const canSeeAllConsultants = auth.context.permissions.includes('filters.consultores.todos');
  const ownConsultorId = auth.context.profile.consultor_id ?? null;

  if (mode === 'operation' && !canSeeAllConsultants) {
    return NextResponse.json({ ok: false, error: 'Voce nao tem permissao para ver a operacao completa.' }, { status: 403 });
  }

  if (mode === 'mine' && !canSeeAllConsultants && consultorId !== ownConsultorId) {
    return NextResponse.json({ ok: false, error: 'Voce nao pode consultar outro consultor.' }, { status: 403 });
  }

  let rateLimit;
  try {
    rateLimit = await checkRateLimit(
      auth.context.supabaseAdmin,
      `insights:${auth.context.user.id}:${refresh ? 'refresh' : 'read'}`,
      refresh
        ? { limit: 6, windowMs: 60_000 }
        : { limit: 60, windowMs: 60_000 },
    );
  } catch (error) {
    console.error('insights rate limit storage:', error);
    return NextResponse.json(
      { ok: false, error: 'Rate limit temporariamente indisponivel. Tente novamente em instantes.' },
      { status: 503 },
    );
  }

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Muitas requisicoes para Insights IA. Tente novamente em instantes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const result = await buildInsightsResponse(mode, mesAno, consultorId, refresh);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha inesperada ao montar os insights.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
