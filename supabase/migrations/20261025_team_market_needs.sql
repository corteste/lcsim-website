-- ============================================================================
-- MIGRATION: 20261025_team_market_needs.sql
-- DESCRIZIONE: Tabella per la gestione dei bisogni di calciomercato delle 12 squadre
--              suddivisi per le 8 macro-categorie (POR, TER, DC, CDC, CC, EST, COC, ATT).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_market_needs (
  team_id TEXT PRIMARY KEY REFERENCES public.an_team("TEAM_ID") ON DELETE CASCADE,
  needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by TEXT NULL
);

-- Indici di performance
CREATE INDEX IF NOT EXISTS idx_team_market_needs_team_id ON public.team_market_needs(team_id);

-- Abilitazione RLS
ALTER TABLE public.team_market_needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select team_market_needs" ON public.team_market_needs;
CREATE POLICY "Allow select team_market_needs"
ON public.team_market_needs
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow write team_market_needs" ON public.team_market_needs;
CREATE POLICY "Allow write team_market_needs"
ON public.team_market_needs
FOR ALL
USING (true)
WITH CHECK (true);

-- Popolamento iniziale dei 12 club ufficiali da an_team se non ancora presenti
INSERT INTO public.team_market_needs (team_id, needs, updated_at, updated_by)
SELECT "TEAM_ID", '[]'::jsonb, timezone('utc'::text, now()), 'Sistema'
FROM public.an_team
ON CONFLICT (team_id) DO NOTHING;

-- Aggiunta a realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_market_needs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_market_needs;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignora se già presente o permessi limitati in pooler
    NULL;
END $$;
