-- ==============================================================================
-- Rollback: 20261116_web_push_triggers_and_cron_rollback.sql
-- Descrizione: Rimuove il job pg_cron, i trigger e le funzioni Web Push.
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lcsim-deadline-push-24h') THEN
    PERFORM cron.unschedule('lcsim-deadline-push-24h');
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_after_insert_league_announcement_push ON public.league_announcements;
DROP TRIGGER IF EXISTS trg_after_write_market_trade_push ON public.market_trades;
DROP TRIGGER IF EXISTS trg_after_insert_trade_message_push ON public.trade_messages;
DROP TRIGGER IF EXISTS trg_after_write_press_conference_push ON public.press_conferences;
DROP TRIGGER IF EXISTS trg_after_insert_market_rumor_push ON public.league_market_rumors;

DROP FUNCTION IF EXISTS public.cron_check_formation_deadline_push();
DROP FUNCTION IF EXISTS public.trg_push_market_rumor();
DROP FUNCTION IF EXISTS public.trg_push_press_conference();
DROP FUNCTION IF EXISTS public.trg_push_trade_message();
DROP FUNCTION IF EXISTS public.trg_push_market_trade();
DROP FUNCTION IF EXISTS public.trg_push_league_announcement();
DROP FUNCTION IF EXISTS public.invoke_send_web_push(JSONB);

DROP TABLE IF EXISTS public.push_deadline_reminders_log CASCADE;
