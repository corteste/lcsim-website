-- ==============================================================================
-- LCSIM - Risoluzione Conflitti Numero Maglia negli Scambi di Mercato
-- Assegna automaticamente un numero casuale (1..99) libero nella squadra
-- di destinazione se il numero del calciatore è già occupato (indice uq_an_player_team_jersey).
-- ==============================================================================

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
BEGIN
    -- Seleziona e blocca la riga per prevenire race conditions
    SELECT * INTO v_trade FROM public.market_trades WHERE id = p_trade_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trattativa non trovata.');
    END IF;
    
    IF v_trade.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lo scambio è già stato completato in precedenza.');
    END IF;

    -- Concatena tutti gli ID dei calciatori coinvolti nello scambio
    v_all_traded_ids := COALESCE(v_trade.offered_player_ids, ARRAY[]::INT[]) || COALESCE(v_trade.requested_player_ids, ARRAY[]::INT[]);

    -- STEP 0: Disassocia temporaneamente tutti i calciatori coinvolti impostando Squadra = NULL.
    -- Questo azzera qualsiasi rischio di collisione transitoria su uq_an_player_team_jersey
    -- (l'indice parziale agisce solo dove Squadra IS NOT NULL).
    IF array_length(v_all_traded_ids, 1) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = NULL
        WHERE "ID" = ANY(v_all_traded_ids);
    END IF;

    -- STEP 1: Trasferisci calciatori offerti (da sender a receiver_team)
    IF array_length(v_trade.offered_player_ids, 1) > 0 THEN
        -- Raccogli tutti i numeri di maglia attualmente occupati nel receiver_team
        SELECT COALESCE(array_agg("NumeroMaglia"), ARRAY[]::INT[])
        INTO v_taken_jerseys
        FROM public.an_player
        WHERE "Squadra" = v_trade.receiver_team
          AND "NumeroMaglia" IS NOT NULL;

        FOREACH v_player_id IN ARRAY v_trade.offered_player_ids LOOP
            SELECT "NumeroMaglia" INTO v_cur_jersey
            FROM public.an_player
            WHERE "ID" = v_player_id;

            -- Se il numero esiste già nella squadra di destinazione, assegna un numero casuale tra 1 e 99 disponibile
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

    -- STEP 2: Trasferisci calciatori richiesti (da receiver a sender_team)
    IF array_length(v_trade.requested_player_ids, 1) > 0 THEN
        -- Raccogli tutti i numeri di maglia attualmente occupati nel sender_team
        SELECT COALESCE(array_agg("NumeroMaglia"), ARRAY[]::INT[])
        INTO v_taken_jerseys
        FROM public.an_player
        WHERE "Squadra" = v_trade.sender_team
          AND "NumeroMaglia" IS NOT NULL;

        FOREACH v_player_id IN ARRAY v_trade.requested_player_ids LOOP
            SELECT "NumeroMaglia" INTO v_cur_jersey
            FROM public.an_player
            WHERE "ID" = v_player_id;

            -- Se il numero esiste già nella squadra di destinazione, assegna un numero casuale tra 1 e 99 disponibile
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

    -- STEP 2-bis: Sincronizza Squadra in an_player_training se presente
    IF array_length(v_trade.offered_player_ids, 1) > 0 THEN
        UPDATE public.an_player_training
        SET "Squadra" = v_trade.receiver_team
        WHERE "PlayerID" = ANY(v_trade.offered_player_ids);
    END IF;

    IF array_length(v_trade.requested_player_ids, 1) > 0 THEN
        UPDATE public.an_player_training
        SET "Squadra" = v_trade.sender_team
        WHERE "PlayerID" = ANY(v_trade.requested_player_ids);
    END IF;

    -- STEP 3: Trasferisci le scelte del draft offerte dal sender al receiver
    IF array_length(v_trade.offered_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.receiver_team
        WHERE pick_overall = ANY(v_trade.offered_pick_numbers);
    END IF;

    -- STEP 4: Trasferisci le scelte del draft richieste dal receiver al sender
    IF array_length(v_trade.requested_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.sender_team
        WHERE pick_overall = ANY(v_trade.requested_pick_numbers);
    END IF;

    -- STEP 5: Aggiorna lo stato dello scambio a 'completed' con timestamp e firma admin
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
