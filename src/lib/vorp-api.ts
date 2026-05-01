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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tipos NocoDB (campos retornados pela API)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  Empresas?:    LinkedField;
  /** Nome do produto vinculado */
  Produtos?:    LinkedField;
  /** Vertical herdada do produto vinculado */
  'Vertical (from Produtos)'?: LinkedField;
  /** Colaboradores vinculados */
  Colaboradores?: LinkedField;
  /** Nome exibivel dos colaboradores vinculados */
  'Nome colaborador'?: LinkedField;
  'Nome do colaborador'?: LinkedField;
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
  Projetos?:    LinkedField;
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
  Projetos?:   LinkedField;
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
  Projetos?:  LinkedField;
  created_at?: string;
  updated_at?: string;
}

type LinkedRecord = {
  Id?: number | string;
  id?: number | string;
  Nome?: string;
  name?: string;
  Vertical?: string;
  fields?: Record<string, unknown>;
};

type LinkedField = string | LinkedRecord | LinkedRecord[];

// Resposta paginada padrÃ£o do NocoDB v3
interface NocoPaginatedResponse<T> {
  list:       T[];
  records?:   Array<{ id?: number | string; fields?: Record<string, unknown> }>;
  data?:      T[];
  next?:      string | null;
  pageInfo: {
    totalRows:   number;
    page:        number;
    pageSize:    number;
    isFirstPage: boolean;
    isLastPage:  boolean;
  };
}

function normalizeNocoRecord<T>(
  row: T | { id?: number | string; fields?: Record<string, unknown> },
): T {
  if (!row || typeof row !== 'object' || !('fields' in row)) return row as T;

  const envelope = row as { id?: number | string; fields?: Record<string, unknown> };
  const fields = envelope.fields ?? {};

  return {
    Id: envelope.id ?? fields.Id ?? fields.id,
    Nome: fields.Nome ?? fields['Nome completo'] ?? fields['Nome do projeto'] ?? fields.Projeto,
    ...fields,
  } as T;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FunÃ§Ã£o base de fetch
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  const rows: T[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const currentUrl = nextUrl;
    const res: Response = await fetch(currentUrl, {
      headers: {
        'xc-token': API_KEY,
        'Content-Type': 'application/json',
      },
      // Revalida no servidor a cada 5 minutos (Next.js cache hint)
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(
        `[vorp-api] ${tableId} -> HTTP ${res.status}: ${await res.text()}`,
      );
    }

    const data: NocoPaginatedResponse<T> | T[] = await res.json();
    const pageRows = Array.isArray(data)
      ? data
      : (data.list ?? data.records ?? data.data ?? []);

    rows.push(...pageRows.map((row) => normalizeNocoRecord<T>(row)));
    nextUrl = !Array.isArray(data) && typeof data.next === 'string' && data.next
      ? data.next
      : null;
  }

  return rows;
}
// ─────────────────────────────────────────────
// FunÃ§Ãµes pÃºblicas â€” vertical Growth
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Colaboradores da vertical Growth (= consultores). */
export async function getVorpColaboradores(): Promise<VorpColaborador[]> {
  return fetchTable<VorpColaborador>(TABLES.colaboradores, {
    where: `(Vertical,eq,${VERTICAL})`,
  });
}

/** Projetos da vertical Growth (via colaboradores vinculados). */
export async function getVorpProjetos(): Promise<VorpProjeto[]> {
  // Projetos nÃ£o possuem campo Vertical direto; buscamos todos e
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
  return fetchTable<VorpChurn>(TABLES.churn);
}

/** HealthScores â€” todos (filtro por projeto Growth feito no sync). */
export async function getVorpHealthScores(): Promise<VorpHealthScore[]> {
  return fetchTable<VorpHealthScore>(TABLES.healthscores);
}

/** Metas â€” todas (filtro por projeto Growth feito no sync). */
export async function getVorpMetas(): Promise<VorpMeta[]> {
  return fetchTable<VorpMeta>(TABLES.metas);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UtilitÃ¡rios
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function parseMaybeJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!['[', '{'].includes(trimmed[0])) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function readLinkedName(record: LinkedRecord): string | null {
  const fields = record.fields ?? {};
  const fromFields =
    fields.Nome ??
    fields.nome ??
    fields['Nome completo'] ??
    fields['Nome do projeto'] ??
    fields['Nome fantasia'] ??
    fields.Projeto ??
    fields.name;

  const value = record.Nome ?? record.name ?? fromFields;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readLinkedId(record: LinkedRecord): string | null {
  const fields = record.fields ?? {};
  const value = record.Id ?? record.id ?? fields.Id ?? fields.id;
  return value === undefined || value === null || value === '' ? null : String(value);
}

function toLinkedArray(field?: LinkedField | null): Array<string | LinkedRecord> {
  if (!field) return [];
  if (typeof field === 'string') {
    const parsed = parseMaybeJson(field);
    if (!parsed) return [];
    if (typeof parsed === 'string') return parsed.trim() ? [parsed.trim()] : [];
    if (Array.isArray(parsed)) return parsed as Array<string | LinkedRecord>;
    if (typeof parsed === 'object') return [parsed as LinkedRecord];
    return [];
  }
  return Array.isArray(field) ? field : [field];
}

export function resolveNomes(field?: LinkedField | null): string[] {
  return toLinkedArray(field)
    .map((item) => {
      if (typeof item === 'string') return item.trim() || null;
      return readLinkedName(item);
    })
    .filter((value): value is string => Boolean(value));
}

export function resolveIds(field?: LinkedField | null): string[] {
  return toLinkedArray(field)
    .map((item) => {
      if (typeof item === 'string') return null;
      return readLinkedId(item);
    })
    .filter((value): value is string => Boolean(value));
}

/** Extrai o primeiro nome limpo de um campo vinculado do NocoDB. */
export function resolveNome(field?: LinkedField | null): string | null {
  return resolveNomes(field)[0] ?? null;
}

export function resolveNomesTexto(field?: LinkedField | null): string | null {
  const nomes = resolveNomes(field);
  return nomes.length > 0 ? nomes.join(', ') : null;
}

