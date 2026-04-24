-- ============================================================
-- Corrige view_conformidade_consultor e view_scores_por_tipo
-- para calcular score de conformidade usando APENAS itens
-- com tipo = 'Conformidade' (separando de Resultado).
-- Execute no SQL Editor do Supabase Dashboard.
-- ============================================================

-- ── 1. view_conformidade_consultor ───────────────────────────
-- Adiciona WHERE ai.tipo = 'Conformidade' para garantir que
-- o score_categoria reflita apenas conformidade de processo.

CREATE OR REPLACE VIEW public.view_conformidade_consultor AS
SELECT
  am.consultor_id,
  co.nome        AS consultor,
  am.mes_ano,
  ai.categoria,
  ROUND(AVG(ai.nota_pct), 1) AS score_categoria,
  COUNT(*)                   AS total_itens
FROM auditoria_itens ai
  JOIN auditoria_mensal am ON am.id = ai.auditoria_id
  JOIN consultores      co ON co.id = am.consultor_id
WHERE ai.tipo = 'Conformidade'
GROUP BY
  am.consultor_id,
  co.nome,
  am.mes_ano,
  ai.categoria;

-- ── 2. view_scores_por_tipo ───────────────────────────────────
-- Garante que Conformidade e Resultado são calculados de forma
-- completamente separada, sem mistura de itens entre os tipos.

CREATE OR REPLACE VIEW public.view_scores_por_tipo AS
SELECT
  am.consultor_id,
  am.mes_ano,
  ai.tipo,
  ROUND(AVG(ai.nota_pct), 1) AS score
FROM auditoria_itens ai
  JOIN auditoria_mensal am ON am.id = ai.auditoria_id
WHERE
  ai.tipo          IS NOT NULL
  AND ai.qtd_avaliados > 0
GROUP BY
  am.consultor_id,
  am.mes_ano,
  ai.tipo;
