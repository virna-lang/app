/**
 * Conversão de "pergunta de auditoria" → narrativa de impacto operacional.
 *
 * Em vez de exibir o item de auditoria literalmente (ex.: "Os clientes possuem
 * gravações de reuniões?" 0%), traduzimos para a leitura que importa pra
 * operação (ex.: "100% dos projetos estão sem gravações arquivadas — isso
 * causa perda de rastreabilidade e dificuldade de handoff").
 *
 * Match é por substring normalizada (sem acento, lowercase) — robusto a
 * pequenas variações na pergunta cadastrada.
 */

export interface ImpactoNarrativa {
  /** Frase principal, ex.: "62% dos projetos estão sem flag preenchida". */
  headline: string;
  /** 2–3 consequências operacionais. Ex.: "operação sem diagnóstico de saúde". */
  consequencias: string[];
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function pctStr(pct: number): string {
  if (!Number.isFinite(pct)) return '0%';
  // Sem casas decimais quando inteiro, 1 casa quando fracionário
  return pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`;
}

/**
 * Cada regra tem:
 * - `match`: array de substrings (normalizadas) que TODAS devem estar
 *   presentes na pergunta para a regra disparar.
 * - `headline(pct)`: monta a headline com o % de NÃO-conformidade.
 * - `consequencias`: lista fixa de 2–3 consequências operacionais.
 */
interface ImpactoRule {
  match: string[];
  /** Recebe o % de não-conformidade já formatado e a pergunta original
   *  (para extrair contexto como produto entre parênteses). */
  headline: (pct: string, pergunta: string) => string;
  consequencias: string[];
}

/** Extrai conteúdo entre parênteses no final da pergunta — geralmente o produto.
 *  Ex.: "Quantos % … operação? (Aliança Pro)" → "Aliança Pro"
 *  Retorna null se não houver, ou se for "Todos os produtos". */
function extractProdutoSuffix(pergunta: string): string | null {
  const match = pergunta.match(/\(([^)]+)\)\s*$/);
  if (!match) return null;
  const produto = match[1].trim();
  if (/todos/i.test(produto)) return null; // "Todos os produtos" = recorte agregado
  return produto;
}

const RULES: ImpactoRule[] = [
  // ── Drive: gravações de reunião ─────────────────────────────────────────
  {
    match: ['gravacoes', 'reunioes'],
    headline: (pct) => `${pct} dos projetos avaliados estão sem gravações de reunião arquivadas no Drive`,
    consequencias: [
      'perda de rastreabilidade do que foi alinhado com o cliente',
      'consultor sem material para revisar antes da próxima reunião',
      'se houver troca de consultor, sucessor fica sem contexto',
    ],
  },
  // ── Drive: entregas no drive do cliente ────────────────────────────────
  {
    match: ['entregas', 'drives'],
    headline: (pct) => `${pct} das entregas avaliadas não estão arquivadas no Drive do cliente`,
    consequencias: [
      'cliente não consegue acessar histórico de entregas por conta própria',
      'dificulta comprovar valor entregue em caso de churn',
      'time perde referência para reaproveitar entregas em outros projetos',
    ],
  },
  // ── Drive: identidade visual ───────────────────────────────────────────
  {
    match: ['identidade visual'],
    headline: (pct) => `${pct} dos arquivos avaliados estão fora da identidade visual da Vorp`,
    consequencias: [
      'percepção de pouca padronização e maturidade do time',
      'cliente recebe material visualmente inconsistente entre consultores',
    ],
  },
  // ── Vorp System: meta batida ───────────────────────────────────────────
  {
    match: ['meta batida'],
    headline: (pct, pergunta) => {
      const produto = extractProdutoSuffix(pergunta);
      if (produto) {
        return `${pct} dos clientes avaliados em ${produto} não bateram a meta do produto neste recorte`;
      }
      return `${pct} dos clientes avaliados não bateram a meta consolidada da operação neste recorte`;
    },
    consequencias: [
      'risco de churn por percepção de não-entrega no produto auditado',
      'pressiona o resultado consolidado da carteira no mês',
      'dificulta renovação e expansão de fee neste produto',
    ],
  },
  // ── Vorp System: flags Care / Safe / Danger ────────────────────────────
  {
    match: ['flags', 'care'],
    headline: (pct) => `${pct} dos clientes avaliados não estão classificados como Care quando deveriam`,
    consequencias: [
      'clientes que precisam de atenção extra ficam invisíveis no painel',
      'CS perde gatilho pra agir antes do problema escalar',
    ],
  },
  {
    match: ['flags', 'safe'],
    headline: (pct) => `${pct} dos clientes avaliados não estão classificados como Safe quando deveriam`,
    consequencias: [
      'subestimamos o tamanho da carteira saudável (afeta NPS e renovação)',
      'clientes "Safe" mal classificados puxam o diagnóstico geral para baixo',
    ],
  },
  {
    match: ['flags', 'danger'],
    headline: (pct) => `${pct} dos clientes avaliados não estão classificados como Danger quando deveriam`,
    consequencias: [
      'clientes em risco real ficam sem plano de retenção',
      'churn aparece sem alerta antecipado',
    ],
  },
  // ── Vorp System: flags preenchidas em geral ────────────────────────────
  {
    match: ['flags', 'preenchidas'],
    headline: (pct) => `${pct} dos clientes avaliados estão sem flag preenchida no Vorp System`,
    consequencias: [
      'operação sem diagnóstico de saúde da carteira',
      'gestores sem visibilidade para priorizar ações de retenção',
      'painel de risco perde valor preditivo',
    ],
  },
  // ── Vorp System: critérios das flags ───────────────────────────────────
  {
    match: ['criterios das flags'],
    headline: (pct) => `${pct} dos clientes avaliados têm flag fora dos critérios definidos`,
    consequencias: [
      'classificação subjetiva mascara a real saúde da operação',
      'comparações entre consultores ficam injustas e enviesadas',
    ],
  },
  // ── Vorp System: realizados da meta preenchidos ────────────────────────
  {
    match: ['realizados da meta'],
    headline: (pct, pergunta) => {
      const produto = extractProdutoSuffix(pergunta);
      if (produto) {
        return `${pct} das metas avaliadas em ${produto} estão sem o valor realizado preenchido`;
      }
      return `${pct} das metas avaliadas estão sem o valor realizado preenchido`;
    },
    consequencias: [
      'KPIs de batimento de meta ficam distorcidos neste produto',
      'cliente não vê evolução numérica do trabalho',
    ],
  },
  // ── Vorp System: metas inseridas até o dia 5 ───────────────────────────
  {
    match: ['metas', 'dia 5'],
    headline: (pct) => `${pct} das metas mensais foram inseridas após o dia 5 (fora do prazo)`,
    consequencias: [
      'cliente começa o mês sem direção formal de entrega',
      'gestor não consegue acompanhar projeção vs. realizado em tempo real',
    ],
  },
  // ── Vorp System: entregas X escopo do produto ──────────────────────────
  {
    match: ['entregas', 'escopo'],
    headline: (pct) => `${pct} das entregas avaliadas estão fora do escopo contratado`,
    consequencias: [
      'consultor entrega mais do que o produto prevê (margem comprometida)',
      'ou entrega menos, gerando percepção de produto raso',
      'dificulta padronizar a operação entre clientes do mesmo produto',
    ],
  },
  // ── ClickUp: justificativas em tarefas atrasadas ───────────────────────
  {
    match: ['tarefas', 'justificativas'],
    headline: (pct) => `${pct} das tarefas atrasadas ou sem reunião estão sem justificativa no ClickUp`,
    consequencias: [
      'gestor não tem como auditar atrasos e cobrar reposição',
      'reuniões perdidas viram passivo invisível no projeto',
    ],
  },
  // ── ClickUp: histórico/transcrições ────────────────────────────────────
  {
    match: ['historico', 'comentarios'],
    headline: (pct) => `${pct} dos projetos avaliados têm histórico de ClickUp incompleto (sem transcrições/descrições)`,
    consequencias: [
      'se o consultor sair, sucessor não consegue retomar pelo ClickUp',
      'gestor não consegue revisar contexto do projeto sem chamar o consultor',
    ],
  },
  // ── ClickUp: continuidade se consultor sair ────────────────────────────
  {
    match: ['consultor sair', 'clickup'],
    headline: (pct) => `${pct} dos projetos avaliados não passariam num teste de troca de consultor (handoff via ClickUp)`,
    consequencias: [
      'dependência alta da memória individual de cada consultor',
      'risco operacional grave em caso de desligamento ou férias',
    ],
  },
  // ── ClickUp: temporizador de reuniões ──────────────────────────────────
  {
    match: ['temporizador'],
    headline: (pct) => `${pct} das reuniões avaliadas estão sem o temporizador do ClickUp preenchido`,
    consequencias: [
      'time perde dado real de tempo investido por cliente',
      'difícil identificar projetos que consomem mais hora que o fee comporta',
    ],
  },
  // ── WhatsApp: encaminhamentos pós-reunião ──────────────────────────────
  {
    match: ['resumo', 'grupo'],
    headline: (pct) => `${pct} das últimas reuniões avaliadas não tiveram resumo/encaminhamento enviado no grupo`,
    consequencias: [
      'cliente esquece o que foi combinado e cobra reentrega',
      'ausência de registro escrito do alinhamento (vira "ele falou, ela falou")',
    ],
  },
  // ── WhatsApp: resposta no último turno ─────────────────────────────────
  {
    match: ['respondidos', 'turno'],
    headline: (pct) => `${pct} dos clientes avaliados ficaram com mensagens sem resposta no último turno (>24h úteis)`,
    consequencias: [
      'cliente percebe descaso e abre processo de saída',
      'reclamações explícitas viram trigger formal de churn',
    ],
  },
  // ── Dados: clientes atendidos no mês ───────────────────────────────────
  {
    match: ['atendidos', 'mes'],
    headline: (pct) => `${pct} dos clientes da carteira NÃO foram atendidos dentro do mês`,
    consequencias: [
      'percepção de abandono — gatilho clássico de churn',
      'fee cobrado sem contrapartida visível para o cliente',
    ],
  },
];

/**
 * Tenta casar a pergunta com uma regra do dicionário. Retorna null se nada bate.
 */
function findRule(perguntaNorm: string): ImpactoRule | null {
  for (const rule of RULES) {
    if (rule.match.every((token) => perguntaNorm.includes(token))) {
      return rule;
    }
  }
  return null;
}

/**
 * Monta a narrativa de impacto. Sempre retorna algo:
 * - Se a pergunta bate com uma regra do dicionário → headline curada + consequências.
 * - Se não bate (pergunta nova/não mapeada) → headline genérica usando o % de não-conformidade.
 */
export function buildImpactoNarrativa(
  pergunta: string,
  notaPct: number,
  qtdAvaliados: number,
  qtdConformes: number,
): ImpactoNarrativa {
  // % de NÃO-conformidade (o que importa pra leitura de impacto)
  const naoConformesPct = qtdAvaliados > 0
    ? ((qtdAvaliados - qtdConformes) / qtdAvaliados) * 100
    : Math.max(0, 100 - notaPct);
  const pct = pctStr(naoConformesPct);

  const rule = findRule(normalize(pergunta));
  if (rule) {
    return {
      headline: rule.headline(pct, pergunta),
      consequencias: rule.consequencias,
    };
  }

  // Fallback genérico: ainda traz a leitura de não-conformidade, sem consequências.
  return {
    headline: `${pct} dos itens avaliados estão fora de conformidade em "${pergunta}"`,
    consequencias: [],
  };
}
