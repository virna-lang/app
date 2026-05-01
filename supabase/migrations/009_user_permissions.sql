-- ============================================================
-- Permissoes por login do app
-- ============================================================
-- O login continua sendo feito pelo Supabase Auth/Google.
-- Esta tabela define o que cada login pode ver dentro do app.

CREATE TABLE IF NOT EXISTS usuarios_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT,
  role TEXT NOT NULL DEFAULT 'Consultor'
    CHECK (role IN ('Administrador', 'Consultor')),
  consultor_id UUID
    REFERENCES consultores (id) ON UPDATE CASCADE ON DELETE SET NULL,
  permissoes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'Ativo'
    CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_app_email
  ON usuarios_app (email);

CREATE INDEX IF NOT EXISTS idx_usuarios_app_consultor_id
  ON usuarios_app (consultor_id);

CREATE OR REPLACE FUNCTION set_usuarios_app_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_app_updated_at ON usuarios_app;
CREATE TRIGGER trg_usuarios_app_updated_at
BEFORE UPDATE ON usuarios_app
FOR EACH ROW
EXECUTE FUNCTION set_usuarios_app_updated_at();

COMMENT ON TABLE usuarios_app IS
  'Perfis e permissoes de rota/tela por usuario autenticado no app.';

COMMENT ON COLUMN usuarios_app.permissoes IS
  'Lista de permissoes funcionais do app. O nome do usuario e apenas apresentacao; a chave do login e auth_user_id/email.';
