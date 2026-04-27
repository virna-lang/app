-- ============================================================
-- Identidade canonica de colaboradores por projeto Vorp
-- ============================================================
-- Regra principal:
--   consultores.id -> ID interno da auditoria
--   consultores.vorp_colaborador_id -> vorp_colaboradores.vorp_id
--   vorp_colaboradores.vorp_id -> ID oficial do colaborador no Vorp System
--
-- vorp_projetos.colaborador_vorp_id / consultor_id ficam apenas como
-- ponte temporaria de compatibilidade. A fonte correta para projetos com
-- multiplos colaboradores passa a ser vorp_projeto_colaboradores.

ALTER TABLE consultores
  ADD COLUMN IF NOT EXISTS vorp_colaborador_id TEXT;

DO LANGUAGE plpgsql $$
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

CREATE INDEX IF NOT EXISTS idx_consultores_vorp_colaborador_id
  ON consultores (vorp_colaborador_id);

ALTER TABLE vorp_projetos
  ADD COLUMN IF NOT EXISTS colaborador_vorp_id TEXT
    REFERENCES vorp_colaboradores (vorp_id) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS produto_vorp_id TEXT
    REFERENCES vorp_produtos (vorp_id) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consultor_id UUID
    REFERENCES consultores (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE vorp_churn
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT
    REFERENCES vorp_projetos (vorp_id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE vorp_healthscores
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT
    REFERENCES vorp_projetos (vorp_id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE vorp_metas
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT
    REFERENCES vorp_projetos (vorp_id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS vorp_projeto_colaboradores (
  projeto_vorp_id TEXT NOT NULL
    REFERENCES vorp_projetos (vorp_id) ON UPDATE CASCADE ON DELETE CASCADE,
  vorp_colaborador_id TEXT NOT NULL
    REFERENCES vorp_colaboradores (vorp_id) ON UPDATE CASCADE ON DELETE CASCADE,
  consultor_id UUID
    REFERENCES consultores (id) ON UPDATE CASCADE ON DELETE SET NULL,
  colaborador_nome_snapshot TEXT,
  origem TEXT NOT NULL DEFAULT 'sync',
  confianca_match NUMERIC(3,2) NOT NULL DEFAULT 1.00
    CHECK (confianca_match >= 0 AND confianca_match <= 1),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (projeto_vorp_id, vorp_colaborador_id)
);

CREATE INDEX IF NOT EXISTS idx_vorp_proj_colabs_colaborador
  ON vorp_projeto_colaboradores (vorp_colaborador_id);

CREATE INDEX IF NOT EXISTS idx_vorp_proj_colabs_consultor
  ON vorp_projeto_colaboradores (consultor_id);

CREATE TABLE IF NOT EXISTS vorp_projeto_colaborador_pendencias (
  id BIGSERIAL PRIMARY KEY,
  projeto_vorp_id TEXT NOT NULL
    REFERENCES vorp_projetos (vorp_id) ON UPDATE CASCADE ON DELETE CASCADE,
  colaborador_nome_snapshot TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'sync',
  motivo TEXT NOT NULL DEFAULT 'sem_match',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (projeto_vorp_id, colaborador_nome_snapshot)
);

CREATE INDEX IF NOT EXISTS idx_vorp_proj_colab_pendencias_projeto
  ON vorp_projeto_colaborador_pendencias (projeto_vorp_id);

CREATE OR REPLACE FUNCTION vorp_normalize_text(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(regexp_replace(lower(translate(coalesce(value, ''),
    'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
  )), '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION link_consultores_vorp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE consultores c
  SET vorp_colaborador_id = vc.vorp_id
  FROM vorp_colaboradores vc
  WHERE c.vorp_colaborador_id IS NULL
    AND vorp_normalize_text(c.nome) = vorp_normalize_text(vc.nome);

  UPDATE consultores c
  SET vorp_colaborador_id = vc.vorp_id
  FROM vorp_colaboradores vc
  WHERE c.vorp_colaborador_id IS NULL
    AND vorp_normalize_text(vc.nome) LIKE '%' || vorp_normalize_text(c.nome) || '%'
    AND (
      SELECT COUNT(*)
      FROM vorp_colaboradores v2
      WHERE vorp_normalize_text(v2.nome) LIKE '%' || vorp_normalize_text(c.nome) || '%'
    ) = 1;
END;
$$;

CREATE OR REPLACE FUNCTION link_vorp_project_collaborators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM link_consultores_vorp();

  WITH nomes AS (
    SELECT
      p.vorp_id AS projeto_vorp_id,
      trim(nome_raw.nome) AS colaborador_nome_snapshot
    FROM vorp_projetos p
    CROSS JOIN LATERAL regexp_split_to_table(coalesce(p.colaborador_nome, ''), ',') AS nome_raw(nome)
    WHERE trim(nome_raw.nome) <> ''
  ),
  candidatos AS (
    SELECT
      n.projeto_vorp_id,
      n.colaborador_nome_snapshot,
      vc.vorp_id AS vorp_colaborador_id,
      c.id AS consultor_id,
      COUNT(*) OVER (
        PARTITION BY n.projeto_vorp_id, vorp_normalize_text(n.colaborador_nome_snapshot)
      ) AS qtd_candidatos
    FROM nomes n
    JOIN vorp_colaboradores vc
      ON vorp_normalize_text(vc.nome) = vorp_normalize_text(n.colaborador_nome_snapshot)
    LEFT JOIN consultores c
      ON c.vorp_colaborador_id = vc.vorp_id
  ),
  matches AS (
    SELECT *
    FROM candidatos
    WHERE qtd_candidatos = 1
  )
  INSERT INTO vorp_projeto_colaboradores (
    projeto_vorp_id,
    vorp_colaborador_id,
    consultor_id,
    colaborador_nome_snapshot,
    origem,
    confianca_match,
    synced_at
  )
  SELECT
    projeto_vorp_id,
    vorp_colaborador_id,
    consultor_id,
    colaborador_nome_snapshot,
    'funcao_nome_exato',
    0.90,
    NOW()
  FROM matches
  ON CONFLICT (projeto_vorp_id, vorp_colaborador_id)
  DO UPDATE SET
    consultor_id = EXCLUDED.consultor_id,
    colaborador_nome_snapshot = EXCLUDED.colaborador_nome_snapshot,
    origem = EXCLUDED.origem,
    confianca_match = EXCLUDED.confianca_match,
    synced_at = EXCLUDED.synced_at;

  UPDATE vorp_projeto_colaboradores pc
  SET consultor_id = c.id
  FROM consultores c
  WHERE c.vorp_colaborador_id = pc.vorp_colaborador_id
    AND (pc.consultor_id IS NULL OR pc.consultor_id <> c.id);

  WITH nomes AS (
    SELECT
      p.vorp_id AS projeto_vorp_id,
      trim(nome_raw.nome) AS colaborador_nome_snapshot
    FROM vorp_projetos p
    CROSS JOIN LATERAL regexp_split_to_table(coalesce(p.colaborador_nome, ''), ',') AS nome_raw(nome)
    WHERE trim(nome_raw.nome) <> ''
  ),
  sem_match AS (
    SELECT n.*
    FROM nomes n
    WHERE NOT EXISTS (
      SELECT 1
      FROM vorp_colaboradores vc
      WHERE vorp_normalize_text(vc.nome) = vorp_normalize_text(n.colaborador_nome_snapshot)
    )
  )
  INSERT INTO vorp_projeto_colaborador_pendencias (
    projeto_vorp_id,
    colaborador_nome_snapshot,
    origem,
    motivo,
    synced_at
  )
  SELECT
    projeto_vorp_id,
    colaborador_nome_snapshot,
    'funcao_nome_exato',
    'sem_match_vorp_colaboradores',
    NOW()
  FROM sem_match
  ON CONFLICT (projeto_vorp_id, colaborador_nome_snapshot)
  DO UPDATE SET
    origem = EXCLUDED.origem,
    motivo = EXCLUDED.motivo,
    synced_at = EXCLUDED.synced_at;

  DELETE FROM vorp_projeto_colaborador_pendencias pend
  WHERE EXISTS (
    SELECT 1
    FROM vorp_colaboradores vc
    WHERE vorp_normalize_text(vc.nome) = vorp_normalize_text(pend.colaborador_nome_snapshot)
  );
END;
$$;

CREATE OR REPLACE FUNCTION link_vorp_fks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM link_consultores_vorp();

  UPDATE vorp_projetos p
  SET produto_vorp_id = pr.vorp_id
  FROM vorp_produtos pr
  WHERE p.produto_nome IS NOT NULL
    AND vorp_normalize_text(p.produto_nome) = vorp_normalize_text(pr.nome)
    AND (p.produto_vorp_id IS NULL OR p.produto_vorp_id <> pr.vorp_id);

  UPDATE vorp_churn ch
  SET projeto_vorp_id = p.vorp_id
  FROM vorp_projetos p
  WHERE ch.projeto_nome IS NOT NULL
    AND vorp_normalize_text(ch.projeto_nome) IN (
      vorp_normalize_text(p.nome),
      vorp_normalize_text(p.empresa_nome)
    )
    AND (ch.projeto_vorp_id IS NULL OR ch.projeto_vorp_id <> p.vorp_id);

  UPDATE vorp_healthscores hs
  SET projeto_vorp_id = p.vorp_id
  FROM vorp_projetos p
  WHERE hs.projeto_nome IS NOT NULL
    AND vorp_normalize_text(hs.projeto_nome) IN (
      vorp_normalize_text(p.nome),
      vorp_normalize_text(p.empresa_nome)
    )
    AND (hs.projeto_vorp_id IS NULL OR hs.projeto_vorp_id <> p.vorp_id);

  UPDATE vorp_metas m
  SET projeto_vorp_id = p.vorp_id
  FROM vorp_projetos p
  WHERE m.projeto_nome IS NOT NULL
    AND vorp_normalize_text(m.projeto_nome) IN (
      vorp_normalize_text(p.nome),
      vorp_normalize_text(p.empresa_nome)
    )
    AND (m.projeto_vorp_id IS NULL OR m.projeto_vorp_id <> p.vorp_id);

  PERFORM link_vorp_project_collaborators();

  WITH principal AS (
    SELECT DISTINCT ON (projeto_vorp_id)
      projeto_vorp_id,
      vorp_colaborador_id,
      consultor_id
    FROM vorp_projeto_colaboradores
    ORDER BY projeto_vorp_id, consultor_id NULLS LAST, vorp_colaborador_id
  )
  UPDATE vorp_projetos p
  SET
    colaborador_vorp_id = principal.vorp_colaborador_id,
    consultor_id = principal.consultor_id
  FROM principal
  WHERE p.vorp_id = principal.projeto_vorp_id
    AND (
      p.colaborador_vorp_id IS DISTINCT FROM principal.vorp_colaborador_id
      OR p.consultor_id IS DISTINCT FROM principal.consultor_id
    );
END;
$$;

CREATE OR REPLACE VIEW view_vorp_projetos_por_consultor AS
SELECT
  p.vorp_id AS projeto_vorp_id,
  p.nome AS projeto_nome,
  p.empresa_nome,
  p.status,
  p.produto_nome,
  p.produto_vorp_id,
  p.colaborador_nome,
  p.fee,
  p.canal,
  p.tratativa_cs,
  p.tratativa_cs_obs,
  p.synced_at AS projeto_synced_at,
  pc.vorp_colaborador_id,
  pc.consultor_id,
  c.nome AS consultor_nome,
  vc.nome AS vorp_colaborador_nome,
  pc.colaborador_nome_snapshot,
  pc.origem,
  pc.confianca_match,
  pc.synced_at AS vinculo_synced_at
FROM vorp_projetos p
JOIN vorp_projeto_colaboradores pc
  ON pc.projeto_vorp_id = p.vorp_id
LEFT JOIN vorp_colaboradores vc
  ON vc.vorp_id = pc.vorp_colaborador_id
LEFT JOIN consultores c
  ON c.id = pc.consultor_id;

CREATE OR REPLACE VIEW view_vorp_churn_por_consultor AS
SELECT
  ch.*,
  pc.vorp_colaborador_id,
  pc.consultor_id,
  c.nome AS consultor_nome,
  vc.nome AS vorp_colaborador_nome,
  p.nome AS projeto_nome_canonico,
  p.tratativa_cs
FROM vorp_churn ch
JOIN vorp_projetos p
  ON p.vorp_id = ch.projeto_vorp_id
JOIN vorp_projeto_colaboradores pc
  ON pc.projeto_vorp_id = p.vorp_id
LEFT JOIN vorp_colaboradores vc
  ON vc.vorp_id = pc.vorp_colaborador_id
LEFT JOIN consultores c
  ON c.id = pc.consultor_id;

CREATE OR REPLACE VIEW view_vorp_healthscores_por_consultor AS
SELECT
  hs.*,
  pc.vorp_colaborador_id,
  pc.consultor_id,
  c.nome AS consultor_nome,
  vc.nome AS vorp_colaborador_nome,
  p.nome AS projeto_nome_canonico,
  p.tratativa_cs
FROM vorp_healthscores hs
JOIN vorp_projetos p
  ON p.vorp_id = hs.projeto_vorp_id
JOIN vorp_projeto_colaboradores pc
  ON pc.projeto_vorp_id = p.vorp_id
LEFT JOIN vorp_colaboradores vc
  ON vc.vorp_id = pc.vorp_colaborador_id
LEFT JOIN consultores c
  ON c.id = pc.consultor_id;

CREATE OR REPLACE VIEW view_vorp_metas_por_consultor AS
SELECT
  m.*,
  pc.vorp_colaborador_id,
  pc.consultor_id,
  c.nome AS consultor_nome,
  vc.nome AS vorp_colaborador_nome,
  p.nome AS projeto_nome_canonico,
  p.tratativa_cs
FROM vorp_metas m
JOIN vorp_projetos p
  ON p.vorp_id = m.projeto_vorp_id
JOIN vorp_projeto_colaboradores pc
  ON pc.projeto_vorp_id = p.vorp_id
LEFT JOIN vorp_colaboradores vc
  ON vc.vorp_id = pc.vorp_colaborador_id
LEFT JOIN consultores c
  ON c.id = pc.consultor_id;

SELECT link_vorp_fks();
