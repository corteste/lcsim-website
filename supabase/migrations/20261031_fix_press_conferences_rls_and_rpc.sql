-- ==============================================================================
-- Migrazione: 20261031_fix_press_conferences_rls_and_rpc.sql
-- Descrizione: Risolve il mancato salvataggio delle risposte alle conferenze stampa
--              e delle reazioni ai rumor.
--              1. Crea la funzione protetta RPC rpc_submit_press_answer (SECURITY DEFINER).
--              2. Crea la funzione protetta RPC rpc_react_to_rumor (SECURITY DEFINER).
--              3. Aggiorna le policy RLS su press_conferences e league_market_rumors
--                 consentendo l'aggiornamento anche al ruolo 'anon' utilizzato dal client.
-- ==============================================================================

-- 1. RPC per invio risposta conferenza stampa
CREATE OR REPLACE FUNCTION public.rpc_submit_press_answer(
  p_conference_id BIGINT,
  p_answer TEXT,
  p_manager_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF p_answer IS NULL OR TRIM(p_answer) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Il commento non può essere vuoto.');
  END IF;

  UPDATE public.press_conferences
  SET
    answer = TRIM(p_answer),
    status = 'ANSWERED',
    answered_at = now(),
    updated_at = now(),
    manager_name = COALESCE(NULLIF(TRIM(p_manager_name), ''), manager_name)
  WHERE id = p_conference_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conferenza stampa non trovata.');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_submit_press_answer TO anon, authenticated, service_role;

-- 2. RPC per reazione ai rumor di mercato
CREATE OR REPLACE FUNCTION public.rpc_react_to_rumor(
  p_rumor_id BIGINT,
  p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rx JSONB;
  v_count INT;
BEGIN
  IF p_reaction_type NOT IN ('fire', 'laugh', 'shock', 'doubt') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reazione non valida.');
  END IF;

  SELECT COALESCE(reactions, '{"fire": 0, "laugh": 0, "shock": 0, "doubt": 0}'::JSONB)
  INTO v_rx
  FROM public.league_market_rumors
  WHERE id = p_rumor_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rumor non trovato.');
  END IF;

  v_count := COALESCE((v_rx->>p_reaction_type)::INT, 0) + 1;
  v_rx := jsonb_set(v_rx, ARRAY[p_reaction_type], to_jsonb(v_count));

  UPDATE public.league_market_rumors
  SET reactions = v_rx
  WHERE id = p_rumor_id;

  RETURN jsonb_build_object('success', true, 'reactions', v_rx);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_react_to_rumor TO anon, authenticated, service_role;

-- 3. Aggiornamento policy RLS per accesso tramite ruolo anon / public
DROP POLICY IF EXISTS "press_conferences_update" ON public.press_conferences;
CREATE POLICY "press_conferences_update" ON public.press_conferences
    FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "press_conferences_insert" ON public.press_conferences;
CREATE POLICY "press_conferences_insert" ON public.press_conferences
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "league_market_rumors_update" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_update" ON public.league_market_rumors
    FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "league_market_rumors_insert" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_insert" ON public.league_market_rumors
    FOR INSERT TO public WITH CHECK (true);
