import {
  getAuditoriaPontosDetalhados,
  getScoresPorTipo,
  getViewConformidade,
  getVorpChurn,
  getVorpHealthScores,
  getVorpMetas,
  getVorpProjetosAtivos,
} from './api';
import type {
  AuditoriaPontoDetalhado,
} from './api';
import type {
  ViewConformidadeConsultor,
  VorpChurnRow,
  VorpHealthScoreRow,
  VorpMetaRow,
  VorpProjetoRow,
} from './supabase';

export type CorrelationMode = 'mine' | 'operation';
export type CorrelationStatus = 'Saudavel' | 'Em atencao' | 'Critica';
export type CorrelationScopeType = 'operation' | 'consultant';

export interface CorrelationWeakPoint {
  consultorId: string | null;
  categoria: string;
  pergunta: string;
  tipo: string | null;
  notaPct: number;
  qtdAvaliados: number;
  qtdConformes: number;
  consultoresImpactados?: number;
  consultorIdsImpactados?: string[];
}

export interface CorrelationCategoryScore {
  categoria: string;
  score: number;
  totalItens: number;
}

export interface CorrelationProjectRiskItem {
  projetoVorpId: string;
  consultorId: string | null;
  nome: string;
  produto: string | null;
  status: string | null;
  tratativaCS: boolean;
  healthscore: number | null;
  healthClassificacao: string | null;
  metaProjetada: number | null;
  metaRealizada: number | null;
  riscoScore: number;
  motivos: string[];
}

export interface CorrelationCoverageMetric {
  total: number;
  preenchidos: number;
  faltantes: number;
  coberturaPct: number;
}

export interface CorrelationFlagDistributionItem {
  classificacao: string;
  total: number;
  pct: number;
}

export interface CorrelationDataCoverage {
  totalProjetos: number;
  metas: CorrelationCoverageMetric & {
    abaixoDoProjetado: number;
    semResultado: number;
  };
  healthscore: CorrelationCoverageMetric & {
    emAlerta: number;
  };
  flags: CorrelationCoverageMetric & {
    distribuicao: CorrelationFlagDistributionItem[];
  };
}

export interface CorrelationOverview {
  mode: CorrelationMode;
  mesAno: string;
  scopeType: CorrelationScopeType;
  scopeLabel: string;
  conformidadeCarteira: number;
  resultadoCarteira: number;
  deltaConformidade: number | null;
  deltaResultado: number | null;
  projetosAtivos: number;
  projetosEmRisco: number;
  churnsPeriodo: number;
  healthscoreMedio: number | null;
  dataCoverage: CorrelationDataCoverage;
  weakPoints: CorrelationWeakPoint[];
  categoryScores: CorrelationCategoryScore[];
  projetosPrioritarios: CorrelationProjectRiskItem[];
  alertas: string[];
  resumoStatus: CorrelationStatus;
  resumoTexto: string;
}

export interface CorrelationInsights {
  titulo: string;
  resumoExecutivo: string;
  diagnosticoGeral: string[];
  conformidadeNarrativa: string[];
  correlacoesPrincipais: string[];
  projetosPrioritarios: string[];
  hipotesesDeCausa: string[];
  planoDeAcao: string[];
  limitesDaLeitura: string[];
}

interface CorrelationOverviewParams {
  mode: CorrelationMode;
  mesAno: string;
  consultorId?: string | null;
  vorpColaboradorId?: string | null;
  scopeType?: CorrelationScopeType;
  scopeLabel?: string;
}

const HEALTH_RISK_LABELS = ['critico', 'crítico', 'ruim', 'baixo', 'risco', 'alerta'];

function toMonthParts(mesAno: string) {
  const [ano, mes] = mesAno.split('-');
  return {
    ano: Number(ano),
    mes: Number(mes),
  };
}

function getPreviousMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-').map(Number);
  const date = new Date(ano, mes - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pct(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(1)}%`;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageOrNull(values: number[]) {
  return values.length > 0 ? average(values) : null;
}

function coverageMetric(total: number, preenchidos: number): CorrelationCoverageMetric {
  const safeTotal = Math.max(total, 0);
  const safePreenchidos = Math.min(Math.max(preenchidos, 0), safeTotal);
  return {
    total: safeTotal,
    preenchidos: safePreenchidos,
    faltantes: safeTotal - safePreenchidos,
    coberturaPct: safeTotal > 0 ? round((safePreenchidos / safeTotal) * 100) : 0,
  };
}

function normalizeText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isSameMesAno(dateValue?: string | null, mesAno?: string) {
  if (!dateValue || !mesAno) return false;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;
  const current = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  return current === mesAno;
}

function aggregateTypeScore(
  rows: Array<{ consultor_id: string; tipo: string; score: number }>,
  tipo: 'Resultado' | 'Conformidade',
) {
  return average(
    rows
      .filter((row) => row.tipo === tipo)
      .map((row) => row.score ?? 0),
  );
}

function aggregateCategoryScores(rows: ViewConformidadeConsultor[]) {
  const grouped = new Map<string, { weightedTotal: number; totalItens: number }>();

  for (const row of rows) {
    const categoria = row.categoria ?? 'Sem categoria';
    const current = grouped.get(categoria) ?? { weightedTotal: 0, totalItens: 0 };
    const totalItens = row.total_itens ?? 0;
    current.weightedTotal += (row.score_categoria ?? 0) * Math.max(totalItens, 1);
    current.totalItens += totalItens;
    grouped.set(categoria, current);
  }

  return Array.from(grouped.entries())
    .map(([categoria, current]) => ({
      categoria,
      score: current.totalItens > 0
        ? round(current.weightedTotal / current.totalItens)
        : 0,
      totalItens: current.totalItens,
    }))
    .sort((a, b) => a.score - b.score);
}

function aggregateWeakPoints(mode: CorrelationMode, rows: AuditoriaPontoDetalhado[]) {
  if (mode === 'mine') {
    return rows
      .filter((row) => (row.nota_pct ?? 0) < 80)
      .sort((a, b) => a.nota_pct - b.nota_pct)
      .map((row) => ({
        consultorId: row.consultor_id,
        categoria: row.categoria,
        pergunta: row.pergunta,
        tipo: row.tipo,
        notaPct: row.nota_pct ?? 0,
        qtdAvaliados: row.qtd_avaliados ?? 0,
        qtdConformes: row.qtd_conformes ?? 0,
      }));
  }

  const grouped = new Map<string, {
    categoria: string;
    pergunta: string;
    tipo: string | null;
    totalNota: number;
    totalAvaliados: number;
    totalConformes: number;
    consultores: Set<string>;
    count: number;
  }>();

  for (const row of rows) {
    const key = `${row.categoria}::${row.pergunta}`;
    const current = grouped.get(key) ?? {
      categoria: row.categoria,
      pergunta: row.pergunta,
      tipo: row.tipo,
      totalNota: 0,
      totalAvaliados: 0,
      totalConformes: 0,
      consultores: new Set<string>(),
      count: 0,
    };

    current.totalNota += row.nota_pct ?? 0;
    current.totalAvaliados += row.qtd_avaliados ?? 0;
    current.totalConformes += row.qtd_conformes ?? 0;
    current.consultores.add(row.consultor_id);
    current.count += 1;
    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .map((row) => ({
      consultorId: null,
      categoria: row.categoria,
      pergunta: row.pergunta,
      tipo: row.tipo,
      notaPct: round(row.totalNota / Math.max(row.count, 1)),
      qtdAvaliados: row.totalAvaliados,
      qtdConformes: row.totalConformes,
      consultoresImpactados: row.consultores.size,
      consultorIdsImpactados: Array.from(row.consultores).filter(Boolean),
    }))
    .filter((row) => row.notaPct < 80)
    .sort((a, b) => a.notaPct - b.notaPct);
}

function selectRelevantProjects(mode: CorrelationMode, projetos: VorpProjetoRow[]) {
  const filtered = projetos.filter((projeto) => {
    if (normalizeText(projeto.status) !== 'ativo') return false;
    if (mode === 'operation') return Boolean(projeto.consultor_id);
    return true;
  });

  const unique = new Map<string, VorpProjetoRow>();
  for (const projeto of filtered) {
    const current = unique.get(projeto.vorp_id);
    if (!current || (!current.consultor_id && projeto.consultor_id)) {
      unique.set(projeto.vorp_id, projeto);
    }
  }

  return Array.from(unique.values());
}

function buildHealthMap(rows: VorpHealthScoreRow[]) {
  const map = new Map<string, VorpHealthScoreRow>();
  for (const row of rows) {
    if (row.projeto_vorp_id) map.set(row.projeto_vorp_id, row);
  }
  return map;
}

function buildMetaMap(rows: VorpMetaRow[]) {
  const map = new Map<string, VorpMetaRow>();
  for (const row of rows) {
    if (row.projeto_vorp_id) map.set(row.projeto_vorp_id, row);
  }
  return map;
}

function buildChurnMap(rows: VorpChurnRow[], mesAno: string) {
  const map = new Map<string, boolean>();
  for (const row of rows) {
    if (row.projeto_vorp_id && isSameMesAno(row.vorp_created_at, mesAno)) {
      map.set(row.projeto_vorp_id, true);
    }
  }
  return map;
}

function getHealthRiskWeight(row?: VorpHealthScoreRow | null) {
  if (!row || !hasHealthscore(row)) return { weight: 1, reason: 'Sem healthscore no mês' };

  const classificacao = normalizeText(row.classificacao);
  const score = row.pontuacao ?? 0;
  if (HEALTH_RISK_LABELS.some((label) => classificacao.includes(label))) {
    return { weight: 3, reason: `Healthscore em alerta (${row.classificacao ?? 'sem classificação'})` };
  }

  if (score > 0 && score <= 4 && score < 2.5) {
    return { weight: 2, reason: `Healthscore abaixo do ideal (${round(score)}/4)` };
  }

  if (score > 4 && score < 70) {
    return { weight: 2, reason: `Healthscore abaixo do ideal (${round(score)} pontos)` };
  }

  return { weight: 0, reason: '' };
}

function hasCompleteMeta(row?: VorpMetaRow | null) {
  return Boolean(row && row.meta_projetada != null && row.meta_realizada != null);
}

function hasHealthscore(row?: VorpHealthScoreRow | null) {
  return Boolean(row && (row.pontuacao != null || row.classificacao));
}

function hasHealthFlag(row?: VorpHealthScoreRow | null) {
  return Boolean(row?.classificacao?.trim());
}

function isHealthAlert(row?: VorpHealthScoreRow | null) {
  if (!row) return false;
  const healthRisk = getHealthRiskWeight(row);
  return healthRisk.weight >= 2;
}

function buildDataCoverage(
  scopedProjects: VorpProjetoRow[],
  healthscores: VorpHealthScoreRow[],
  metas: VorpMetaRow[],
) {
  const projectIds = new Set(scopedProjects.map((project) => project.vorp_id));
  const healthMap = buildHealthMap(healthscores);
  const metaMap = buildMetaMap(metas);
  const totalProjetos = scopedProjects.length;

  let metasCompletas = 0;
  let metasAbaixoDoProjetado = 0;
  let metasSemResultado = 0;
  let healthscorePreenchido = 0;
  let healthscoreEmAlerta = 0;
  let flagsPreenchidas = 0;
  const flagCounts = new Map<string, number>();

  for (const projectId of projectIds) {
    const meta = metaMap.get(projectId);
    if (hasCompleteMeta(meta)) {
      metasCompletas += 1;
      if ((meta?.meta_realizada ?? 0) < (meta?.meta_projetada ?? 0)) {
        metasAbaixoDoProjetado += 1;
      }
    } else if (meta && meta.meta_projetada != null && meta.meta_realizada == null) {
      metasSemResultado += 1;
    }

    const health = healthMap.get(projectId);
    if (hasHealthscore(health)) {
      healthscorePreenchido += 1;
    }
    if (isHealthAlert(health)) {
      healthscoreEmAlerta += 1;
    }
    if (hasHealthFlag(health)) {
      const classificacao = health?.classificacao?.trim() ?? 'Sem classificacao';
      flagsPreenchidas += 1;
      flagCounts.set(classificacao, (flagCounts.get(classificacao) ?? 0) + 1);
    }
  }

  const flagsMetric = coverageMetric(totalProjetos, flagsPreenchidas);

  return {
    totalProjetos,
    metas: {
      ...coverageMetric(totalProjetos, metasCompletas),
      abaixoDoProjetado: metasAbaixoDoProjetado,
      semResultado: metasSemResultado,
    },
    healthscore: {
      ...coverageMetric(totalProjetos, healthscorePreenchido),
      emAlerta: healthscoreEmAlerta,
    },
    flags: {
      ...flagsMetric,
      distribuicao: Array.from(flagCounts.entries())
        .map(([classificacao, total]) => ({
          classificacao,
          total,
          pct: flagsMetric.preenchidos > 0 ? round((total / flagsMetric.preenchidos) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total || a.classificacao.localeCompare(b.classificacao, 'pt-BR')),
    },
  } satisfies CorrelationDataCoverage;
}

function buildProjectRiskItems(
  mode: CorrelationMode,
  projetos: VorpProjetoRow[],
  healthscores: VorpHealthScoreRow[],
  metas: VorpMetaRow[],
  churns: VorpChurnRow[],
  mesAno: string,
) {
  const healthMap = buildHealthMap(healthscores);
  const metaMap = buildMetaMap(metas);
  const churnMap = buildChurnMap(churns, mesAno);
  const scopedProjects = selectRelevantProjects(mode, projetos);

  return scopedProjects
    .map((projeto) => {
      const health = healthMap.get(projeto.vorp_id);
      const meta = metaMap.get(projeto.vorp_id);
      const hasChurn = churnMap.get(projeto.vorp_id) ?? false;
      const reasons: string[] = [];
      let riskScore = 0;

      const healthRisk = getHealthRiskWeight(health);
      if (healthRisk.weight > 0) {
        riskScore += healthRisk.weight;
        reasons.push(healthRisk.reason);
      }

      if (projeto.tratativa_cs) {
        riskScore += 2;
        reasons.push('Projeto em Tratativa CS');
      }

      if (hasCompleteMeta(meta) && (meta?.meta_realizada ?? 0) < (meta?.meta_projetada ?? 0)) {
        riskScore += 1;
        reasons.push('Meta do mês abaixo do projetado');
      }

      if (meta && !hasCompleteMeta(meta)) {
        riskScore += 1;
        reasons.push('Meta do mês incompleta');
      }

      if (!meta) {
        riskScore += 1;
        reasons.push('Sem meta registrada no mês');
      }

      if (hasChurn) {
        riskScore += 3;
        reasons.push('Houve churn no período');
      }

      return {
        projetoVorpId: projeto.vorp_id,
        consultorId: projeto.consultor_id ?? null,
        nome: projeto.nome,
        produto: projeto.produto_nome ?? null,
        status: projeto.status ?? null,
        tratativaCS: projeto.tratativa_cs,
        healthscore: health?.pontuacao ?? null,
        healthClassificacao: health?.classificacao ?? null,
        metaProjetada: meta?.meta_projetada ?? null,
        metaRealizada: meta?.meta_realizada ?? null,
        riscoScore: riskScore,
        motivos: reasons,
      } satisfies CorrelationProjectRiskItem;
    })
    .sort((a, b) => {
      if (b.riscoScore !== a.riscoScore) return b.riscoScore - a.riscoScore;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
}

function buildStatusAndSummary(
  conformidadeCarteira: number,
  projetosEmRisco: number,
  weakPoints: CorrelationWeakPoint[],
  churnsPeriodo: number,
) {
  if (conformidadeCarteira < 70 || projetosEmRisco >= 4 || churnsPeriodo >= 2) {
    return {
      resumoStatus: 'Critica' as const,
      resumoTexto: `A carteira está em nível crítico: ${projetosEmRisco} projeto(s) prioritário(s) e ${weakPoints.length} ponto(s) de auditoria abaixo de 80%.`,
    };
  }

  if (conformidadeCarteira < 85 || projetosEmRisco > 0 || weakPoints.length > 0) {
    return {
      resumoStatus: 'Em atencao' as const,
      resumoTexto: `A carteira está em atenção: ${weakPoints.length} ponto(s) de conformidade pedem ajuste e ${projetosEmRisco} projeto(s) já merecem prioridade.`,
    };
  }

  return {
    resumoStatus: 'Saudavel' as const,
    resumoTexto: 'A carteira está saudável neste recorte, sem sinais relevantes de risco operacional ou de projeto.',
  };
}

function buildAlerts(
  weakPoints: CorrelationWeakPoint[],
  projetosPrioritarios: CorrelationProjectRiskItem[],
  categoryScores: CorrelationCategoryScore[],
  churnsPeriodo: number,
  dataCoverage: CorrelationDataCoverage,
) {
  const alerts: string[] = [];

  if (weakPoints.length > 0) {
    const first = weakPoints[0];
    alerts.push(`${first.categoria}: "${first.pergunta}" está em ${round(first.notaPct)}%.`);
  }

  const lowestCategory = categoryScores[0];
  if (lowestCategory) {
    alerts.push(`A categoria mais fraca do recorte atual é ${lowestCategory.categoria}, com média de ${round(lowestCategory.score)}%.`);
  }

  const riskyProjects = projetosPrioritarios.filter((item) => item.riscoScore >= 3);
  if (riskyProjects.length > 0) {
    alerts.push(`${riskyProjects.length} projeto(s) ativo(s) já combinam risco operacional e sinal externo de atenção.`);
  }

  if (churnsPeriodo > 0) {
    alerts.push(`Foram identificados ${churnsPeriodo} churn(s) no período selecionado.`);
  }

  if (dataCoverage.metas.coberturaPct < 80) {
    alerts.push(`A cobertura de metas completas está em ${round(dataCoverage.metas.coberturaPct)}%, com ${dataCoverage.metas.faltantes} projeto(s) sem meta completa.`);
  }

  if (dataCoverage.healthscore.coberturaPct < 80) {
    alerts.push(`A cobertura de healthscore está em ${round(dataCoverage.healthscore.coberturaPct)}%, limitando a leitura externa da carteira.`);
  }

  if (dataCoverage.flags.coberturaPct < 80) {
    alerts.push(`A cobertura de flags/classificação está em ${round(dataCoverage.flags.coberturaPct)}%, então a priorização deve considerar essa lacuna.`);
  }

  return alerts.slice(0, 5);
}

function formatWeakPoint(item: CorrelationWeakPoint) {
  return `"${item.pergunta}" em ${round(item.notaPct)}% (${item.categoria})`;
}

function formatProject(item: CorrelationProjectRiskItem) {
  const product = item.produto ? ` · ${item.produto}` : '';
  return `${item.nome}${product}`;
}

export function buildCorrelationInsights(overview: CorrelationOverview): CorrelationInsights {
  const isOperationScope = overview.scopeType === 'operation';
  const consultantLabel = overview.scopeLabel || 'Consultor';
  const consultantScopeText = `a carteira de ${consultantLabel}`;
  const titulo = isOperationScope
    ? 'Estratégia do Especialista IA para a operação'
    : `Estratégia do Especialista IA para ${consultantLabel}`;

  const weakest = overview.weakPoints.slice(0, 3);
  const riskyProjects = overview.projetosPrioritarios.filter((item) => item.riscoScore >= 3).slice(0, 3);
  const mostFragileCategory = overview.categoryScores[0];
  const strongestCategory = overview.categoryScores.length > 0
    ? overview.categoryScores[overview.categoryScores.length - 1]
    : null;

  const resumoExecutivo = isOperationScope
    ? `A operação está em nível ${overview.resumoStatus === 'Saudavel' ? 'saudável' : overview.resumoStatus === 'Critica' ? 'crítico' : 'de atenção'}, com conformidade média de ${pct(overview.conformidadeCarteira)} e ${overview.projetosEmRisco} projeto(s) ativos em faixa prioritária.`
    : `${consultantScopeText.charAt(0).toUpperCase()}${consultantScopeText.slice(1)} está em nível ${overview.resumoStatus === 'Saudavel' ? 'saudável' : overview.resumoStatus === 'Critica' ? 'crítico' : 'de atenção'}, com conformidade de ${pct(overview.conformidadeCarteira)} e ${overview.projetosEmRisco} projeto(s) que já merecem prioridade imediata.`;

  const diagnosticoGeral = [
    `Conformidade da carteira em ${pct(overview.conformidadeCarteira)} e resultado em ${pct(overview.resultadoCarteira)} neste recorte.`,
    `${overview.projetosAtivos} projeto(s) ativo(s), ${overview.projetosEmRisco} em faixa prioritária e ${overview.churnsPeriodo} churn(s) no período.`,
    `Cobertura da base: metas completas em ${pct(overview.dataCoverage.metas.coberturaPct)}, healthscore em ${pct(overview.dataCoverage.healthscore.coberturaPct)} e flags/classificação em ${pct(overview.dataCoverage.flags.coberturaPct)}.`,
    strongestCategory
      ? `A operação mostra melhor estabilidade em ${strongestCategory.categoria}, enquanto ${mostFragileCategory?.categoria ?? 'a auditoria'} concentra a maior sensibilidade.`
      : 'Ainda não há leitura suficiente por categoria para fechar um diagnóstico comparativo.',
  ];

  const conformidadeNarrativa = weakest.length > 0
    ? [
        `Os itens que mais derrubaram a conformidade foram ${weakest.map(formatWeakPoint).join('; ')}.`,
        mostFragileCategory
          ? `A categoria mais sensível do recorte atual é ${mostFragileCategory.categoria}, com média de ${pct(mostFragileCategory.score)}.`
          : 'A leitura por categoria ainda não trouxe uma concentração forte de risco.',
      ]
    : [
        'Nenhum item da auditoria ficou abaixo de 80% neste recorte.',
        mostFragileCategory
          ? `Mesmo assim, a categoria mais sensível no momento é ${mostFragileCategory.categoria}, com média de ${pct(mostFragileCategory.score)}.`
          : 'As categorias da auditoria estão equilibradas neste recorte.',
      ];

  const correlacoesPrincipais = [
    overview.projetosEmRisco > 0
      ? `${overview.projetosEmRisco} projeto(s) da carteira combinam sinais externos de atenção com gargalos operacionais da auditoria.`
      : 'A carteira não apresentou concentração relevante de projetos críticos neste recorte.',
    overview.healthscoreMedio != null
      ? `O healthscore médio está em ${overview.healthscoreMedio <= 4 ? `${overview.healthscoreMedio.toFixed(1)}/4` : `${overview.healthscoreMedio.toFixed(1)} pontos`}, com cobertura de ${pct(overview.dataCoverage.healthscore.coberturaPct)} da carteira.`
      : 'Ainda faltam healthscores suficientes para fechar uma leitura externa mais robusta da carteira.',
    overview.dataCoverage.metas.abaixoDoProjetado > 0
      ? `${overview.dataCoverage.metas.abaixoDoProjetado} projeto(s) com meta completa ficaram abaixo do projetado no período.`
      : 'Entre as metas completas, não há concentração relevante de projetos abaixo do projetado.',
    overview.churnsPeriodo > 0
      ? `Houve ${overview.churnsPeriodo} churn(s) no período, o que reforça a necessidade de agir sobre os projetos e categorias mais frágeis.`
      : 'Não houve churn no período, então o principal foco agora é evitar que os gargalos operacionais virem risco real de perda.',
  ];

  const projetosPrioritarios = riskyProjects.length > 0
    ? riskyProjects.map((item) => {
        const reasons = item.motivos.slice(0, 2).join(' e ');
        return `${formatProject(item)}: prioridade alta porque apresenta ${reasons.toLowerCase()}.`;
      })
    : ['Nenhum projeto entrou na faixa de prioridade alta neste recorte.'];

  const hipotesesDeCausa = [
    weakest.length > 0
      ? 'Os principais desvios parecem vir de rotinas operacionais executadas com baixa consistência na carteira.'
      : 'A auditoria não mostrou ruptura forte, então a atenção maior fica na prevenção de novos desvios.',
    riskyProjects.some((item) => item.metaProjetada != null && item.metaRealizada != null && item.metaRealizada < item.metaProjetada)
      ? 'Parte do risco pode estar ligada a metas abaixo do planejado em projetos prioritários.'
      : 'Não há sinal dominante de meta abaixo do planejado entre os projetos mais críticos.',
    overview.healthscoreMedio == null
      ? 'A falta de healthscore em parte da carteira reduz a visibilidade externa e pode esconder riscos ainda não capturados.'
      : 'O healthscore ajuda a confirmar quais projetos já saíram do risco operacional e entraram em risco de carteira.',
    overview.dataCoverage.flags.faltantes > 0
      ? `${overview.dataCoverage.flags.faltantes} projeto(s) ainda não têm flag/classificação no mês, o que enfraquece a leitura comparativa entre projetos.`
      : 'As flags/classificações estão cobertas para os projetos ativos deste recorte.',
  ];

  const planoDeAcao = [
    weakest.length > 0
      ? `Atacar primeiro os itens de conformidade abaixo de 80%, começando por ${formatWeakPoint(weakest[0])}.`
      : 'Manter o padrão operacional atual e monitorar qualquer oscilação nova na auditoria.',
    riskyProjects.length > 0
      ? `Abrir plano de acompanhamento para ${riskyProjects.map((item) => formatProject(item)).join(', ')}.`
      : 'Seguir acompanhando a carteira sem necessidade de escalonamento imediato de projetos.',
    mostFragileCategory
      ? `Reforçar rotina e ritos da categoria ${mostFragileCategory.categoria}, que hoje é o ponto com maior sensibilidade operacional.`
      : 'Continuar acompanhando as categorias para identificar cedo qualquer novo desvio.',
  ];

  const limitesDaLeitura = [
    'A conformidade apresentada aqui é da carteira do consultor, não de projetos isolados.',
    overview.healthscoreMedio == null
      ? 'Existem lacunas de healthscore/flag na base atual, então parte da leitura de risco externo fica parcial.'
      : `A leitura de healthscore cobre ${pct(overview.dataCoverage.healthscore.coberturaPct)} dos projetos ativos e foi usada apenas como sinal externo de risco.`,
    overview.dataCoverage.metas.faltantes > 0
      ? `${overview.dataCoverage.metas.faltantes} projeto(s) ativo(s) ainda não possuem meta completa no Vorp, o que limita a profundidade da priorização.`
      : 'Metas do Vorp estão completas para os projetos ativos deste recorte.',
    overview.dataCoverage.flags.faltantes > 0
      ? `${overview.dataCoverage.flags.faltantes} projeto(s) ativo(s) ainda não possuem flag/classificação no mês.`
      : 'Flags/classificações estão presentes para os projetos ativos deste recorte.',
  ];

  return {
    titulo,
    resumoExecutivo,
    diagnosticoGeral,
    conformidadeNarrativa,
    correlacoesPrincipais,
    projetosPrioritarios,
    hipotesesDeCausa,
    planoDeAcao,
    limitesDaLeitura,
  };
}

export async function getCorrelationOverview({
  mode,
  mesAno,
  consultorId,
  vorpColaboradorId,
  scopeType,
  scopeLabel,
}: CorrelationOverviewParams): Promise<CorrelationOverview> {
  const previousMesAno = getPreviousMesAno(mesAno);
  const { ano, mes } = toMonthParts(mesAno);

  const scoreConsultorId = mode === 'mine' ? consultorId ?? undefined : undefined;
  const categoryConsultorId = mode === 'mine' ? consultorId ?? undefined : undefined;
  const auditConsultorId = mode === 'mine' ? consultorId ?? undefined : undefined;
  const vorpScopeId = mode === 'mine' ? vorpColaboradorId ?? undefined : undefined;

  const [
    currentScores,
    previousScores,
    currentCategories,
    auditItems,
    projetos,
    healthscores,
    metas,
    churns,
  ] = await Promise.all([
    getScoresPorTipo(mesAno, scoreConsultorId),
    getScoresPorTipo(previousMesAno, scoreConsultorId),
    getViewConformidade(mesAno, categoryConsultorId),
    getAuditoriaPontosDetalhados(mesAno, auditConsultorId),
    getVorpProjetosAtivos(vorpScopeId, mode === 'mine' ? 'Ativo' : null),
    getVorpHealthScores(ano, mes, vorpScopeId),
    getVorpMetas(ano, mes, vorpScopeId),
    getVorpChurn(vorpScopeId),
  ]);

  const conformidadeCarteira = aggregateTypeScore(currentScores, 'Conformidade');
  const resultadoCarteira = aggregateTypeScore(currentScores, 'Resultado');
  const previousConformidade = aggregateTypeScore(previousScores, 'Conformidade');
  const previousResultado = aggregateTypeScore(previousScores, 'Resultado');
  const weakPoints = aggregateWeakPoints(mode, auditItems);
  const categoryScores = aggregateCategoryScores(currentCategories);
  const projetosPrioritarios = buildProjectRiskItems(mode, projetos, healthscores, metas, churns, mesAno);
  const scopedProjects = selectRelevantProjects(mode, projetos);
  const scopedProjectIds = new Set(scopedProjects.map((project) => project.vorp_id));
  const dataCoverage = buildDataCoverage(scopedProjects, healthscores, metas);
  const projetosEmRisco = projetosPrioritarios.filter((item) => item.riscoScore >= 3).length;
  const churnsPeriodo = churns.filter((row) =>
    Boolean(row.projeto_vorp_id)
    && scopedProjectIds.has(row.projeto_vorp_id as string)
    && isSameMesAno(row.vorp_created_at, mesAno),
  ).length;
  const healthscoreMedio = averageOrNull(
    healthscores
      .filter((row) => Boolean(row.projeto_vorp_id) && scopedProjectIds.has(row.projeto_vorp_id as string))
      .map((row) => row.pontuacao ?? null)
      .filter((value): value is number => value != null),
  );
  const { resumoStatus, resumoTexto } = buildStatusAndSummary(
    conformidadeCarteira,
    projetosEmRisco,
    weakPoints,
    churnsPeriodo,
  );

  return {
    mode,
    mesAno,
    scopeType: scopeType ?? (mode === 'operation' ? 'operation' : 'consultant'),
    scopeLabel: scopeLabel ?? (mode === 'operation' ? 'Operação' : 'Consultor'),
    conformidadeCarteira,
    resultadoCarteira,
    deltaConformidade: previousScores.length > 0 ? round(conformidadeCarteira - previousConformidade) : null,
    deltaResultado: previousScores.length > 0 ? round(resultadoCarteira - previousResultado) : null,
    projetosAtivos: scopedProjects.length,
    projetosEmRisco,
    churnsPeriodo,
    healthscoreMedio,
    dataCoverage,
    weakPoints,
    categoryScores,
    projetosPrioritarios,
    alertas: buildAlerts(weakPoints, projetosPrioritarios, categoryScores, churnsPeriodo, dataCoverage),
    resumoStatus,
    resumoTexto,
  };
}
