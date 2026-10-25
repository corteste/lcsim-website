-- ==============================================================================
-- Migrazione: 20261025_press_and_ai_rumors.sql
-- Descrizione: Creazione tabelle per Sala Stampa (Interviste Presidenti & Domande AI)
--              e Rumor di Mercato del Giornalista AI (Punti #20 e #21)
-- ==============================================================================

-- 1. TABELLA: press_conferences (Interviste e conferenze stampa di giornata)
CREATE TABLE IF NOT EXISTS public.press_conferences (
    id BIGSERIAL PRIMARY KEY,
    season INTEGER NOT NULL DEFAULT 11,
    matchday INTEGER NOT NULL,
    team_id VARCHAR(10) NOT NULL REFERENCES public.an_team("TEAM_ID") ON DELETE CASCADE,
    manager_name TEXT,
    opponent_team_id VARCHAR(10) REFERENCES public.an_team("TEAM_ID") ON DELETE SET NULL,
    context_summary TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    answered_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ANSWERED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_press_conferences_season_matchday_team UNIQUE (season, matchday, team_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_press_conferences_matchday ON public.press_conferences(season, matchday);
CREATE INDEX IF NOT EXISTS idx_press_conferences_team ON public.press_conferences(team_id);
CREATE INDEX IF NOT EXISTS idx_press_conferences_status ON public.press_conferences(status);

-- 2. TABELLA: league_market_rumors (Feed rumor, fake news e indiscrezioni del Giornalista AI)
CREATE TABLE IF NOT EXISTS public.league_market_rumors (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(40) NOT NULL DEFAULT 'TRATTATIVA_REALE' 
        CHECK (category IN ('TRATTATIVA_REALE', 'TRATTATIVA_DISTORTA', 'FAKE_NEWS', 'COLPO_A_SORPRESA')),
    headline TEXT NOT NULL,
    content TEXT NOT NULL,
    involved_team_ids TEXT[] NOT NULL DEFAULT '{}',
    involved_player_names TEXT[] NOT NULL DEFAULT '{}',
    credibility_score INTEGER NOT NULL DEFAULT 50 CHECK (credibility_score BETWEEN 1 AND 100),
    credibility_badge VARCHAR(50) NOT NULL DEFAULT 'Indiscrezione',
    source_label VARCHAR(60) NOT NULL DEFAULT 'LCSIM Insider',
    reactions JSONB NOT NULL DEFAULT '{"fire": 0, "laugh": 0, "shock": 0, "doubt": 0}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indici per rumor
CREATE INDEX IF NOT EXISTS idx_league_market_rumors_created ON public.league_market_rumors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_league_market_rumors_active ON public.league_market_rumors(is_active);

-- 3. ABILITAZIONE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.press_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_market_rumors ENABLE ROW LEVEL SECURITY;

-- Policy press_conferences
DROP POLICY IF EXISTS "press_conferences_select" ON public.press_conferences;
CREATE POLICY "press_conferences_select" ON public.press_conferences
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "press_conferences_insert" ON public.press_conferences;
CREATE POLICY "press_conferences_insert" ON public.press_conferences
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "press_conferences_update" ON public.press_conferences;
CREATE POLICY "press_conferences_update" ON public.press_conferences
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "press_conferences_delete" ON public.press_conferences;
CREATE POLICY "press_conferences_delete" ON public.press_conferences
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.app_user
            WHERE app_user.id = auth.uid() AND app_user.is_admin = true
        )
    );

-- Policy league_market_rumors
DROP POLICY IF EXISTS "league_market_rumors_select" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_select" ON public.league_market_rumors
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "league_market_rumors_insert" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_insert" ON public.league_market_rumors
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "league_market_rumors_update" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_update" ON public.league_market_rumors
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "league_market_rumors_delete" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_delete" ON public.league_market_rumors
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.app_user
            WHERE app_user.id = auth.uid() AND app_user.is_admin = true
        )
    );

-- 4. AGGIUNTA A SUPABASE REALTIME
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'press_conferences'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.press_conferences;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'league_market_rumors'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.league_market_rumors;
    END IF;
END $$;
