-- ============================================================
-- Dashboard views: canonical identity by ID
-- ============================================================
-- Goal:
-- 1) Ensure dashboard aggregations use consultor_id as canonical key.
-- 2) Prevent consultants from disappearing from monthly ranking views.
-- 3) Keep names as display-only fields.

-- ------------------------------------------------------------
-- Reunioes ranking by consultant/month (with zero-fill)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW view_ranking_atendidos AS
WITH meses AS (
  SELECT DISTINCT mes_ano
  FROM auditoria_mensal
  WHERE mes_ano IS NOT NULL
  UNION
  SELECT DISTINCT mes_ano
  FROM reunioes
  WHERE mes_ano IS NOT NULL
  UNION
  SELECT DISTINCT mes_ano
  FROM metas_mensais
  WHERE mes_ano IS NOT NULL
  UNION
  SELECT DISTINCT mes_churn AS mes_ano
  FROM churn
  WHERE mes_churn IS NOT NULL
),
consultores_ativos AS (
  SELECT c.id, c.nome
  FROM consultores c
  WHERE lower(coalesce(c.status, 'ativo')) = 'ativo'
),
base AS (
  SELECT
    c.id AS consultor_id,
    c.nome AS consultor,
    m.mes_ano
  FROM consultores_ativos c
  CROSS JOIN meses m
),
carteira_auditoria AS (
  SELECT
    am.consultor_id,
    am.mes_ano,
    MAX(COALESCE(am.tamanho_carteira, am.clientes_ativos_real, 0))::int AS carteira
  FROM auditoria_mensal am
  GROUP BY am.consultor_id, am.mes_ano
),
carteira_clientes AS (
  SELECT
    b.consultor_id,
    b.mes_ano,
    COUNT(DISTINCT cl.id)::int AS carteira
  FROM base b
  LEFT JOIN clientes cl
    ON cl.consultor_id = b.consultor_id
   AND lower(trim(coalesce(cl.status, ''))) = 'ativo'
  GROUP BY b.consultor_id, b.mes_ano
),
carteira AS (
  SELECT
    b.consultor_id,
    b.mes_ano,
    COALESCE(ca.carteira, cc.carteira, 0)::int AS carteira
  FROM base b
  LEFT JOIN carteira_auditoria ca
    ON ca.consultor_id = b.consultor_id
   AND ca.mes_ano = b.mes_ano
  LEFT JOIN carteira_clientes cc
    ON cc.consultor_id = b.consultor_id
   AND cc.mes_ano = b.mes_ano
),
atendimentos AS (
  SELECT
    b.consultor_id,
    b.mes_ano,
    COUNT(DISTINCT r.cliente_id)::int AS atendidos
  FROM base b
  LEFT JOIN reunioes r
    ON r.consultor_id = b.consultor_id
   AND r.mes_ano = b.mes_ano
   AND lower(coalesce(r.status, '')) LIKE 'conclu%'
  GROUP BY b.consultor_id, b.mes_ano
)
SELECT
  b.consultor_id,
  b.consultor,
  b.mes_ano,
  coalesce(a.atendidos, 0)::int AS atendidos,
  coalesce(ca.carteira, 0)::int AS carteira,
  CASE
    WHEN coalesce(ca.carteira, 0) = 0 THEN 0::numeric
    ELSE ROUND((coalesce(a.atendidos, 0)::numeric / ca.carteira::numeric) * 100, 2)
  END AS pct_reunioes
FROM base b
LEFT JOIN atendimentos a
  ON a.consultor_id = b.consultor_id
 AND a.mes_ano = b.mes_ano
LEFT JOIN carteira ca
  ON ca.consultor_id = b.consultor_id
 AND ca.mes_ano = b.mes_ano;

CREATE OR REPLACE VIEW view_reunioes_consultor AS
SELECT
  v.consultor_id,
  v.consultor,
  v.mes_ano,
  v.atendidos AS clientes_com_reuniao,
  v.carteira AS total_clientes,
  v.pct_reunioes
FROM view_ranking_atendidos v;

