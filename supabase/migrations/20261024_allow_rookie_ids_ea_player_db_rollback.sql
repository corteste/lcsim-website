-- ==============================================================================
-- LCSIM - Rollback: Ripristina vincolo Foreign Key su public.ea_player_db
-- ==============================================================================

-- 1. Ripristino vincolo Foreign Key su an_player("ID")
ALTER TABLE public.ea_player_db
    ADD CONSTRAINT ea_player_db_playerid_fkey
    FOREIGN KEY (playerid) REFERENCES public.an_player("ID")
    ON UPDATE CASCADE ON DELETE CASCADE;

-- 2. Rimozione record automazione rookie import
DELETE FROM public.league_automation_state WHERE id = 'import_rookie_class';
