-- ==============================================================================
-- Migrazione: 20261031_drop_legacy_uppercase_stats_views.sql
-- Descrizione: Rimozione definitiva delle viste alias legacy in uppercase
--              (VIEW_PLAYER_STATS, AS_TEAM_STAT, AS_PLAYER_STAT).
--              Tutte le chiamate applicative e le routine interne sono state
--              migrate con successo alle tabelle e viste lowercase:
--              as_team_stat, as_player_stat, view_player_stats.
-- ==============================================================================

DROP VIEW IF EXISTS public."VIEW_PLAYER_STATS" CASCADE;
DROP VIEW IF EXISTS public."AS_TEAM_STAT" CASCADE;
DROP VIEW IF EXISTS public."AS_PLAYER_STAT" CASCADE;
