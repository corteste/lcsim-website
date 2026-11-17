-- ==============================================================================
-- Migrazione: 20261117_allow_archive_transactions_write.sql
-- Descrizione: Abilita INSERT/UPDATE RLS su an_player_transactions e
--              an_player_career_seasons per consentire la registrazione
--              automatica degli scambi e movimenti dall'app, e riallinea
--              la sequence su an_player_transactions(id).
-- ==============================================================================

DROP POLICY IF EXISTS "Allow insert on an_player_transactions" ON public.an_player_transactions;
CREATE POLICY "Allow insert on an_player_transactions"
  ON public.an_player_transactions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON TABLE public.an_player_transactions TO anon, authenticated;
GRANT ALL ON TABLE public.an_player_transactions TO service_role;

DROP POLICY IF EXISTS "Allow write on an_player_career_seasons" ON public.an_player_career_seasons;
CREATE POLICY "Allow write on an_player_career_seasons"
  ON public.an_player_career_seasons
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON TABLE public.an_player_career_seasons TO anon, authenticated;
GRANT ALL ON TABLE public.an_player_career_seasons TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DO $$
DECLARE
  seq_name text;
BEGIN
  seq_name := pg_get_serial_sequence('public.an_player_transactions', 'id');
  IF seq_name IS NOT NULL THEN
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(id) FROM public.an_player_transactions), 1))', seq_name);
  END IF;
END $$;
