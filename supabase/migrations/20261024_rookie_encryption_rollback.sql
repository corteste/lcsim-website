-- ==============================================================================
-- LCSIM - Rollback Migrazione: Crittografia Zero-Knowledge Classe Rookie
-- ==============================================================================

-- 1. Rimozione RPC
DROP FUNCTION IF EXISTS public.rpc_undo_draft_rookie(INT, BIGINT);
DROP FUNCTION IF EXISTS public.rpc_draft_rookie(INT, BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_get_scouted_rookies(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_import_encrypted_rookies(JSONB, TEXT, TEXT);

-- 2. Rimozione Funzioni e Schema Vault
DROP FUNCTION IF EXISTS internal_vault.get_range3_mid(NUMERIC);
DROP FUNCTION IF EXISTS internal_vault.get_range10_mid(NUMERIC);
DROP TABLE IF EXISTS internal_vault.rookie_key;
DROP SCHEMA IF EXISTS internal_vault CASCADE;

-- 3. Rimozione colonna encrypted_data da public.an_rookie
ALTER TABLE public.an_rookie
  DROP COLUMN IF EXISTS encrypted_data;

NOTIFY pgrst, 'reload schema';
