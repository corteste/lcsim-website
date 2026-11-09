-- ==============================================================================
-- Rollback: Ripristino stato precedente "SUB" su as_player_stat
-- File: supabase/migrations/20261109_fix_player_stats_sub_and_starters_rollback.sql
-- ==============================================================================

-- Ripristina il valore "SUB" = false per tutti i record di as_player_stat
UPDATE public.as_player_stat
SET "SUB" = false;
