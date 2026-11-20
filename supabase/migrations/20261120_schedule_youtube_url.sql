-- ==============================================================================
-- Migrazione: 20261120_schedule_youtube_url.sql
-- Descrizione: Aggiunge la colonna youtube_url ad an_schedule e le RPC Admin
--              per associare i link YouTube (Premiere & On-Demand) alle partite.
-- ==============================================================================

ALTER TABLE public.an_schedule
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

CREATE OR REPLACE FUNCTION public.rpc_admin_set_match_youtube_url(
  p_stag INTEGER,
  p_week INTEGER,
  p_home TEXT,
  p_away TEXT,
  p_youtube_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_url TEXT := NULLIF(TRIM(COALESCE(p_youtube_url, '')), '');
BEGIN
  UPDATE public.an_schedule
  SET youtube_url = v_clean_url
  WHERE stag = p_stag
    AND week = p_week
    AND home = p_home
    AND away = p_away;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Partita non trovata in an_schedule'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'youtube_url', v_clean_url
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_admin_batch_set_match_youtube_urls(
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_updated INTEGER := 0;
  v_clean_url TEXT;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payload non valido');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_clean_url := NULLIF(TRIM(COALESCE(v_item->>'youtube_url', '')), '');

    UPDATE public.an_schedule
    SET youtube_url = v_clean_url
    WHERE stag = (v_item->>'stag')::INTEGER
      AND week = (v_item->>'week')::INTEGER
      AND home = (v_item->>'home')::TEXT
      AND away = (v_item->>'away')::TEXT;

    IF FOUND THEN
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_set_match_youtube_url(INTEGER, INTEGER, TEXT, TEXT, TEXT)
  TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.rpc_admin_batch_set_match_youtube_urls(JSONB)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
