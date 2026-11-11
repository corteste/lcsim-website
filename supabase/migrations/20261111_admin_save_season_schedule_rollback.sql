-- ============================================================================
-- Rollback: RPC Salvataggio Calendario Stagionale Generato dall'Admin
-- File: supabase/migrations/20261111_admin_save_season_schedule_rollback.sql
-- ============================================================================

DROP FUNCTION IF EXISTS public.rpc_admin_save_season_schedule(integer, jsonb, text);
DELETE FROM public.league_automation_state WHERE id = 'generate_season_schedule';
