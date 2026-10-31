-- ==============================================================================
-- Migrazione: 20261031_rename_stats_tables_to_lowercase.sql
-- Descrizione: Rinomina le tabelle e viste delle statistiche in lowercase per consistenza:
--              1. AS_TEAM_STAT -> as_team_stat
--              2. AS_PLAYER_STAT -> as_player_stat
--              3. VIEW_PLAYER_STATS -> view_player_stats
--              Aggiorna viste e funzioni collegate e crea viste alias per backward compatibility.
-- ==============================================================================

-- 1. RINOMINA TABELLE E VISTE
ALTER TABLE IF EXISTS public."AS_TEAM_STAT" RENAME TO as_team_stat;
ALTER TABLE IF EXISTS public."AS_PLAYER_STAT" RENAME TO as_player_stat;
ALTER VIEW IF EXISTS public."VIEW_PLAYER_STATS" RENAME TO view_player_stats;

-- 2. AGGIORNAMENTO DEFINIZIONE VISTA view_team_stats
CREATE OR REPLACE VIEW public.view_team_stats AS
SELECT
  s.home,
  s.away,
  s.stag,
  s.week,
  htm."NAME" AS home_team,
  hst."ALLENATORE" AS home_allenatore,
  hst."VOTO" AS home_voto,
  hst."MINUTI" AS home_minuti,
  hst."GOL" AS home_gol,
  hst."AGOL" AS home_autogol,
  hst."ASST" AS home_assist,
  hst."TIRI_SI" AS home_tiri_si,
  hst."TIRI_TOT" AS home_tiri_tot,
  hst."PASS_SI" AS home_pass_si,
  hst."PASS_TOT" AS home_pass_tot,
  hst."DRIB_SI" AS home_drib_si,
  hst."DRIB_TOT" AS home_drib_tot,
  hst."CROS_SI" AS home_cros_si,
  hst."CROS_TOT" AS home_cros_tot,
  hst."CTRS_SI" AS home_ctrs_si,
  hst."CTRS_TOT" AS home_ctrs_tot,
  hst."FALLI" AS home_falli,
  hst."PARA" AS home_para,
  hst."GSUB" AS home_gsub,
  hst."GIALLI" AS home_gialli,
  hst."ROSSI" AS home_rossi,
  hst."FGIOCO" AS home_fgioco,
  hst."POSS" AS home_poss,
  hst."CANGL" AS home_cangl,
  atm."NAME" AS away_team,
  ast."ALLENATORE" AS away_allenatore,
  ast."VOTO" AS away_voto,
  ast."MINUTI" AS away_minuti,
  ast."GOL" AS away_gol,
  ast."AGOL" AS away_autogol,
  ast."ASST" AS away_assist,
  ast."TIRI_SI" AS away_tiri_si,
  ast."TIRI_TOT" AS away_tiri_tot,
  ast."PASS_SI" AS away_pass_si,
  ast."PASS_TOT" AS away_pass_tot,
  ast."DRIB_SI" AS away_drib_si,
  ast."DRIB_TOT" AS away_drib_tot,
  ast."CROS_SI" AS away_cros_si,
  ast."CROS_TOT" AS away_cros_tot,
  ast."CTRS_SI" AS away_ctrs_si,
  ast."CTRS_TOT" AS away_ctrs_tot,
  ast."FALLI" AS away_falli,
  ast."PARA" AS away_para,
  ast."GSUB" AS away_gsub,
  ast."GIALLI" AS away_gialli,
  ast."ROSSI" AS away_rossi,
  ast."FGIOCO" AS away_fgioco,
  ast."POSS" AS away_poss,
  ast."CANGL" AS away_cangl,
  s.match_time,
  s.unlock_at,
  hst."TEMPOREC" AS home_temporec,
  hst."xG" AS home_xg,
  hst."INTERC" AS home_interc,
  hst."TAGLI" AS home_tagli,
  hst."AGGIR" AS home_aggir,
  hst."SCAVAL" AS home_scaval,
  hst."INCURS" AS home_incurs,
  hst."EXTRA_STATS" AS home_extra_stats,
  ast."TEMPOREC" AS away_temporec,
  ast."xG" AS away_xg,
  ast."INTERC" AS away_interc,
  ast."TAGLI" AS away_tagli,
  ast."AGGIR" AS away_aggir,
  ast."SCAVAL" AS away_scaval,
  ast."INCURS" AS away_incurs,
  ast."EXTRA_STATS" AS away_extra_stats
