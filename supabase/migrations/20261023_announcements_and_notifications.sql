-- ==============================================================================
-- LCSIM - Modulo Comunicazioni Ufficiali Admin & Notifiche Realtime (Punti 2.2 & 2.3)
-- ==============================================================================

-- 1. Tabella Comunicati Ufficiali di Lega (Broadcast Globale)
CREATE TABLE IF NOT EXISTS public.league_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'generale' CHECK (category IN ('generale', 'regolamento', 'mercato', 'giornate', 'disciplinare')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_banner BOOLEAN NOT NULL DEFAULT false,
    author_name TEXT NOT NULL DEFAULT 'Commissione Lega LCSIM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ
);

-- 2. Tabella Stato di Lettura Comunicati per Utente/Squadra
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    announcement_id UUID NOT NULL REFERENCES public.league_announcements(id) ON DELETE CASCADE,
    user_key TEXT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (announcement_id, user_key)
);

-- 3. Indici per performance
CREATE INDEX IF NOT EXISTS idx_league_announcements_created_at ON public.league_announcements(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_league_announcements_banner ON public.league_announcements(is_banner) WHERE is_banner = true;
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON public.announcement_reads(user_key);

-- 4. Row Level Security (RLS) e Permessi
ALTER TABLE public.league_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access on league_announcements" ON public.league_announcements;
CREATE POLICY "Public access on league_announcements" ON public.league_announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on announcement_reads" ON public.announcement_reads;
CREATE POLICY "Public access on announcement_reads" ON public.announcement_reads FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.league_announcements TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.announcement_reads TO anon, authenticated, service_role;

-- 5. Abilitazione Tabelle nella Pubblicazione Realtime di Supabase
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'league_announcements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.league_announcements;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'market_trades'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.market_trades;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trade_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_messages;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Realtime publication update skipped: %', SQLERRM;
END $$;
