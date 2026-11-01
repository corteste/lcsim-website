-- ==============================================================================
-- Migrazione: 20261101_league_bug_reports.sql
-- Descrizione: 
--   1. Crea la tabella public.league_bug_reports per archiviare i feedback di bug inviati dagli utenti.
--   2. Registra lo stato 'test_mode' nella tabella public.league_automation_state.
-- ==============================================================================

-- 1. Tabella Segnalazioni Bug & Feedback
CREATE TABLE IF NOT EXISTS public.league_bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_username TEXT,
    sender_team TEXT,
    page_url TEXT,
    category TEXT NOT NULL DEFAULT 'bug',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'resolved' | 'ignored'
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

-- Indice per filtraggio veloce per stato e data
CREATE INDEX IF NOT EXISTS idx_league_bug_reports_status_created 
    ON public.league_bug_reports (status, created_at DESC);

-- Abilitazione RLS
ALTER TABLE public.league_bug_reports ENABLE ROW LEVEL SECURITY;

-- Chiunque (anon e authenticated) può inserire un feedback
DROP POLICY IF EXISTS "Anyone can insert league_bug_reports" ON public.league_bug_reports;
CREATE POLICY "Anyone can insert league_bug_reports"
    ON public.league_bug_reports FOR INSERT
    WITH CHECK (true);

-- Chiunque può leggere le segnalazioni (per UI trasparente e dashboard admin)
DROP POLICY IF EXISTS "Anyone can read league_bug_reports" ON public.league_bug_reports;
CREATE POLICY "Anyone can read league_bug_reports"
    ON public.league_bug_reports FOR SELECT
    USING (true);

-- Modifica consentita per aggiornamento stato da parte dell'admin
DROP POLICY IF EXISTS "Allow update league_bug_reports" ON public.league_bug_reports;
CREATE POLICY "Allow update league_bug_reports"
    ON public.league_bug_reports FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Permessi
GRANT SELECT, INSERT, UPDATE, DELETE ON public.league_bug_reports TO anon, authenticated, service_role;

-- 2. Registrazione stato Modalità Test in league_automation_state
INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details)
VALUES
    ('test_mode', 'Modalità Test (Dry Run)', NULL, NULL, '{"is_active": false}'::JSONB)
ON CONFLICT (id) DO NOTHING;
