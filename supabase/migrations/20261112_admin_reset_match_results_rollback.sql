-- ==============================================================================
-- LCSIM Migration Rollback: Procedura di Reset / Annullamento Risultati Partita e Giornata (#72)
-- File: supabase/migrations/20261112_admin_reset_match_results_rollback.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_admin_reset_single_match(INTEGER, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_admin_reset_matchday_results(INTEGER, INTEGER, TEXT);
