-- ==============================================================================
-- Migrazione: 20261116_user_notification_reads.sql
-- Descrizione: Crea public.user_notification_reads per sincronizzare su DB
--              lo stato di lettura di Inbox e notifiche tra PC, browser e PWA.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  user_key TEXT NOT NULL,
  item_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_key, item_id)
);

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access on user_notification_reads" ON public.user_notification_reads;
CREATE POLICY "Public access on user_notification_reads"
  ON public.user_notification_reads
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.user_notification_reads TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_notification_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification_reads;
  END IF;
END $$;
