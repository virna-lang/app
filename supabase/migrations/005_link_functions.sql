-- ============================================================
-- Funções que resolvem vínculos nome→ID entre as entidades
-- do sistema de auditoria e as tabelas espelho do Vorp System.
--
-- Chamadas automaticamente pelo sync (vorp-sync.ts):
--   syncColaboradores() → link_consultores_vorp()
--   syncAll()           → link_vorp_fks()
-- ============================================================

-- 1. Coluna colaborador_vorp_id em vorp_projetos (caso ainda não exista)
ALTER TABLE vorp_projetos
  ADD COLUMN IF NOT EXISTS colaborador_vorp_id TEXT
  REFERENCES vorp_colaboradores (vorp_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Coluna consultor_id em vorp_projetos para acesso direto ao consultor local
ALTER TABLE vorp_projetos
  ADD COLUMN IF NOT EXISTS consultor_id UUID
  REFERENCES consultores (id)
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vorp_projetos_colaborador_vorp_id
  ON vorp_projetos (colaborador_vorp_id);

CREATE INDEX IF NOT EXISTS idx_vorp_projetos_consultor_id
  ON vorp_projetos (consultor_id);

-- ============================================================
-- 2. link_consultores_vorp
--    Preenche consultores.vorp_colaborador_id cruzando pelo nome
--    normalizado. Chamada após syncColaboradores().
-- ============================================================
CREATE OR REPLACE FUNCTION link_consultores_vorp()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Passagem 1: match exato (lowercase + trim)
  UPDATE consultores c
  SET vorp_colaborador_id = vc.vorp_id
  FROM vorp_colaboradores vc
  WHERE c.vorp_colaborador_id IS NULL
    AND lower(trim(c.nome)) = lower(trim(vc.nome));

  -- Passagem 2: nome local contido no nome Vorp
  -- ex.: "Leticia Bezerra" bate em "Leticia de Sousa Bezerra"
  -- Só aplica quando há exatamente 1 candidato para evitar falsos positivos.
  UPDATE consultores c
  SET vorp_colaborador_id = vc.vorp_id
  FROM vorp_colaboradores vc
  WHERE c.vorp_colaborador_id IS NULL
    AND lower(trim(vc.nome)) LIKE '%' || lower(trim(c.nome)) || '%'
    AND (
      SELECT COUNT(*) FROM vorp_colaboradores v2
      WHERE lower(trim(v2.nome)) LIKE '%' || lower(trim(c.nome)) || '%'
    ) = 1;
END;
$$;

-- ============================================================
-- 3. link_vorp_fks
--    Resolve os campos nome→ID em vorp_projetos e atualiza
--    consultor_id. Chamada ao final de syncAll().
-- ============================================================
CREATE OR REPLACE FUNCTION link_vorp_fks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 3a. Preenche vorp_projetos.colaborador_vorp_id pelo nome do colaborador
  UPDATE vorp_projetos vp
  SET colaborador_vorp_id = vc.vorp_id
  FROM vorp_colaboradores vc
  WHERE lower(trim(vp.colaborador_nome)) = lower(trim(vc.nome))
    AND vp.colaborador_nome IS NOT NULL
    AND (vp.colaborador_vorp_id IS NULL
         OR vp.colaborador_vorp_id <> vc.vorp_id);

  -- 3b. Preenche vorp_projetos.consultor_id usando o vínculo já estabelecido
  --     vorp_projetos.colaborador_vorp_id → consultores.vorp_colaborador_id
  UPDATE vorp_projetos vp
  SET consultor_id = c.id
  FROM consultores c
  WHERE c.vorp_colaborador_id = vp.colaborador_vorp_id
    AND vp.colaborador_vorp_id IS NOT NULL
    AND (vp.consultor_id IS NULL
         OR vp.consultor_id <> c.id);
END;
$$;

-- ============================================================
-- 4. Executa imediatamente para backfill dos dados existentes
-- ============================================================
SELECT link_consultores_vorp();
SELECT link_vorp_fks();
