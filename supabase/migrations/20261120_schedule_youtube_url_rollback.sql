-- ==============================================================================
-- Rollback: 20261120_schedule_youtube_url_rollback.sql
-- Descrizione: Rimuove le RPC e la colonna youtube_url da an_schedule.
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_admin_batch_set_match_youtube_urls(JSONB);
DROP FUNCTION IF EXISTS public.rpc_admin_set_match_youtube_url(INTEGER, INTEGER, TEXT, TEXT, TEXT);

ALTER TABLE public.an_schedule
  DROP COLUMN IF EXISTS youtube_url;

NOTIFY pgrst, 'reload schema';
