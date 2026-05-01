-- ============================================================
-- RLS e bootstrap seguro para usuarios_app
-- ============================================================
-- Objetivo:
-- 1) permitir que cada usuario autenticado crie o proprio perfil
-- 2) permitir que administradores listem e editem todos os perfis
-- 3) impedir escalacao de privilegio via client-side

ALTER TABLE usuarios_app ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_usuario_app()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.usuarios_app ua
    WHERE ua.auth_user_id = auth.uid()
      AND ua.role = 'Administrador'
      AND ua.status = 'Ativo'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_usuario_app()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_usuarios BIGINT;
  auth_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario autenticado obrigatorio para criar perfil.';
  END IF;

  auth_email := COALESCE(auth.jwt() ->> 'email', NEW.email);

  IF auth_email IS NULL OR btrim(auth_email) = '' THEN
    RAISE EXCEPTION 'Email do usuario autenticado nao encontrado.';
  END IF;

  SELECT COUNT(*) INTO total_usuarios
  FROM public.usuarios_app;

  NEW.auth_user_id := auth.uid();
  NEW.email := auth_email;
  NEW.status := 'Ativo';

  IF total_usuarios = 0 THEN
    NEW.role := 'Administrador';
    NEW.permissoes := ARRAY[
      'dashboard.overview',
      'dashboard.evolution',
      'dashboard.conformidade',
      'dashboard.processos',
      'dashboard.reunioes',
      'dashboard.metas',
      'dashboard.nps',
      'dashboard.churn',
      'dashboard.correlacao',
      'dashboard.vorp',
      'cadastro.time',
      'cadastro.produtos',
      'cadastro.projetos',
      'cadastro.vorp',
      'auditoria.edicao',
      'auditoria.rapida',
      'auditoria.churn',
      'admin.usuarios',
      'filters.consultores.todos'
    ]::TEXT[];
  ELSE
    NEW.role := 'Consultor';
    NEW.permissoes := ARRAY[
      'dashboard.overview',
      'dashboard.conformidade',
      'dashboard.processos',
      'dashboard.reunioes',
      'dashboard.metas',
      'dashboard.nps',
      'dashboard.churn',
      'dashboard.correlacao',
      'dashboard.vorp',
      'auditoria.churn'
    ]::TEXT[];
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_app_bootstrap ON usuarios_app;
CREATE TRIGGER trg_usuarios_app_bootstrap
BEFORE INSERT ON usuarios_app
FOR EACH ROW
EXECUTE FUNCTION public.bootstrap_usuario_app();

DROP POLICY IF EXISTS usuarios_app_select_self_or_admin ON usuarios_app;
CREATE POLICY usuarios_app_select_self_or_admin
ON usuarios_app
FOR SELECT
TO authenticated
USING (
  auth_user_id = auth.uid()
  OR public.is_admin_usuario_app()
);

DROP POLICY IF EXISTS usuarios_app_insert_self ON usuarios_app;
CREATE POLICY usuarios_app_insert_self
ON usuarios_app
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS usuarios_app_update_admin ON usuarios_app;
CREATE POLICY usuarios_app_update_admin
ON usuarios_app
FOR UPDATE
TO authenticated
USING (public.is_admin_usuario_app())
WITH CHECK (public.is_admin_usuario_app());
