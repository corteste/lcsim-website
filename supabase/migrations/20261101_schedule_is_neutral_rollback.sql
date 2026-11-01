-- ============================================================================
-- Rollback Migrazione: Supporto Partite su Campo Neutro
-- Data: 2026-11-01
-- ============================================================================

-- 1. Rimozione colonna is_neutral
ALTER TABLE public.an_schedule
DROP COLUMN IF EXISTS is_neutral;

-- 2. Ripristino funzione refresh_standings_for_season
CREATE OR REPLACE FUNCTION public.refresh_standings_for_season(p_stag integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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

  UPDATE public.an_schedule s
  SET standings_processed = true
  WHERE s.stag = p_stag
    AND standings_processed = false
    AND (s.unlock_at IS NULL OR s.unlock_at <= NOW())
    AND EXISTS (SELECT 1 FROM public."AS_TEAM_STAT" WHERE "STAG" = s.stag AND "WEEK" = s.week AND "ID" = s.home)
    AND EXISTS (SELECT 1 FROM public."AS_TEAM_STAT" WHERE "STAG" = s.stag AND "WEEK" = s.week AND "ID" = s.away);

  UPDATE public.an_schedule s
  SET standings_processed = false
  WHERE s.stag = p_stag
    AND standings_processed = true
    AND s.unlock_at IS NOT NULL
    AND s.unlock_at > NOW();
END;
$function$;
