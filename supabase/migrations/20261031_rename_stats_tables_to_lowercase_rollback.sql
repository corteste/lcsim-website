-- ==============================================================================
-- Rollback: 20261031_rename_stats_tables_to_lowercase_rollback.sql
-- Descrizione: Ripristina i nomi maiuscoli originali per AS_TEAM_STAT, AS_PLAYER_STAT, VIEW_PLAYER_STATS.
-- ==============================================================================

-- 1. RIMOZIONE VISTE ALIAS
DROP VIEW IF EXISTS public."VIEW_PLAYER_STATS" CASCADE;
DROP VIEW IF EXISTS public."AS_PLAYER_STAT" CASCADE;
DROP VIEW IF EXISTS public."AS_TEAM_STAT" CASCADE;

-- 2. RIPRISTINO NOMI MAIUSCOLI
ALTER TABLE IF EXISTS public.as_team_stat RENAME TO "AS_TEAM_STAT";
ALTER TABLE IF EXISTS public.as_player_stat RENAME TO "AS_PLAYER_STAT";
ALTER VIEW IF EXISTS public.view_player_stats RENAME TO "VIEW_PLAYER_STATS";

-- 3. RIPRISTINO DEFINIZIONE VISTA view_team_stats
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
LEFT JOIN public."AS_TEAM_STAT" hst ON s.home = hst."ID" AND s.stag = hst."STAG" AND s.week = hst."WEEK" AND (s.unlock_at IS NULL OR s.unlock_at <= now())
LEFT JOIN public."AS_TEAM_STAT" ast ON s.away = ast."ID" AND s.stag = ast."STAG" AND s.week = ast."WEEK" AND (s.unlock_at IS NULL OR s.unlock_at <= now())
LEFT JOIN public.an_team htm ON s.home = htm."TEAM_ID"
LEFT JOIN public.an_team atm ON s.away = atm."TEAM_ID";

-- 4. RIPRISTINO DEFINIZIONE VISTA public."VIEW_PLAYER_STATS"
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
LEFT JOIN public."AS_PLAYER_STAT" t ON s."ID" = t."ID"
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

-- 5. PERMESSI
GRANT SELECT, INSERT, UPDATE, DELETE ON public."AS_TEAM_STAT" TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."AS_PLAYER_STAT" TO anon, authenticated, service_role;
GRANT SELECT ON public."VIEW_PLAYER_STATS" TO anon, authenticated, service_role;
