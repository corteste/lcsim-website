-- ==============================================================================
-- LCSIM Migration Rollback: Sincronizzazione Nome Presidente nelle Interviste Giornalista AI
-- File: supabase/migrations/20261110_sync_president_in_press_conferences_rollback.sql
-- ==============================================================================

-- Ripristina la precedente definizione di rpc_update_team_profile senza l'aggiornamento a press_conferences
CREATE OR REPLACE FUNCTION public.rpc_update_team_profile(
  p_team_id TEXT,
  p_coach_name TEXT DEFAULT NULL,
  p_president_name TEXT DEFAULT NULL,
  p_stadium_name TEXT DEFAULT NULL,
  p_stadium_city TEXT DEFAULT NULL,
  p_stadium_capacity INTEGER DEFAULT NULL,
  p_stadium_surface TEXT DEFAULT NULL,
  p_stadium_year INTEGER DEFAULT NULL,
  p_acting_username TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_target_team_id TEXT;
BEGIN
  v_target_team_id := UPPER(TRIM(p_team_id));

  IF p_acting_username IS NOT NULL AND TRIM(p_acting_username) <> '' THEN
    SELECT * INTO v_user
    FROM public.app_user
    WHERE LOWER(username) = LOWER(TRIM(p_acting_username));

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Utente non autorizzato.');
    END IF;

    IF NOT COALESCE(v_user.is_admin, false) AND UPPER(COALESCE(v_user.team_id, '')) <> v_target_team_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Non hai i permessi per modificare le informazioni di questo club.');
    END IF;
  END IF;

  UPDATE public.an_team
  SET
    "MANAGER" = COALESCE(NULLIF(TRIM(p_coach_name), ''), "MANAGER"),
    stadium_name = COALESCE(NULLIF(TRIM(p_stadium_name), ''), stadium_name),
    stadium_city = COALESCE(NULLIF(TRIM(p_stadium_city), ''), stadium_city),
    stadium_capacity = COALESCE(p_stadium_capacity, stadium_capacity),
    stadium_surface = COALESCE(NULLIF(TRIM(p_stadium_surface), ''), stadium_surface),
    stadium_year = COALESCE(p_stadium_year, stadium_year)
  WHERE UPPER(TRIM("TEAM_ID")) = v_target_team_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Squadra non trovata.');
  END IF;

  IF p_president_name IS NOT NULL AND TRIM(p_president_name) <> '' THEN
    UPDATE public.app_user
    SET name = TRIM(p_president_name),
        updated_at = NOW()
    WHERE UPPER(TRIM(team_id)) = v_target_team_id AND is_admin = false;
  END IF;

  RETURN jsonb_build_object('success', true, 'team_id', v_target_team_id);
END;
$$;
