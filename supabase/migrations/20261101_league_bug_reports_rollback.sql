-- ==============================================================================
-- Rollback: 20261101_league_bug_reports_rollback.sql
-- Descrizione: Ripristina il database rimuovendo league_bug_reports e test_mode
-- ==============================================================================

DROP TABLE IF EXISTS public.league_bug_reports CASCADE;
DELETE FROM public.league_automation_state WHERE id = 'test_mode';