FROM public.an_schedule s
LEFT JOIN public.as_team_stat hst ON s.home = hst."ID" AND s.stag = hst."STAG" AND s.week = hst."WEEK" AND (s.unlock_at IS NULL OR s.unlock_at <= now())
LEFT JOIN public.as_team_stat ast ON s.away = ast."ID" AND s.stag = ast."STAG" AND s.week = ast."WEEK" AND (s.unlock_at IS NULL OR s.unlock_at <= now())
LEFT JOIN public.an_team htm ON s.home = htm."TEAM_ID"
LEFT JOIN public.an_team atm ON s.away = atm."TEAM_ID";

-- 3. AGGIORNAMENTO DEFINIZIONE VISTA view_player_stats
CREATE OR REPLACE VIEW public.view_player_stats AS
SELECT
  s."Nome",
  s."Cognome",
  s."Posiz",
  COALESCE(t."TEAM_ID", s."Squadra") AS "Squadra",
  s."OVR",
  s."Età",
  s."Altezza",
  s."Peso",
  t."STAG",
  t."WEEK",
  t."ID",
  t."VOTO",
  t."MINUTI",
  t."GOL",
  t."AGOL",
  t."ASST",
  t."TIRI_IN",
  t."TIRI_TOT",
  t."PASS_SI",
  t."PASS_TOT",
  t."DRIB_SI",
  t."DRIB_TOT",
  t."CROS_SI",
  t."CROS_TOT",
  t."CTRS_SI",
  t."CTRS_TOT",
  t."FALLI",
  t."PARA",
  t."GSUB",
  t."GIALLI",
  t."ROSSI",
  t."FGIOCO",
  s."NumeroMaglia",
  t."TEAM_ID",
  t."POS_GIOCATA",
  t."SUB",
  t."MOTM",
  t."POSS_VINTI",
  t."PALLE_PERSE",
  t."DIST_TOT",
  t."DIST_SCATTO",
  t."EXTRA_STATS"
FROM public.an_player s
LEFT JOIN public.as_player_stat t ON s."ID" = t."ID"
  AND NOT (
    EXISTS (
      SELECT 1
      FROM public.an_schedule sch
      WHERE sch.stag = t."STAG"
        AND sch.week = t."WEEK"
        AND (sch.home = COALESCE(t."TEAM_ID", s."Squadra") OR sch.away = COALESCE(t."TEAM_ID", s."Squadra"))
        AND sch.unlock_at IS NOT NULL
        AND sch.unlock_at > now()
    )
  );

-- 4. AGGIORNAMENTO FUNZIONI POSTGRES

