-- ==============================================================================
-- LCSIM - Tabella Stato e Timestamp Automazioni di Lega
-- Memorizza l'ultima esecuzione (timestamp e autore) per i comandi di amministrazione
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.league_automation_state (
    id TEXT PRIMARY KEY,
    action_name TEXT NOT NULL,
    last_run_at TIMESTAMPTZ,
    last_run_by TEXT,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Abilitazione RLS
ALTER TABLE public.league_automation_state ENABLE ROW LEVEL SECURITY;

-- Tutti possono leggere lo stato
DROP POLICY IF EXISTS "Anyone can read league_automation_state" ON public.league_automation_state;
CREATE POLICY "Anyone can read league_automation_state"
    ON public.league_automation_state FOR SELECT
    USING (true);

-- Scrittura aperta per anon, authenticated e service_role
DROP POLICY IF EXISTS "Allow write league_automation_state" ON public.league_automation_state;
CREATE POLICY "Allow write league_automation_state"
    ON public.league_automation_state FOR ALL
    USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.league_automation_state TO anon, authenticated, service_role;

-- Inserimento record iniziali per le automazioni di lega
INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details)
VALUES
    ('export_master_table', 'Export Master Table EA FC 25', NULL, NULL, '{"format": "tsv", "columns": 137}'::JSONB),
    ('aging_players', 'Applica Invecchiamento Calciatori', NULL, NULL, '{}'::JSONB),
    ('market_toggle', 'Controllo Finestra Calciomercato', NULL, NULL, '{"status": "open"}'::JSONB),
    ('roster_lock', 'Blocco / Sblocco Rose', NULL, NULL, '{"status": "unlocked"}'::JSONB)
ON CONFLICT (id) DO NOTHING;
