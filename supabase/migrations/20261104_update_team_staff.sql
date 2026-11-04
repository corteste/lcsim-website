-- ==============================================================================
-- LCSIM Migration: RPC per Aggiornamento Staff Squadra (Allenatore e Presidente)
-- File: supabase/migrations/20261104_update_team_staff.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_update_team_staff(
  p_team_id TEXT,
  p_coach_name TEXT,
  p_president_name TEXT DEFAULT NULL,
  p_acting_username TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_clean_coach TEXT;
  v_clean_president TEXT;
  v_target_team_id TEXT;
  v_president_updated BOOLEAN := FALSE;
BEGIN
  v_clean_coach := TRIM(p_coach_name);
  v_clean_president := TRIM(p_president_name);
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
      RETURN jsonb_build_object('success', false, 'error', 'Non hai i permessi per modificare lo staff di questa squadra.');
    END IF;
  END IF;

  -- 1. Aggiorna Allenatore in an_team se specificato
  IF v_clean_coach IS NOT NULL AND v_clean_coach <> '' THEN
    UPDATE public.an_team
    SET "MANAGER" = v_clean_coach
    WHERE UPPER(TRIM("TEAM_ID")) = v_target_team_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Squadra non trovata.');
    END IF;
  END IF;

  -- 2. Aggiorna Nome Presidente in app_user se specificato
  IF v_clean_president IS NOT NULL AND v_clean_president <> '' THEN
    UPDATE public.app_user
    SET name = v_clean_president,
        updated_at = NOW()
    WHERE UPPER(TRIM(team_id)) = v_target_team_id AND is_admin = false;

    IF FOUND THEN
      v_president_updated := TRUE;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'coach', v_clean_coach,
    'president', v_clean_president,
    'president_updated', v_president_updated
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_team_staff(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
