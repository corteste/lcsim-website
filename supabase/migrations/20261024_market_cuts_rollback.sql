-- ============================================================================
-- ROLLBACK: 20261024_market_cuts_rollback.sql
-- ============================================================================

DROP FUNCTION IF EXISTS public.execute_official_cuts(TEXT);

DROP TABLE IF EXISTS public.team_cuts_registry CASCADE;

DELETE FROM public.league_automation_state WHERE id = 'official_cuts';
