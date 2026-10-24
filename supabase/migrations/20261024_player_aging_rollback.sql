-- ==============================================================================
-- Rollback Migrazione: Automatizzazione Applica Invecchiamenti & Gestione Ritiri (Punto #10)
-- File: supabase/migrations/20261024_player_aging_rollback.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_apply_player_aging(TEXT, JSONB, BIGINT[], TEXT, TEXT, JSONB);
