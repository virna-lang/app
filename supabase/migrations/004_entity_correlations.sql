-- ============================================================
-- Entity correlations between the internal audit system and
-- Vorp System mirrored tables.
-- Execute in Supabase SQL Editor before relying on ID-based
-- Vorp System filters in production.
-- ============================================================

-- 1. Canonical consultant mapping.
ALTER TABLE consultores
  ADD COLUMN IF NOT EXISTS vorp_colaborador_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultores_vorp_colaborador_id_fkey'
  ) THEN
    ALTER TABLE consultores
      ADD CONSTRAINT consultores_vorp_colaborador_id_fkey
      FOREIGN KEY (vorp_colaborador_id)
      REFERENCES vorp_colaboradores (vorp_id)
      ON UPDATE CASCADE
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'consultores_vorp_colaborador_id_fkey'
      AND NOT convalidated
  ) THEN
    ALTER TABLE consultores VALIDATE CONSTRAINT consultores_vorp_colaborador_id_fkey;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultores_vorp_colaborador_id
  ON consultores (vorp_colaborador_id);

-- Backfill known Growth consultant mappings observed in April/2026.
UPDATE consultores SET vorp_colaborador_id = '8'
  WHERE id = 'cd5f3e37-4e9d-4a15-99eb-ea2038de5a2b' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '97'
  WHERE id = '3ac8e9c1-97dd-4010-a322-b235d66770ba' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '49'
  WHERE id = '80a5a1ac-289a-4b09-b4cb-154b9592fd0f' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '50'
  WHERE id = 'abac424b-1262-481f-ab23-82d8a8cb3c05' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '106'
  WHERE id = 'ce3ec1ec-619a-4d14-b5e8-6a9d300eb0eb' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '72'
  WHERE id = '0a4a3afa-c290-4aff-828b-345cc7753180' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '89'
  WHERE id = 'd6ebc4ce-2709-4e0c-a414-d25a33a4710a' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '74'
  WHERE id = '7d4e8c7f-9e85-4940-9061-b0f06382a3c8' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '93'
  WHERE id = '64c1b685-1c11-4aa6-8269-788a217eb520' AND vorp_colaborador_id IS NULL;
UPDATE consultores SET vorp_colaborador_id = '120'
  WHERE id = 'af38a820-8d92-4724-ba68-1226add1e251' AND vorp_colaborador_id IS NULL;

-- 2. Canonical client/project mapping.
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS vorp_projeto_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_vorp_projeto_id_fkey'
  ) THEN
    ALTER TABLE clientes
      ADD CONSTRAINT clientes_vorp_projeto_id_fkey
      FOREIGN KEY (vorp_projeto_id)
      REFERENCES vorp_projetos (vorp_id)
      ON UPDATE CASCADE
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clientes_vorp_projeto_id_fkey'
      AND NOT convalidated
  ) THEN
    ALTER TABLE clientes VALIDATE CONSTRAINT clientes_vorp_projeto_id_fkey;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clientes_vorp_projeto_id
  ON clientes (vorp_projeto_id);

-- 3. Keep local schema aligned with the live Supabase schema.
ALTER TABLE vorp_metas
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT;

ALTER TABLE vorp_healthscores
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT;

ALTER TABLE vorp_churn
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT;

CREATE INDEX IF NOT EXISTS idx_vorp_metas_projeto_vorp_id
  ON vorp_metas (projeto_vorp_id);

CREATE INDEX IF NOT EXISTS idx_vorp_healthscores_projeto_vorp_id
  ON vorp_healthscores (projeto_vorp_id);

CREATE INDEX IF NOT EXISTS idx_vorp_churn_projeto_vorp_id
  ON vorp_churn (projeto_vorp_id);

-- 4. Diagnostic view for consultant identity.
CREATE OR REPLACE VIEW view_diagnostico_consultores_vorp AS
SELECT
  c.id AS consultor_id,
  c.nome AS consultor_nome,
  c.status AS consultor_status,
  c.vorp_colaborador_id,
  vc.nome AS vorp_colaborador_nome,
  vc.email AS vorp_colaborador_email,
  vc.status AS vorp_colaborador_status,
  CASE
    WHEN c.vorp_colaborador_id IS NOT NULL AND vc.vorp_id IS NOT NULL THEN 'forte'
    WHEN c.vorp_colaborador_id IS NOT NULL AND vc.vorp_id IS NULL THEN 'quebrado'
    ELSE 'ausente'
  END AS status_correlacao
FROM consultores c
LEFT JOIN vorp_colaboradores vc
  ON vc.vorp_id = c.vorp_colaborador_id;
