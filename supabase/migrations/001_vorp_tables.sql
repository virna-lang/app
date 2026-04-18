-- ============================================================
-- Tabelas espelho do Vorp System (NocoDB) — Vertical Growth
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- ── 1. Colaboradores (consultores da vertical Growth) ────────

CREATE TABLE IF NOT EXISTS vorp_colaboradores (
  vorp_id   TEXT PRIMARY KEY,          -- Id do NocoDB convertido para texto
  nome      TEXT NOT NULL,
  email     TEXT,
  telefone  TEXT,
  cargo     TEXT,
  status    TEXT,
  vertical  TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vorp_colaboradores IS
  'Colaboradores da vertical Growth importados do Vorp System.';

-- ── 2. Projetos ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vorp_projetos (
  vorp_id          TEXT PRIMARY KEY,
  nome             TEXT NOT NULL,
  empresa_nome     TEXT,
  status           TEXT,
  produto_nome     TEXT,
  colaborador_nome TEXT,
  fee              NUMERIC,
  canal            TEXT,
  synced_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vorp_projetos IS
  'Projetos da vertical Growth importados do Vorp System.';

-- ── 3. Produtos ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vorp_produtos (
  vorp_id   TEXT PRIMARY KEY,
  nome      TEXT NOT NULL,
  tipo      TEXT,
  vertical  TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vorp_produtos IS
  'Produtos da vertical Growth importados do Vorp System.';

-- ── 4. Churn ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vorp_churn (
  vorp_id       TEXT PRIMARY KEY,
  projeto_nome  TEXT,
  status        TEXT,
  tipo          TEXT,
  vertical      TEXT,
  vorp_created_at TIMESTAMPTZ,
  synced_at     TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vorp_churn IS
  'Registros de Churn da vertical Growth importados do Vorp System.';

-- ── 5. HealthScores ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vorp_healthscores (
  vorp_id                   TEXT PRIMARY KEY,
  projeto_nome              TEXT,
  ano                       INTEGER,
  mes                       INTEGER,
  pontuacao                 NUMERIC,
  classificacao             TEXT,
  engajamento_cliente       NUMERIC,
  entregas                  NUMERIC,
  relacionamento            NUMERIC,
  resultado                 NUMERIC,
  implementacao_ferramentas NUMERIC,
  entrega_treinador_vendas  NUMERIC,
  observacoes               TEXT,
  synced_at                 TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vorp_healthscores IS
  'HealthScores dos projetos Growth importados do Vorp System.';

-- índice para consultas por mês
CREATE INDEX IF NOT EXISTS idx_vorp_hs_mes
  ON vorp_healthscores (ano, mes);

-- ── 6. Metas ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vorp_metas (
  vorp_id          TEXT PRIMARY KEY,
  projeto_nome     TEXT,
  ano              INTEGER,
  mes              INTEGER,
  meta_projetada   NUMERIC,
  meta_realizada   NUMERIC,
  observacoes      TEXT,
  synced_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vorp_metas IS
  'Metas dos projetos Growth importados do Vorp System.';

-- índice para consultas por mês
CREATE INDEX IF NOT EXISTS idx_vorp_metas_mes
  ON vorp_metas (ano, mes);

-- ── 7. Log de sincronizações ─────────────────────────────────

CREATE TABLE IF NOT EXISTS vorp_sync_log (
  id          BIGSERIAL PRIMARY KEY,
  tabela      TEXT NOT NULL,
  registros   INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'ok',   -- 'ok' | 'erro'
  mensagem    TEXT,
  executado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vorp_sync_log IS
  'Histórico de execuções de sincronização com o Vorp System.';
