-- ==============================================================================
-- LCSIM Rollback: Rimozione Trigger trg_an_player_cleanup_market
-- File: supabase/migrations/20261103_cleanup_minor_league_market_status_rollback.sql
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_an_player_cleanup_market ON public.an_player;
DROP FUNCTION IF EXISTS public.trg_cleanup_player_market_status();

NOTIFY pgrst, 'reload schema';
