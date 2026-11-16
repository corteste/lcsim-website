-- ==============================================================================
-- Migrazione: 20261116_trade_conflict_guard_rpc.sql
-- Descrizione: Aggiorna public.rpc_execute_trade per:
--              1) Verificare prima dell'esecuzione che tutti i calciatori e le
--                 scelte appartengano ancora alle rispettive squadre.
--              2) Annullare automaticamente eventuali altre trattative parallele
--                 (pending / pending_admin) sugli stessi calciatori o scelte.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_execute_trade(p_trade_id UUID, p_admin_user TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade RECORD;
    v_all_players INT[];
    v_all_picks INT[];
    v_count INT;
    v_conflict RECORD;
BEGIN
    -- Seleziona e blocca la riga per prevenire race conditions
    SELECT * INTO v_trade FROM public.market_trades WHERE id = p_trade_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trattativa non trovata.');
    END IF;

    IF v_trade.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lo scambio è già stato completato in precedenza.');
    END IF;

    IF v_trade.status IN ('cancelled', 'rejected', 'admin_rejected') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lo scambio non è più attivo (stato: ' || v_trade.status || ').');
    END IF;

    -- 0. Verifica proprietà attuale di calciatori e scelte
    IF COALESCE(array_length(v_trade.offered_player_ids, 1), 0) > 0 THEN
        SELECT COUNT(*) INTO v_count
        FROM public.an_player
        WHERE "ID" = ANY(v_trade.offered_player_ids)
          AND "Squadra" = v_trade.sender_team;
        IF v_count <> array_length(v_trade.offered_player_ids, 1) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Uno o più calciatori offerti non appartengono più a ' || v_trade.sender_team || '.');
        END IF;
    END IF;

    IF COALESCE(array_length(v_trade.requested_player_ids, 1), 0) > 0 THEN
        SELECT COUNT(*) INTO v_count
        FROM public.an_player
        WHERE "ID" = ANY(v_trade.requested_player_ids)
          AND "Squadra" = v_trade.receiver_team;
        IF v_count <> array_length(v_trade.requested_player_ids, 1) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Uno o più calciatori richiesti non appartengono più a ' || v_trade.receiver_team || '.');
        END IF;
    END IF;

    IF COALESCE(array_length(v_trade.offered_pick_numbers, 1), 0) > 0 THEN
        SELECT COUNT(*) INTO v_count
        FROM public.an_draft_board
        WHERE pick_overall = ANY(v_trade.offered_pick_numbers)
          AND team_id = v_trade.sender_team;
        IF v_count <> array_length(v_trade.offered_pick_numbers, 1) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Una o più scelte offerte non appartengono più a ' || v_trade.sender_team || '.');
        END IF;
    END IF;

    IF COALESCE(array_length(v_trade.requested_pick_numbers, 1), 0) > 0 THEN
        SELECT COUNT(*) INTO v_count
        FROM public.an_draft_board
        WHERE pick_overall = ANY(v_trade.requested_pick_numbers)
          AND team_id = v_trade.receiver_team;
        IF v_count <> array_length(v_trade.requested_pick_numbers, 1) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Una o più scelte richieste non appartengono più a ' || v_trade.receiver_team || '.');
        END IF;
    END IF;

    -- 1. Trasferisci i calciatori offerti dal sender alla squadra receiver
    IF COALESCE(array_length(v_trade.offered_player_ids, 1), 0) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = v_trade.receiver_team
        WHERE "ID" = ANY(v_trade.offered_player_ids);
    END IF;

    -- 2. Trasferisci i calciatori richiesti dal receiver alla squadra sender
    IF COALESCE(array_length(v_trade.requested_player_ids, 1), 0) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = v_trade.sender_team
        WHERE "ID" = ANY(v_trade.requested_player_ids);
    END IF;

    -- 3. Trasferisci le scelte del draft offerte dal sender al receiver
    IF COALESCE(array_length(v_trade.offered_pick_numbers, 1), 0) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.receiver_team
        WHERE pick_overall = ANY(v_trade.offered_pick_numbers);
    END IF;

    -- 4. Trasferisci le scelte del draft richieste dal receiver al sender
    IF COALESCE(array_length(v_trade.requested_pick_numbers, 1), 0) > 0 THEN
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

    -- 6. Annulla automaticamente eventuali altre trattative parallele sugli stessi asset
    v_all_players := COALESCE(v_trade.offered_player_ids, '{}'::INT[]) || COALESCE(v_trade.requested_player_ids, '{}'::INT[]);
    v_all_picks := COALESCE(v_trade.offered_pick_numbers, '{}'::INT[]) || COALESCE(v_trade.requested_pick_numbers, '{}'::INT[]);

    FOR v_conflict IN
        SELECT id, sender_team
        FROM public.market_trades
        WHERE id <> p_trade_id
          AND status IN ('pending', 'pending_admin')
          AND (
            (COALESCE(array_length(v_all_players, 1), 0) > 0 AND (
              COALESCE(offered_player_ids, '{}'::INT[]) && v_all_players OR
              COALESCE(requested_player_ids, '{}'::INT[]) && v_all_players
            ))
            OR
            (COALESCE(array_length(v_all_picks, 1), 0) > 0 AND (
              COALESCE(offered_pick_numbers, '{}'::INT[]) && v_all_picks OR
              COALESCE(requested_pick_numbers, '{}'::INT[]) && v_all_picks
            ))
          )
    LOOP
        UPDATE public.market_trades
        SET
            status = 'cancelled',
            rejection_reason = 'Annullata automaticamente: uno o più asset sono stati ceduti in un altro scambio.',
            updated_at = timezone('utc'::text, now())
        WHERE id = v_conflict.id;

        INSERT INTO public.trade_messages (trade_id, sender_team, sender_name, message)
        VALUES (
            v_conflict.id,
            v_conflict.sender_team,
            'Sistema',
            '⚠️ Trattativa annullata automaticamente: uno o più calciatori/scelte coinvolti sono stati trasferiti in un altro scambio.'
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'trade_id', p_trade_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
