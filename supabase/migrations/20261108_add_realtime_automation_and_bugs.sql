-- ==============================================================================
-- Migrazione: Aggiunta league_automation_state e league_bug_reports a supabase_realtime
-- File: supabase/migrations/20261108_add_realtime_automation_and_bugs.sql
-- ==============================================================================

DO $$
BEGIN
  -- Aggiunge league_automation_state alla pubblicazione realtime se non presente
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'league_automation_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.league_automation_state;
  END IF;

  -- Aggiunge league_bug_reports alla pubblicazione realtime se non presente
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'league_bug_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.league_bug_reports;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
