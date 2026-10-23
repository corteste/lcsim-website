-- ==============================================================================
-- LCSIM - Modulo Scambi di Mercato & Trattative (Punto 2.1)
-- Migrazione Tabelle & Funzione di Esecuzione Atomica
-- ==============================================================================

-- 1. Tabella Principale Trattative di Mercato
CREATE TABLE IF NOT EXISTS public.market_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_team TEXT NOT NULL,
    receiver_team TEXT NOT NULL,
    offered_player_ids INTEGER[] NOT NULL DEFAULT '{}',
    offered_pick_numbers INTEGER[] NOT NULL DEFAULT '{}',
    requested_player_ids INTEGER[] NOT NULL DEFAULT '{}',
    requested_pick_numbers INTEGER[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_admin', 'completed', 'rejected', 'cancelled', 'admin_rejected')),
    notes TEXT,
    rejection_reason TEXT,
    parent_trade_id UUID REFERENCES public.market_trades(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    completed_by TEXT
);

-- 2. Tabella Messaggi / Negoziazione per ciascuna trattativa
CREATE TABLE IF NOT EXISTS public.trade_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.market_trades(id) ON DELETE CASCADE,
    sender_team TEXT NOT NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indici per performance e query veloci
CREATE INDEX IF NOT EXISTS idx_market_trades_sender ON public.market_trades(sender_team);
CREATE INDEX IF NOT EXISTS idx_market_trades_receiver ON public.market_trades(receiver_team);
CREATE INDEX IF NOT EXISTS idx_market_trades_status ON public.market_trades(status);
CREATE INDEX IF NOT EXISTS idx_market_trades_created_at ON public.market_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_messages_trade_id ON public.trade_messages(trade_id, created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.market_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_messages ENABLE ROW LEVEL SECURITY;

-- 5. Policies RLS (Accesso tramite API anonima configurata nel frontend)
DROP POLICY IF EXISTS "Public access on market_trades" ON public.market_trades;
CREATE POLICY "Public access on market_trades" ON public.market_trades FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on trade_messages" ON public.trade_messages;
CREATE POLICY "Public access on trade_messages" ON public.trade_messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Funzione RPC Atomica per l'approvazione ed esecuzione dello scambio da parte dell'Admin
CREATE OR REPLACE FUNCTION public.rpc_execute_trade(p_trade_id UUID, p_admin_user TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade RECORD;
BEGIN
    -- Seleziona e blocca la riga per prevenire race conditions
    SELECT * INTO v_trade FROM public.market_trades WHERE id = p_trade_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trattativa non trovata.');
    END IF;
    
    IF v_trade.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lo scambio è già stato completato in precedenza.');
    END IF;

    -- 1. Trasferisci i calciatori offerti dal sender alla squadra receiver
    IF array_length(v_trade.offered_player_ids, 1) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = v_trade.receiver_team
        WHERE "ID" = ANY(v_trade.offered_player_ids);
    END IF;

    -- 2. Trasferisci i calciatori richiesti dal receiver alla squadra sender
    IF array_length(v_trade.requested_player_ids, 1) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = v_trade.sender_team
        WHERE "ID" = ANY(v_trade.requested_player_ids);
    END IF;

    -- 3. Trasferisci le scelte del draft offerte dal sender al receiver
    IF array_length(v_trade.offered_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.receiver_team
        WHERE pick_overall = ANY(v_trade.offered_pick_numbers);
    END IF;

    -- 4. Trasferisci le scelte del draft richieste dal receiver al sender
    IF array_length(v_trade.requested_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.sender_team
        WHERE pick_overall = ANY(v_trade.requested_pick_numbers);
    END IF;

    -- 5. Aggiorna lo stato dello scambio a 'completed' con timestamp e firma admin
    UPDATE public.market_trades
    SET 
        status = 'completed',
        updated_at = timezone('utc'::text, now()),
        completed_at = timezone('utc'::text, now()),
        completed_by = p_admin_user
    WHERE id = p_trade_id;

    RETURN jsonb_build_object('success', true, 'trade_id', p_trade_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
