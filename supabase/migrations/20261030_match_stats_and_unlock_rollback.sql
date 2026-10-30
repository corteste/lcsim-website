-- ==============================================================================
-- Rollback: 20261030_match_stats_and_unlock_rollback.sql
-- Descrizione: Ripristina viste, funzioni e tabelle allo stato precedente alla
--              migrazione `20261030_match_stats_and_unlock.sql`.
-- ==============================================================================

-- 1. Rimozione RPC e funzioni introdotte
DROP FUNCTION IF EXISTS public.rpc_admin_set_match_schedule(INTEGER, INTEGER, TEXT, TEXT, DATE, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_admin_save_match_report(INTEGER, INTEGER, TEXT, TEXT, DATE, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.sync_unlocked_standings(INTEGER);

-- 2. Ripristino vista public.view_team_stats originale
DROP VIEW IF EXISTS public.view_team_stats;
CREATE VIEW public.view_team_stats AS
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
  ast."CANGL" AS away_cangl
FROM public.an_schedule s
LEFT JOIN public."AS_TEAM_STAT" hst ON s.home = hst."ID" AND s.stag = hst."STAG" AND s.week = hst."WEEK"
LEFT JOIN public."AS_TEAM_STAT" ast ON s.away = ast."ID" AND s.stag = ast."STAG" AND s.week = ast."WEEK"
LEFT JOIN public.an_team htm ON s.home = htm."TEAM_ID"
LEFT JOIN public.an_team atm ON s.away = atm."TEAM_ID";

-- 3. Ripristino vista public."VIEW_PLAYER_STATS" originale (e relative funzioni dipendenti)
DROP VIEW IF EXISTS public."VIEW_PLAYER_STATS" CASCADE;
CREATE VIEW public."VIEW_PLAYER_STATS" AS
SELECT
  s."Nome",
  s."Cognome",
  s."Posiz",
  s."Squadra",
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
  s."NumeroMaglia"
FROM public.an_player s
LEFT JOIN public."AS_PLAYER_STAT" t ON s."ID" = t."ID";

-- Ricrea funzioni statistiche stagionali ove droppate da CASCADE
CREATE OR REPLACE FUNCTION public.player_stats_avg_by_season(p_stag smallint)
 RETURNS TABLE("ID" bigint, matches_played bigint, avg_voto double precision, avg_minuti double precision, avg_gol double precision, avg_agol double precision, avg_asst double precision, avg_tiri_in double precision, avg_tiri_tot double precision, avg_pass_si double precision, avg_pass_tot double precision, avg_drib_si double precision, avg_drib_tot double precision, avg_cros_si double precision, avg_cros_tot double precision, avg_ctrs_si double precision, avg_ctrs_tot double precision, avg_falli double precision, avg_para double precision, avg_gsub double precision, avg_gialli double precision, avg_rossi double precision, avg_fgioco double precision)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    "ID", COUNT(*)::bigint AS matches_played,
    AVG("VOTO")::double precision, AVG("MINUTI")::double precision, AVG("GOL")::double precision,
    AVG("AGOL")::double precision, AVG("ASST")::double precision, AVG("TIRI_IN")::double precision,
    AVG("TIRI_TOT")::double precision, AVG("PASS_SI")::double precision, AVG("PASS_TOT")::double precision,
    AVG("DRIB_SI")::double precision, AVG("DRIB_TOT")::double precision, AVG("CROS_SI")::double precision,
    AVG("CROS_TOT")::double precision, AVG("CTRS_SI")::double precision, AVG("CTRS_TOT")::double precision,
    AVG("FALLI")::double precision, AVG("PARA")::double precision, AVG("GSUB")::double precision,
    AVG("GIALLI")::double precision, AVG("ROSSI")::double precision, AVG("FGIOCO")::double precision
  FROM public."VIEW_PLAYER_STATS"
  WHERE "STAG" = p_stag AND "VIEW_PLAYER_STATS"."MINUTI" > 0
  GROUP BY "ID"
  ORDER BY "ID";
$function$;

CREATE OR REPLACE FUNCTION public.player_stats_sum_by_season(p_stag smallint)
 RETURNS TABLE("ID" bigint, matches_played bigint, sum_voto double precision, sum_minuti double precision, sum_gol double precision, sum_agol double precision, sum_asst double precision, sum_tiri_in double precision, sum_tiri_tot double precision, sum_pass_si double precision, sum_pass_tot double precision, sum_drib_si double precision, sum_drib_tot double precision, sum_cros_si double precision, sum_cros_tot double precision, sum_ctrs_si double precision, sum_ctrs_tot double precision, sum_falli double precision, sum_para double precision, sum_gsub double precision, sum_gialli double precision, sum_rossi double precision, sum_fgioco double precision)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    "ID", COUNT(*)::bigint AS matches_played,
    SUM("VOTO")::double precision, SUM("MINUTI")::double precision, SUM("GOL")::double precision,
    SUM("AGOL")::double precision, SUM("ASST")::double precision, SUM("TIRI_IN")::double precision,
    SUM("TIRI_TOT")::double precision, SUM("PASS_SI")::double precision, SUM("PASS_TOT")::double precision,
    SUM("DRIB_SI")::double precision, SUM("DRIB_TOT")::double precision, SUM("CROS_SI")::double precision,
    SUM("CROS_TOT")::double precision, SUM("CTRS_SI")::double precision, SUM("CTRS_TOT")::double precision,
    SUM("FALLI")::double precision, SUM("PARA")::double precision, SUM("GSUB")::double precision,
    SUM("GIALLI")::double precision, SUM("ROSSI")::double precision, SUM("FGIOCO")::double precision
  FROM public."VIEW_PLAYER_STATS"
  WHERE "STAG" = p_stag AND "VIEW_PLAYER_STATS"."MINUTI" > 0
  GROUP BY "ID"
  ORDER BY "ID";
$function$;

-- 4. Rimozione trigger e colonne aggiunte
DROP TRIGGER IF EXISTS trg_an_schedule_set_unlock_at ON public.an_schedule;
DROP FUNCTION IF EXISTS public.fn_sync_schedule_unlock_at();
DROP FUNCTION IF EXISTS public.compute_match_unlock_at(DATE, TEXT);
DROP INDEX IF EXISTS public.idx_an_schedule_stag_week_unlock;

ALTER TABLE public.an_schedule
  DROP COLUMN IF EXISTS match_time,
  DROP COLUMN IF EXISTS unlock_at;

ALTER TABLE public."AS_TEAM_STAT"
  DROP COLUMN IF EXISTS "EXTRA_STATS";

DROP INDEX IF EXISTS public.idx_as_player_stat_stag_week_team;

ALTER TABLE public."AS_PLAYER_STAT"
  DROP COLUMN IF EXISTS "TEAM_ID",
  DROP COLUMN IF EXISTS "POS_GIOCATA",
  DROP COLUMN IF EXISTS "SUB",
  DROP COLUMN IF EXISTS "MOTM",
  DROP COLUMN IF EXISTS "POSS_VINTI",
  DROP COLUMN IF EXISTS "PALLE_PERSE",
  DROP COLUMN IF EXISTS "DIST_TOT",
  DROP COLUMN IF EXISTS "DIST_SCATTO",
  DROP COLUMN IF EXISTS "EXTRA_STATS";
