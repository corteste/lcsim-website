-- ==============================================================================
-- Rollback: 20261116_pwa_push_subscriptions_rollback.sql
-- Descrizione: Rimuove la tabella public.user_push_subscriptions.
-- ==============================================================================

DROP TABLE IF EXISTS public.user_push_subscriptions CASCADE;
