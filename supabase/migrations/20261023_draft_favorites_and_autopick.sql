-- Migrazione per Punto 6 (Watchlist / Giocatori Preferiti) e Punto 7 (Draft Priority Queue & Autopick)

-- 1. Tabella Giocatori Preferiti (Watchlist per Scouting, Draft e Free Agent)
CREATE TABLE IF NOT EXISTS public.team_player_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id TEXT NOT NULL,
    player_id BIGINT NOT NULL,
    player_type TEXT NOT NULL DEFAULT 'rookie', -- 'rookie' | 'player'
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_team_player_favorite UNIQUE (team_id, player_id, player_type)
);

CREATE INDEX IF NOT EXISTS idx_team_player_favorites_lookup 
ON public.team_player_favorites(team_id, player_type);

-- 2. Tabella Lista di Priorità Draft (Wishlist Ordinata per Team)
CREATE TABLE IF NOT EXISTS public.draft_team_wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id TEXT NOT NULL,
    rookie_id BIGINT NOT NULL,
    priority_rank INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_team_rookie_wishlist UNIQUE (team_id, rookie_id)
);

CREATE INDEX IF NOT EXISTS idx_draft_team_wishlist_rank 
ON public.draft_team_wishlist(team_id, priority_rank ASC);

-- 3. Tabella Impostazioni Autopick per Squadra
CREATE TABLE IF NOT EXISTS public.draft_autopick_settings (
    team_id TEXT PRIMARY KEY,
    is_autopick_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Abilitazione Realtime per aggiornamenti live
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'draft_autopick_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_autopick_settings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'draft_team_wishlist'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_team_wishlist;
    END IF;
END $$;

-- Abilitazione RLS
ALTER TABLE public.team_player_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_team_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_autopick_settings ENABLE ROW LEVEL SECURITY;

-- Policies per team_player_favorites
DROP POLICY IF EXISTS "Allow all for team_player_favorites" ON public.team_player_favorites;
CREATE POLICY "Allow all for team_player_favorites" 
    ON public.team_player_favorites FOR ALL 
    USING (true) WITH CHECK (true);

-- Policies per draft_team_wishlist
DROP POLICY IF EXISTS "Allow all for draft_team_wishlist" ON public.draft_team_wishlist;
CREATE POLICY "Allow all for draft_team_wishlist" 
    ON public.draft_team_wishlist FOR ALL 
    USING (true) WITH CHECK (true);

-- Policies per draft_autopick_settings
DROP POLICY IF EXISTS "Allow all for draft_autopick_settings" ON public.draft_autopick_settings;
CREATE POLICY "Allow all for draft_autopick_settings" 
    ON public.draft_autopick_settings FOR ALL 
    USING (true) WITH CHECK (true);
