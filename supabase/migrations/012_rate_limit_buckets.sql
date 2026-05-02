-- ============================================================
-- Rate limit distribuido em Postgres
-- ============================================================
-- Usado pelas rotas server-side para manter um unico bucket por chave
-- mesmo em multiplas instancias/serverless.

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_reset_at
ON public.rate_limit_buckets (reset_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.rate_limit_buckets FROM anon;
REVOKE ALL ON public.rate_limit_buckets FROM authenticated;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  retry_after_seconds INTEGER,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := statement_timestamp();
  v_window INTERVAL;
  v_count INTEGER;
BEGIN
  IF p_key IS NULL OR btrim(p_key) = '' THEN
    RAISE EXCEPTION 'p_key is required';
  END IF;

  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'p_limit must be greater than zero';
  END IF;

  IF p_window_ms IS NULL OR p_window_ms < 1000 THEN
    RAISE EXCEPTION 'p_window_ms must be at least 1000';
  END IF;

  v_window := (p_window_ms::DOUBLE PRECISION / 1000.0) * INTERVAL '1 second';

  DELETE FROM public.rate_limit_buckets
  WHERE rate_limit_buckets.reset_at < v_now - INTERVAL '1 hour';

  INSERT INTO public.rate_limit_buckets AS bucket (key, count, reset_at, updated_at)
  VALUES (p_key, 1, v_now + v_window, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN bucket.reset_at <= v_now THEN 1
      ELSE bucket.count + 1
    END,
    reset_at = CASE
      WHEN bucket.reset_at <= v_now THEN v_now + v_window
      ELSE bucket.reset_at
    END,
    updated_at = v_now
  RETURNING bucket.count, bucket.reset_at
  INTO v_count, reset_at;

  allowed := v_count <= p_limit;
  retry_after_seconds := GREATEST(CEIL(EXTRACT(EPOCH FROM (reset_at - v_now)))::INTEGER, 1);
  remaining := GREATEST(p_limit - v_count, 0);

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
