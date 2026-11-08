-- ==============================================================================
-- Rollback: Calcolo Clean Sheet e Statistiche Porta Riservato ai Soli Portieri (POR)
-- File: supabase/migrations/20261108_clean_sheets_goalkeeper_only_rollback.sql
-- ==============================================================================

-- 1. Ripristino vista view_player_season_summary
CREATE OR REPLACE VIEW public.view_player_season_summary AS
 WITH stat_agg AS (
   SELECT 
     s."ID" AS player_id,
     s."STAG" AS stagione,
     max(s."TEAM_ID") AS stat_team_id,
     count(*)::integer AS presenze,
     count(*) FILTER (WHERE NOT COALESCE(s."SUB", false))::integer AS titolare,
     COALESCE(sum(s."MINUTI"), 0::numeric)::integer AS minuti,
     round(avg(s."VOTO")::numeric, 2)::real AS media_voto,
     count(*) FILTER (WHERE COALESCE(s."MOTM", false))::integer AS motm,
     COALESCE(sum(s."GOL"), 0::bigint)::integer AS gol,
     COALESCE(sum(s."AGOL"), 0::bigint)::integer AS autogol,
     COALESCE(sum(s."ASST"), 0::bigint)::integer AS assist,
     COALESCE(sum(s."TIRI_IN"), 0::bigint)::integer AS tiri_in,
     COALESCE(sum(s."TIRI_TOT"), 0::bigint)::integer AS tiri_tot,
     COALESCE(sum(s."PASS_SI"), 0::bigint)::integer AS pass_si,
     COALESCE(sum(s."PASS_TOT"), 0::bigint)::integer AS pass_tot,
     COALESCE(sum(s."DRIB_SI"), 0::bigint)::integer AS drib_si,
     COALESCE(sum(s."DRIB_TOT"), 0::bigint)::integer AS drib_tot,
     COALESCE(sum(s."CROS_SI"), 0::bigint)::integer AS cros_si,
     COALESCE(sum(s."CROS_TOT"), 0::bigint)::integer AS cros_tot,
     COALESCE(sum(s."CTRS_SI"), 0::bigint)::integer AS ctrs_si,
     COALESCE(sum(s."CTRS_TOT"), 0::bigint)::integer AS ctrs_tot,
     COALESCE(sum(s."FALLI"), 0::bigint)::integer AS falli,
     COALESCE(sum(s."PARA"), 0::bigint)::integer AS parate,
     COALESCE(sum(s."GSUB"), 0::bigint)::integer AS gol_subiti,
     count(*) FILTER (WHERE COALESCE(s."GSUB", 0) = 0 AND COALESCE(s."MINUTI", 0::bigint) >= 45)::integer AS clean_sheets,
     COALESCE(sum(s."GIALLI"), 0::bigint)::integer AS gialli,
     COALESCE(sum(s."ROSSI"), 0::bigint)::integer AS rossi,
     COALESCE(sum(s."FGIOCO"), 0::bigint)::integer AS fuorigioco
   FROM as_player_stat s
   GROUP BY s."ID", s."STAG"
 )
 SELECT 
   COALESCE(cs.player_id, sa.player_id) AS player_id,
   COALESCE(cs.stagione, sa.stagione) AS stagione,
   COALESCE(cs.team_id, sa.stat_team_id, 'N/D'::text) AS team_id,
   COALESCE(cs.franchise_id, sa.stat_team_id, 'N/D'::text) AS franchise_id,
   COALESCE(cs.entry_motivo, 'A Referto'::text) AS entry_motivo,
   cs.draft_pick,
   COALESCE(cs.presenze_capitano, 0) AS presenze_capitano,
   COALESCE(sa.presenze, 0) AS presenze,
   COALESCE(sa.titolare, 0) AS titolare,
   COALESCE(sa.minuti, 0) AS minuti,
   sa.media_voto,
   COALESCE(sa.motm, 0) AS motm,
   COALESCE(sa.gol, 0) AS gol,
   COALESCE(sa.autogol, 0) AS autogol,
   COALESCE(sa.assist, 0) AS assist,
   COALESCE(sa.tiri_in, 0) AS tiri_in,
   COALESCE(sa.tiri_tot, 0) AS tiri_tot,
   COALESCE(sa.pass_si, 0) AS pass_si,
   COALESCE(sa.pass_tot, 0) AS pass_tot,
   COALESCE(sa.drib_si, 0) AS drib_si,
   COALESCE(sa.drib_tot, 0) AS drib_tot,
   COALESCE(sa.cros_si, 0) AS cros_si,
   COALESCE(sa.cros_tot, 0) AS cros_tot,
   COALESCE(sa.ctrs_si, 0) AS ctrs_si,
   COALESCE(sa.ctrs_tot, 0) AS ctrs_tot,
   COALESCE(sa.falli, 0) AS falli,
   COALESCE(sa.parate, 0) AS parate,
   COALESCE(sa.gol_subiti, 0) AS gol_subiti,
   COALESCE(sa.clean_sheets, 0) AS clean_sheets,
   COALESCE(sa.gialli, 0) AS gialli,
   COALESCE(sa.rossi, 0) AS rossi,
   COALESCE(sa.fuorigioco, 0) AS fuorigioco
 FROM an_player_career_seasons cs
   FULL JOIN stat_agg sa ON cs.player_id = sa.player_id AND cs.stagione = sa.stagione;

