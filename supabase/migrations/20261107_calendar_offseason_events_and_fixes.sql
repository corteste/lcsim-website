-- ==============================================================================
-- Migrazione: 20261107_calendar_offseason_events_and_fixes.sql
-- Descrizione: Supporto completo per la gestione delle Date Offseason ed Eventi
--              Stagionali nel Calendario (#53) tramite la tabella an_league_events,
--              con colonna 'note' opzionale e RPC SECURITY DEFINER per Admin.
-- ==============================================================================

-- 1. Aggiunta colonna opzionale 'note' su public.an_league_events
ALTER TABLE public.an_league_events
  ADD COLUMN IF NOT EXISTS note TEXT NULL;

-- 2. Permessi e policy per consentire gestione da Admin e lettura pubblica
GRANT SELECT, INSERT, UPDATE, DELETE ON public.an_league_events TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.an_league_events_id_seq TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow write an_league_events" ON public.an_league_events;
CREATE POLICY "Allow write an_league_events"
  ON public.an_league_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. RPC SECURITY DEFINER per creare o aggiornare un evento stagionale / offseason
CREATE OR REPLACE FUNCTION public.rpc_admin_upsert_league_event(
  p_id INTEGER DEFAULT NULL,
  p_stagione INTEGER DEFAULT 11,
  p_evento TEXT DEFAULT '',
  p_tipo TEXT DEFAULT 'Offseason',
  p_event_date DATE DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_evento TEXT;
  v_clean_tipo TEXT;
  v_next_order INTEGER;
  v_result_id INTEGER;
BEGIN
  v_clean_evento := TRIM(COALESCE(p_evento, ''));
  IF v_clean_evento = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Il nome dell''evento è obbligatorio.');
  END IF;

  v_clean_tipo := TRIM(COALESCE(p_tipo, 'Offseason'));
  IF v_clean_tipo = '' THEN
    v_clean_tipo := 'Offseason';
  END IF;

  IF p_id IS NOT NULL AND p_id > 0 THEN
    UPDATE public.an_league_events
    SET
      stagione = p_stagione,
      evento = v_clean_evento,
      tipo = v_clean_tipo,
      event_date = p_event_date,
      note = NULLIF(TRIM(COALESCE(p_note, '')), '')
    WHERE id = p_id
    RETURNING id INTO v_result_id;

    IF v_result_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Evento non trovato.');
    END IF;
  ELSE
    SELECT COALESCE(MAX(event_order), 0) + 1
    INTO v_next_order
    FROM public.an_league_events;

    INSERT INTO public.an_league_events (
      event_order,
      event_date,
      evento,
      tipo,
      stagione,
      note
    )
    VALUES (
      v_next_order,
      p_event_date,
      v_clean_evento,
      v_clean_tipo,
      p_stagione,
      NULLIF(TRIM(COALESCE(p_note, '')), '')
    )
    RETURNING id INTO v_result_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_result_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_upsert_league_event TO anon, authenticated, service_role;

-- 4. RPC SECURITY DEFINER per eliminare un evento stagionale / offseason
CREATE OR REPLACE FUNCTION public.rpc_admin_delete_league_event(
  p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.an_league_events
  WHERE id = p_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Evento non trovato.');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_delete_league_event TO anon, authenticated, service_role;
