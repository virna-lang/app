-- Vincula cada consultor local ao seu registro espelho no Vorp System.
-- O campo vorp_id referencia vorp_colaboradores.vorp_id (texto, PK do NocoDB).

ALTER TABLE consultores
  ADD COLUMN IF NOT EXISTS vorp_id text UNIQUE REFERENCES vorp_colaboradores(vorp_id) ON DELETE SET NULL;

-- Popula o vínculo automaticamente cruzando pelo nome (trim + lower).
-- Executa apenas para consultores que ainda não têm vorp_id definido.
UPDATE consultores c
SET vorp_id = vc.vorp_id
FROM vorp_colaboradores vc
WHERE c.vorp_id IS NULL
  AND lower(trim(c.nome)) = lower(trim(vc.nome));

-- Função chamada pelo sync para manter o vínculo atualizado a cada rodada.
CREATE OR REPLACE FUNCTION link_consultores_vorp()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE consultores c
  SET vorp_id = vc.vorp_id
  FROM vorp_colaboradores vc
  WHERE c.vorp_id IS NULL
    AND lower(trim(c.nome)) = lower(trim(vc.nome));
$$;
