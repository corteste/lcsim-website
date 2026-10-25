-- Migration: Add an_draft_board and an_rookie to supabase_realtime publication
-- Enables live sync across all connected clients when a pick is made or updated

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'an_draft_board'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.an_draft_board;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'an_rookie'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.an_rookie;
  END IF;
END $$;

ALTER TABLE public.an_draft_board REPLICA IDENTITY FULL;
ALTER TABLE public.an_rookie REPLICA IDENTITY FULL;
