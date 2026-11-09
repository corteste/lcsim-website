-- ==============================================================================
-- Rollback: Rimozione Tabella Repliche Interviste (Punto #69)
-- File: supabase/migrations/20261109_press_conference_replies_rollback.sql
-- ==============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'press_conference_replies'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.press_conference_replies;
    END IF;
END $$;

DROP FUNCTION IF EXISTS public.rpc_submit_conference_reply(BIGINT, VARCHAR, TEXT, TEXT);

DROP TABLE IF EXISTS public.press_conference_replies CASCADE;
