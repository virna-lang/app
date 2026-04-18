/**
 * Cliente para a API do Vorp System (NocoDB v3)
 * Busca dados da vertical de Growth: colaboradores, projetos, produtos,
 * churn, healthscores e metas.
 */

const BASE_URL  = process.env.VORP_API_URL  ?? '';
const API_KEY   = process.env.VORP_API_KEY  ?? '';
const BASE_ID   = process.env.VORP_BASE_ID  ?? 'pd90pmw26pxw28p';
const VERTICAL  = process.env.VORP_VERTICAL ?? 'Growth';

// IDs das tabelas no NocoDB
const TABLES = {
  colaboradores: 'mgfth3rkiui6cqe',
  projetos:      'm1ncqs230heea1j',
  produtos:      'mb8stqr8kjzjf2n',
  churn:         'mw3njb9laen7fa7',
  healthscores:  'mtq9gdiibpu49nc',
  metas:         'mlstarc6ceajj6b',
} as const;

// ─────────────────────────────────────────────
// Tipos NocoDB (campos retornados pela API)
// ─────────────────────────────────────────────

export interface VorpColaborador {
  Id:         number;
  Nome:       string;
  Email?:     string;
  Telefone?:  string;
  Cargo?:     string;
  Status?:    string;
  Vertical?:  string;
  created_at?: string;
  updated_at?: string;
}

export interface VorpProjeto {
  Id:           number;
  Nome:         string;
  Status?:      string;
  FEE?:         number;
  Canal?:       string;
  /** Nome da empresa vinculada (campo lookup/roll-up) */
  Empresas?:    string | { Nome?: string }[];
  /** Nome do produto vinculado */
  Produtos?:    string | { Nome?: string; Vertical?: string }[];
  /** Colaboradores vinculados */
  Colaboradores?: { Nome?: string; Vertical?: string }[];
  created_at?:  string;
  updated_at?:  string;
}

export interface VorpProduto {
  Id:        number;
  Nome:      string;
  Tipo?:     string;
  Vertical?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VorpChurn {
  Id:           number;
  Nome?:        string;
  Status?:      string;
  Tipo?:        string;
  Vertical?:    string;
  /** Projeto vinculado */
  Projetos?:    string | { Nome?: string }[];
  created_at?:  string;
}

export interface VorpHealthScore {
  Id:                          number;
  ano?:                        number;
  mes?:                        number;
  pontuacao?:                  number;
  classificacao?:              string;
  engajamento_cliente?:        number;
  entregas?:                   number;
  relacionamento?:             number;
  resultado?:                  number;
  implementacao_ferramentas?:  number;
  entrega_treinador_vendas?:   number;
  observacoes?:                string;
  /** Projeto vinculado */
  Projetos?:   string | { Nome?: string }[];
  created_at?: string;
  updated_at?: string;
}

export interface VorpMeta {
  Id:               number;
  ano?:             number;
  mes?:             number;
  meta_projetada?:  number;
  meta_realizada?:  number;
  observacoes?:     string;
  /** Projeto vinculado */
  Projetos?:  string | { Nome?: string }[];
  created_at?: string;
  updated_at?: string;
}

// Resposta paginada padrão do NocoDB v3
interface NocoPaginatedResponse<T> {
  list:       T[];
  pageInfo: {
    totalRows:   number;
    page:        number;
    pageSize:    number;
    isFirstPage: boolean;
    isLastPage:  boolean;
  };
}

// ─────────────────────────────────────────────
// Função base de fetch
// ─────────────────────────────────────────────

async function fetchTable<T>(
  tableId: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const url = new URL(
    `/api/v3/data/${BASE_ID}/${tableId}/records`,
    BASE_URL,
  );

  // Paginação automática — busca até 1 000 registros por página
  url.searchParams.set('limit', '1000');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      'xc-token': API_KEY,
      'Content-Type': 'application/json',
    },
    // Revalida no servidor a cada 5 minutos (Next.js cache hint)
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(
      `[vorp-api] ${tableId} → HTTP ${res.status}: ${await res.text()}`,
    );
  }

  const data: NocoPaginatedResponse<T> = await res.json();
  return data.list ?? [];
}

// ─────────────────────────────────────────────
// Funções públicas — vertical Growth
// ─────────────────────────────────────────────

/** Colaboradores da vertical Growth (= consultores). */
export async function getVorpColaboradores(): Promise<VorpColaborador[]> {
  return fetchTable<VorpColaborador>(TABLES.colaboradores, {
    where: `(Vertical,eq,${VERTICAL})`,
  });
}

/** Projetos da vertical Growth (via colaboradores vinculados). */
export async function getVorpProjetos(): Promise<VorpProjeto[]> {
  // Projetos não possuem campo Vertical direto; buscamos todos e
  // filtramos pelo produto ou colaborador da vertical no sync.
  return fetchTable<VorpProjeto>(TABLES.projetos);
}

/** Produtos da vertical Growth. */
export async function getVorpProdutos(): Promise<VorpProduto[]> {
  return fetchTable<VorpProduto>(TABLES.produtos, {
    where: `(Vertical,eq,${VERTICAL})`,
  });
}

/** Registros de Churn da vertical Growth. */
export async function getVorpChurn(): Promise<VorpChurn[]> {
  return fetchTable<VorpChurn>(TABLES.churn, {
    where: `(Vertical,eq,${VERTICAL})`,
  });
}

/** HealthScores — todos (filtro por projeto Growth feito no sync). */
export async function getVorpHealthScores(): Promise<VorpHealthScore[]> {
  return fetchTable<VorpHealthScore>(TABLES.healthscores);
}

/** Metas — todas (filtro por projeto Growth feito no sync). */
export async function getVorpMetas(): Promise<VorpMeta[]> {
  return fetchTable<VorpMeta>(TABLES.metas);
}

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────

/** Extrai o nome de um campo que pode ser string ou array de objetos. */
export function resolveNome(
  field?: string | { Nome?: string }[],
): string | null {
  if (!field) return null;
  if (typeof field === 'string') return field || null;
  if (Array.isArray(field) && field.length > 0) return field[0].Nome ?? null;
  return null;
}
