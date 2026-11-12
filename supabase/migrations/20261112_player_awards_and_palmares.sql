-- ==============================================================================
-- LCSIM Migration: Tabella Premi Individuali & Palmarès Calciatori (Punto #76)
-- File: supabase/migrations/20261112_player_awards_and_palmares.sql
-- ==============================================================================

-- 1. Creazione Tabella Premi Individuali Calciatori
CREATE TABLE IF NOT EXISTS public.player_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id BIGINT NOT NULL REFERENCES public.an_player("ID") ON DELETE CASCADE,
    season INTEGER NOT NULL,
    award_type TEXT NOT NULL, -- 'capocannoniere', 'assistman', 'golden_glove', 'mvp', 'custom'
    award_title TEXT NOT NULL,
    team_id TEXT NOT NULL,
    stat_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_awards_player ON public.player_awards (player_id);
CREATE INDEX IF NOT EXISTS idx_player_awards_season ON public.player_awards (season);
CREATE INDEX IF NOT EXISTS idx_player_awards_type ON public.player_awards (award_type);

-- 2. Configurazione Row Level Security (RLS)
ALTER TABLE public.player_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read player_awards" ON public.player_awards;
CREATE POLICY "Public read player_awards" ON public.player_awards
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write player_awards" ON public.player_awards;
CREATE POLICY "Admin write player_awards" ON public.player_awards
    FOR ALL USING (true);

-- 3. Popolamento Premi Storici Ufficiali S1–S10
INSERT INTO public.player_awards (player_id, season, award_type, award_title, team_id, stat_value, notes)
VALUES
    -- Stagione 1
    (50079, 1, 'capocannoniere', 'Capocannoniere Serie A', 'QFM', '4 Gol', 'Miglior marcatore Stagione 1'),
    (50047, 1, 'assistman', 'Miglior Assist-man', 'GAP', '3 Assist', 'Miglior fornitore di assist Stagione 1 (ex-aequo)'),
    (50242, 1, 'assistman', 'Miglior Assist-man', 'SBM', '3 Assist', 'Miglior fornitore di assist Stagione 1 (ex-aequo)'),
    (50293, 1, 'assistman', 'Miglior Assist-man', 'PAN', '3 Assist', 'Miglior fornitore di assist Stagione 1 (ex-aequo)'),
    (50244, 1, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'APD', '6 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 1 (ex-aequo)'),
    (50117, 1, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'SBM', '6 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 1 (ex-aequo)'),
    (50117, 1, 'mvp', 'MVP della Stagione', 'SBM', 'Media Voto 7.30', 'Miglior media voto Stagione 1 (min. 5 presenze)'),

    -- Stagione 2
    (50078, 2, 'capocannoniere', 'Capocannoniere Serie A', 'KAR', '7 Gol', 'Miglior marcatore Stagione 2 (ex-aequo)'),
    (50011, 2, 'capocannoniere', 'Capocannoniere Serie A', 'VFC', '7 Gol', 'Miglior marcatore Stagione 2 (ex-aequo)'),
    (50160, 2, 'assistman', 'Miglior Assist-man', 'KAR', '4 Assist', 'Miglior fornitore di assist Stagione 2 (ex-aequo)'),
    (50274, 2, 'assistman', 'Miglior Assist-man', 'APD', '4 Assist', 'Miglior fornitore di assist Stagione 2 (ex-aequo)'),
    (50284, 2, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'PAN', '6 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 2 (ex-aequo)'),
    (50117, 2, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'SBM', '6 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 2 (ex-aequo)'),
    (50011, 2, 'mvp', 'MVP della Stagione', 'VFC', 'Media Voto 7.12', 'Miglior media voto Stagione 2 (min. 5 presenze)'),

    -- Stagione 3
    (50219, 3, 'capocannoniere', 'Capocannoniere Serie A', 'ACD', '6 Gol', 'Miglior marcatore Stagione 3 (ex-aequo)'),
    (50011, 3, 'capocannoniere', 'Capocannoniere Serie A', 'VFC', '6 Gol', 'Miglior marcatore Stagione 3 (ex-aequo)'),
    (50074, 3, 'assistman', 'Miglior Assist-man', 'HTV', '3 Assist', 'Miglior fornitore di assist Stagione 3 (ex-aequo)'),
    (50259, 3, 'assistman', 'Miglior Assist-man', 'HTV', '3 Assist', 'Miglior fornitore di assist Stagione 3 (ex-aequo)'),
    (50290, 3, 'assistman', 'Miglior Assist-man', 'SBM', '3 Assist', 'Miglior fornitore di assist Stagione 3 (ex-aequo)'),
    (50186, 3, 'assistman', 'Miglior Assist-man', 'ACD', '3 Assist', 'Miglior fornitore di assist Stagione 3 (ex-aequo)'),
    (50042, 3, 'assistman', 'Miglior Assist-man', 'KAR', '3 Assist', 'Miglior fornitore di assist Stagione 3 (ex-aequo)'),
    (50137, 3, 'assistman', 'Miglior Assist-man', 'APD', '3 Assist', 'Miglior fornitore di assist Stagione 3 (ex-aequo)'),
    (50044, 3, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'KAR', '8 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 3'),
    (50284, 3, 'mvp', 'MVP della Stagione', 'HTV', 'Media Voto 7.26', 'Miglior media voto Stagione 3 (min. 5 presenze)'),

    -- Stagione 4
    (50011, 4, 'capocannoniere', 'Capocannoniere Serie A', 'VFC', '12 Gol', 'Miglior marcatore Stagione 4'),
    (50205, 4, 'assistman', 'Miglior Assist-man', 'PFC', '9 Assist', 'Miglior fornitore di assist Stagione 4'),
    (50230, 4, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'ACF', '5 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 4'),
    (50011, 4, 'mvp', 'MVP della Stagione', 'VFC', 'Media Voto 7.36', 'Miglior media voto Stagione 4 (min. 5 presenze)'),

    -- Stagione 5
    (50011, 5, 'capocannoniere', 'Capocannoniere Serie A', 'VFC', '9 Gol', 'Miglior marcatore Stagione 5'),
    (50077, 5, 'assistman', 'Miglior Assist-man', 'VFC', '6 Assist', 'Miglior fornitore di assist Stagione 5'),
    (50070, 5, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'ALV', '6 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 5'),
    (50380, 5, 'mvp', 'MVP della Stagione', 'HVI', 'Media Voto 7.25', 'Miglior media voto Stagione 5 (min. 5 presenze)'),

    -- Stagione 6
    (50078, 6, 'capocannoniere', 'Capocannoniere Serie A', 'BLA', '7 Gol', 'Miglior marcatore Stagione 6 (ex-aequo)'),
    (50219, 6, 'capocannoniere', 'Capocannoniere Serie A', 'ACD', '7 Gol', 'Miglior marcatore Stagione 6 (ex-aequo)'),
    (50011, 6, 'assistman', 'Miglior Assist-man', 'VFC', '5 Assist', 'Miglior fornitore di assist Stagione 6'),
    (50044, 6, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'ASK', '6 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 6'),
    (50244, 6, 'mvp', 'MVP della Stagione', 'APD', 'Media Voto 7.93', 'Miglior media voto Stagione 6 (min. 5 presenze)'),

    -- Stagione 7
    (50204, 7, 'capocannoniere', 'Capocannoniere Serie A', 'MAR', '11 Gol', 'Miglior marcatore Stagione 7'),
    (50247, 7, 'assistman', 'Miglior Assist-man', 'APD', '6 Assist', 'Miglior fornitore di assist Stagione 7'),
    (50244, 7, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'APD', '4 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 7'),
    (50230, 7, 'mvp', 'MVP della Stagione', 'ACF', 'Media Voto 8.28', 'Miglior media voto Stagione 7 (min. 5 presenze)'),

    -- Stagione 8
    (50205, 8, 'capocannoniere', 'Capocannoniere Serie A', 'ASK', '10 Gol', 'Miglior marcatore Stagione 8'),
    (50184, 8, 'assistman', 'Miglior Assist-man', 'VFC', '5 Assist', 'Miglior fornitore di assist Stagione 8'),
    (50289, 8, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'OLD', '4 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 8 (ex-aequo)'),
    (50070, 8, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'ALV', '4 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 8 (ex-aequo)'),
    (50193, 8, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'MAR', '4 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 8 (ex-aequo)'),
    (50249, 8, 'mvp', 'MVP della Stagione', 'ACD', 'Media Voto 8.20', 'Miglior media voto Stagione 8 (min. 5 presenze)'),

    -- Stagione 9
    (50463, 9, 'capocannoniere', 'Capocannoniere Serie A', 'OLD', '9 Gol', 'Miglior marcatore Stagione 9'),
    (50011, 9, 'assistman', 'Miglior Assist-man', 'VFC', '5 Assist', 'Miglior fornitore di assist Stagione 9 (ex-aequo)'),
    (50158, 9, 'assistman', 'Miglior Assist-man', 'PFC', '5 Assist', 'Miglior fornitore di assist Stagione 9 (ex-aequo)'),
    (50225, 9, 'assistman', 'Miglior Assist-man', 'MAR', '5 Assist', 'Miglior fornitore di assist Stagione 9 (ex-aequo)'),
    (50220, 9, 'assistman', 'Miglior Assist-man', 'OLD', '5 Assist', 'Miglior fornitore di assist Stagione 9 (ex-aequo)'),
    (50043, 9, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'ALV', '6 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 9'),
    (50277, 9, 'mvp', 'MVP della Stagione', 'ACD', 'Media Voto 7.41', 'Miglior media voto Stagione 9 (min. 5 presenze)'),

    -- Stagione 10
    (50374, 10, 'capocannoniere', 'Capocannoniere Serie A', 'RMB', '16 Gol', 'Miglior marcatore Stagione 10 (ex-aequo)'),
    (50463, 10, 'capocannoniere', 'Capocannoniere Serie A', 'OLD', '16 Gol', 'Miglior marcatore Stagione 10 (ex-aequo)'),
    (50181, 10, 'assistman', 'Miglior Assist-man', 'ALV', '10 Assist', 'Miglior fornitore di assist Stagione 10'),
    (50193, 10, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'MAR', '4 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 10 (ex-aequo)'),
    (50043, 10, 'golden_glove', 'Guanto d''Oro (Miglior Portiere)', 'ALV', '4 Clean Sheet', 'Miglior portiere per porte inviolate Stagione 10 (ex-aequo)'),
    (50181, 10, 'mvp', 'MVP della Stagione', 'ALV', 'Media Voto 8.26', 'Miglior media voto Stagione 10 (min. 5 presenze)');

GRANT SELECT ON public.player_awards TO anon, authenticated, service_role;
