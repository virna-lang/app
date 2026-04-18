-- ============================================================
-- Adiciona suporte a Tratativa CS em vorp_projetos
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Coluna gerenciada manualmente no sistema de auditoria
-- (o sync NocoDB nunca sobrescreve esse campo)
ALTER TABLE vorp_projetos
  ADD COLUMN IF NOT EXISTS tratativa_cs     BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tratativa_cs_obs TEXT;

COMMENT ON COLUMN vorp_projetos.tratativa_cs IS
  'Projeto em Tratativa CS — não conta para auditoria. Gerenciado manualmente.';

-- Índice para filtrar rapidamente projetos auditáveis
CREATE INDEX IF NOT EXISTS idx_vorp_projetos_tratativa
  ON vorp_projetos (tratativa_cs);
