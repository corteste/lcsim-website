-- ==============================================================================
-- LCSIM Migration Rollback: Sincronizzazione Archivio Storico Scambi (Gaillard/Leite & Futuri)
-- File: supabase/migrations/20261112_sync_trade_gaillard_leite_archive_rollback.sql
-- ==============================================================================

-- 1. ROLLBACK SANATORIA SCAMBIO PREGRESSO
DELETE FROM public.an_player_transactions 
WHERE player_id IN (50380, 50653) AND stagione = 11 AND motivo = 'Scambio';

UPDATE public.an_player_career_seasons 
SET team_id = 'APD', franchise_id = 'APD', entry_motivo = 'Confermato' 
WHERE player_id = 50380 AND stagione = 11;

UPDATE public.an_player_career_seasons 
SET team_id = 'ACD', franchise_id = 'ACD', entry_motivo = 'Confermato' 
WHERE player_id = 50653 AND stagione = 11;

-- 2. RIPRISTINO VERSIONE PRECEDENTE DI rpc_execute_trade (da 20261110_trade_goalkeeper_exemption.sql)
CREATE OR REPLACE FUNCTION public.rpc_execute_trade(p_trade_id UUID, p_admin_user TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trade RECORD;
    v_all_traded_ids INT[];
    v_player_id INT;
    v_cur_jersey INT;
    v_new_jersey INT;
    v_taken_jerseys INT[];
    v_pick_num INT;
    v_sender_cur_por INT;
    v_receiver_cur_por INT;
    v_offered_por INT;
    v_requested_por INT;
    v_sender_post_por INT;
    v_receiver_post_por INT;
BEGIN
    SELECT * INTO v_trade FROM public.market_trades WHERE id = p_trade_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trattativa non trovata.');
    END IF;
    
    IF v_trade.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lo scambio è già stato completato in precedenza.');
    END IF;

    v_all_traded_ids := COALESCE(v_trade.offered_player_ids, ARRAY[]::INT[]) || COALESCE(v_trade.requested_player_ids, ARRAY[]::INT[]);

    SELECT count(*) INTO v_sender_cur_por
    FROM public.an_player
    WHERE "Squadra" = v_trade.sender_team AND "Posiz" = 'POR';

    SELECT count(*) INTO v_receiver_cur_por
    FROM public.an_player
    WHERE "Squadra" = v_trade.receiver_team AND "Posiz" = 'POR';

    SELECT count(*) INTO v_offered_por
    FROM public.an_player
    WHERE "ID" = ANY(COALESCE(v_trade.offered_player_ids, ARRAY[]::INT[])) AND "Posiz" = 'POR';

    SELECT count(*) INTO v_requested_por
    FROM public.an_player
    WHERE "ID" = ANY(COALESCE(v_trade.requested_player_ids, ARRAY[]::INT[])) AND "Posiz" = 'POR';

    v_sender_post_por := v_sender_cur_por - v_offered_por + v_requested_por;
    v_receiver_post_por := v_receiver_cur_por - v_requested_por + v_offered_por;

    IF v_sender_cur_por <= 1 THEN
        IF v_sender_post_por < 1 THEN
            RETURN jsonb_build_object('success', false, 'error', format('La squadra %s rimarrebbe con 0 portieri in rosa (vietato).', v_trade.sender_team));
        END IF;
    ELSE
        IF v_sender_post_por < 2 THEN
            RETURN jsonb_build_object('success', false, 'error', format('La squadra %s scenderebbe sotto il limite minimo di 2 portieri in rosa (ne avrebbe %s).', v_trade.sender_team, v_sender_post_por));
        END IF;
    END IF;

    IF v_sender_post_por > 3 THEN
        RETURN jsonb_build_object('success', false, 'error', format('La squadra %s supererebbe il limite massimo di 3 portieri in rosa (ne avrebbe %s).', v_trade.sender_team, v_sender_post_por));
    END IF;

    IF v_receiver_cur_por <= 1 THEN
        IF v_receiver_post_por < 1 THEN
            RETURN jsonb_build_object('success', false, 'error', format('La squadra %s rimarrebbe con 0 portieri in rosa (vietato).', v_trade.receiver_team));
        END IF;
    ELSE
        IF v_receiver_post_por < 2 THEN
            RETURN jsonb_build_object('success', false, 'error', format('La squadra %s scenderebbe sotto il limite minimo di 2 portieri in rosa (ne avrebbe %s).', v_trade.receiver_team, v_receiver_post_por));
        END IF;
    END IF;

    IF v_receiver_post_por > 3 THEN
        RETURN jsonb_build_object('success', false, 'error', format('La squadra %s supererebbe il limite massimo di 3 portieri in rosa (ne avrebbe %s).', v_trade.receiver_team, v_receiver_post_por));
    END IF;

    IF array_length(v_all_traded_ids, 1) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = NULL
        WHERE "ID" = ANY(v_all_traded_ids);
    END IF;

    IF array_length(v_trade.offered_player_ids, 1) > 0 THEN
        SELECT COALESCE(array_agg("NumeroMaglia"), ARRAY[]::INT[])
        INTO v_taken_jerseys
        FROM public.an_player
        WHERE "Squadra" = v_trade.receiver_team
          AND "NumeroMaglia" IS NOT NULL;

        FOREACH v_player_id IN ARRAY v_trade.offered_player_ids LOOP
            SELECT "NumeroMaglia" INTO v_cur_jersey
            FROM public.an_player
            WHERE "ID" = v_player_id;

            IF v_cur_jersey IS NOT NULL AND v_cur_jersey = ANY(v_taken_jerseys) THEN
                SELECT n INTO v_new_jersey
                FROM generate_series(1, 99) n
                WHERE NOT (n = ANY(v_taken_jerseys))
                ORDER BY random()
                LIMIT 1;

                UPDATE public.an_player
                SET "Squadra" = v_trade.receiver_team,
                    "NumeroMaglia" = v_new_jersey
                WHERE "ID" = v_player_id;

                IF v_new_jersey IS NOT NULL THEN
                    v_taken_jerseys := array_append(v_taken_jerseys, v_new_jersey);
                END IF;
            ELSE
                UPDATE public.an_player
                SET "Squadra" = v_trade.receiver_team
                WHERE "ID" = v_player_id;

                IF v_cur_jersey IS NOT NULL THEN
                    v_taken_jerseys := array_append(v_taken_jerseys, v_cur_jersey);
                END IF;
            END IF;
        END LOOP;
    END IF;

    IF array_length(v_trade.requested_player_ids, 1) > 0 THEN
        SELECT COALESCE(array_agg("NumeroMaglia"), ARRAY[]::INT[])
        INTO v_taken_jerseys
        FROM public.an_player
        WHERE "Squadra" = v_trade.sender_team
          AND "NumeroMaglia" IS NOT NULL;

        FOREACH v_player_id IN ARRAY v_trade.requested_player_ids LOOP
            SELECT "NumeroMaglia" INTO v_cur_jersey
            FROM public.an_player
            WHERE "ID" = v_player_id;

            IF v_cur_jersey IS NOT NULL AND v_cur_jersey = ANY(v_taken_jerseys) THEN
                SELECT n INTO v_new_jersey
                FROM generate_series(1, 99) n
                WHERE NOT (n = ANY(v_taken_jerseys))
                ORDER BY random()
                LIMIT 1;

                UPDATE public.an_player
                SET "Squadra" = v_trade.sender_team,
                    "NumeroMaglia" = v_new_jersey
                WHERE "ID" = v_player_id;

                IF v_new_jersey IS NOT NULL THEN
                    v_taken_jerseys := array_append(v_taken_jerseys, v_new_jersey);
                END IF;
            ELSE
                UPDATE public.an_player
                SET "Squadra" = v_trade.sender_team
                WHERE "ID" = v_player_id;

                IF v_cur_jersey IS NOT NULL THEN
                    v_taken_jerseys := array_append(v_taken_jerseys, v_cur_jersey);
                END IF;
            END IF;
        END LOOP;
    END IF;

    IF array_length(v_trade.offered_pick_numbers, 1) > 0 THEN
        FOREACH v_pick_num IN ARRAY v_trade.offered_pick_numbers LOOP
            UPDATE public.an_draft_board
            SET team_id = v_trade.receiver_team
            WHERE pick_overall = v_pick_num;
        END LOOP;
    END IF;

    IF array_length(v_trade.requested_pick_numbers, 1) > 0 THEN
        FOREACH v_pick_num IN ARRAY v_trade.requested_pick_numbers LOOP
            UPDATE public.an_draft_board
            SET team_id = v_trade.sender_team
            WHERE pick_overall = v_pick_num;
        END LOOP;
    END IF;

    UPDATE public.market_trades
    SET status = 'completed',
        approved_by = p_admin_user,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_trade_id;

    RETURN jsonb_build_object(
        'success', true,
        'trade_id', p_trade_id,
        'transferred_offered_players', v_trade.offered_player_ids,
        'transferred_requested_players', v_trade.requested_player_ids,
        'transferred_offered_picks', v_trade.offered_pick_numbers,
        'transferred_requested_picks', v_trade.requested_pick_numbers
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_execute_trade TO authenticated, service_role;
