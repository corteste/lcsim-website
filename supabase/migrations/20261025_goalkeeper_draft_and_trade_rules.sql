-- ==============================================================================
-- Migrazione: Regole di Salvaguardia e Limiti Portieri nel Draft e nel Mercato (Punti #42 e #43)
-- 1. Obbligo Portiere all'ultima scelta per squadre con 1 solo portiere a roster (Punto #42)
-- 2. Tetto massimo di 3 portieri per squadra: blocco scambi (>3 o <2) e blocco draft (Punto #43)
-- File: supabase/migrations/20261025_goalkeeper_draft_and_trade_rules.sql
-- ==============================================================================

-- 1. Aggiornamento rpc_draft_rookie con verifiche portieri
CREATE OR REPLACE FUNCTION public.rpc_draft_rookie(
  p_pick_overall INT,
  p_rookie_id BIGINT,
  p_team_id TEXT,
  p_picked_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal_vault, extensions
AS $$
DECLARE
  v_key TEXT;
  v_enc BYTEA;
  v_sec JSONB;
  v_ea JSONB;
  v_rookie_row RECORD;
  v_gk_count INT;
  v_remaining_picks INT;
BEGIN
  -- 1. Verifica che la scelta non sia già stata effettuata
  IF EXISTS (
    SELECT 1 FROM public.an_draft_board
    WHERE pick_overall = p_pick_overall AND (rookie_id IS NOT NULL OR player_id IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'La scelta #% è già stata effettuata.', p_pick_overall;
  END IF;

  -- 2. Recupera rookie
  SELECT * INTO v_rookie_row FROM public.an_rookie WHERE "ID" = p_rookie_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rookie con ID % non trovato.', p_rookie_id;
  END IF;

  IF v_rookie_row."Squadra" IS NOT NULL THEN
    RAISE EXCEPTION 'Il rookie % % è già stato scelto da %.', v_rookie_row."Nome", v_rookie_row."Cognome", v_rookie_row."Squadra";
  END IF;

  -- 2b. Verifica limiti e obbligo portieri (Punti #42 e #43)
  SELECT count(*) INTO v_gk_count
  FROM public.an_player
  WHERE "Squadra" = p_team_id AND "Posiz" = 'POR';

  SELECT count(*) INTO v_remaining_picks
  FROM public.an_draft_board
  WHERE team_id = p_team_id AND (rookie_id IS NULL AND player_id IS NULL);

  -- Punto #43: Non si possono avere più di 3 portieri in squadra
  IF v_rookie_row."Posiz" = 'POR' AND v_gk_count >= 3 THEN
    RAISE EXCEPTION 'Limite portieri raggiunto: la squadra % possiede già % portieri in rosa (massimo consentito: 3).', p_team_id, v_gk_count;
  END IF;

  -- Punto #42: Obbligo portiere se all'ultima pick la squadra ha solo 1 portiere in rosa
  IF v_remaining_picks <= 1 AND v_gk_count = 1 AND v_rookie_row."Posiz" != 'POR' THEN
    RAISE EXCEPTION 'Obbligo Portiere: la squadra % possiede un solo portiere a roster ed è alla sua ultima scelta del Draft, pertanto è obbligata a selezionare un portiere (POR).', p_team_id;
  END IF;

  -- 3. Recupera chiave del vault e decifra i dati completi
  SELECT vault_passphrase INTO v_key FROM internal_vault.rookie_key WHERE id = 1;
  IF v_key IS NOT NULL AND v_rookie_row.encrypted_data IS NOT NULL THEN
    BEGIN
      v_sec := pgp_sym_decrypt(v_rookie_row.encrypted_data, v_key)::jsonb;
    EXCEPTION WHEN OTHERS THEN
      v_sec := NULL;
    END;
  END IF;

  -- 4. Aggiorna an_rookie (assegna la squadra)
  UPDATE public.an_rookie
  SET "Squadra" = p_team_id
  WHERE "ID" = p_rookie_id;

  -- 5. Se abbiamo i dati decifrati, inserisci/aggiorna in an_player!
  IF v_sec IS NOT NULL THEN
    INSERT INTO public.an_player (
      "ID", "Nome", "Cognome", "DOB", "Età", "Nazionalità",
      "Altezza", "Peso", "Posiz", "Piede", "PiedeDebole", "Squadra",
      "XP", "OVR", "POTN",
      "Role1", "Role2", "Role3",
      "Trait1", "Trait2", "IconTrait1", "IconTrait2",
      "BodyType", "Emotion", "MABI",
      "FRED", "RIFP", "PREP", "TUFP", "POSP", "RINP",
      "MARC", "CONT", "AGGR", "SCIV", "INTR",
      "PASC", "PASL", "CRSS", "CTRP", "VISI", "EFFT",
      "PIAZ", "PTIR", "TIRD", "DRBL", "TIRV", "TSTA", "FINA",
      "ACCL", "VELO", "RESI", "FRZA", "AGIL", "ELEV", "RIFL", "EQLB", "PNIZ", "CRIG",
      "NumeroMaglia",
      "PreferredPosition2", "PreferredPosition3", "PreferredPosition4",
      "JerseyStyle", "JerseyFit", "SleeveLength", "SeasonalJersey", "GKGloves", "Shoe", "SockLength",
      "Accessory1", "Colour", "Accessory2", "Colour_1", "Accessory3", "Colour_2", "Accessory4", "Colour_3"
    )
    VALUES (
      v_rookie_row."ID",
      v_rookie_row."Nome",
      v_rookie_row."Cognome",
      v_rookie_row."DOB",
      v_rookie_row."Età",
      v_rookie_row."Nazionalità",
      v_rookie_row."Altezza",
      v_rookie_row."Peso",
      v_rookie_row."Posiz",
      v_rookie_row."Piede",
      v_sec->>'PiedeDebole',
      p_team_id,
      0,
      (v_sec->>'OVR')::BIGINT,
      (v_sec->>'POTN')::BIGINT,
      v_sec->>'Role1',
      v_sec->>'Role2',
      v_sec->>'Role3',
      v_sec->>'Trait1',
      v_sec->>'Trait2',
      v_sec->>'IconTrait1',
      v_sec->>'IconTrait2',
      (v_sec->>'BodyType')::BIGINT,
      (v_sec->>'Emotion')::BIGINT,
      v_sec->>'MABI',
      (v_sec->>'FRED')::BIGINT,
      (v_sec->>'RIFP')::BIGINT,
      (v_sec->>'PREP')::BIGINT,
      (v_sec->>'TUFP')::BIGINT,
      (v_sec->>'POSP')::BIGINT,
      (v_sec->>'RINP')::BIGINT,
      (v_sec->>'MARC')::BIGINT,
      (v_sec->>'CONT')::BIGINT,
      (v_sec->>'AGGR')::BIGINT,
      (v_sec->>'SCIV')::BIGINT,
      (v_sec->>'INTR')::BIGINT,
      (v_sec->>'PASC')::BIGINT,
      (v_sec->>'PASL')::BIGINT,
      (v_sec->>'CRSS')::BIGINT,
      (v_sec->>'CTRP')::BIGINT,
      (v_sec->>'VISI')::BIGINT,
      (v_sec->>'EFFT')::BIGINT,
      (v_sec->>'PIAZ')::BIGINT,
      (v_sec->>'PTIR')::BIGINT,
      (v_sec->>'TIRD')::BIGINT,
      (v_sec->>'DRBL')::BIGINT,
      (v_sec->>'TIRV')::BIGINT,
      (v_sec->>'TSTA')::BIGINT,
      (v_sec->>'FINA')::BIGINT,
      (v_sec->>'ACCL')::BIGINT,
      (v_sec->>'VELO')::BIGINT,
      (v_sec->>'RESI')::BIGINT,
      (v_sec->>'FRZA')::BIGINT,
      (v_sec->>'AGIL')::BIGINT,
      (v_sec->>'ELEV')::BIGINT,
      (v_sec->>'RIFL')::BIGINT,
      (v_sec->>'EQLB')::BIGINT,
      (v_sec->>'PNIZ')::BIGINT,
      (v_sec->>'CRIG')::BIGINT,
      NULL,
      v_rookie_row."PreferredPosition2",
      v_rookie_row."PreferredPosition3",
      v_rookie_row."PreferredPosition4",
      (v_sec->>'JerseyStyle')::BIGINT,
      (v_sec->>'JerseyFit')::BIGINT,
      (v_sec->>'SleeveLength')::BIGINT,
      (v_sec->>'SeasonalJersey')::BIGINT,
      (v_sec->>'GKGloves')::BIGINT,
      (v_sec->>'Shoe')::BIGINT,
      (v_sec->>'SockLength')::BIGINT,
      (v_sec->>'Accessory1')::BIGINT,
      (v_sec->>'Colour')::BIGINT,
      (v_sec->>'Accessory2')::BIGINT,
      (v_sec->>'Colour_1')::BIGINT,
      (v_sec->>'Accessory3')::BIGINT,
      (v_sec->>'Colour_2')::BIGINT,
      (v_sec->>'Accessory4')::BIGINT,
      (v_sec->>'Colour_3')::BIGINT
    )
    ON CONFLICT ("ID") DO UPDATE SET
      "Squadra" = EXCLUDED."Squadra",
      "OVR" = EXCLUDED."OVR",
      "POTN" = EXCLUDED."POTN",
      "VELO" = EXCLUDED."VELO",
      "FINA" = EXCLUDED."FINA",
      "CONT" = EXCLUDED."CONT";

    -- 6. Inserisci anche in ea_player_db per EA FC 25
    v_ea := v_sec->'fullEaRow';
    IF v_ea IS NOT NULL THEN
      BEGIN
        INSERT INTO public.ea_player_db SELECT * FROM jsonb_populate_record(NULL::public.ea_player_db, v_ea)
        ON CONFLICT (playerid) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  -- 7. Aggiorna an_draft_board
  UPDATE public.an_draft_board
  SET rookie_id = p_rookie_id,
      player_id = p_rookie_id,
      player_type = 'rookie',
      picked_at = now(),
      picked_by = p_picked_by
  WHERE pick_overall = p_pick_overall;

  RETURN jsonb_build_object(
    'success', true,
    'pick_overall', p_pick_overall,
    'rookie_id', p_rookie_id,
    'player_id', p_rookie_id,
    'team_id', p_team_id,
    'player_type', 'rookie'
  );
END;
$$;


-- 2. Aggiornamento rpc_draft_free_agent con verifiche portieri
CREATE OR REPLACE FUNCTION public.rpc_draft_free_agent(
  p_pick_overall INT,
  p_player_id BIGINT,
  p_team_id TEXT,
  p_picked_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_player RECORD;
  v_gk_count INT;
  v_remaining_picks INT;
BEGIN
  -- 1. Verifica che la scelta non sia già stata effettuata
  IF EXISTS (
    SELECT 1 FROM public.an_draft_board
    WHERE pick_overall = p_pick_overall AND (rookie_id IS NOT NULL OR player_id IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'La scelta #% è già stata effettuata.', p_pick_overall;
  END IF;

  -- 2. Recupera giocatore da an_player
  SELECT * INTO v_player FROM public.an_player WHERE "ID" = p_player_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Calciatore con ID % non trovato in archivio.', p_player_id;
  END IF;

  IF v_player."Squadra" IS NOT NULL AND trim(v_player."Squadra") != '' THEN
    RAISE EXCEPTION 'Il calciatore % % non è svincolato (attualmente assegnato a %).', v_player."Nome", v_player."Cognome", v_player."Squadra";
  END IF;

  -- 2b. Verifica limiti e obbligo portieri (Punti #42 e #43)
  SELECT count(*) INTO v_gk_count
  FROM public.an_player
  WHERE "Squadra" = p_team_id AND "Posiz" = 'POR';

  SELECT count(*) INTO v_remaining_picks
  FROM public.an_draft_board
  WHERE team_id = p_team_id AND (rookie_id IS NULL AND player_id IS NULL);

  -- Punto #43: Non si possono avere più di 3 portieri in squadra
  IF v_player."Posiz" = 'POR' AND v_gk_count >= 3 THEN
    RAISE EXCEPTION 'Limite portieri raggiunto: la squadra % possiede già % portieri in rosa (massimo consentito: 3).', p_team_id, v_gk_count;
  END IF;

  -- Punto #42: Obbligo portiere se all'ultima pick la squadra ha solo 1 portiere in rosa
  IF v_remaining_picks <= 1 AND v_gk_count = 1 AND v_player."Posiz" != 'POR' THEN
    RAISE EXCEPTION 'Obbligo Portiere: la squadra % possiede un solo portiere a roster ed è alla sua ultima scelta del Draft, pertanto è obbligata a selezionare un portiere (POR).', p_team_id;
  END IF;

  -- 3. Assegna squadra al calciatore svincolato
  UPDATE public.an_player
  SET "Squadra" = p_team_id
  WHERE "ID" = p_player_id;

  -- 4. Aggiorna an_draft_board con riferimento allo svincolato
  UPDATE public.an_draft_board
  SET player_id = p_player_id,
      rookie_id = NULL,
      player_type = 'free_agent',
      picked_at = now(),
      picked_by = p_picked_by
  WHERE pick_overall = p_pick_overall;

  RETURN jsonb_build_object(
    'success', true,
    'pick_overall', p_pick_overall,
    'player_id', p_player_id,
    'team_id', p_team_id,
    'player_type', 'free_agent'
  );
END;
$$;


-- 3. Aggiornamento rpc_execute_trade con controlli 2..3 portieri per entrambi i club
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

    -- Verifica vincoli Portieri per entrambe le squadre (Punto #43: max 3, min 2)
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

    IF v_sender_post_por > 3 THEN
        RETURN jsonb_build_object('success', false, 'error', format('La squadra %s supererebbe il limite massimo di 3 portieri in rosa (ne avrebbe %s).', v_trade.sender_team, v_sender_post_por));
    END IF;
    IF v_sender_post_por < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', format('La squadra %s scenderebbe sotto il limite minimo di 2 portieri in rosa (ne avrebbe %s).', v_trade.sender_team, v_sender_post_por));
    END IF;

    IF v_receiver_post_por > 3 THEN
        RETURN jsonb_build_object('success', false, 'error', format('La squadra %s supererebbe il limite massimo di 3 portieri in rosa (ne avrebbe %s).', v_trade.receiver_team, v_receiver_post_por));
    END IF;
    IF v_receiver_post_por < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', format('La squadra %s scenderebbe sotto il limite minimo di 2 portieri in rosa (ne avrebbe %s).', v_trade.receiver_team, v_receiver_post_por));
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

    -- STEP 5: Aggiorna stato dello scambio a 'completed'
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

GRANT EXECUTE ON FUNCTION public.rpc_draft_rookie TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_draft_free_agent TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_execute_trade TO authenticated, service_role;
