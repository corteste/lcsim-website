-- ==============================================================================
-- Rollback: 20261116_trade_conflict_guard_rpc_rollback.sql
-- Descrizione: Ripristina rpc_execute_trade alla versione 20261023.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_execute_trade(p_trade_id UUID, p_admin_user TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade RECORD;
BEGIN
    SELECT * INTO v_trade FROM public.market_trades WHERE id = p_trade_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trattativa non trovata.');
    END IF;

    IF v_trade.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lo scambio è già stato completato in precedenza.');
    END IF;

    IF array_length(v_trade.offered_player_ids, 1) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = v_trade.receiver_team
        WHERE "ID" = ANY(v_trade.offered_player_ids);
    END IF;

    IF array_length(v_trade.requested_player_ids, 1) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = v_trade.sender_team
        WHERE "ID" = ANY(v_trade.requested_player_ids);
    END IF;

    IF array_length(v_trade.offered_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.receiver_team
        WHERE pick_overall = ANY(v_trade.offered_pick_numbers);
    END IF;

    IF array_length(v_trade.requested_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.sender_team
        WHERE pick_overall = ANY(v_trade.requested_pick_numbers);
    END IF;

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
