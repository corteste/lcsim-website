-- ==============================================================================
-- Migrazione: 20261030_match_stats_and_unlock.sql
-- Descrizione:
--   1. Aggiunta orario partita (`match_time`) e timestamp di sblocco automatico
--      (`unlock_at` = inizio partita + 45 minuti) su `public.an_schedule`.
--   2. Aggiunta colonne statistiche avanzate su `public."AS_TEAM_STAT"` (`EXTRA_STATS`)
--      e `public."AS_PLAYER_STAT"` (`TEAM_ID`, `POS_GIOCATA`, `SUB`, `MOTM`,
--      `POSS_VINTI`, `PALLE_PERSE`, `DIST_TOT`, `DIST_SCATTO`, `EXTRA_STATS`).
--   3. Aggiornamento viste `view_team_stats` e `"VIEW_PLAYER_STATS"` e funzione
--      `refresh_standings_for_season` per nascondere automaticamente risultati,
--      statistiche e punti classifica fino a `unlock_at` (+45 min dall'inizio gara).
--   4. Creazione RPC `SECURITY DEFINER` per salvataggio atomico referto partita
--      (`rpc_admin_save_match_report`), gestione orari/sblocco (`rpc_admin_set_match_schedule`)
--      e sincronizzazione classifica allo scadere dell'embargo (`sync_unlocked_standings`).
-- ==============================================================================

-- 1. FUNZIONE HELPER CALCOLO UNLOCK_AT (Data + Ora in Europe/Rome + 45 minuti)
CREATE OR REPLACE FUNCTION public.compute_match_unlock_at(
  p_date DATE,
  p_time TEXT DEFAULT '21:00'
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_clean_time TEXT;
  v_ts TIMESTAMP;
BEGIN
  IF p_date IS NULL THEN
    RETURN NULL;
  END IF;

  v_clean_time := COALESCE(NULLIF(TRIM(p_time), ''), '21:00');
  IF v_clean_time !~ '^\d{1,2}:\d{2}(:\d{2})?$' THEN
    v_clean_time := '21:00';
  END IF;

  v_ts := (p_date::TEXT || ' ' || v_clean_time)::TIMESTAMP;
  RETURN (v_ts AT TIME ZONE 'Europe/Rome') + INTERVAL '45 minutes';
END;
$$;

-- 2. ESTENSIONE TABELLA public.an_schedule
ALTER TABLE public.an_schedule
  ADD COLUMN IF NOT EXISTS match_time TEXT NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ NULL;

-- Backfill per le partite già presenti a calendario
UPDATE public.an_schedule
SET
  match_time = COALESCE(NULLIF(TRIM(match_time), ''), '21:00'),
  unlock_at = public.compute_match_unlock_at(date, COALESCE(NULLIF(TRIM(match_time), ''), '21:00'))
WHERE unlock_at IS NULL AND date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_an_schedule_stag_week_unlock
  ON public.an_schedule(stag, week, unlock_at);

-- Trigger per mantenere unlock_at sincronizzato quando cambiano date o match_time
CREATE OR REPLACE FUNCTION public.fn_sync_schedule_unlock_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.match_time IS NULL OR TRIM(NEW.match_time) = '' THEN
    NEW.match_time := '21:00';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.unlock_at IS NULL AND NEW.date IS NOT NULL THEN
      NEW.unlock_at := public.compute_match_unlock_at(NEW.date, NEW.match_time);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.date IS DISTINCT FROM OLD.date OR NEW.match_time IS DISTINCT FROM OLD.match_time)
       AND (NEW.unlock_at IS NOT DISTINCT FROM OLD.unlock_at) THEN
      NEW.unlock_at := public.compute_match_unlock_at(NEW.date, NEW.match_time);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_an_schedule_set_unlock_at ON public.an_schedule;
CREATE TRIGGER trg_an_schedule_set_unlock_at
  BEFORE INSERT OR UPDATE ON public.an_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_schedule_unlock_at();

-- 3. ESTENSIONE TABELLA public."AS_TEAM_STAT"
ALTER TABLE public."AS_TEAM_STAT"
  ADD COLUMN IF NOT EXISTS "EXTRA_STATS" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 4. ESTENSIONE TABELLA public."AS_PLAYER_STAT"
ALTER TABLE public."AS_PLAYER_STAT"
  ADD COLUMN IF NOT EXISTS "TEAM_ID" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "POS_GIOCATA" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "SUB" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "MOTM" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "POSS_VINTI" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "PALLE_PERSE" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "DIST_TOT" REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "DIST_SCATTO" REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "EXTRA_STATS" JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_as_player_stat_stag_week_team
  ON public."AS_PLAYER_STAT"("STAG", "WEEK", "TEAM_ID");

-- 5. AGGIORNAMENTO VISTA public.view_team_stats (rispetta embargo unlock_at <= NOW())
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
LEFT JOIN public."AS_TEAM_STAT" hst
  ON s.home = hst."ID"
 AND s.stag = hst."STAG"
 AND s.week = hst."WEEK"
 AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
LEFT JOIN public."AS_TEAM_STAT" ast
  ON s.away = ast."ID"
 AND s.stag = ast."STAG"
 AND s.week = ast."WEEK"
 AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
LEFT JOIN public.an_team htm ON s.home = htm."TEAM_ID"
LEFT JOIN public.an_team atm ON s.away = atm."TEAM_ID";

-- 6. AGGIORNAMENTO VISTA public."VIEW_PLAYER_STATS" (rispetta embargo unlock_at <= NOW())
CREATE OR REPLACE VIEW public."VIEW_PLAYER_STATS" AS
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
LEFT JOIN public."AS_PLAYER_STAT" t
  ON s."ID" = t."ID"
 AND NOT EXISTS (
   SELECT 1
   FROM public.an_schedule sch
   WHERE sch.stag = t."STAG"
     AND sch.week = t."WEEK"
     AND (sch.home = COALESCE(t."TEAM_ID", s."Squadra") OR sch.away = COALESCE(t."TEAM_ID", s."Squadra"))
     AND sch.unlock_at IS NOT NULL
     AND sch.unlock_at > NOW()
 );

-- 7. AGGIORNAMENTO refresh_standings_for_season (considera solo partite con unlock_at <= NOW())
CREATE OR REPLACE FUNCTION public.refresh_standings_for_season(p_stag integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH match_pairs AS (
    SELECT
      s.stag, s.week, s.home, s.away,
      h."GOL" AS home_goals, a."GOL" AS away_goals
    FROM public.an_schedule s
    JOIN public."AS_TEAM_STAT" h ON h."STAG" = s.stag AND h."WEEK" = s.week AND h."ID" = s.home
    JOIN public."AS_TEAM_STAT" a ON a."STAG" = s.stag AND a."WEEK" = s.week AND a."ID" = s.away
    WHERE s.stag = p_stag
      AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
  ),
  team_matches AS (
    SELECT
      stag, home AS team, 1 AS played_at_home,
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
$$;

CREATE OR REPLACE FUNCTION public.refresh_standings_for_season(p_stag bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.refresh_standings_for_season(p_stag::integer);
END;
$$;

-- 8. RPC PUBBLICA DI AUTO-ALLINEAMENTO CLASSIFICA POST-EMBARGO
CREATE OR REPLACE FUNCTION public.sync_unlocked_standings(p_stag integer DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stag integer;
  v_updated boolean := false;
BEGIN
  FOR v_stag IN
    SELECT DISTINCT s.stag
    FROM public.an_schedule s
    WHERE (p_stag IS NULL OR s.stag = p_stag)
      AND s.standings_processed = false
      AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
      AND EXISTS (SELECT 1 FROM public."AS_TEAM_STAT" h WHERE h."STAG" = s.stag AND h."WEEK" = s.week AND h."ID" = s.home)
      AND EXISTS (SELECT 1 FROM public."AS_TEAM_STAT" a WHERE a."STAG" = s.stag AND a."WEEK" = s.week AND a."ID" = s.away)
  LOOP
    PERFORM public.refresh_standings_for_season(v_stag);
    v_updated := true;
  END LOOP;

  RETURN v_updated;
END;
$$;

-- 9. RPC ADMIN: SALVATAGGIO ATOMICO REFERTO PARTITA (Screenshot / Manuale / CSV)
CREATE OR REPLACE FUNCTION public.rpc_admin_save_match_report(
  p_stag INTEGER,
  p_week INTEGER,
  p_home TEXT,
  p_away TEXT,
  p_match_date DATE DEFAULT NULL,
  p_match_time TEXT DEFAULT '21:00',
  p_custom_unlock_at TIMESTAMPTZ DEFAULT NULL,
  p_stadium TEXT DEFAULT NULL,
  p_referee TEXT DEFAULT NULL,
  p_weather TEXT DEFAULT NULL,
  p_home_team_stat JSONB DEFAULT '{}'::jsonb,
  p_away_team_stat JSONB DEFAULT '{}'::jsonb,
  p_player_stats JSONB DEFAULT '[]'::jsonb,
  p_admin_name TEXT DEFAULT 'Super Admin'
)
RETURNS JSONB
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

  -- Rilegge l'unlock_at effettivo salvato
  SELECT unlock_at INTO v_unlock_at
  FROM public.an_schedule
  WHERE stag = p_stag AND week = p_week AND home = p_home AND away = p_away;

  -- B. Upsert statistiche squadra CASA in "AS_TEAM_STAT"
  IF p_home_team_stat IS NOT NULL AND p_home_team_stat != '{}'::jsonb THEN
    INSERT INTO public."AS_TEAM_STAT" (
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

  -- C. Upsert statistiche squadra TRASFERTA in "AS_TEAM_STAT"
  IF p_away_team_stat IS NOT NULL AND p_away_team_stat != '{}'::jsonb THEN
    INSERT INTO public."AS_TEAM_STAT" (
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

  -- D. Pulizia e inserimento statistiche calciatori ("AS_PLAYER_STAT") per questo match
  DELETE FROM public."AS_PLAYER_STAT" ps
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
        INSERT INTO public."AS_PLAYER_STAT" (
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
$$;

-- 10. RPC ADMIN: AGGIORNAMENTO DATA/ORA PARTITA O SBLOCCO IMMEDIATO
CREATE OR REPLACE FUNCTION public.rpc_admin_set_match_schedule(
  p_stag INTEGER,
  p_week INTEGER,
  p_home TEXT,
  p_away TEXT,
  p_match_date DATE,
  p_match_time TEXT,
  p_force_unlock_now BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unlock_at TIMESTAMPTZ;
BEGIN
  IF p_force_unlock_now THEN
    v_unlock_at := NOW() - INTERVAL '1 minute';
  ELSE
    v_unlock_at := public.compute_match_unlock_at(p_match_date, p_match_time);
  END IF;

  UPDATE public.an_schedule
  SET
    date = COALESCE(p_match_date, date),
    match_time = COALESCE(NULLIF(TRIM(p_match_time), ''), match_time, '21:00'),
    unlock_at = v_unlock_at
  WHERE stag = p_stag AND week = p_week AND home = p_home AND away = p_away;

  PERFORM public.refresh_standings_for_season(p_stag);

  RETURN jsonb_build_object(
    'success', true,
    'unlock_at', v_unlock_at,
    'is_unlocked_now', (v_unlock_at <= NOW())
  );
END;
$$;