-- 2. Ripristino vista view_player_career_summary
CREATE OR REPLACE VIEW public.view_player_career_summary AS
 WITH raw_career AS (
   SELECT 
     s."ID" AS player_id,
     count(*)::integer AS presenze,
     count(*) FILTER (WHERE NOT COALESCE(s."SUB", false))::integer AS titolare,
     COALESCE(sum(s."MINUTI"), 0::numeric)::integer AS minuti,
     round(avg(s."VOTO")::numeric, 2)::real AS media_voto,
     count(*) FILTER (WHERE COALESCE(s."MOTM", false))::integer AS motm,
     COALESCE(sum(s."GOL"), 0::bigint)::integer AS gol,
     COALESCE(sum(s."AGOL"), 0::bigint)::integer AS autogol,
     COALESCE(sum(s."ASST"), 0::bigint)::integer AS assist,
     COALESCE(sum(s."TIRI_IN"), 0::bigint)::integer AS tiri_in,
     COALESCE(sum(s."TIRI_TOT"), 0::bigint)::integer AS tiri_tot,
     COALESCE(sum(s."PASS_SI"), 0::bigint)::integer AS pass_si,
     COALESCE(sum(s."PASS_TOT"), 0::bigint)::integer AS pass_tot,
     COALESCE(sum(s."DRIB_SI"), 0::bigint)::integer AS drib_si,
     COALESCE(sum(s."DRIB_TOT"), 0::bigint)::integer AS drib_tot,
     COALESCE(sum(s."CROS_SI"), 0::bigint)::integer AS cros_si,
     COALESCE(sum(s."CROS_TOT"), 0::bigint)::integer AS cros_tot,
     COALESCE(sum(s."CTRS_SI"), 0::bigint)::integer AS ctrs_si,
     COALESCE(sum(s."CTRS_TOT"), 0::bigint)::integer AS ctrs_tot,
     COALESCE(sum(s."FALLI"), 0::bigint)::integer AS falli,
     COALESCE(sum(s."PARA"), 0::bigint)::integer AS parate,
     COALESCE(sum(s."GSUB"), 0::bigint)::integer AS gol_subiti,
     count(*) FILTER (WHERE COALESCE(s."GSUB", 0) = 0 AND COALESCE(s."MINUTI", 0::bigint) >= 45)::integer AS clean_sheets,
     COALESCE(sum(s."GIALLI"), 0::bigint)::integer AS gialli,
     COALESCE(sum(s."ROSSI"), 0::bigint)::integer AS rossi,
     COALESCE(sum(s."FGIOCO"), 0::bigint)::integer AS fuorigioco
   FROM as_player_stat s
   GROUP BY s."ID"
 ), season_meta AS (
   SELECT 
     view_player_season_summary.player_id,
     count(*)::integer AS stagioni_rosa,
     count(*) FILTER (WHERE view_player_season_summary.presenze > 0)::integer AS stagioni_giocate,
     min(view_player_season_summary.stagione) AS first_stag,
     max(view_player_season_summary.stagione) AS last_stag,
     array_agg(view_player_season_summary.team_id ORDER BY view_player_season_summary.stagione) AS season_teams,
     array_agg(DISTINCT view_player_season_summary.franchise_id) AS franchises,
     COALESCE(sum(view_player_season_summary.presenze_capitano), 0::bigint)::integer AS sum_cap
   FROM view_player_season_summary
   GROUP BY view_player_season_summary.player_id
 ), draft_info AS (
   SELECT DISTINCT ON (an_player_transactions.player_id) 
     an_player_transactions.player_id,
     an_player_transactions.stagione AS draft_stag,
     an_player_transactions.draft_pick,
     an_player_transactions.new_team AS draft_team
   FROM an_player_transactions
   WHERE an_player_transactions.motivo = 'Draft'::text
   ORDER BY an_player_transactions.player_id, an_player_transactions.tx_order
 )
 SELECT 
   p."ID" AS player_id,
   p."Nome" AS nome,
   p."Cognome" AS cognome,
   p."Posiz" AS posiz,
   p."Squadra" AS squadra_attuale,
   p."OVR" AS ovr,
   p."Età" AS eta,
   p."Altezza" AS altezza,
   p."Peso" AS peso,
   p."Nazionalità" AS nazionalita,
   p."Piede" AS piede,
   hof.player_id IS NOT NULL AS is_hof,
   hof.induction_class AS hof_class,
   hof.active_seasons AS hof_active_seasons,
   COALESCE(sm.stagioni_rosa, 0) AS stagioni_rosa,
   COALESCE(sm.stagioni_giocate, 0) AS stagioni_giocate,
   sm.first_stag,
   sm.last_stag,
   COALESCE(sm.season_teams, ARRAY[]::text[]) AS season_teams,
   COALESCE(sm.franchises, ARRAY[]::text[]) AS franchises,
   di.draft_stag,
   di.draft_pick,
   di.draft_team,
   COALESCE(cl.presenze_capitano, sm.sum_cap, 0) AS presenze_capitano,
   COALESCE(rc.presenze, 0) AS presenze,
   COALESCE(rc.titolare, 0) AS titolare,
   COALESCE(rc.minuti, 0) AS minuti,
   rc.media_voto,
   COALESCE(rc.motm, 0) AS motm,
   COALESCE(rc.gol, 0) AS gol,
   COALESCE(rc.autogol, 0) AS autogol,
   COALESCE(rc.assist, 0) AS assist,
   COALESCE(rc.tiri_in, 0) AS tiri_in,
   COALESCE(rc.tiri_tot, 0) AS tiri_tot,
   COALESCE(rc.pass_si, 0) AS pass_si,
   COALESCE(rc.pass_tot, 0) AS pass_tot,
   COALESCE(rc.drib_si, 0) AS drib_si,
   COALESCE(rc.drib_tot, 0) AS drib_tot,
   COALESCE(rc.cros_si, 0) AS cros_si,
   COALESCE(rc.cros_tot, 0) AS cros_tot,
   COALESCE(rc.ctrs_si, 0) AS ctrs_si,
   COALESCE(rc.ctrs_tot, 0) AS ctrs_tot,
   COALESCE(rc.falli, 0) AS falli,
   COALESCE(rc.parate, 0) AS parate,
   COALESCE(rc.gol_subiti, 0) AS gol_subiti,
   COALESCE(rc.clean_sheets, 0) AS clean_sheets,
   COALESCE(rc.gialli, 0) AS gialli,
   COALESCE(rc.rossi, 0) AS rossi,
   COALESCE(rc.fuorigioco, 0) AS fuorigioco
 FROM an_player p
   LEFT JOIN raw_career rc ON p."ID" = rc.player_id
   LEFT JOIN season_meta sm ON p."ID" = sm.player_id
   LEFT JOIN draft_info di ON p."ID" = di.player_id
   LEFT JOIN an_captain_leaderboards cl ON p."ID" = cl.player_id
   LEFT JOIN an_hall_of_fame hof ON p."ID" = hof.player_id;

NOTIFY pgrst, 'reload schema';
