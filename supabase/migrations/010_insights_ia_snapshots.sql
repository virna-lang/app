-- ============================================================
-- Snapshots de Insights IA
-- ============================================================
-- Guarda a leitura gerada por consultor/mes, junto do payload usado.
-- Isso cria rastreabilidade: o app sabe o que a IA recebeu, qual modelo
-- respondeu e quando a leitura foi gerada.

CREATE TABLE IF NOT EXISTS insights_ia_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL
    CHECK (mode IN ('mine', 'operation')),
  consultor_id UUID
    REFERENCES consultores (id) ON UPDATE CASCADE ON DELETE SET NULL,
  scope_key TEXT GENERATED ALWAYS AS (
    COALESCE(consultor_id::TEXT, 'operation')
  ) STORED,
  mes_ano TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  overview JSONB NOT NULL,
  insights JSONB NOT NULL,
  source TEXT NOT NULL
    CHECK (source IN ('openai', 'fallback')),
  model TEXT,
  warning TEXT,
  status TEXT NOT NULL DEFAULT 'ok'
    CHECK (status IN ('ok', 'erro')),
  error_message TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_ia_snapshots_lookup
  ON insights_ia_snapshots (mode, mes_ano, consultor_id, generated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_insights_ia_snapshots_payload
  ON insights_ia_snapshots (
    mode,
    mes_ano,
    scope_key,
    payload_hash
  );

CREATE OR REPLACE FUNCTION set_insights_ia_snapshots_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_insights_ia_snapshots_updated_at ON insights_ia_snapshots;
CREATE TRIGGER trg_insights_ia_snapshots_updated_at
BEFORE UPDATE ON insights_ia_snapshots
FOR EACH ROW
EXECUTE FUNCTION set_insights_ia_snapshots_updated_at();

COMMENT ON TABLE insights_ia_snapshots IS
  'Historico rastreavel das leituras de Insights IA por consultor/mes e hash do payload consolidado.';

COMMENT ON COLUMN insights_ia_snapshots.overview IS
  'Payload consolidado da correlacao enviado como base factual para a IA.';

COMMENT ON COLUMN insights_ia_snapshots.insights IS
  'Resposta estruturada gerada pela IA ou fallback deterministico local.';
