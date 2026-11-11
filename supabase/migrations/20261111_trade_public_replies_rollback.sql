-- ==============================================================================
-- Rollback: Commenti e Reazioni Pubbliche alle Trattative Concluse in Sala Stampa
-- File: supabase/migrations/20261111_trade_public_replies_rollback.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_submit_trade_reply(UUID, VARCHAR, TEXT, TEXT);
DROP TABLE IF EXISTS public.trade_public_replies CASCADE;
