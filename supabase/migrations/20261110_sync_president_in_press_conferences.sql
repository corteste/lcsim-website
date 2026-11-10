-- ==============================================================================
-- LCSIM Migration: Sincronizzazione Nome Presidente nelle Interviste Giornalista AI
-- File: supabase/migrations/20261110_sync_president_in_press_conferences.sql
-- ==============================================================================

-- 1. Aggiorna la funzione rpc_update_team_profile affinché allinei anche le interviste
--    pendenti del Giornalista AI (press_conferences) quando viene modificato il Presidente del club.

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
  v_old_president TEXT;
BEGIN
  v_target_team_id := UPPER(TRIM(p_team_id));

  -- Verifica permessi se acting_username fornito
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

  -- Aggiorna Allenatore e Dati Stadio in an_team
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

  -- Aggiorna Nome Presidente in app_user e sincronizza press_conferences pendenti
  IF p_president_name IS NOT NULL AND TRIM(p_president_name) <> '' THEN
    -- Recupera il vecchio nome del presidente
    SELECT name INTO v_old_president
    FROM public.app_user
    WHERE UPPER(TRIM(team_id)) = v_target_team_id AND is_admin = false
    LIMIT 1;

    UPDATE public.app_user
    SET name = TRIM(p_president_name),
        updated_at = NOW()
    WHERE UPPER(TRIM(team_id)) = v_target_team_id AND is_admin = false;

    -- Aggiorna le interviste PENDING in press_conferences con il nuovo nome del Presidente
    UPDATE public.press_conferences
    SET
      manager_name = TRIM(p_president_name),
      question = CASE
        WHEN v_old_president IS NOT NULL AND TRIM(v_old_president) <> '' AND question ILIKE '%' || TRIM(v_old_president) || '%'
          THEN REPLACE(question, TRIM(v_old_president), TRIM(p_president_name))
        WHEN question ~* '^("?\\s*(?:Presidente|Mister)\\s+)[^,]+(,)'
          THEN REGEXP_REPLACE(question, '^("?\\s*(?:Presidente|Mister)\\s+)[^,]+(,)', '\\1' || TRIM(p_president_name) || '\\2')
        ELSE question
      END,
      updated_at = NOW()
    WHERE UPPER(TRIM(team_id)) = v_target_team_id AND status = 'PENDING';
  END IF;

  RETURN jsonb_build_object('success', true, 'team_id', v_target_team_id);
END;
$$;

-- 2. Allinea subito le interviste attualmente in stato PENDING ai nomi dei rispettivi Presidenti
UPDATE public.press_conferences pc
SET
  manager_name = u.name,
  question = REGEXP_REPLACE(pc.question, '^("?\\s*(?:Presidente|Mister)\\s+)[^,]+(,)', '\\1' || u.name || '\\2'),
  updated_at = NOW()
FROM public.app_user u
WHERE UPPER(TRIM(pc.team_id)) = UPPER(TRIM(u.team_id))
  AND u.is_admin = false
  AND pc.status = 'PENDING'
  AND u.name IS NOT NULL
  AND TRIM(u.name) <> '';
