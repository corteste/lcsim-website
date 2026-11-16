-- ==============================================================================
-- Migrazione: 20261116_pwa_push_subscriptions.sql
-- Descrizione: Crea la tabella public.user_push_subscriptions per registrare
--              le sottoscrizioni PWA/notifiche per utente/squadra, con indici,
--              RLS e pubblicazione Realtime su press_conferences & league_market_rumors.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key TEXT NOT NULL,
  team_id TEXT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_key
  ON public.user_push_subscriptions(user_key);

CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_team_id
  ON public.user_push_subscriptions(team_id);

ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access on user_push_subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Public access on user_push_subscriptions"
  ON public.user_push_subscriptions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.user_push_subscriptions TO anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'press_conferences'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'press_conferences'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.press_conferences;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'league_market_rumors'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'league_market_rumors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.league_market_rumors;
  END IF;
END $$;
