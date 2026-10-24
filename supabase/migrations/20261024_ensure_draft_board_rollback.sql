-- ==============================================================================
-- LCSIM - Rollback: Funzione RPC Ripristino & Integrità Draft Board
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_ensure_draft_board();

NOTIFY pgrst, 'reload schema';
