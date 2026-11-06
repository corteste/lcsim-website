-- ==============================================================================
-- LCSIM Rollback Migration: Archivio Storico, Cronistoria & Hall of Fame (#57)
-- File: supabase/migrations/20261106_archive_and_cronistoria_rollback.sql
-- ==============================================================================

DROP VIEW IF EXISTS public.view_player_career_summary;
DROP VIEW IF EXISTS public.view_player_season_summary;

DROP FUNCTION IF EXISTS public.rpc_admin_delete_hof_member(BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_admin_upsert_hof_member(BIGINT, TEXT, TEXT, INTEGER, TEXT, TEXT);

DROP TABLE IF EXISTS public.an_hall_of_fame CASCADE;
DROP TABLE IF EXISTS public.an_historical_news CASCADE;
DROP TABLE IF EXISTS public.an_captain_leaderboards CASCADE;
DROP TABLE IF EXISTS public.an_match_captains CASCADE;
DROP TABLE IF EXISTS public.an_coach_history CASCADE;
DROP TABLE IF EXISTS public.an_league_events CASCADE;
DROP TABLE IF EXISTS public.an_player_career_seasons CASCADE;
DROP TABLE IF EXISTS public.an_player_transactions CASCADE;
DROP TABLE IF EXISTS public.an_team_rebrands CASCADE;

-- Ripristino TEAM_ID NULL per S1-S10 in as_player_stat
UPDATE public.as_player_stat SET "TEAM_ID" = NULL WHERE "STAG" BETWEEN 1 AND 10;

-- Rimozione squadre storiche aggiunte in an_team
DELETE FROM public.an_team
WHERE "TEAM_ID" IN ('FCP', 'KAR', 'QFM', 'GAP', 'PAN', 'HTV', 'PRO', 'YBO', 'SBM', 'HVI', 'BLA')
  AND "ACTIVE" = false;
