-- ==============================================================================
-- Migrazione: Reset Gettoni e Scouting Effettuato per Squadra APD
-- File: supabase/migrations/20261108_reset_apd_scouting.sql
-- ==============================================================================

-- Elimina tutti i report e le allocazioni gettoni scouting per la squadra APD
DELETE FROM public.an_rookie_scouting
WHERE team_id = 'APD';

NOTIFY pgrst, 'reload schema';
