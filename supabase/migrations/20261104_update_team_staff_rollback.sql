-- ==============================================================================
-- LCSIM Migration Rollback: RPC per Aggiornamento Staff Squadra
-- File: supabase/migrations/20261104_update_team_staff_rollback.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_update_team_staff(TEXT, TEXT, TEXT, TEXT);