-- 4a. player_stats_avg_by_season
CREATE OR REPLACE FUNCTION public.player_stats_avg_by_season(p_stag smallint)
RETURNS TABLE(
  "ID" bigint,
  matches_played bigint,
  avg_voto double precision,
  avg_minuti double precision,
  avg_gol double precision,
  avg_agol double precision,
  avg_asst double precision,
  avg_tiri_in double precision,
  avg_tiri_tot double precision,
  avg_pass_si double precision,
  avg_pass_tot double precision,
  avg_drib_si double precision,
  avg_drib_tot double precision,
  avg_cros_si double precision,
  avg_cros_tot double precision,
  avg_ctrs_si double precision,
  avg_ctrs_tot double precision,
  avg_falli double precision,
  avg_para double precision,
  avg_gsub double precision,
  avg_gialli double precision,
  avg_rossi double precision,
  avg_fgioco double precision
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    "ID",
    COUNT(*)::bigint AS matches_played,
    AVG("VOTO")::double precision,
    AVG("MINUTI")::double precision,
    AVG("GOL")::double precision,
    AVG("AGOL")::double precision,
    AVG("ASST")::double precision,
    AVG("TIRI_IN")::double precision,
    AVG("TIRI_TOT")::double precision,
    AVG("PASS_SI")::double precision,
    AVG("PASS_TOT")::double precision,
    AVG("DRIB_SI")::double precision,
    AVG("DRIB_TOT")::double precision,
    AVG("CROS_SI")::double precision,
    AVG("CROS_TOT")::double precision,
    AVG("CTRS_SI")::double precision,
    AVG("CTRS_TOT")::double precision,
    AVG("FALLI")::double precision,
    AVG("PARA")::double precision,
    AVG("GSUB")::double precision,
    AVG("GIALLI")::double precision,
    AVG("ROSSI")::double precision,
    AVG("FGIOCO")::double precision
  FROM public.view_player_stats
  WHERE "STAG" = p_stag AND view_player_stats."MINUTI" > 0
  GROUP BY "ID"
  ORDER BY "ID";
$function$;

-- 4b. player_stats_sum_by_season
CREATE OR REPLACE FUNCTION public.player_stats_sum_by_season(p_stag smallint)
RETURNS TABLE(
  "ID" bigint,
  matches_played bigint,
  sum_voto double precision,
  sum_minuti double precision,
  sum_gol double precision,
  sum_agol double precision,
  sum_asst double precision,
  sum_tiri_in double precision,
  sum_tiri_tot double precision,
  sum_pass_si double precision,
  sum_pass_tot double precision,
  sum_drib_si double precision,
  sum_drib_tot double precision,
  sum_cros_si double precision,
  sum_cros_tot double precision,
  sum_ctrs_si double precision,
  sum_ctrs_tot double precision,
  sum_falli double precision,
  sum_para double precision,
  sum_gsub double precision,
  sum_gialli double precision,
  sum_rossi double precision,
  sum_fgioco double precision
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    "ID",
    COUNT(*)::bigint AS matches_played,
    SUM("VOTO")::double precision,
    SUM("MINUTI")::double precision,
    SUM("GOL")::double precision,
    SUM("AGOL")::double precision,
    SUM("ASST")::double precision,
    SUM("TIRI_IN")::double precision,
    SUM("TIRI_TOT")::double precision,
    SUM("PASS_SI")::double precision,
    SUM("PASS_TOT")::double precision,
    SUM("DRIB_SI")::double precision,
    SUM("DRIB_TOT")::double precision,
    SUM("CROS_SI")::double precision,
    SUM("CROS_TOT")::double precision,
    SUM("CTRS_SI")::double precision,
    SUM("CTRS_TOT")::double precision,
    SUM("FALLI")::double precision,
    SUM("PARA")::double precision,
    SUM("GSUB")::double precision,
    SUM("GIALLI")::double precision,
    SUM("ROSSI")::double precision,
    SUM("FGIOCO")::double precision
  FROM public.view_player_stats
  WHERE "STAG" = p_stag AND view_player_stats."MINUTI" > 0
  GROUP BY "ID"
  ORDER BY "ID";
$function$;

-- 4c. update_standings_on_schedule_insert
CREATE OR REPLACE FUNCTION public.update_standings_on_schedule_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  home_goals integer := 0;
  away_goals integer := 0;
BEGIN
  SELECT COALESCE("GOL", 0) INTO home_goals
  FROM public.as_team_stat
  WHERE "STAG" = NEW."STAG" AND "WEEK" = NEW."WEEK" AND "ID" = NEW."ID"
  LIMIT 1;

  SELECT COALESCE("GOL", 0) INTO away_goals
  FROM public.as_team_stat
  WHERE "STAG" = NEW."STAG" AND "WEEK" = NEW."WEEK" AND "ID" = NEW."ID"
  LIMIT 1;

  PERFORM public.update_standings_single(NEW.stag, NEW.home, home_goals, away_goals, true);
  PERFORM public.update_standings_single(NEW.stag, NEW.away, away_goals, home_goals, false);

  RETURN NEW;
END;
$function$;

-- 4d. update_standings_on_team_stat_change
CREATE OR REPLACE FUNCTION public.update_standings_on_team_stat_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_stag integer := NEW."STAG";
  v_week integer := NEW."WEEK";
  v_team_id text := NEW."ID";
  v_home text;
  v_away text;
  v_home_goals integer;
  v_away_goals integer;
BEGIN
  SELECT home, away INTO v_home, v_away
  FROM public.an_schedule
  WHERE stag = v_stag AND week = v_week AND standings_processed = false
    AND (home = v_team_id OR away = v_team_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE("GOL", 0) INTO v_home_goals
  FROM public.as_team_stat
  WHERE "STAG" = v_stag AND "WEEK" = v_week AND "ID" = v_home
  LIMIT 1;

  SELECT COALESCE("GOL", 0) INTO v_away_goals
  FROM public.as_team_stat
  WHERE "STAG" = v_stag AND "WEEK" = v_week AND "ID" = v_away
  LIMIT 1;

  IF v_home_goals IS NULL OR v_away_goals IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.update_standings_single(v_stag, v_home, v_home_goals, v_away_goals, true);
  PERFORM public.update_standings_single(v_stag, v_away, v_away_goals, v_home_goals, false);

  UPDATE public.an_schedule
  SET standings_processed = true
  WHERE stag = v_stag AND week = v_week AND home = v_home AND away = v_away;

  RETURN NEW;
END;
$function$;

-- 4e. sync_unlocked_standings
CREATE OR REPLACE FUNCTION public.sync_unlocked_standings(p_stag integer DEFAULT NULL::integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_r RECORD;
  v_count INT := 0;
BEGIN
  FOR v_r IN
    SELECT s.stag, s.week, s.home, s.away
    FROM public.an_schedule s
    WHERE (p_stag IS NULL OR s.stag = p_stag)
      AND s.standings_processed = false
      AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
      AND EXISTS (SELECT 1 FROM public.as_team_stat WHERE "STAG" = s.stag AND "WEEK" = s.week AND "ID" = s.home)
      AND EXISTS (SELECT 1 FROM public.as_team_stat WHERE "STAG" = s.stag AND "WEEK" = s.week AND "ID" = s.away)
    ORDER BY s.stag ASC, s.week ASC
  LOOP
    PERFORM public.apply_match_to_standings(v_r.stag, v_r.week, v_r.home, v_r.away);
    v_count := v_count + 1;
  END LOOP;

  RETURN TRUE;
END;
$function$;

-- 4f. rpc_admin_save_match_report
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
  p_admin_name text DEFAULT 'Super Admin'::text
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
    stag, week, home, away, stadium, referee, weather, date, match_time, unlock_at, standings_processed
  ) VALUES (
    p_stag, p_week, p_home, p_away,
    COALESCE(p_stadium, 'Stadio Ufficiale'),
    COALESCE(p_referee, 'Arbitro Federale'),
    COALESCE(p_weather, 'Sereno'),
    v_date,
    v_time,
    v_unlock_at,
    false
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
    'is_unlocked_now', (v_unlock_at IS NULL OR v_unlock_at <= NOW())
  );
END;
$function$;

-- 5. CREAZIONE VISTE DI COMPATIBILITÀ (ALIAS UPPERCASE)
CREATE OR REPLACE VIEW public."AS_TEAM_STAT" AS SELECT * FROM public.as_team_stat;
CREATE OR REPLACE VIEW public."AS_PLAYER_STAT" AS SELECT * FROM public.as_player_stat;
CREATE OR REPLACE VIEW public."VIEW_PLAYER_STATS" AS SELECT * FROM public.view_player_stats;

-- 6. PERMESSI DI ACCESSO
GRANT SELECT, INSERT, UPDATE, DELETE ON public.as_team_stat TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.as_player_stat TO anon, authenticated, service_role;
GRANT SELECT ON public.view_team_stats TO anon, authenticated, service_role;
GRANT SELECT ON public.view_player_stats TO anon, authenticated, service_role;
GRANT SELECT ON public."AS_TEAM_STAT" TO anon, authenticated, service_role;
GRANT SELECT ON public."AS_PLAYER_STAT" TO anon, authenticated, service_role;
GRANT SELECT ON public."VIEW_PLAYER_STATS" TO anon, authenticated, service_role;
