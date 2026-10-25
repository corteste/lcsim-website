-- ============================================================================
-- ROLLBACK MIGRATION: 20261025_team_market_needs_rollback.sql
-- DESCRIZIONE: Rimozione della tabella team_market_needs e pulizia delle relative policy.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_market_needs'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.team_market_needs;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DROP TABLE IF EXISTS public.team_market_needs CASCADE;
