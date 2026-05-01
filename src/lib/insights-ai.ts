import type { CorrelationInsights, CorrelationOverview } from './correlation';
import { buildCorrelationInsights } from './correlation';

export const INSIGHTS_AI_MODEL = (process.env.OPENAI_INSIGHTS_MODEL ?? 'gpt-5.5').trim();
export const INSIGHTS_PROMPT_VERSION = '2026-05-01-v2';

interface OpenAIResponseTextContent {
  type?: string;
  text?: string;
}

interface OpenAIResponseMessage {
  type?: string;
  content?: OpenAIResponseTextContent[];
}

interface OpenAIResponsePayload {
  output_text?: string;
  output?: OpenAIResponseMessage[];
}

export const correlationInsightsSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'titulo',
    'resumoExecutivo',
    'diagnosticoGeral',
    'conformidadeNarrativa',
    'correlacoesPrincipais',
    'projetosPrioritarios',
    'hipotesesDeCausa',
    'planoDeAcao',
    'limitesDaLeitura',
  ],
  properties: {
    titulo: { type: 'string' },
    resumoExecutivo: { type: 'string' },
    diagnosticoGeral: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
    conformidadeNarrativa: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
    correlacoesPrincipais: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
    projetosPrioritarios: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
    hipotesesDeCausa: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
    planoDeAcao: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
    limitesDaLeitura: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
  },
} as const;

export function buildInsightsDeveloperPrompt() {
  return [
    'Voce e um analista estrategico da carteira de consultores do Grupo Vorp.',
    'Responda sempre em portugues do Brasil, com tom pratico, claro e acionavel.',
    'Regras obrigatorias:',
    '1. Nao invente dados, causas, clientes ou percentuais.',
    '2. Nao afirme conformidade por projeto. A conformidade e da carteira do consultor.',
    '3. Voce pode dizer que a carteira tem conformidade X e que projetos da carteira apresentam sinais de risco.',
    '4. Quando faltarem metas, healthscore, flags ou qualquer outro dado, deixe o limite explicito.',
    '5. Priorize leitura operacional: onde esta melhor, onde esta pior, riscos imediatos e o que fazer primeiro.',
    '6. Evite jargoes vagos. Cada frase deve ajudar o consultor a decidir a proxima acao.',
    '7. Use somente a base enviada no contexto estruturado.',
  ].join('\n');
}

export function buildInsightsUserPrompt(overview: CorrelationOverview) {
  const payload = {
    contexto: {
      modo: overview.mode,
      scopeType: overview.scopeType,
      scopeLabel: overview.scopeLabel,
      mesAno: overview.mesAno,
      regraConceitual: 'A auditoria mede a carteira do consultor, nao a conformidade individual de cada projeto.',
    },
    resumoCarteira: {
      conformidadeCarteira: overview.conformidadeCarteira,
      resultadoCarteira: overview.resultadoCarteira,
      deltaConformidade: overview.deltaConformidade,
      deltaResultado: overview.deltaResultado,
      projetosAtivos: overview.projetosAtivos,
      projetosEmRisco: overview.projetosEmRisco,
      churnsPeriodo: overview.churnsPeriodo,
      healthscoreMedio: overview.healthscoreMedio,
      dataCoverage: overview.dataCoverage,
      resumoStatus: overview.resumoStatus,
      resumoTexto: overview.resumoTexto,
    },
    categorias: overview.categoryScores,
    pontosCriticos: overview.weakPoints.slice(0, 12),
    projetosPrioritarios: overview.projetosPrioritarios.slice(0, 8),
    alertas: overview.alertas,
  };

  return [
    'Gere os blocos estruturados de Insights IA com base somente neste contexto.',
    'Se a base nao sustentar uma afirmacao, transforme isso em limite explicito.',
    'Contexto estruturado:',
    JSON.stringify(payload, null, 2),
  ].join('\n\n');
}

export function extractResponseText(responsePayload: OpenAIResponsePayload) {
  if (typeof responsePayload?.output_text === 'string' && responsePayload.output_text.trim()) {
    return responsePayload.output_text.trim();
  }

  const texts = Array.isArray(responsePayload?.output)
    ? responsePayload.output.flatMap((item) => {
        if (item?.type !== 'message' || !Array.isArray(item.content)) return [];
        return item.content
          .filter((contentItem): contentItem is OpenAIResponseTextContent =>
            contentItem?.type === 'output_text' && typeof contentItem.text === 'string')
          .map((contentItem) => contentItem.text as string);
      })
    : [];

  return texts.join('\n').trim();
}

function pickStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function normalizeCorrelationInsights(candidate: unknown, fallback: CorrelationInsights): CorrelationInsights {
  const data = typeof candidate === 'object' && candidate !== null ? candidate as Record<string, unknown> : {};

  return {
    titulo: typeof data.titulo === 'string' && data.titulo.trim() ? data.titulo : fallback.titulo,
    resumoExecutivo: typeof data.resumoExecutivo === 'string' && data.resumoExecutivo.trim()
      ? data.resumoExecutivo
      : fallback.resumoExecutivo,
    diagnosticoGeral: pickStringArray(data.diagnosticoGeral, fallback.diagnosticoGeral),
    conformidadeNarrativa: pickStringArray(data.conformidadeNarrativa, fallback.conformidadeNarrativa),
    correlacoesPrincipais: pickStringArray(data.correlacoesPrincipais, fallback.correlacoesPrincipais),
    projetosPrioritarios: pickStringArray(data.projetosPrioritarios, fallback.projetosPrioritarios),
    hipotesesDeCausa: pickStringArray(data.hipotesesDeCausa, fallback.hipotesesDeCausa),
    planoDeAcao: pickStringArray(data.planoDeAcao, fallback.planoDeAcao),
    limitesDaLeitura: pickStringArray(data.limitesDaLeitura, fallback.limitesDaLeitura),
  };
}

export function buildFallbackInsights(overview: CorrelationOverview) {
  return buildCorrelationInsights(overview);
}
