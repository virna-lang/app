-- ============================================================
-- Correlações FK completas entre tabelas Vorp e internas
-- ============================================================

-- ── vorp_projetos: FK para colaborador, produto e consultor interno ──

ALTER TABLE vorp_projetos
  ADD COLUMN IF NOT EXISTS colaborador_vorp_id TEXT REFERENCES vorp_colaboradores(vorp_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS produto_vorp_id     TEXT REFERENCES vorp_produtos(vorp_id)      ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consultor_id        UUID REFERENCES consultores(id)              ON DELETE SET NULL;

-- Popula colaborador_vorp_id cruzando pelo nome
UPDATE vorp_projetos p
SET colaborador_vorp_id = vc.vorp_id
FROM vorp_colaboradores vc
WHERE p.colaborador_vorp_id IS NULL
  AND lower(trim(p.colaborador_nome)) = lower(trim(vc.nome));

-- Popula produto_vorp_id cruzando pelo nome
UPDATE vorp_projetos p
SET produto_vorp_id = vp.vorp_id
FROM vorp_produtos vp
WHERE p.produto_vorp_id IS NULL
  AND lower(trim(p.produto_nome)) = lower(trim(vp.nome));

-- Popula consultor_id cruzando vorp_projetos → vorp_colaboradores → consultores
UPDATE vorp_projetos p
SET consultor_id = c.id
FROM vorp_colaboradores vc
JOIN consultores c ON c.vorp_id = vc.vorp_id
WHERE p.consultor_id IS NULL
  AND p.colaborador_vorp_id = vc.vorp_id;

-- ── vorp_churn: FK para projeto ──────────────────────────────

ALTER TABLE vorp_churn
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT REFERENCES vorp_projetos(vorp_id) ON DELETE SET NULL;

UPDATE vorp_churn ch
SET projeto_vorp_id = p.vorp_id
FROM vorp_projetos p
WHERE ch.projeto_vorp_id IS NULL
  AND lower(trim(ch.projeto_nome)) = lower(trim(p.nome));

-- ── vorp_healthscores: FK para projeto ───────────────────────

ALTER TABLE vorp_healthscores
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT REFERENCES vorp_projetos(vorp_id) ON DELETE SET NULL;

UPDATE vorp_healthscores hs
SET projeto_vorp_id = p.vorp_id
FROM vorp_projetos p
WHERE hs.projeto_vorp_id IS NULL
  AND lower(trim(hs.projeto_nome)) = lower(trim(p.nome));

-- ── vorp_metas: FK para projeto ──────────────────────────────

ALTER TABLE vorp_metas
  ADD COLUMN IF NOT EXISTS projeto_vorp_id TEXT REFERENCES vorp_projetos(vorp_id) ON DELETE SET NULL;

UPDATE vorp_metas m
SET projeto_vorp_id = p.vorp_id
FROM vorp_projetos p
WHERE m.projeto_vorp_id IS NULL
  AND lower(trim(m.projeto_nome)) = lower(trim(p.nome));

-- ── Índices para as novas FKs ─────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vorp_projetos_colab   ON vorp_projetos (colaborador_vorp_id);
CREATE INDEX IF NOT EXISTS idx_vorp_projetos_produto  ON vorp_projetos (produto_vorp_id);
CREATE INDEX IF NOT EXISTS idx_vorp_projetos_cons     ON vorp_projetos (consultor_id);
CREATE INDEX IF NOT EXISTS idx_vorp_churn_projeto     ON vorp_churn (projeto_vorp_id);
CREATE INDEX IF NOT EXISTS idx_vorp_hs_projeto        ON vorp_healthscores (projeto_vorp_id);
CREATE INDEX IF NOT EXISTS idx_vorp_metas_projeto     ON vorp_metas (projeto_vorp_id);

-- ── Função para re-popular todos os vínculos (chamada pelo sync) ─

CREATE OR REPLACE FUNCTION link_vorp_fks()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- vorp_projetos → colaborador
  UPDATE vorp_projetos p
  SET colaborador_vorp_id = vc.vorp_id
  FROM vorp_colaboradores vc
  WHERE p.colaborador_vorp_id IS NULL
    AND lower(trim(p.colaborador_nome)) = lower(trim(vc.nome));

  -- vorp_projetos → produto
  UPDATE vorp_projetos p
  SET produto_vorp_id = vp.vorp_id
  FROM vorp_produtos vp
  WHERE p.produto_vorp_id IS NULL
    AND lower(trim(p.produto_nome)) = lower(trim(vp.nome));

  -- vorp_projetos → consultor interno
  UPDATE vorp_projetos p
  SET consultor_id = c.id
  FROM vorp_colaboradores vc
  JOIN consultores c ON c.vorp_id = vc.vorp_id
  WHERE p.consultor_id IS NULL
    AND p.colaborador_vorp_id = vc.vorp_id;

  -- vorp_churn → projeto
  UPDATE vorp_churn ch
  SET projeto_vorp_id = p.vorp_id
  FROM vorp_projetos p
  WHERE ch.projeto_vorp_id IS NULL
    AND lower(trim(ch.projeto_nome)) = lower(trim(p.nome));

  -- vorp_healthscores → projeto
  UPDATE vorp_healthscores hs
  SET projeto_vorp_id = p.vorp_id
  FROM vorp_projetos p
  WHERE hs.projeto_vorp_id IS NULL
    AND lower(trim(hs.projeto_nome)) = lower(trim(p.nome));

  -- vorp_metas → projeto
  UPDATE vorp_metas m
  SET projeto_vorp_id = p.vorp_id
  FROM vorp_projetos p
  WHERE m.projeto_vorp_id IS NULL
    AND lower(trim(m.projeto_nome)) = lower(trim(p.nome));
$$;
