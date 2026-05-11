-- Migration 017: Adiciona status_operacao e fallback de carteira Vorp ao ranking de reuniões
--
-- Problema resolvido:
--   • view_ranking_atendidos não expunha o status_operacao do consultor (Ativo / Onboarding / Desativado)
--   • Consultores sem entrada em auditoria_mensal para o mês ficavam com carteira=0 mesmo tendo
--     projetos ativos no Vorp System.  Agora usa vorp_projeto_colaboradores como fallback.
-- ---------------------------------------------------------------------------

-- Recria a view com a nova coluna status_operacao e fallback carteira_vorp
CREATE OR REPLACE VIEW public.view_ranking_atendidos AS
WITH
-- Situação operacional vigente de cada consultor por mês.
-- "Vigente" = entrada mais recente em consultor_operacao_historico com mes_inicio <= mes_ano.
operacao AS (
  SELECT DISTINCT ON (h.consultor_id, m.mes_ano)
    h.consultor_id,
    m.mes_ano,
    h.status_operacao
  FROM public.consultor_operacao_historico h
  CROSS JOIN (
    SELECT DISTINCT mes_ano
    FROM   public.auditoria_mensal
    WHERE  mes_ano IS NOT NULL
  ) m
  WHERE h.mes_inicio <= m.mes_ano
  ORDER BY h.consultor_id, m.mes_ano, h.mes_inicio DESC
),

-- Carteira canônica via Vorp System (projetos ativos linkados ao consultor).
-- Usa a cadeia: consultores.id -> vorp_projeto_colaboradores.consultor_id -> vorp_projetos.status
carteira_vorp AS (
  SELECT
    vpc.consultor_id,
    COUNT(DISTINCT vpc.projeto_vorp_id)::bigint AS total_vorp
  FROM  public.vorp_projeto_colaboradores vpc
  JOIN  public.vorp_projetos              vp  ON vp.vorp_id = vpc.projeto_vorp_id
  WHERE lower(coalesce(vp.status, '')) = 'ativo'
    AND vpc.consultor_id IS NOT NULL
  GROUP BY vpc.consultor_id
)

SELECT
  v.consultor_id,
  v.consultor,
  v.mes_ano,
  v.clientes_com_reuniao                                   AS atendidos,
  -- Carteira: prefere o valor auditado; quando é 0 (sem auditoria no mês) usa o Vorp canônico
  coalesce(
    NULLIF(v.total_clientes, 0),
    cv.total_vorp,
    0::bigint
  )                                                        AS carteira,
  coalesce(o.status_operacao, 'Ativo')                    AS status_operacao
FROM       public.view_reunioes_consultor v
LEFT JOIN  carteira_vorp   cv ON cv.consultor_id = v.consultor_id
LEFT JOIN  operacao        o  ON o.consultor_id  = v.consultor_id
                              AND o.mes_ano      = v.mes_ano;

COMMENT ON VIEW public.view_ranking_atendidos IS
  'Ranking de reuniões realizadas por consultor por mês. '
  'Carteira prioriza auditoria_mensal; fallback para vorp_projeto_colaboradores quando não há auditoria. '
  'Inclui status_operacao (Ativo/Onboarding/Desativado) para exibição visual no dashboard.';
