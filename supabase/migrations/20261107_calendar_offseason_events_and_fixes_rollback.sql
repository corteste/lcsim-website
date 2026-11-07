-- ==============================================================================
-- Rollback: 20261107_calendar_offseason_events_and_fixes_rollback.sql
-- Descrizione: Annulla le modifiche di 20261107_calendar_offseason_events_and_fixes.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_admin_delete_league_event(INTEGER);
DROP FUNCTION IF EXISTS public.rpc_admin_upsert_league_event(INTEGER, INTEGER, TEXT, TEXT, DATE, TEXT);

DROP POLICY IF EXISTS "Allow write an_league_events" ON public.an_league_events;

REVOKE INSERT, UPDATE, DELETE ON public.an_league_events FROM anon, authenticated;

ALTER TABLE public.an_league_events
  DROP COLUMN IF EXISTS note;
