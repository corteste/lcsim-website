-- ==============================================================================
-- Migrazione: Tabella Repliche / Botta e Risposta Interviste (Punto #69)
-- File: supabase/migrations/20261109_press_conference_replies.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.press_conference_replies (
    id BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES public.press_conferences(id) ON DELETE CASCADE,
    team_id VARCHAR(10) NOT NULL REFERENCES public.an_team("TEAM_ID") ON DELETE CASCADE,
    manager_name TEXT,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_press_conference_replies_conf ON public.press_conference_replies(conference_id);
CREATE INDEX IF NOT EXISTS idx_press_conference_replies_team ON public.press_conference_replies(team_id);
CREATE INDEX IF NOT EXISTS idx_press_conference_replies_created ON public.press_conference_replies(created_at);

ALTER TABLE public.press_conference_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "press_conference_replies_select" ON public.press_conference_replies;
CREATE POLICY "press_conference_replies_select" ON public.press_conference_replies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "press_conference_replies_insert" ON public.press_conference_replies;
CREATE POLICY "press_conference_replies_insert" ON public.press_conference_replies
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "press_conference_replies_delete" ON public.press_conference_replies;
CREATE POLICY "press_conference_replies_delete" ON public.press_conference_replies
    FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_conference_replies TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.press_conference_replies_id_seq TO anon, authenticated, service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'press_conference_replies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.press_conference_replies;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rpc_submit_conference_reply(
    p_conference_id BIGINT,
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
    IF p_reply_text IS NULL OR length(trim(p_reply_text)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Il testo della replica non può essere vuoto.');
    END IF;

    IF p_manager_name IS NULL OR length(trim(p_manager_name)) = 0 THEN
        SELECT "MANAGER" INTO v_final_mgr FROM public.an_team WHERE "TEAM_ID" = p_team_id;
    ELSE
        v_final_mgr := trim(p_manager_name);
    END IF;

    INSERT INTO public.press_conference_replies (
        conference_id,
        team_id,
        manager_name,
        reply_text
    ) VALUES (
        p_conference_id,
        p_team_id,
        v_final_mgr,
        trim(p_reply_text)
    )
    RETURNING id INTO v_reply_id;

    RETURN jsonb_build_object(
        'success', true,
        'reply_id', v_reply_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_submit_conference_reply TO anon, authenticated, service_role;
