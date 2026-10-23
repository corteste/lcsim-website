-- ==============================================================================
-- Migrazione: Storico Formazioni Inserite (Archivio Formazioni Passate)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.team_formation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id TEXT NOT NULL REFERENCES public.an_team("TEAM_ID") ON DELETE CASCADE,
    stag INTEGER NOT NULL DEFAULT 10,
    week INTEGER,
    formation TEXT NOT NULL,
    starters JSONB NOT NULL,
    bench_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    captain_id BIGINT,
    freekick_id BIGINT,
    penalty_id BIGINT,
    corner_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT DEFAULT 'user'
);

CREATE INDEX IF NOT EXISTS idx_formation_history_team_date 
ON public.team_formation_history(team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_formation_history_team_week 
ON public.team_formation_history(team_id, stag, week);

-- Row Level Security
ALTER TABLE public.team_formation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on team_formation_history" ON public.team_formation_history;
CREATE POLICY "Allow public read on team_formation_history" 
ON public.team_formation_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on team_formation_history" ON public.team_formation_history;
CREATE POLICY "Allow insert on team_formation_history" 
ON public.team_formation_history FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on team_formation_history" ON public.team_formation_history;
CREATE POLICY "Allow delete on team_formation_history" 
ON public.team_formation_history FOR DELETE USING (true);
