-- ==============================================================================
-- Rollback: 20261117_allow_archive_transactions_write_rollback.sql
-- Descrizione: Ripristina le policy di sola lettura su an_player_transactions e
--              an_player_career_seasons.
-- ==============================================================================

DROP POLICY IF EXISTS "Allow insert on an_player_transactions" ON public.an_player_transactions;
DROP POLICY IF EXISTS "Allow write on an_player_career_seasons" ON public.an_player_career_seasons;

REVOKE INSERT ON TABLE public.an_player_transactions FROM anon, authenticated;
REVOKE INSERT, UPDATE ON TABLE public.an_player_career_seasons FROM anon, authenticated;
