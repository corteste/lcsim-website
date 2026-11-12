-- ==============================================================================
-- ROLLBACK: 20261112_draft_allow_serie_b_free_agents_rollback.sql
-- Ripristina rpc_draft_free_agent alla versione che consente solo Squadra IS NULL.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_draft_free_agent(
  p_pick_overall INT,
  p_player_id BIGINT,
  p_team_id TEXT,
  p_picked_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_player RECORD;
  v_gk_count INT;
  v_remaining_picks INT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.an_draft_board
    WHERE pick_overall = p_pick_overall AND (rookie_id IS NOT NULL OR player_id IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'La scelta #% è già stata effettuata.', p_pick_overall;
  END IF;

  SELECT * INTO v_player FROM public.an_player WHERE "ID" = p_player_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Calciatore con ID % non trovato in archivio.', p_player_id;
  END IF;

  IF v_player."Squadra" IS NOT NULL AND trim(v_player."Squadra") != '' THEN
    RAISE EXCEPTION 'Il calciatore % % non è svincolato (attualmente assegnato a %).', v_player."Nome", v_player."Cognome", v_player."Squadra";
  END IF;

  SELECT count(*) INTO v_gk_count
  FROM public.an_player
  WHERE "Squadra" = p_team_id AND "Posiz" = 'POR';

  SELECT count(*) INTO v_remaining_picks
  FROM public.an_draft_board
  WHERE team_id = p_team_id AND (rookie_id IS NULL AND player_id IS NULL);

  IF v_player."Posiz" = 'POR' AND v_gk_count >= 3 THEN
    RAISE EXCEPTION 'Limite portieri raggiunto: la squadra % possiede già % portieri in rosa (massimo consentito: 3).', p_team_id, v_gk_count;
  END IF;

  IF v_remaining_picks <= 1 AND v_gk_count = 1 AND v_player."Posiz" != 'POR' THEN
    RAISE EXCEPTION 'Obbligo Portiere: la squadra % possiede un solo portiere a roster ed è alla sua ultima scelta del Draft, pertanto è obbligata a selezionare un portiere (POR).', p_team_id;
  END IF;

  UPDATE public.an_player
  SET "Squadra" = p_team_id
  WHERE "ID" = p_player_id;

  UPDATE public.an_draft_board
  SET player_id = p_player_id,
      rookie_id = NULL,
      player_type = 'free_agent',
      picked_at = now(),
      picked_by = p_picked_by
  WHERE pick_overall = p_pick_overall;

  RETURN jsonb_build_object(
    'success', true,
    'pick_overall', p_pick_overall,
    'player_id', p_player_id,
    'team_id', p_team_id,
    'player_type', 'free_agent'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_draft_free_agent TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
