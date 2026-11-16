-- ==============================================================================
-- Rollback: 20261116_serie_b_player_stat_rollback.sql
-- Descrizione: Rimuove la tabella dedicata alle statistiche Serie B (LCSIM 2).
-- ==============================================================================

DROP TABLE IF EXISTS public.as_serie_b_player_stat CASCADE;
