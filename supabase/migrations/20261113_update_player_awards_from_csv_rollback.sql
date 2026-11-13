-- ==============================================================================
-- LCSIM Rollback: Storico Premi Ufficiale S1-S10 da CSV
-- File: supabase/migrations/20261113_update_player_awards_from_csv_rollback.sql
-- ==============================================================================

BEGIN;

DELETE FROM public.player_awards WHERE season BETWEEN 1 AND 10;

COMMIT;