-- ------------------------------------------------------------
-- Metas by consultant/product/month (with zero-fill)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW view_metas_consultor AS
WITH meses AS (
  SELECT DISTINCT mes_ano
  FROM metas_mensais
  WHERE mes_ano IS NOT NULL
  UNION
  SELECT DISTINCT mes_ano
  FROM auditoria_mensal
  WHERE mes_ano IS NOT NULL
),
consultores_ativos AS (
  SELECT c.id, c.nome
  FROM consultores c
  WHERE lower(coalesce(c.status, 'ativo')) = 'ativo'
),
produtos AS (
  SELECT DISTINCT cl.produto
  FROM clientes cl
  WHERE cl.produto IS NOT NULL
),
base AS (
  SELECT
    c.id AS consultor_id,
    c.nome AS consultor,
    p.produto,
    m.mes_ano
  FROM consultores_ativos c
  CROSS JOIN produtos p
  CROSS JOIN meses m
),
agregado AS (
  SELECT
    cl.consultor_id,
    cl.produto,
    mm.mes_ano,
    COUNT(mm.id)::int AS total_metas,
    SUM(CASE WHEN coalesce(mm.bateu_meta, false) THEN 1 ELSE 0 END)::int AS metas_batidas
  FROM metas_mensais mm
  JOIN clientes cl
    ON cl.id = mm.cliente_id
  GROUP BY cl.consultor_id, cl.produto, mm.mes_ano
)
SELECT
  b.consultor_id,
  b.consultor,
  b.produto,
  b.mes_ano,
  coalesce(a.metas_batidas, 0)::int AS metas_batidas,
  coalesce(a.total_metas, 0)::int AS total_metas,
  CASE
    WHEN coalesce(a.total_metas, 0) = 0 THEN 0::numeric
    ELSE ROUND((a.metas_batidas::numeric / a.total_metas::numeric) * 100, 2)
  END AS pct_batimento
FROM base b
LEFT JOIN agregado a
  ON a.consultor_id = b.consultor_id
 AND a.produto = b.produto
 AND a.mes_ano = b.mes_ano;

CREATE OR REPLACE VIEW view_metas_batidas_produto AS
SELECT
  v.consultor_id,
  v.consultor,
  v.mes_ano,
  format('Batimento de Metas (%s)', coalesce(v.produto, 'Sem produto')) AS pergunta,
  v.pct_batimento AS nota_pct,
  v.total_metas AS qtd_avaliados,
  v.metas_batidas AS qtd_conformes
FROM view_metas_consultor v;

-- ------------------------------------------------------------
-- Auditoria score views by canonical consultant ID
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW view_conformidade_consultor AS
SELECT
  am.consultor_id,
  c.nome AS consultor,
  am.mes_ano,
  ai.categoria,
  ROUND(AVG(ai.nota_pct)::numeric, 2) AS score_categoria,
  COUNT(ai.id)::int AS total_itens
FROM auditoria_mensal am
JOIN consultores c
  ON c.id = am.consultor_id
JOIN auditoria_itens ai
  ON ai.auditoria_id = am.id
WHERE lower(coalesce(ai.tipo, '')) = 'conformidade'
GROUP BY am.consultor_id, c.nome, am.mes_ano, ai.categoria;

CREATE OR REPLACE VIEW view_scores_por_tipo AS
SELECT
  am.consultor_id,
  c.nome AS consultor,
  am.mes_ano,
  CASE
    WHEN lower(ai.tipo) = 'resultado' THEN 'Resultado'
    ELSE 'Conformidade'
  END AS tipo,
  ROUND(AVG(ai.nota_pct)::numeric, 2) AS score
FROM auditoria_mensal am
JOIN consultores c
  ON c.id = am.consultor_id
JOIN auditoria_itens ai
  ON ai.auditoria_id = am.id
WHERE lower(coalesce(ai.tipo, '')) IN ('resultado', 'conformidade')
GROUP BY
  am.consultor_id,
  c.nome,
  am.mes_ano,
  CASE
    WHEN lower(ai.tipo) = 'resultado' THEN 'Resultado'
    ELSE 'Conformidade'
  END;
