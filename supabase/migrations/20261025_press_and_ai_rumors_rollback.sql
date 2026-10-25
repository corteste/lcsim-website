-- ==============================================================================
-- Rollback: 20261025_press_and_ai_rumors_rollback.sql
-- Descrizione: Rimozione tabelle press_conferences e league_market_rumors
-- ==============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'press_conferences'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.press_conferences;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'league_market_rumors'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.league_market_rumors;
    END IF;
END $$;

DROP TABLE IF EXISTS public.league_market_rumors CASCADE;
DROP TABLE IF EXISTS public.press_conferences CASCADE;
