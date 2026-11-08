-- ==============================================================================
-- Rollback: Rimozione league_automation_state e league_bug_reports da supabase_realtime
-- File: supabase/migrations/20261108_add_realtime_automation_and_bugs_rollback.sql
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'league_automation_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.league_automation_state;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'league_bug_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.league_bug_reports;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
