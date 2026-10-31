-- ==============================================================================
-- Rollback: Calcolo Peggioramenti Giocatori (In-Season / Prestazionali) - Punto #25
-- File: supabase/migrations/20261031_performance_decay_rollback.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_apply_performance_decay(TEXT, INT, JSONB, JSONB);

DELETE FROM public.league_automation_state WHERE id = 'performance_decay';
