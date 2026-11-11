-- ============================================================================
-- Migrazione: RPC Salvataggio Calendario Stagionale Generato dall'Admin
-- File: supabase/migrations/20261111_admin_save_season_schedule.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_admin_save_season_schedule(
  p_stag integer,
  p_matches jsonb,
  p_admin_name text DEFAULT 'Super Admin'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_m jsonb;
  v_week int;
  v_home text;
  v_away text;
  v_date date;
  v_time text;
  v_is_neutral boolean;
  v_stadium text;
  v_referee text;
  v_weather text;
  v_unlock_at timestamptz;
  v_inserted_count int := 0;
BEGIN
  IF p_matches IS NULL OR jsonb_typeof(p_matches) <> 'array' OR jsonb_array_length(p_matches) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nessuna partita fornita per il salvataggio del calendario.'
    );
  END IF;

  -- Rimuove eventuale calendario Regular Season (Giornate 1-11) precedente per la stagione indicata
  DELETE FROM public.an_schedule
  WHERE stag = p_stag
    AND week BETWEEN 1 AND 11;

  FOR v_m IN SELECT * FROM jsonb_array_elements(p_matches)
  LOOP
    v_week := (v_m->>'week')::int;
    v_home := TRIM(v_m->>'home');
    v_away := TRIM(v_m->>'away');
    v_date := COALESCE((NULLIF(TRIM(v_m->>'date'), ''))::date, CURRENT_DATE);
    v_time := COALESCE(NULLIF(TRIM(v_m->>'match_time'), ''), '21:00');
    v_is_neutral := COALESCE((v_m->>'is_neutral')::boolean, (v_week = 6));
    v_stadium := COALESCE(
      NULLIF(TRIM(v_m->>'stadium'), ''),
      CASE WHEN v_is_neutral THEN 'PhoneHub Arena' ELSE 'Stadio Ufficiale' END
    );
    v_referee := COALESCE(NULLIF(TRIM(v_m->>'referee'), ''), 'Arbitro Federale');
    v_weather := COALESCE(NULLIF(TRIM(v_m->>'weather'), ''), 'Sereno');
    v_unlock_at := public.compute_match_unlock_at(v_date, v_time);

    INSERT INTO public.an_schedule (
      stag,
      week,
      home,
      away,
      stadium,
      referee,
      weather,
      date,
      match_time,
      unlock_at,
      standings_processed,
      is_neutral
    ) VALUES (
      p_stag,
      v_week,
      v_home,
      v_away,
      v_stadium,
      v_referee,
      v_weather,
      v_date,
      v_time,
      v_unlock_at,
      false,
      v_is_neutral
    )
    ON CONFLICT (stag, week, home, away) DO UPDATE SET
      stadium = EXCLUDED.stadium,
      referee = EXCLUDED.referee,
      weather = EXCLUDED.weather,
      date = EXCLUDED.date,
      match_time = EXCLUDED.match_time,
      unlock_at = EXCLUDED.unlock_at,
      is_neutral = EXCLUDED.is_neutral;

    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  -- Registra l'esecuzione nello stato automazioni di lega
  INSERT INTO public.league_automation_state (
    id,
    action_name,
    last_run_at,
    last_run_by,
    details,
    updated_at
  ) VALUES (
    'generate_season_schedule',
    'Generazione Calendario Stagionale',
    NOW(),
    COALESCE(NULLIF(TRIM(p_admin_name), ''), 'Super Admin'),
    jsonb_build_object(
      'stag', p_stag,
      'matches_count', v_inserted_count,
      'neutral_week', 6,
      'neutral_stadium', 'PhoneHub Arena'
    ),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    action_name = EXCLUDED.action_name,
    last_run_at = EXCLUDED.last_run_at,
    last_run_by = EXCLUDED.last_run_by,
    details = EXCLUDED.details,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'success', true,
    'stag', p_stag,
    'inserted_count', v_inserted_count
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_save_season_schedule(integer, jsonb, text) TO anon, authenticated, service_role;
