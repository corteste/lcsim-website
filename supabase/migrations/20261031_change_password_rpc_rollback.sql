-- ==============================================================================
-- ROLLBACK - Modulo Cambio Password Autonomo (#16)
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_change_password(TEXT, TEXT, TEXT);
