-- ==============================================================================
-- Migrazione: 20261123_fix_rpc_execute_trade_full.sql
-- Descrizione: Ripristina in public.rpc_execute_trade la gestione delle
--              collisioni di NumeroMaglia (uq_an_player_team_jersey), i controlli
--              portieri, il sync an_player_training e l'archivio storico
--              (an_player_transactions / an_player_career_seasons), mantenendo
--              i controlli di proprietà e l'annullamento automatico delle
--              trattative parallele in conflitto introdotti il 2026-11-16.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_execute_trade(p_trade_id UUID, p_admin_user TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_trade RECORD;
    v_all_players INT[];
    v_all_picks INT[];
    v_count INT;
    v_conflict RECORD;
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
    -- 0. Seleziona e blocca la riga per prevenire race conditions
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

    -- 1. Verifica proprietà attuale di calciatori e scelte
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

    -- 2. Verifica vincoli Portieri per entrambe le squadre
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

    v_all_players := COALESCE(v_trade.offered_player_ids, '{}'::INT[]) || COALESCE(v_trade.requested_player_ids, '{}'::INT[]);
    v_all_picks := COALESCE(v_trade.offered_pick_numbers, '{}'::INT[]) || COALESCE(v_trade.requested_pick_numbers, '{}'::INT[]);

    -- 3. Disassocia temporaneamente tutti i calciatori coinvolti per evitare collisioni transitorie su uq_an_player_team_jersey
    IF COALESCE(array_length(v_all_players, 1), 0) > 0 THEN
        UPDATE public.an_player
        SET "Squadra" = NULL
        WHERE "ID" = ANY(v_all_players);
    END IF;

    -- 4. Trasferisci i calciatori offerti (sender -> receiver) risolvendo eventuali collisioni NumeroMaglia
    IF COALESCE(array_length(v_trade.offered_player_ids, 1), 0) > 0 THEN
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

    -- 5. Trasferisci i calciatori richiesti (receiver -> sender) risolvendo eventuali collisioni NumeroMaglia
    IF COALESCE(array_length(v_trade.requested_player_ids, 1), 0) > 0 THEN
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

    -- 6. Sincronizza Squadra in an_player_training
    IF COALESCE(array_length(v_trade.offered_player_ids, 1), 0) > 0 THEN
        UPDATE public.an_player_training
        SET "Squadra" = v_trade.receiver_team
        WHERE "PlayerID" = ANY(v_trade.offered_player_ids);
    END IF;

    IF COALESCE(array_length(v_trade.requested_player_ids, 1), 0) > 0 THEN
        UPDATE public.an_player_training
        SET "Squadra" = v_trade.sender_team
        WHERE "PlayerID" = ANY(v_trade.requested_player_ids);
    END IF;

    -- 7. Trasferisci le scelte del draft
    IF COALESCE(array_length(v_trade.offered_pick_numbers, 1), 0) > 0 THEN
        FOREACH v_pick_num IN ARRAY v_trade.offered_pick_numbers LOOP
            UPDATE public.an_draft_board
            SET team_id = v_trade.receiver_team
            WHERE pick_overall = v_pick_num;
        END LOOP;
    END IF;

    IF COALESCE(array_length(v_trade.requested_pick_numbers, 1), 0) > 0 THEN
        FOREACH v_pick_num IN ARRAY v_trade.requested_pick_numbers LOOP
            UPDATE public.an_draft_board
            SET team_id = v_trade.sender_team
            WHERE pick_overall = v_pick_num;
        END LOOP;
    END IF;

    -- 8. Registrazione automatica nell'Archivio Storico (an_player_transactions e an_player_career_seasons)
    SELECT COALESCE(MAX(stagione), 11) INTO v_current_season FROM public.an_player_career_seasons;
    SELECT COALESCE(MAX(tx_order), 0) INTO v_next_tx_order FROM public.an_player_transactions;

    SELECT COALESCE((SELECT current_franchise_id FROM public.an_team_rebrands WHERE post_team_id = v_trade.receiver_team ORDER BY id DESC LIMIT 1), v_trade.receiver_team) INTO v_rec_franchise;
    SELECT COALESCE((SELECT current_franchise_id FROM public.an_team_rebrands WHERE post_team_id = v_trade.sender_team ORDER BY id DESC LIMIT 1), v_trade.sender_team) INTO v_send_franchise;

    IF COALESCE(array_length(v_trade.offered_player_ids, 1), 0) > 0 THEN
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

    IF COALESCE(array_length(v_trade.requested_player_ids, 1), 0) > 0 THEN
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

    -- 9. Aggiorna lo stato dello scambio a 'completed'
    UPDATE public.market_trades
    SET
        status = 'completed',
        updated_at = timezone('utc'::text, now()),
        completed_at = timezone('utc'::text, now()),
        completed_by = p_admin_user
    WHERE id = p_trade_id;

    -- 10. Annulla automaticamente eventuali altre trattative parallele sugli stessi asset
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

    RETURN jsonb_build_object(
        'success', true,
        'trade_id', p_trade_id,
        'transferred_offered_players', v_trade.offered_player_ids,
        'transferred_requested_players', v_trade.requested_player_ids,
        'transferred_offered_picks', v_trade.offered_pick_numbers,
        'transferred_requested_picks', v_trade.requested_pick_numbers
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_execute_trade(UUID, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
