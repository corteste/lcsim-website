-- ==============================================================================
-- LCSIM Migration: Sincronizzazione Archivio Storico Scambi (Gaillard/Leite & Futuri)
-- File: supabase/migrations/20261112_sync_trade_gaillard_leite_archive.sql
-- ==============================================================================

-- 1. SANATORIA SCAMBIO PREGRESSO: Didier GAILLARD (50380) e Carlos LEITE (50653)
DO $$
DECLARE
    v_next_order INT;
BEGIN
    SELECT COALESCE(MAX(tx_order), 0) INTO v_next_order FROM public.an_player_transactions;

    -- Gaillard (APD -> ACD)
    IF NOT EXISTS (
        SELECT 1 FROM public.an_player_transactions 
        WHERE player_id = 50380 AND stagione = 11 AND motivo = 'Scambio'
    ) THEN
        v_next_order := v_next_order + 1;
        INSERT INTO public.an_player_transactions (
            tx_order, tx_date, tx_time, player_id, nome, cognome, prev_team, new_team, motivo, stagione, draft_pick
        ) VALUES (
            v_next_order, '2026-11-11'::DATE, '21:35:57', 50380, 'Didier', 'GAILLARD', 'APD', 'ACD', 'Scambio', 11, NULL
        );
    END IF;

    -- Leite (ACD -> APD)
    IF NOT EXISTS (
        SELECT 1 FROM public.an_player_transactions 
        WHERE player_id = 50653 AND stagione = 11 AND motivo = 'Scambio'
    ) THEN
        v_next_order := v_next_order + 1;
        INSERT INTO public.an_player_transactions (
            tx_order, tx_date, tx_time, player_id, nome, cognome, prev_team, new_team, motivo, stagione, draft_pick
        ) VALUES (
            v_next_order, '2026-11-11'::DATE, '21:35:57', 50653, 'Carlos', 'LEITE', 'ACD', 'APD', 'Scambio', 11, NULL
        );
    END IF;

    -- Aggiorna an_player_career_seasons per la Stagione 11
    INSERT INTO public.an_player_career_seasons (
        player_id, stagione, team_id, franchise_id, entry_motivo, draft_pick, presenze_capitano
    ) VALUES (
        50380, 11, 'ACD', 'ACD', 'Scambio', NULL, 0
    )
    ON CONFLICT (player_id, stagione) DO UPDATE
    SET team_id = 'ACD',
        franchise_id = 'ACD',
        entry_motivo = 'Scambio';

    INSERT INTO public.an_player_career_seasons (
        player_id, stagione, team_id, franchise_id, entry_motivo, draft_pick, presenze_capitano
    ) VALUES (
        50653, 11, 'APD', 'APD', 'Scambio', NULL, 0
    )
    ON CONFLICT (player_id, stagione) DO UPDATE
    SET team_id = 'APD',
        franchise_id = 'APD',
        entry_motivo = 'Scambio';
END;
$$;

