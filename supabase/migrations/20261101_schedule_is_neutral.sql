-- ============================================================================
-- Migrazione: Supporto Partite su Campo Neutro & Esclusione Playoff da Standings
-- Data: 2026-11-01
-- ============================================================================

-- 1. Aggiunta colonna is_neutral su public.an_schedule
ALTER TABLE public.an_schedule
ADD COLUMN IF NOT EXISTS is_neutral BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.an_schedule.is_neutral IS 'Indica se la partita è disputata in campo neutro (se true, non conta come partita in casa per nessuna squadra)';

-- 2. Aggiornamento funzione refresh_standings_for_season
CREATE OR REPLACE FUNCTION public.refresh_standings_for_season(p_stag integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  WITH match_pairs AS (
    SELECT
      s.stag, s.week, s.home, s.away, s.is_neutral,
      h."GOL" AS home_goals, a."GOL" AS away_goals
    FROM public.an_schedule s
    JOIN public."AS_TEAM_STAT" h ON h."STAG" = s.stag AND h."WEEK" = s.week AND h."ID" = s.home
    JOIN public."AS_TEAM_STAT" a ON a."STAG" = s.stag AND a."WEEK" = s.week AND a."ID" = s.away
    WHERE s.stag = p_stag
      AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
      -- Include solo i turni di Regular Season nella classifica (esclude Playoff / Post-Season)
      AND ((s.stag >= 11 AND s.week <= 11) OR (s.stag <= 10 AND s.week <= 9))
  ),
  team_matches AS (
    SELECT
      stag, home AS team,
      CASE WHEN COALESCE(is_neutral, false) = false THEN 1 ELSE 0 END AS played_at_home,
      home_goals AS gf, away_goals AS ga,
      CASE WHEN home_goals > away_goals THEN 3 WHEN home_goals = away_goals THEN 1 ELSE 0 END AS pts,
      CASE WHEN home_goals > away_goals THEN 1 ELSE 0 END AS w,
      CASE WHEN home_goals = away_goals THEN 1 ELSE 0 END AS d,
      CASE WHEN home_goals < away_goals THEN 1 ELSE 0 END AS l
    FROM match_pairs
    UNION ALL
    SELECT
      stag, away AS team, 0 AS played_at_home,
      away_goals AS gf, home_goals AS ga,
      CASE WHEN away_goals > home_goals THEN 3 WHEN away_goals = home_goals THEN 1 ELSE 0 END AS pts,
      CASE WHEN away_goals > home_goals THEN 1 ELSE 0 END AS w,
      CASE WHEN away_goals = home_goals THEN 1 ELSE 0 END AS d,
      CASE WHEN away_goals < home_goals THEN 1 ELSE 0 END AS l
    FROM match_pairs
  ),
  season_teams AS (
    SELECT DISTINCT home AS team FROM public.an_schedule WHERE stag = p_stag
    UNION
    SELECT DISTINCT away AS team FROM public.an_schedule WHERE stag = p_stag
  ),
  aggregated AS (
    SELECT
      st.team,
      COALESCE(COUNT(tm.team), 0)::int AS games_played,
      COALESCE(SUM(tm.w), 0)::int AS win,
      COALESCE(SUM(tm.d), 0)::int AS draws,
      COALESCE(SUM(tm.l), 0)::int AS loss,
      COALESCE(SUM(tm.gf), 0)::bigint AS goal_made,
      COALESCE(SUM(tm.ga), 0)::bigint AS goal_conceded,
      (COALESCE(SUM(tm.gf), 0) - COALESCE(SUM(tm.ga), 0))::bigint AS goal_difference,
      COALESCE(SUM(tm.played_at_home), 0)::int AS played_at_home,
      COALESCE(SUM(tm.pts), 0)::int AS points,
      p_stag::int AS stag,
      NOW() AS modification_date
    FROM season_teams st
    LEFT JOIN team_matches tm ON tm.team = st.team
    GROUP BY st.team
  )
  INSERT INTO public.an_standings (
    team, games_played, win, draws, loss,
    goal_made, goal_conceded, goal_difference,
    played_at_home, points, stag, modification_date
  )
  SELECT
    team, games_played, win, draws, loss,
    goal_made, goal_conceded, goal_difference,
    played_at_home, points, stag, modification_date
  FROM aggregated
  ON CONFLICT (team) DO UPDATE SET
    games_played = EXCLUDED.games_played,
    win = EXCLUDED.win,
    draws = EXCLUDED.draws,
    loss = EXCLUDED.loss,
    goal_made = EXCLUDED.goal_made,
    goal_conceded = EXCLUDED.goal_conceded,
    goal_difference = EXCLUDED.goal_difference,
    played_at_home = EXCLUDED.played_at_home,
    points = EXCLUDED.points,
    stag = EXCLUDED.stag,
    modification_date = EXCLUDED.modification_date;

  -- Aggiorna standings_processed solo per le partite sbloccate che hanno i tabellini
  UPDATE public.an_schedule s
  SET standings_processed = true
  WHERE s.stag = p_stag
    AND standings_processed = false
    AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
    AND EXISTS (SELECT 1 FROM public."AS_TEAM_STAT" WHERE "STAG" = s.stag AND "WEEK" = s.week AND "ID" = s.home)
    AND EXISTS (SELECT 1 FROM public."AS_TEAM_STAT" WHERE "STAG" = s.stag AND "WEEK" = s.week AND "ID" = s.away);

  -- Se una partita con tabellini è ancora sotto embargo (unlock_at > NOW()), standings_processed resta false
  UPDATE public.an_schedule s
  SET standings_processed = false
  WHERE s.stag = p_stag
    AND standings_processed = true
    AND s.unlock_at IS NOT NULL
    AND s.unlock_at > NOW();
END;
$function$;

-- 3. Aggiornamento funzione sync_unlocked_standings
CREATE OR REPLACE FUNCTION public.sync_unlocked_standings(p_stag integer DEFAULT NULL::integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_stag integer;
BEGIN
  IF p_stag IS NOT NULL THEN
    PERFORM public.refresh_standings_for_season(p_stag);
  ELSE
    FOR v_stag IN (SELECT DISTINCT stag FROM public.an_schedule ORDER BY stag ASC) LOOP
      PERFORM public.refresh_standings_for_season(v_stag);
    END LOOP;
  END IF;

  RETURN TRUE;
END;
$function$;

-- 4. Aggiornamento rpc_admin_save_match_report con parametro p_is_neutral
CREATE OR REPLACE FUNCTION public.rpc_admin_save_match_report(
  p_stag integer,
  p_week integer,
  p_home text,
  p_away text,
  p_match_date date DEFAULT NULL::date,
  p_match_time text DEFAULT '21:00'::text,
  p_custom_unlock_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_stadium text DEFAULT NULL::text,
  p_referee text DEFAULT NULL::text,
  p_weather text DEFAULT NULL::text,
  p_home_team_stat jsonb DEFAULT '{}'::jsonb,
  p_away_team_stat jsonb DEFAULT '{}'::jsonb,
  p_player_stats jsonb DEFAULT '[]'::jsonb,
  p_admin_name text DEFAULT 'Super Admin'::text,
  p_is_neutral boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    unlock_at = v_unlock_at,
    is_neutral = COALESCE(p_is_neutral, public.an_schedule.is_neutral);

  -- B. Upsert statistiche squadra casa
  IF p_home_team_stat IS NOT NULL AND jsonb_typeof(p_home_team_stat) = 'object' AND p_home_team_stat != '{}'::jsonb THEN
    INSERT INTO public."AS_TEAM_STAT" (
      "STAG", "WEEK", "ID", "MODULO", "STILE",
      "GOL", "TIRI_TOT", "TIRI_IN", "CANGL", "FALLI",
      "RIGORI", "FUORIGIOCO", "POSSESSO", "PASS_SI", "PASS_TOT", "CTRS_SI", "CTRS_TOT", "PARA"
    ) VALUES (
      p_stag, p_week, p_home,
      COALESCE(p_home_team_stat->>'MODULO', '4-3-3'),
      COALESCE(p_home_team_stat->>'STILE', 'Equilibrato'),
      COALESCE((p_home_team_stat->>'GOL')::int, 0),
      COALESCE((p_home_team_stat->>'TIRI_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'TIRI_IN')::int, 0),
      COALESCE((p_home_team_stat->>'CANGL')::int, 0),
      COALESCE((p_home_team_stat->>'FALLI')::int, 0),
      COALESCE((p_home_team_stat->>'RIGORI')::int, 0),
      COALESCE((p_home_team_stat->>'FUORIGIOCO')::int, 0),
      COALESCE((p_home_team_stat->>'POSSESSO')::numeric, 0.5),
      COALESCE((p_home_team_stat->>'PASS_SI')::int, 0),
      COALESCE((p_home_team_stat->>'PASS_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'CTRS_SI')::int, 0),
      COALESCE((p_home_team_stat->>'CTRS_TOT')::int, 0),
      COALESCE((p_home_team_stat->>'PARA')::int, 0)
    )
    ON CONFLICT ("STAG", "WEEK", "ID") DO UPDATE SET
      "MODULO" = EXCLUDED."MODULO",
      "STILE" = EXCLUDED."STILE",
      "GOL" = EXCLUDED."GOL",
      "TIRI_TOT" = EXCLUDED."TIRI_TOT",
      "TIRI_IN" = EXCLUDED."TIRI_IN",
      "CANGL" = EXCLUDED."CANGL",
      "FALLI" = EXCLUDED."FALLI",
      "RIGORI" = EXCLUDED."RIGORI",
      "FUORIGIOCO" = EXCLUDED."FUORIGIOCO",
      "POSSESSO" = EXCLUDED."POSSESSO",
      "PASS_SI" = EXCLUDED."PASS_SI",
      "PASS_TOT" = EXCLUDED."PASS_TOT",
      "CTRS_SI" = EXCLUDED."CTRS_SI",
      "CTRS_TOT" = EXCLUDED."CTRS_TOT",
      "PARA" = EXCLUDED."PARA";
  END IF;

  -- C. Upsert statistiche squadra trasferta
  IF p_away_team_stat IS NOT NULL AND jsonb_typeof(p_away_team_stat) = 'object' AND p_away_team_stat != '{}'::jsonb THEN
    INSERT INTO public."AS_TEAM_STAT" (
      "STAG", "WEEK", "ID", "MODULO", "STILE",
      "GOL", "TIRI_TOT", "TIRI_IN", "CANGL", "FALLI",
      "RIGORI", "FUORIGIOCO", "POSSESSO", "PASS_SI", "PASS_TOT", "CTRS_SI", "CTRS_TOT", "PARA"
    ) VALUES (
      p_stag, p_week, p_away,
      COALESCE(p_away_team_stat->>'MODULO', '4-3-3'),
      COALESCE(p_away_team_stat->>'STILE', 'Equilibrato'),
      COALESCE((p_away_team_stat->>'GOL')::int, 0),
      COALESCE((p_away_team_stat->>'TIRI_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'TIRI_IN')::int, 0),
      COALESCE((p_away_team_stat->>'CANGL')::int, 0),
      COALESCE((p_away_team_stat->>'FALLI')::int, 0),
      COALESCE((p_away_team_stat->>'RIGORI')::int, 0),
      COALESCE((p_away_team_stat->>'FUORIGIOCO')::int, 0),
      COALESCE((p_away_team_stat->>'POSSESSO')::numeric, 0.5),
      COALESCE((p_away_team_stat->>'PASS_SI')::int, 0),
      COALESCE((p_away_team_stat->>'PASS_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'CTRS_SI')::int, 0),
      COALESCE((p_away_team_stat->>'CTRS_TOT')::int, 0),
      COALESCE((p_away_team_stat->>'PARA')::int, 0)
    )
    ON CONFLICT ("STAG", "WEEK", "ID") DO UPDATE SET
      "MODULO" = EXCLUDED."MODULO",
      "STILE" = EXCLUDED."STILE",
      "GOL" = EXCLUDED."GOL",
      "TIRI_TOT" = EXCLUDED."TIRI_TOT",
      "TIRI_IN" = EXCLUDED."TIRI_IN",
      "CANGL" = EXCLUDED."CANGL",
      "FALLI" = EXCLUDED."FALLI",
      "RIGORI" = EXCLUDED."RIGORI",
      "FUORIGIOCO" = EXCLUDED."FUORIGIOCO",
      "POSSESSO" = EXCLUDED."POSSESSO",
      "PASS_SI" = EXCLUDED."PASS_SI",
      "PASS_TOT" = EXCLUDED."PASS_TOT",
      "CTRS_SI" = EXCLUDED."CTRS_SI",
      "CTRS_TOT" = EXCLUDED."CTRS_TOT",
      "PARA" = EXCLUDED."PARA";
  END IF;

  -- D. Inserimento statistiche calciatori
  IF p_player_stats IS NOT NULL AND jsonb_typeof(p_player_stats) = 'array' THEN
    FOR v_p IN SELECT * FROM jsonb_array_elements(p_player_stats)
    LOOP
      INSERT INTO public.as_player_stat (
        "STAG", "WEEK", "ID", "VOTO", "MINUTI",
        "GOL", "AGOL", "ASST", "TIRI_IN", "TIRI_TOT",
        "PASS_SI", "PASS_TOT", "DRIB_SI", "DRIB_TOT",
        "CROS_SI", "CROS_TOT", "CTRS_SI", "CTRS_TOT",
        "FALLI", "PARA", "GSUB", "GIALLI", "ROSSI", "FGIOCO"
      ) VALUES (
        p_stag, p_week, (v_p->>'ID')::bigint,
        COALESCE((v_p->>'VOTO')::numeric, 6.0),
        COALESCE((v_p->>'MINUTI')::int, 90),
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
        COALESCE((v_p->>'FGIOCO')::int, 0)
      )
      ON CONFLICT ("STAG", "WEEK", "ID") DO UPDATE SET
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
        "FGIOCO" = EXCLUDED."FGIOCO";
      v_player_count := v_player_count + 1;
    END LOOP;
  END IF;

  -- E. Ricalcolo classifica se la partita è già sbloccata
  IF v_unlock_at <= NOW() THEN
    PERFORM public.refresh_standings_for_season(p_stag);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Referto di gara salvato con successo',
    'unlock_at', v_unlock_at,
    'is_neutral', COALESCE(p_is_neutral, false),
    'player_stats_inserted', v_player_count
  );
END;
$function$;
