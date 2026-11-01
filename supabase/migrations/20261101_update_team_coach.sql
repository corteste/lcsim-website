-- ==============================================================================
-- LCSIM Migration: RPC per Aggiornamento Allenatore Squadra (an_team.MANAGER)
-- Data: 01/11/2026
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_update_team_coach(
  p_team_id TEXT,
  p_coach_name TEXT,
  p_acting_username TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_clean_name TEXT;
  v_target_team_id TEXT;
BEGIN
  v_clean_name := TRIM(p_coach_name);
  IF v_clean_name IS NULL OR v_clean_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Il nome dell''allenatore non può essere vuoto.');
  END IF;

  v_target_team_id := UPPER(TRIM(p_team_id));

  -- Se p_acting_username è fornito, verifica permessi
  IF p_acting_username IS NOT NULL AND TRIM(p_acting_username) <> '' THEN
    SELECT * INTO v_user
    FROM public.app_user
    WHERE LOWER(username) = LOWER(TRIM(p_acting_username));

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Utente non autorizzato.');
    END IF;

    -- L'utente deve essere admin oppure il manager assegnato alla squadra
    IF NOT COALESCE(v_user.is_admin, false) AND UPPER(COALESCE(v_user.team_id, '')) <> v_target_team_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Non hai i permessi per modificare l''allenatore di questa squadra.');
    END IF;
  END IF;

  UPDATE public.an_team
  SET "MANAGER" = v_clean_name
  WHERE UPPER(TRIM("TEAM_ID")) = v_target_team_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Squadra non trovata.');
  END IF;

  RETURN jsonb_build_object('success', true, 'coach', v_clean_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_team_coach(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
