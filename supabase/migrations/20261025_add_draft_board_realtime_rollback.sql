-- Rollback: Remove an_draft_board and an_rookie from supabase_realtime publication

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'an_draft_board'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.an_draft_board;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'an_rookie'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.an_rookie;
  END IF;
END $$;

ALTER TABLE public.an_draft_board REPLICA IDENTITY DEFAULT;
ALTER TABLE public.an_rookie REPLICA IDENTITY DEFAULT;
