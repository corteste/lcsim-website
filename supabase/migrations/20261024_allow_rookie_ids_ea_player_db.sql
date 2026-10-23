-- ==============================================================================
-- LCSIM - Migrazione: Permetti ID Rookie in public.ea_player_db
-- Rimuove il vincolo FOREIGN KEY su an_player("ID") per consentire a ea_player_db
-- di memorizzare sia i giocatori attivi (an_player) sia i rookie del Draft (an_rookie).
-- ==============================================================================

-- 1. Rimozione vincolo Foreign Key su public.ea_player_db
ALTER TABLE public.ea_player_db DROP CONSTRAINT IF EXISTS ea_player_db_playerid_fkey;

-- 2. Inserimento record automazione per l'importazione della classe rookie
INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details)
VALUES
    ('import_rookie_class', 'Importa Classe Rookie', NULL, NULL, '{}'::JSONB)
ON CONFLICT (id) DO NOTHING;
