-- ==============================================================================
-- LCSIM - Rollback Modulo Scambi di Mercato (Punto 2.1)
-- ==============================================================================

-- 1. Rimozione Funzione Atomica
DROP FUNCTION IF EXISTS public.rpc_execute_trade(uuid, text);

-- 2. Rimozione Tabelle e relative dipendenze
DROP TABLE IF EXISTS public.trade_messages CASCADE;
DROP TABLE IF EXISTS public.market_trades CASCADE;
