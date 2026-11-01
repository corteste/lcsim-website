-- ==============================================================================
-- LCSIM Migration Rollback: RPC per Aggiornamento Allenatore Squadra
-- Data: 01/11/2026
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_update_team_coach(TEXT, TEXT, TEXT);
