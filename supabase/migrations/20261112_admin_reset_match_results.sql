-- ==============================================================================
-- LCSIM Migration: Procedura di Reset / Annullamento Risultati Partita e Giornata (#72)
-- File: supabase/migrations/20261112_admin_reset_match_results.sql
-- ==============================================================================

-- 1. FUNZIONE RPC: Reset Singola Partita Refertata
CREATE OR REPLACE FUNCTION public.rpc_admin_reset_single_match(
    p_stag INTEGER,
    p_week INTEGER,
    p_home TEXT,
    p_away TEXT,
    p_admin_name TEXT DEFAULT 'Super Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_deleted INT := 0;
    v_player_deleted INT := 0;
    v_schedule_found BOOLEAN := false;
BEGIN
    -- Verifica esistenza match in an_schedule
    SELECT EXISTS (
        SELECT 1 FROM public.an_schedule
        WHERE stag = p_stag AND week = p_week AND home = p_home AND away = p_away
    ) INTO v_schedule_found;

    IF NOT v_schedule_found THEN
        RETURN jsonb_build_object('success', false, 'error', 'Partita non trovata a calendario.');
    END IF;

    -- 1. Elimina statistiche calciatori delle due squadre per questo incontro
    WITH deleted_players AS (
        DELETE FROM public."AS_PLAYER_STAT"
        WHERE "STAG" = p_stag
          AND "WEEK" = p_week
          AND (
              "TEAM_ID" IN (p_home, p_away)
              OR (
                  "TEAM_ID" IS NULL
                  AND "ID" IN (SELECT "ID" FROM public.an_player WHERE "Squadra" IN (p_home, p_away))
              )
          )
        RETURNING *
    )
    SELECT count(*) INTO v_player_deleted FROM deleted_players;

    -- 2. Elimina statistiche squadra da AS_TEAM_STAT
    WITH deleted_teams AS (
        DELETE FROM public."AS_TEAM_STAT"
        WHERE "STAG" = p_stag
          AND "WEEK" = p_week
          AND "ID" IN (p_home, p_away)
        RETURNING *
    )
    SELECT count(*) INTO v_team_deleted FROM deleted_teams;

    -- 3. Resetta stato partita in an_schedule
    UPDATE public.an_schedule
    SET standings_processed = false,
        unlock_at = NULL
    WHERE stag = p_stag AND week = p_week AND home = p_home AND away = p_away;

    -- 4. Ricalcola classifica di lega per la stagione
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_standings_for_season') THEN
        PERFORM public.refresh_standings_for_season(p_stag);
    END IF;

    -- 5. Registra operazione in league_automation_state se presente
    UPDATE public.league_automation_state
    SET last_run_at = NOW(),
        last_run_by = p_admin_name,
        notes = format('Reset referto %s vs %s (Giornata %s, Stagione %s)', p_home, p_away, p_week, p_stag)
    WHERE key = 'import_match_results';

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Referto della partita %s vs %s azzerato con successo.', p_home, p_away),
        'stag', p_stag,
        'week', p_week,
        'home', p_home,
        'away', p_away,
        'teams_deleted', v_team_deleted,
        'players_deleted', v_player_deleted
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. FUNZIONE RPC: Reset Intera Giornata (Tutti i match del turno)
CREATE OR REPLACE FUNCTION public.rpc_admin_reset_matchday_results(
    p_stag INTEGER,
    p_week INTEGER,
    p_admin_name TEXT DEFAULT 'Super Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_matches_count INT := 0;
    v_team_deleted INT := 0;
    v_player_deleted INT := 0;
BEGIN
    SELECT count(*) INTO v_matches_count
    FROM public.an_schedule
    WHERE stag = p_stag AND week = p_week;

    IF v_matches_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', format('Nessuna partita a calendario per la Giornata %s della Stagione %s.', p_week, p_stag));
    END IF;

    -- 1. Elimina tutte le statistiche calciatori della giornata
    WITH deleted_players AS (
        DELETE FROM public."AS_PLAYER_STAT"
        WHERE "STAG" = p_stag AND "WEEK" = p_week
        RETURNING *
    )
    SELECT count(*) INTO v_player_deleted FROM deleted_players;

    -- 2. Elimina tutte le statistiche squadre della giornata
    WITH deleted_teams AS (
        DELETE FROM public."AS_TEAM_STAT"
        WHERE "STAG" = p_stag AND "WEEK" = p_week
        RETURNING *
    )
    SELECT count(*) INTO v_team_deleted FROM deleted_teams;

    -- 3. Resetta lo stato di tutti i match della giornata in an_schedule
    UPDATE public.an_schedule
    SET standings_processed = false,
        unlock_at = NULL
    WHERE stag = p_stag AND week = p_week;

    -- 4. Ricalcola classifica di lega per la stagione
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_standings_for_season') THEN
        PERFORM public.refresh_standings_for_season(p_stag);
    END IF;

    -- 5. Registra operazione in league_automation_state se presente
    UPDATE public.league_automation_state
    SET last_run_at = NOW(),
        last_run_by = p_admin_name,
        notes = format('Reset completo Giornata %s (Stagione %s) eseguito da %s', p_week, p_stag, p_admin_name)
    WHERE key = 'import_match_results';

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Tutti i referti della Giornata %s sono stati azzerati con successo.', p_week),
        'stag', p_stag,
        'week', p_week,
        'matches_reset', v_matches_count,
        'teams_deleted', v_team_deleted,
        'players_deleted', v_player_deleted
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_reset_single_match TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_admin_reset_matchday_results TO anon, authenticated, service_role;
