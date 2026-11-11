-- ==============================================================================
-- Migrazione: Commenti e Reazioni Pubbliche alle Trattative Concluse in Sala Stampa
-- File: supabase/migrations/20261111_trade_public_replies.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.trade_public_replies (
    id BIGSERIAL PRIMARY KEY,
    trade_id UUID NOT NULL REFERENCES public.market_trades(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES public.an_team("TEAM_ID") ON DELETE CASCADE,
    manager_name TEXT,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_trade_public_replies_trade ON public.trade_public_replies(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_public_replies_team ON public.trade_public_replies(team_id);
CREATE INDEX IF NOT EXISTS idx_trade_public_replies_created ON public.trade_public_replies(created_at);

ALTER TABLE public.trade_public_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_public_replies_select" ON public.trade_public_replies;
CREATE POLICY "trade_public_replies_select" ON public.trade_public_replies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "trade_public_replies_insert" ON public.trade_public_replies;
CREATE POLICY "trade_public_replies_insert" ON public.trade_public_replies
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "trade_public_replies_delete" ON public.trade_public_replies;
CREATE POLICY "trade_public_replies_delete" ON public.trade_public_replies
    FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_public_replies TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.trade_public_replies_id_seq TO anon, authenticated, service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trade_public_replies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_public_replies;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rpc_submit_trade_reply(
    p_trade_id UUID,
    p_team_id VARCHAR(10),
    p_reply_text TEXT,
    p_manager_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reply_id BIGINT;
    v_final_mgr TEXT;
BEGIN
    IF p_reply_text IS NULL OR TRIM(p_reply_text) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Il testo del commento non può essere vuoto.');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.market_trades WHERE id = p_trade_id AND status = 'completed') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trattativa non valida o non ancora completata.');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.an_team WHERE "TEAM_ID" = p_team_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Squadra non trovata.');
    END IF;

    IF p_manager_name IS NOT NULL AND TRIM(p_manager_name) <> '' THEN
        v_final_mgr := TRIM(p_manager_name);
    ELSE
        SELECT "MANAGER" INTO v_final_mgr FROM public.an_team WHERE "TEAM_ID" = p_team_id;
        v_final_mgr := COALESCE(v_final_mgr, 'Presidente');
    END IF;

    INSERT INTO public.trade_public_replies (
        trade_id, team_id, manager_name, reply_text, created_at
    ) VALUES (
        p_trade_id, p_team_id, v_final_mgr, TRIM(p_reply_text), timezone('utc', now())
    )
    RETURNING id INTO v_reply_id;

    RETURN jsonb_build_object(
        'success', true,
        'reply_id', v_reply_id,
        'manager_name', v_final_mgr
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_submit_trade_reply(UUID, VARCHAR, TEXT, TEXT) TO anon, authenticated, service_role;
