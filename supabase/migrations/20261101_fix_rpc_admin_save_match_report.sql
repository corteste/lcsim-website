-- Migration: Fix rpc_admin_save_match_report to use lowercase public.as_team_stat and full schema with p_is_neutral
-- Date: 2026-11-01

-- Drop both overloaded signatures to avoid ambiguity
DROP FUNCTION IF EXISTS public.rpc_admin_save_match_report(
  integer, integer, text, text, date, text, timestamp with time zone, text, text, text, jsonb, jsonb, jsonb, text
);

DROP FUNCTION IF EXISTS public.rpc_admin_save_match_report(
  integer, integer, text, text, date, text, timestamp with time zone, text, text, text, jsonb, jsonb, jsonb, text, boolean
);

CREATE OR REPLACE FUNCTION public.rpc_admin_save_match_report(
  p_stag integer,
  p_week integer,
  p_home text,
  p_away text,
  p_match_date date,
  p_match_time text,
  p_custom_unlock_at timestamp with time zone,
  p_stadium text,
  p_referee text,
  p_weather text,
  p_home_team_stat jsonb,
  p_away_team_stat jsonb,
  p_player_stats jsonb,
  p_admin_name text,
  p_is_neutral boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date DATE;
  v_time TEXT;
  v_unlock_at TIMESTAMPTZ;
  v_p JSONB;
  v_player_count INT := 0;
BEGIN
  v_time := COALESCE(NULLIF(TRIM(p_match_time), ''), '21:00');
  v_date := COALESCE(p_match_date, CURRENT_DATE);
  v_unlock_at := COALESCE(p_custom_unlock_at, public.compute_match_unlock_at(v_date, v_time));

  -- A. Upsert riga calendario su an_schedule
  INSERT INTO public.an_schedule (
    stag, week, home, away, stadium, referee, weather, date, match_time, unlock_at, standings_processed, is_neutral
  ) VALUES (
    p_stag, p_week, p_home, p_away,
    COALESCE(p_stadium, 'Stadio Ufficiale'),
    COALESCE(p_referee, 'Arbitro Federale'),
    COALESCE(p_weather, 'Sereno'),
    v_date,
    v_time,
    v_unlock_at,
    false,
    COALESCE(p_is_neutral, false)
  )
  ON CONFLICT (stag, week, home, away) DO UPDATE SET
    stadium = COALESCE(NULLIF(TRIM(p_stadium), ''), public.an_schedule.stadium),
    referee = COALESCE(NULLIF(TRIM(p_referee), ''), public.an_schedule.referee),
    weather = COALESCE(NULLIF(TRIM(p_weather), ''), public.an_schedule.weather),
    date = COALESCE(p_match_date, public.an_schedule.date),
    match_time = v_time,
    unlock_at = COALESCE(
      p_custom_unlock_at,
      public.compute_match_unlock_at(COALESCE(p_match_date, public.an_schedule.date), v_time)
    ),
    is_neutral = COALESCE(p_is_neutral, public.an_schedule.is_neutral),
    standings_processed = false;

  SELECT unlock_at INTO v_unlock_at
  FROM public.an_schedule
  WHERE stag = p_stag AND week = p_week AND home = p_home AND away = p_away;

  -- B. Upsert statistiche squadra CASA in as_team_stat
  IF p_home_team_stat IS NOT NULL AND p_home_team_stat != '{}'::jsonb THEN
    INSERT INTO public.as_team_stat (
      "STAG", "WEEK", "ID", "ALLENATORE", "VOTO", "MINUTI",
      "GOL", "AGOL", "ASST", "TIRI_SI", "TIRI_TOT", "PASS_SI", "PASS_TOT",
      "DRIB_SI", "DRIB_TOT", "CROS_SI", "CROS_TOT", "CTRS_SI", "CTRS_TOT",
      "FALLI", "PARA", "GSUB", "GIALLI", "ROSSI", "FGIOCO",
      "POSS", "CANGL", "TEMPOREC", "xG", "INTERC", "TAGLI", "AGGIR", "SCAVAL", "INCURS",
      "EXTRA_STATS"
    ) VALUES (
      p_stag, p_week, p_home,
      COALESCE(p_home_team_stat->>'ALLENATORE', ''),
      COALESCE((p_home_team_stat->>'VOTO')::real, 6.0),
      COALESCE((p_home_team_stat->>'MINUTI')::bigint, 90),
      COALESCE((p_home_team_stat->>'GOL')::int, 0),
      COALESCE((p_home_team_stat->>'AGOL')::int, 0),
      COALESCE((p_home_team_stat->>'ASST')::int, 0),
      COALESCE((p_home_team_stat->>'TIRI_SI')::int, 0),
      COALESCE((p_home_team_stat->>'TIRI_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'PASS_SI')::int, 0),
      COALESCE((p_home_team_stat->>'PASS_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'DRIB_SI')::int, 0),
      COALESCE((p_home_team_stat->>'DRIB_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'CROS_SI')::int, 0),
      COALESCE((p_home_team_stat->>'CROS_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'CTRS_SI')::int, 0),
      COALESCE((p_home_team_stat->>'CTRS_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'FALLI')::int, 0),
      COALESCE((p_home_team_stat->>'PARA')::int, 0),
      COALESCE((p_home_team_stat->>'GSUB')::int, 0),
      COALESCE((p_home_team_stat->>'GIALLI')::int, 0),
      COALESCE((p_home_team_stat->>'ROSSI')::int, 0),
      COALESCE((p_home_team_stat->>'FGIOCO')::int, 0),
      COALESCE((p_home_team_stat->>'POSS')::real, 0.5),
      COALESCE((p_home_team_stat->>'CANGL')::int, 0),
      (p_home_team_stat->>'TEMPOREC')::int,
      (p_home_team_stat->>'xG')::real,
      (p_home_team_stat->>'INTERC')::int,
      (p_home_team_stat->>'TAGLI')::int,
      (p_home_team_stat->>'AGGIR')::int,
      (p_home_team_stat->>'SCAVAL')::int,
      (p_home_team_stat->>'INCURS')::int,
      COALESCE(p_home_team_stat->'EXTRA_STATS', '{}'::jsonb)
    )
    ON CONFLICT ("STAG", "WEEK", "ID") DO UPDATE SET
      "ALLENATORE" = EXCLUDED."ALLENATORE",
      "VOTO" = EXCLUDED."VOTO",
      "MINUTI" = EXCLUDED."MINUTI",
      "GOL" = EXCLUDED."GOL",
      "AGOL" = EXCLUDED."AGOL",
      "ASST" = EXCLUDED."ASST",
      "TIRI_SI" = EXCLUDED."TIRI_SI",
      "TIRI_TOT" = EXCLUDED."TIRI_TOT",
      "PASS_SI" = EXCLUDED."PASS_SI",
      "PASS_TOT" = EXCLUDED."PASS_TOT",
      "DRIB_SI" = EXCLUDED."DRIB_SI",
      "DRIB_TOT" = EXCLUDED."DRIB_TOT",
      "CROS_SI" = EXCLUDED."CROS_SI",
      "CROS_TOT" = EXCLUDED."CROS_TOT",
      "CTRS_SI" = EXCLUDED."CTRS_SI",
      "CTRS_TOT" = EXCLUDED."CTRS_TOT",
      "FALLI" = EXCLUDED."FALLI",
      "PARA" = EXCLUDED."PARA",
      "GSUB" = EXCLUDED."GSUB",
      "GIALLI" = EXCLUDED."GIALLI",
      "ROSSI" = EXCLUDED."ROSSI",
      "FGIOCO" = EXCLUDED."FGIOCO",
      "POSS" = EXCLUDED."POSS",
      "CANGL" = EXCLUDED."CANGL",
      "TEMPOREC" = EXCLUDED."TEMPOREC",
      "xG" = EXCLUDED."xG",
      "INTERC" = EXCLUDED."INTERC",
      "TAGLI" = EXCLUDED."TAGLI",
      "AGGIR" = EXCLUDED."AGGIR",
      "SCAVAL" = EXCLUDED."SCAVAL",
      "INCURS" = EXCLUDED."INCURS",
      "EXTRA_STATS" = EXCLUDED."EXTRA_STATS";
  END IF;

  -- C. Upsert statistiche squadra TRASFERTA in as_team_stat
  IF p_away_team_stat IS NOT NULL AND p_away_team_stat != '{}'::jsonb THEN
    INSERT INTO public.as_team_stat (
      "STAG", "WEEK", "ID", "ALLENATORE", "VOTO", "MINUTI",
      "GOL", "AGOL", "ASST", "TIRI_SI", "TIRI_TOT", "PASS_SI", "PASS_TOT",
      "DRIB_SI", "DRIB_TOT", "CROS_SI", "CROS_TOT", "CTRS_SI", "CTRS_TOT",
      "FALLI", "PARA", "GSUB", "GIALLI", "ROSSI", "FGIOCO",
      "POSS", "CANGL", "TEMPOREC", "xG", "INTERC", "TAGLI", "AGGIR", "SCAVAL", "INCURS",
      "EXTRA_STATS"
    ) VALUES (
      p_stag, p_week, p_away,
      COALESCE(p_away_team_stat->>'ALLENATORE', ''),
      COALESCE((p_away_team_stat->>'VOTO')::real, 6.0),
      COALESCE((p_away_team_stat->>'MINUTI')::bigint, 90),
      COALESCE((p_away_team_stat->>'GOL')::int, 0),
      COALESCE((p_away_team_stat->>'AGOL')::int, 0),
      COALESCE((p_away_team_stat->>'ASST')::int, 0),
      COALESCE((p_away_team_stat->>'TIRI_SI')::int, 0),
      COALESCE((p_away_team_stat->>'TIRI_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'PASS_SI')::int, 0),
      COALESCE((p_away_team_stat->>'PASS_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'DRIB_SI')::int, 0),
      COALESCE((p_away_team_stat->>'DRIB_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'CROS_SI')::int, 0),
      COALESCE((p_away_team_stat->>'CROS_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'CTRS_SI')::int, 0),
      COALESCE((p_away_team_stat->>'CTRS_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'FALLI')::int, 0),
      COALESCE((p_away_team_stat->>'PARA')::int, 0),
      COALESCE((p_away_team_stat->>'GSUB')::int, 0),
      COALESCE((p_away_team_stat->>'GIALLI')::int, 0),
      COALESCE((p_away_team_stat->>'ROSSI')::int, 0),
      COALESCE((p_away_team_stat->>'FGIOCO')::int, 0),
      COALESCE((p_away_team_stat->>'POSS')::real, 0.5),
      COALESCE((p_away_team_stat->>'CANGL')::int, 0),
      (p_away_team_stat->>'TEMPOREC')::int,
      (p_away_team_stat->>'xG')::real,
      (p_away_team_stat->>'INTERC')::int,
      (p_away_team_stat->>'TAGLI')::int,
      (p_away_team_stat->>'AGGIR')::int,
      (p_away_team_stat->>'SCAVAL')::int,
      (p_away_team_stat->>'INCURS')::int,
      COALESCE(p_away_team_stat->'EXTRA_STATS', '{}'::jsonb)
    )
    ON CONFLICT ("STAG", "WEEK", "ID") DO UPDATE SET
      "ALLENATORE" = EXCLUDED."ALLENATORE",
      "VOTO" = EXCLUDED."VOTO",
      "MINUTI" = EXCLUDED."MINUTI",
      "GOL" = EXCLUDED."GOL",
      "AGOL" = EXCLUDED."AGOL",
      "ASST" = EXCLUDED."ASST",
      "TIRI_SI" = EXCLUDED."TIRI_SI",
      "TIRI_TOT" = EXCLUDED."TIRI_TOT",
      "PASS_SI" = EXCLUDED."PASS_SI",
      "PASS_TOT" = EXCLUDED."PASS_TOT",
      "DRIB_SI" = EXCLUDED."DRIB_SI",
      "DRIB_TOT" = EXCLUDED."DRIB_TOT",
      "CROS_SI" = EXCLUDED."CROS_SI",
      "CROS_TOT" = EXCLUDED."CROS_TOT",
      "CTRS_SI" = EXCLUDED."CTRS_SI",
      "CTRS_TOT" = EXCLUDED."CTRS_TOT",
      "FALLI" = EXCLUDED."FALLI",
      "PARA" = EXCLUDED."PARA",
      "GSUB" = EXCLUDED."GSUB",
      "GIALLI" = EXCLUDED."GIALLI",
      "ROSSI" = EXCLUDED."ROSSI",
      "FGIOCO" = EXCLUDED."FGIOCO",
      "POSS" = EXCLUDED."POSS",
      "CANGL" = EXCLUDED."CANGL",
      "TEMPOREC" = EXCLUDED."TEMPOREC",
      "xG" = EXCLUDED."xG",
      "INTERC" = EXCLUDED."INTERC",
      "TAGLI" = EXCLUDED."TAGLI",
      "AGGIR" = EXCLUDED."AGGIR",
      "SCAVAL" = EXCLUDED."SCAVAL",
      "INCURS" = EXCLUDED."INCURS",
      "EXTRA_STATS" = EXCLUDED."EXTRA_STATS";
  END IF;

  -- D. Pulizia e inserimento statistiche calciatori in as_player_stat
  DELETE FROM public.as_player_stat ps
  WHERE ps."STAG" = p_stag
    AND ps."WEEK" = p_week
    AND (
      ps."TEAM_ID" IN (p_home, p_away)
      OR ps."ID" IN (SELECT "ID" FROM public.an_player WHERE "Squadra" IN (p_home, p_away))
    );

  IF p_player_stats IS NOT NULL AND jsonb_typeof(p_player_stats) = 'array' THEN
    FOR v_p IN SELECT * FROM jsonb_array_elements(p_player_stats)
    LOOP
      IF (v_p->>'ID') IS NOT NULL AND COALESCE((v_p->>'MINUTI')::int, 0) > 0 THEN
        INSERT INTO public.as_player_stat (
          "STAG", "WEEK", "ID", "TEAM_ID", "POS_GIOCATA", "SUB", "MOTM",
          "VOTO", "MINUTI", "GOL", "AGOL", "ASST",
          "TIRI_IN", "TIRI_TOT", "PASS_SI", "PASS_TOT",
          "DRIB_SI", "DRIB_TOT", "CROS_SI", "CROS_TOT",
          "CTRS_SI", "CTRS_TOT", "FALLI", "PARA", "GSUB",
          "GIALLI", "ROSSI", "FGIOCO",
          "POSS_VINTI", "PALLE_PERSE", "DIST_TOT", "DIST_SCATTO", "EXTRA_STATS"
        ) VALUES (
          p_stag,
          p_week,
          (v_p->>'ID')::bigint,
          COALESCE(v_p->>'TEAM_ID', p_home),
          v_p->>'POS_GIOCATA',
          COALESCE((v_p->>'SUB')::boolean, false),
          COALESCE((v_p->>'MOTM')::boolean, false),
          COALESCE((v_p->>'VOTO')::real, 6.0),
          COALESCE((v_p->>'MINUTI')::bigint, 0),
          COALESCE((v_p->>'GOL')::int, 0),
          COALESCE((v_p->>'AGOL')::int, 0),
          COALESCE((v_p->>'ASST')::int, 0),
          COALESCE((v_p->>'TIRI_IN')::int, 0),
          COALESCE((v_p->>'TIRI_TOT')::int, 0),
          COALESCE((v_p->>'PASS_SI')::int, 0),
          COALESCE((v_p->>'PASS_TOT')::int, 0),
          COALESCE((v_p->>'DRIB_SI')::int, 0),
          COALESCE((v_p->>'DRIB_TOT')::int, 0),
          COALESCE((v_p->>'CROS_SI')::int, 0),
          COALESCE((v_p->>'CROS_TOT')::int, 0),
          COALESCE((v_p->>'CTRS_SI')::int, 0),
          COALESCE((v_p->>'CTRS_TOT')::int, 0),
          COALESCE((v_p->>'FALLI')::int, 0),
          COALESCE((v_p->>'PARA')::int, 0),
          COALESCE((v_p->>'GSUB')::int, 0),
          COALESCE((v_p->>'GIALLI')::int, 0),
          COALESCE((v_p->>'ROSSI')::int, 0),
          COALESCE((v_p->>'FGIOCO')::int, 0),
          COALESCE((v_p->>'POSS_VINTI')::int, 0),
          COALESCE((v_p->>'PALLE_PERSE')::int, 0),
          COALESCE((v_p->>'DIST_TOT')::real, 0),
          COALESCE((v_p->>'DIST_SCATTO')::real, 0),
          COALESCE(v_p->'EXTRA_STATS', '{}'::jsonb)
        )
        ON CONFLICT ("STAG", "WEEK", "ID") DO UPDATE SET
          "TEAM_ID" = EXCLUDED."TEAM_ID",
          "POS_GIOCATA" = EXCLUDED."POS_GIOCATA",
          "SUB" = EXCLUDED."SUB",
          "MOTM" = EXCLUDED."MOTM",
          "VOTO" = EXCLUDED."VOTO",
          "MINUTI" = EXCLUDED."MINUTI",
          "GOL" = EXCLUDED."GOL",
          "AGOL" = EXCLUDED."AGOL",
          "ASST" = EXCLUDED."ASST",
          "TIRI_IN" = EXCLUDED."TIRI_IN",
          "TIRI_TOT" = EXCLUDED."TIRI_TOT",
          "PASS_SI" = EXCLUDED."PASS_SI",
          "PASS_TOT" = EXCLUDED."PASS_TOT",
          "DRIB_SI" = EXCLUDED."DRIB_SI",
          "DRIB_TOT" = EXCLUDED."DRIB_TOT",
          "CROS_SI" = EXCLUDED."CROS_SI",
          "CROS_TOT" = EXCLUDED."CROS_TOT",
          "CTRS_SI" = EXCLUDED."CTRS_SI",
          "CTRS_TOT" = EXCLUDED."CTRS_TOT",
          "FALLI" = EXCLUDED."FALLI",
          "PARA" = EXCLUDED."PARA",
          "GSUB" = EXCLUDED."GSUB",
          "GIALLI" = EXCLUDED."GIALLI",
          "ROSSI" = EXCLUDED."ROSSI",
          "FGIOCO" = EXCLUDED."FGIOCO",
          "POSS_VINTI" = EXCLUDED."POSS_VINTI",
          "PALLE_PERSE" = EXCLUDED."PALLE_PERSE",
          "DIST_TOT" = EXCLUDED."DIST_TOT",
          "DIST_SCATTO" = EXCLUDED."DIST_SCATTO",
          "EXTRA_STATS" = EXCLUDED."EXTRA_STATS";

        v_player_count := v_player_count + 1;
      END IF;
    END LOOP;
  END IF;

  -- E. Ricalcola classifica per le sole partite già sbloccate
  PERFORM public.refresh_standings_for_season(p_stag);

  -- F. Registra stato automazione
  INSERT INTO public.league_automation_state (
    id, action_name, last_run_at, last_run_by, details, updated_at
  ) VALUES (
    'import_match_results',
    'Caricamento Referti & Statistiche Partita',
    NOW(),
    p_admin_name,
    jsonb_build_object(
      'stag', p_stag,
      'week', p_week,
      'match', p_home || ' vs ' || p_away,
      'players_saved', v_player_count,
      'unlock_at', v_unlock_at
    ),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_run_at = NOW(),
    last_run_by = EXCLUDED.last_run_by,
    details = EXCLUDED.details,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'stag', p_stag,
    'week', p_week,
    'home', p_home,
    'away', p_away,
    'players_saved', v_player_count,
    'unlock_at', v_unlock_at,
    'is_neutral', COALESCE(p_is_neutral, false),
    'is_unlocked_now', (v_unlock_at IS NULL OR v_unlock_at <= NOW())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_admin_save_match_report TO anon, authenticated, service_role;
