-- ============================================================
-- Fix dashboard de reunioes + guarda de consistencia auditoria
-- ============================================================
-- Objetivos:
-- 1) Garantir que reunioes/ranking usem consultor_id como chave.
-- 2) Incluir consultores ativos com zero quando faltar auditoria no mes.
-- 3) Impedir qtd_conformes > qtd_avaliados em auditoria_itens.

BEGIN;

-- ------------------------------------------------------------
-- 1) Saneamento retroativo dos itens de auditoria
-- ------------------------------------------------------------
UPDATE auditoria_itens ai
SET
  qtd_avaliados = GREATEST(COALESCE(ai.qtd_avaliados, 0), 0),
  qtd_conformes = LEAST(
    GREATEST(COALESCE(ai.qtd_conformes, 0), 0),
    GREATEST(COALESCE(ai.qtd_avaliados, 0), 0)
  ),
  nota_pct = CASE
    WHEN GREATEST(COALESCE(ai.qtd_avaliados, 0), 0) = 0 THEN 0
    ELSE ROUND((
      LEAST(
        GREATEST(COALESCE(ai.qtd_conformes, 0), 0),
        GREATEST(COALESCE(ai.qtd_avaliados, 0), 0)
      )::numeric
      / GREATEST(COALESCE(ai.qtd_avaliados, 0), 0)::numeric
    ) * 100, 2)
  END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'auditoria_itens_conformes_lte_avaliados'
  ) THEN
    ALTER TABLE auditoria_itens
      ADD CONSTRAINT auditoria_itens_conformes_lte_avaliados
      CHECK (
        COALESCE(qtd_conformes, 0) <= GREATEST(COALESCE(qtd_avaliados, 0), 0)
      );
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) Recriacao das views de reunioes (ordem evita dependencia)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS view_ranking_atendidos;
DROP VIEW IF EXISTS view_reunioes_consultor;

CREATE VIEW view_reunioes_consultor AS
WITH meses AS (
  SELECT DISTINCT am.mes_ano
  FROM auditoria_mensal am
  WHERE am.mes_ano IS NOT NULL
),
consultores_ativos AS (
  SELECT c.id, c.nome
  FROM consultores c
  WHERE lower(coalesce(c.status, 'ativo')) = 'ativo'
),
base AS (
  SELECT
    ca.id AS consultor_id,
    ca.nome AS consultor,
    m.mes_ano
  FROM consultores_ativos ca
  CROSS JOIN meses m
),
carteira AS (
  SELECT
    am.consultor_id,
    am.mes_ano,
    MAX(GREATEST(COALESCE(am.tamanho_carteira, am.clientes_ativos_real, 0), 0))::bigint AS total_clientes
  FROM auditoria_mensal am
  GROUP BY am.consultor_id, am.mes_ano
),
resultado_item AS (
  SELECT
    am.consultor_id,
    am.mes_ano,
    MAX(GREATEST(COALESCE(ai.qtd_avaliados, 0), 0))::bigint AS carteira_item,
    MAX(
      LEAST(
        GREATEST(COALESCE(ai.qtd_conformes, 0), 0),
        GREATEST(COALESCE(ai.qtd_avaliados, 0), 0)
      )
    )::bigint AS clientes_com_reuniao
  FROM auditoria_mensal am
  JOIN auditoria_itens ai
    ON ai.auditoria_id = am.id
  WHERE lower(coalesce(ai.tipo, '')) = 'resultado'
    AND lower(coalesce(ai.pergunta, '')) LIKE '%carteira%'
    AND lower(coalesce(ai.pergunta, '')) LIKE '%atendid%'
  GROUP BY am.consultor_id, am.mes_ano
)
SELECT
  b.consultor_id,
  b.consultor,
  b.mes_ano,
  COALESCE(r.clientes_com_reuniao, 0)::bigint AS clientes_com_reuniao,
  COALESCE(r.carteira_item, c.total_clientes, 0)::bigint AS total_clientes,
  CASE
    WHEN COALESCE(r.carteira_item, c.total_clientes, 0) = 0 THEN 0::numeric(10,2)
    ELSE ROUND((
      COALESCE(r.clientes_com_reuniao, 0)::numeric
      / COALESCE(r.carteira_item, c.total_clientes, 0)::numeric
    ) * 100, 2)
  END AS pct_reunioes
FROM base b
LEFT JOIN carteira c
  ON c.consultor_id = b.consultor_id
 AND c.mes_ano = b.mes_ano
LEFT JOIN resultado_item r
  ON r.consultor_id = b.consultor_id
 AND r.mes_ano = b.mes_ano;

CREATE VIEW view_ranking_atendidos AS
SELECT
  v.consultor_id,
  v.consultor,
  v.mes_ano,
  v.clientes_com_reuniao::bigint AS atendidos,
  v.total_clientes::bigint AS carteira,
  v.pct_reunioes
FROM view_reunioes_consultor v;

COMMIT;
