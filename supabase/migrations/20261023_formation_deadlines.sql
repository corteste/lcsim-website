-- Migrazione per la gestione delle scadenze formazioni e snapshot di giornata
-- Tabella 1: league_deadlines
CREATE TABLE IF NOT EXISTS public.league_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stag INTEGER NOT NULL,
    week INTEGER NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_force_closed BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_stag_week_deadline UNIQUE (stag, week)
);

-- Tabella 2: team_lineup_snapshots (salvataggio/congelamento formazioni per singola giornata)
CREATE TABLE IF NOT EXISTS public.team_lineup_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id TEXT NOT NULL,
    stag INTEGER NOT NULL,
    week INTEGER NOT NULL,
    formation TEXT NOT NULL,
    starters JSONB NOT NULL,
    bench_order JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    submitted_by TEXT,
    is_locked BOOLEAN DEFAULT false,
    CONSTRAINT unique_team_stag_week_snapshot UNIQUE (team_id, stag, week)
);

-- Indici di performance
CREATE INDEX IF NOT EXISTS idx_league_deadlines_stag_week ON public.league_deadlines(stag, week);
CREATE INDEX IF NOT EXISTS idx_league_deadlines_active ON public.league_deadlines(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_team_lineup_snapshots_lookup ON public.team_lineup_snapshots(team_id, stag, week);

-- Abilitazione Realtime per league_deadlines
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'league_deadlines'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.league_deadlines;
    END IF;
END $$;

-- Abilitazione RLS
ALTER TABLE public.league_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_lineup_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy league_deadlines: Chiunque può leggere
DROP POLICY IF EXISTS "Anyone can read league_deadlines" ON public.league_deadlines;
CREATE POLICY "Anyone can read league_deadlines" 
    ON public.league_deadlines FOR SELECT 
    USING (true);

-- Policy league_deadlines: Scrittura aperta
DROP POLICY IF EXISTS "Allow write league_deadlines" ON public.league_deadlines;
CREATE POLICY "Allow write league_deadlines" 
    ON public.league_deadlines FOR ALL 
    USING (true) WITH CHECK (true);

-- Policy team_lineup_snapshots: Chiunque può leggere
DROP POLICY IF EXISTS "Anyone can read team_lineup_snapshots" ON public.team_lineup_snapshots;
CREATE POLICY "Anyone can read team_lineup_snapshots" 
    ON public.team_lineup_snapshots FOR SELECT 
    USING (true);

-- Policy team_lineup_snapshots: Scrittura aperta
DROP POLICY IF EXISTS "Allow write team_lineup_snapshots" ON public.team_lineup_snapshots;
CREATE POLICY "Allow write team_lineup_snapshots" 
    ON public.team_lineup_snapshots FOR ALL 
    USING (true) WITH CHECK (true);

-- Inserimento record iniziale per la Giornata 1 della Stagione 11 (scadenza giovedì prossimo ore 20:00)
INSERT INTO public.league_deadlines (stag, week, deadline, is_active, is_force_closed, description)
VALUES (
    11, 
    1, 
    ((CURRENT_DATE + ((4 - EXTRACT(DOW FROM CURRENT_DATE)::INT + 7) % 7))::TEXT || ' 20:00:00+02')::TIMESTAMPTZ, 
    true, 
    false, 
    'Giornata 1 - Andata'
)
ON CONFLICT (stag, week) DO NOTHING;
