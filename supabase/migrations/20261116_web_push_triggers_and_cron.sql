-- ==============================================================================
-- Migrazione: 20261116_web_push_triggers_and_cron.sql
-- Descrizione: Abilita pg_net e pg_cron, crea i trigger automatici per
--              inviare Web Push via Edge Function 'send-web-push' sugli eventi
--              Inbox e schedula il reminder -24h per la chiusura formazioni.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Registro invii reminder -24h (evita invii multipli nella stessa giornata)
CREATE TABLE IF NOT EXISTS public.push_deadline_reminders_log (
  stag INT NOT NULL,
  week INT NOT NULL,
  reminded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (stag, week)
);

-- 2. Helper invio asincrono verso Edge Function send-web-push via pg_net
CREATE OR REPLACE FUNCTION public.invoke_send_web_push(p_payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hzenyasrargpsbuaxmxl.supabase.co/functions/v1/send-web-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := p_payload
  );
EXCEPTION WHEN OTHERS THEN
  -- Non bloccare mai l'operazione principale del database in caso di errori HTTP
  RAISE WARNING 'invoke_send_web_push failed: %', SQLERRM;
END;
$$;

-- 3. Trigger: Comunicati Ufficiali (league_announcements)
CREATE OR REPLACE FUNCTION public.trg_push_league_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.invoke_send_web_push(
    jsonb_build_object(
      'title', '📢 ' || COALESCE(NEW.title, 'Nuovo Comunicato Lega'),
      'body', LEFT(COALESCE(NEW.content, 'Nuovo comunicato ufficiale pubblicato in Inbox.'), 140),
      'url', '/inbox',
      'tag', 'ann-' || NEW.id::TEXT
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_league_announcement_push ON public.league_announcements;
CREATE TRIGGER trg_after_insert_league_announcement_push
  AFTER INSERT ON public.league_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_push_league_announcement();

-- 4. Trigger: Trattative & Scambi (market_trades)
CREATE OR REPLACE FUNCTION public.trg_push_market_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.invoke_send_web_push(
      jsonb_build_object(
        'title', '📥 Nuova Offerta di Scambio',
        'body', NEW.sender_team || ' ti ha inviato una proposta di trattativa.',
        'url', '/mia-squadra/trattative',
        'tag', 'trade-recv-' || NEW.id::TEXT,
        'target_team_id', NEW.receiver_team
      )
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'pending_admin' THEN
      PERFORM public.invoke_send_web_push(
        jsonb_build_object(
          'title', '⚖️ Scambio da Convalidare (' || NEW.sender_team || ' ↔ ' || NEW.receiver_team || ')',
          'body', 'Entrambi i club hanno accettato. È richiesta la convalida Admin.',
          'url', '/mia-squadra/trattative',
          'tag', 'trade-admin-' || NEW.id::TEXT,
          'target_admin', true
        )
      );
    ELSIF NEW.status = 'completed' THEN
      PERFORM public.invoke_send_web_push(
        jsonb_build_object(
          'title', '🏆 Scambio Ufficiale Approvato (' || NEW.sender_team || ' ↔ ' || NEW.receiver_team || ')',
          'body', 'La Lega ha convalidato lo scambio! Rose e scelte aggiornate.',
          'url', '/inbox',
          'tag', 'trade-comp-' || NEW.id::TEXT
        )
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.invoke_send_web_push(
        jsonb_build_object(
          'title', '❌ Offerta Rifiutata da ' || NEW.receiver_team,
          'body', COALESCE(NULLIF(TRIM(NEW.rejection_reason), ''), 'La società destinataria ha declinato la proposta.'),
          'url', '/mia-squadra/trattative',
          'tag', 'trade-rej-' || NEW.id::TEXT,
          'target_team_id', NEW.sender_team
        )
      );
    ELSIF NEW.status = 'admin_rejected' THEN
      PERFORM public.invoke_send_web_push(
        jsonb_build_object(
          'title', '⛔ Scambio Respinto dalla Lega (' || NEW.sender_team || ' ↔ ' || NEW.receiver_team || ')',
          'body', COALESCE(NULLIF(TRIM(NEW.rejection_reason), ''), 'La Commissione non ha convalidato lo scambio.'),
          'url', '/mia-squadra/trattative',
          'tag', 'trade-admrej-' || NEW.id::TEXT,
          'target_team_ids', jsonb_build_array(NEW.sender_team, NEW.receiver_team)
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_write_market_trade_push ON public.market_trades;
CREATE TRIGGER trg_after_write_market_trade_push
  AFTER INSERT OR UPDATE ON public.market_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_push_market_trade();

-- 5. Trigger: Messaggi Trattativa (trade_messages)
CREATE OR REPLACE FUNCTION public.trg_push_trade_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_team TEXT;
  v_receiver_team TEXT;
  v_target_team TEXT;
BEGIN
  SELECT sender_team, receiver_team
  INTO v_sender_team, v_receiver_team
  FROM public.market_trades
  WHERE id = NEW.trade_id;

  IF v_sender_team IS NOT NULL AND v_receiver_team IS NOT NULL THEN
    v_target_team := CASE
      WHEN v_sender_team = NEW.sender_team THEN v_receiver_team
      ELSE v_sender_team
    END;

    PERFORM public.invoke_send_web_push(
      jsonb_build_object(
        'title', '💬 Messaggio da ' || COALESCE(NEW.sender_name, NEW.sender_team),
        'body', LEFT(COALESCE(NEW.message, 'Nuovo messaggio nella chat trattativa.'), 120),
        'url', '/mia-squadra/trattative',
        'tag', 'trade-msg-' || NEW.id::TEXT,
        'target_team_id', v_target_team
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_trade_message_push ON public.trade_messages;
CREATE TRIGGER trg_after_insert_trade_message_push
  AFTER INSERT ON public.trade_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_push_trade_message();

-- 6. Trigger: Conferenze Stampa (press_conferences)
CREATE OR REPLACE FUNCTION public.trg_push_press_conference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'PENDING' THEN
    PERFORM public.invoke_send_web_push(
      jsonb_build_object(
        'title', '🎙️ Nuova Domanda Sala Stampa (G' || COALESCE(NEW.matchday::TEXT, '') || ')',
        'body', LEFT(COALESCE(NEW.question, 'Il giornalista della Lega attende una tua dichiarazione.'), 140),
        'url', '/inbox',
        'tag', 'press-pending-' || NEW.id::TEXT,
        'target_team_id', NEW.team_id
      )
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'ANSWERED' AND OLD.status IS DISTINCT FROM 'ANSWERED' THEN
    PERFORM public.invoke_send_web_push(
      jsonb_build_object(
        'title', '📰 Dichiarazioni da ' || NEW.team_id || ' in Sala Stampa',
        'body', LEFT(COALESCE(NEW.answer, NEW.question, 'Nuova intervista pubblicata nella Inbox.'), 140),
        'url', '/inbox',
        'tag', 'press-ans-' || NEW.id::TEXT,
        'exclude_team_id', NEW.team_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_write_press_conference_push ON public.press_conferences;
CREATE TRIGGER trg_after_write_press_conference_push
  AFTER INSERT OR UPDATE ON public.press_conferences
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_push_press_conference();

-- 7. Trigger: Voci di Mercato (league_market_rumors)
CREATE OR REPLACE FUNCTION public.trg_push_market_rumor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.is_active, true) THEN
    PERFORM public.invoke_send_web_push(
      jsonb_build_object(
        'title', '🔥 ' || COALESCE(NEW.source_label, 'Voci di Mercato'),
        'body', COALESCE(NEW.headline, 'Nuova indiscrezione di calciomercato in Inbox.'),
        'url', '/inbox',
        'tag', 'rumor-' || NEW.id::TEXT
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_market_rumor_push ON public.league_market_rumors;
CREATE TRIGGER trg_after_insert_market_rumor_push
  AFTER INSERT ON public.league_market_rumors
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_push_market_rumor();

-- 8. Job Cron: Reminder -24h scadenza consegna formazioni (ogni 30 minuti)
CREATE OR REPLACE FUNCTION public.cron_check_formation_deadline_push()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  v_hours_left INT;
  v_deadline_str TEXT;
BEGIN
  FOR rec IN
    SELECT stag, week, deadline
    FROM public.league_deadlines
    WHERE is_active = true
      AND COALESCE(is_force_closed, false) = false
      AND deadline IS NOT NULL
      AND deadline > now()
      AND deadline <= now() + interval '24 hours'
  LOOP
    INSERT INTO public.push_deadline_reminders_log (stag, week)
    VALUES (rec.stag, rec.week)
    ON CONFLICT (stag, week) DO NOTHING;

    IF FOUND THEN
      v_hours_left := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (rec.deadline - now())) / 3600.0)::INT);
      v_deadline_str := TO_CHAR(rec.deadline AT TIME ZONE 'Europe/Rome', 'DD/MM HH24:MI');

      PERFORM public.invoke_send_web_push(
        jsonb_build_object(
          'title', '⏰ Scadenza Formazione Giornata ' || rec.week::TEXT,
          'body', 'Mancano meno di ' || v_hours_left::TEXT || 'h alla chiusura (' || v_deadline_str || '). Inserisci o controlla la tua tattica!',
          'url', '/mia-squadra/tattica',
          'tag', 'deadline-' || rec.stag::TEXT || '-' || rec.week::TEXT,
          'exclude_admin', true
        )
      );
    END IF;
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lcsim-deadline-push-24h') THEN
    PERFORM cron.unschedule('lcsim-deadline-push-24h');
  END IF;
END $$;

SELECT cron.schedule(
  'lcsim-deadline-push-24h',
  '*/30 * * * *',
  $$SELECT public.cron_check_formation_deadline_push();$$
);
