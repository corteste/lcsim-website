-- ==============================================================================
-- Rollback: 20261116_user_notification_reads_rollback.sql
-- Descrizione: Rimuove la tabella public.user_notification_reads.
-- ==============================================================================

DROP TABLE IF EXISTS public.user_notification_reads CASCADE;
