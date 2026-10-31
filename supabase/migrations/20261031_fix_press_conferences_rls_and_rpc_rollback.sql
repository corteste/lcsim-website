-- ==============================================================================
-- Rollback: 20261031_fix_press_conferences_rls_and_rpc_rollback.sql
-- Descrizione: Ripristina le policy RLS definite in 20261025_press_and_ai_rumors.sql
--              e rimuove le funzioni rpc_submit_press_answer e rpc_react_to_rumor.
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_submit_press_answer(BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_react_to_rumor(BIGINT, TEXT);

DROP POLICY IF EXISTS "press_conferences_update" ON public.press_conferences;
CREATE POLICY "press_conferences_update" ON public.press_conferences
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "press_conferences_insert" ON public.press_conferences;
CREATE POLICY "press_conferences_insert" ON public.press_conferences
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "league_market_rumors_update" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_update" ON public.league_market_rumors
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "league_market_rumors_insert" ON public.league_market_rumors;
CREATE POLICY "league_market_rumors_insert" ON public.league_market_rumors
    FOR INSERT TO authenticated WITH CHECK (true);