-- 2. AUTOMAZIONE COMPLETA SCAMBI: Aggiornamento della funzione rpc_execute_trade
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
    v_current_season INT;
    v_next_tx_order INT;
    v_p_nome TEXT;
    v_p_cognome TEXT;
    v_rec_franchise TEXT;
    v_send_franchise TEXT;
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

    -- Verifica vincoli Portieri per entrambe le squadre
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

    -- Controllo Portieri Squadra Mittente (sender)
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

    -- Controllo Portieri Squadra Destinataria (receiver)
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

    -- STEP 0: Disassocia temporaneamente tutti i calciatori coinvolti impostando Squadra = NULL.
    IF array_length(v_all_traded_ids, 1) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = NULL
        WHERE "ID" = ANY(v_all_traded_ids);
    END IF;

    -- STEP 1: Trasferisci calciatori offerti (da sender a receiver_team)
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

    -- STEP 2: Trasferisci calciatori richiesti (da receiver a sender_team)
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

    -- STEP 3: Trasferisci scelte offerte (da sender a receiver_team)
    IF array_length(v_trade.offered_pick_numbers, 1) > 0 THEN
        FOREACH v_pick_num IN ARRAY v_trade.offered_pick_numbers LOOP
            UPDATE public.an_draft_board
            SET team_id = v_trade.receiver_team
            WHERE pick_overall = v_pick_num;
        END LOOP;
    END IF;

    -- STEP 4: Trasferisci scelte richieste (da receiver a sender_team)
    IF array_length(v_trade.requested_pick_numbers, 1) > 0 THEN
        FOREACH v_pick_num IN ARRAY v_trade.requested_pick_numbers LOOP
            UPDATE public.an_draft_board
            SET team_id = v_trade.sender_team
            WHERE pick_overall = v_pick_num;
        END LOOP;
    END IF;

    -- STEP 5: REGISTRAZIONE AUTOMATICA NELL'ARCHIVIO STORICO (an_player_transactions e an_player_career_seasons)
    SELECT COALESCE(MAX(stagione), 11) INTO v_current_season FROM public.an_player_career_seasons;
    SELECT COALESCE(MAX(tx_order), 0) INTO v_next_tx_order FROM public.an_player_transactions;

    -- Risoluzione Franchise ID per sender e receiver
    SELECT COALESCE((SELECT current_franchise_id FROM public.an_team_rebrands WHERE post_team_id = v_trade.receiver_team ORDER BY id DESC LIMIT 1), v_trade.receiver_team) INTO v_rec_franchise;
    SELECT COALESCE((SELECT current_franchise_id FROM public.an_team_rebrands WHERE post_team_id = v_trade.sender_team ORDER BY id DESC LIMIT 1), v_trade.sender_team) INTO v_send_franchise;

    -- Movimenti calciatori offerti (sender -> receiver)
    IF array_length(v_trade.offered_player_ids, 1) > 0 THEN
        FOREACH v_player_id IN ARRAY v_trade.offered_player_ids LOOP
            v_next_tx_order := v_next_tx_order + 1;
            SELECT "Nome", "Cognome" INTO v_p_nome, v_p_cognome FROM public.an_player WHERE "ID" = v_player_id;

            INSERT INTO public.an_player_transactions (
                tx_order, tx_date, tx_time, player_id, nome, cognome, prev_team, new_team, motivo, stagione, draft_pick
            ) VALUES (
                v_next_tx_order, CURRENT_DATE, to_char(NOW(), 'HH24:MI:SS'), v_player_id, COALESCE(v_p_nome, ''), COALESCE(v_p_cognome, ''), v_trade.sender_team, v_trade.receiver_team, 'Scambio', v_current_season, NULL
            );

            INSERT INTO public.an_player_career_seasons (
                player_id, stagione, team_id, franchise_id, entry_motivo, draft_pick, presenze_capitano
            ) VALUES (
                v_player_id, v_current_season, v_trade.receiver_team, v_rec_franchise, 'Scambio', NULL, 0
            )
            ON CONFLICT (player_id, stagione) DO UPDATE
            SET team_id = EXCLUDED.team_id,
                franchise_id = EXCLUDED.franchise_id,
                entry_motivo = 'Scambio';
        END LOOP;
    END IF;

    -- Movimenti calciatori richiesti (receiver -> sender)
    IF array_length(v_trade.requested_player_ids, 1) > 0 THEN
        FOREACH v_player_id IN ARRAY v_trade.requested_player_ids LOOP
            v_next_tx_order := v_next_tx_order + 1;
            SELECT "Nome", "Cognome" INTO v_p_nome, v_p_cognome FROM public.an_player WHERE "ID" = v_player_id;

            INSERT INTO public.an_player_transactions (
                tx_order, tx_date, tx_time, player_id, nome, cognome, prev_team, new_team, motivo, stagione, draft_pick
            ) VALUES (
                v_next_tx_order, CURRENT_DATE, to_char(NOW(), 'HH24:MI:SS'), v_player_id, COALESCE(v_p_nome, ''), COALESCE(v_p_cognome, ''), v_trade.receiver_team, v_trade.sender_team, 'Scambio', v_current_season, NULL
            );

            INSERT INTO public.an_player_career_seasons (
                player_id, stagione, team_id, franchise_id, entry_motivo, draft_pick, presenze_capitano
            ) VALUES (
                v_player_id, v_current_season, v_trade.sender_team, v_send_franchise, 'Scambio', NULL, 0
            )
            ON CONFLICT (player_id, stagione) DO UPDATE
            SET team_id = EXCLUDED.team_id,
                franchise_id = EXCLUDED.franchise_id,
                entry_motivo = 'Scambio';
        END LOOP;
    END IF;

    -- STEP 6: Aggiorna stato dello scambio a 'completed'
    UPDATE public.market_trades
    SET status = 'completed',
        approved_by = p_admin_user,
        approved_at = NOW(),
        updated_at = NOW(),
        completed_at = NOW(),
        completed_by = p_admin_user
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
