-- ==============================================================================
-- LCSIM - Migrazione: Sincronizzazione Master Data EA FC 25 all'Import Rookie
-- ==============================================================================

-- 1. Aggiorna rpc_import_encrypted_rookies: rimuove la cancellazione da ea_player_db
--    in modo che i rookie importati da File 1 rimangano salvati nella Master Table.
CREATE OR REPLACE FUNCTION public.rpc_import_encrypted_rookies(
  p_rookies JSONB,
  p_passphrase TEXT,
  p_author TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal_vault, extensions
AS $$
DECLARE
  v_item JSONB;
  v_pub JSONB;
  v_sec JSONB;
  v_enc BYTEA;
  v_count INT := 0;
BEGIN
  IF p_passphrase IS NULL OR LENGTH(TRIM(p_passphrase)) < 4 THEN
    RAISE EXCEPTION 'La passphrase di cifratura deve contenere almeno 4 caratteri.';
  END IF;

  -- 1. Salva la chiave segreta nel vault protetto
  INSERT INTO internal_vault.rookie_key (id, vault_passphrase, updated_at)
  VALUES (1, p_passphrase, now())
  ON CONFLICT (id) DO UPDATE
    SET vault_passphrase = EXCLUDED.vault_passphrase,
        updated_at = now();

  -- 2. Itera sui rookie da importare
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_rookies)
  LOOP
    v_pub := v_item->'publicInfo';
    v_sec := v_item->'secretData';

    -- Cifra tutti i dati sensibili con pgcrypto AES-256
    v_enc := pgp_sym_encrypt(v_sec::text, p_passphrase);

    -- Inserisci in public.an_rookie con tutti gli attributi sensibili a NULL (protetti da crittografia)
    INSERT INTO public.an_rookie (
      "ID", "Nome", "Cognome", "DOB", "Età", "Nazionalità",
      "Altezza", "Peso", "Posiz", "Piede", "PiedeDebole", "Squadra",
      "XP", "Role1", "Role2", "Role3", "OVR", "POTN",
      "Trait1", "Trait2", "IconTrait1", "IconTrait2",
      "BodyType", "Emotion", "MABI",
      "FRED", "RIFP", "PREP", "TUFP", "POSP", "RINP",
      "MARC", "CONT", "AGGR", "SCIV", "INTR",
      "PASC", "PASL", "CRSS", "CTRP", "VISI", "EFFT",
      "PIAZ", "PTIR", "TIRD", "DRBL", "TIRV", "TSTA", "FINA",
      "ACCL", "VELO", "RESI", "FRZA", "AGIL", "ELEV", "RIFL", "EQLB", "PNIZ", "CRIG",
      "JerseyStyle", "JerseyFit", "SleeveLength", "SeasonalJersey", "GKGloves", "Shoe", "SockLength",
      "Accessory1", "Colour", "Accessory2", "Colour_1", "Accessory3", "Colour_2", "Accessory4", "Colour_3",
      "Stelle", "NumeroMaglia",
      "PreferredPosition2", "PreferredPosition3", "PreferredPosition4",
      encrypted_data
    )
    VALUES (
      (v_pub->>'id')::BIGINT,
      v_pub->>'nome',
      v_pub->>'cognome',
      (v_pub->>'dob')::BIGINT,
      (v_pub->>'eta')::BIGINT,
      v_pub->>'nazionalita',
      (v_pub->>'altezza')::BIGINT,
      (v_pub->>'peso')::BIGINT,
      v_pub->>'posiz',
      v_pub->>'piede',
      NULL,
      v_pub->>'squadra',
      0,
      NULL, NULL, NULL,
      NULL, NULL,
      NULL, NULL, NULL, NULL,
      NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      COALESCE((v_pub->>'stelle')::INT, 3),
      NULL,
      v_pub->>'preferredPosition2',
      v_pub->>'preferredPosition3',
      v_pub->>'preferredPosition4',
      v_enc
    )
    ON CONFLICT ("ID") DO UPDATE SET
      "Nome" = EXCLUDED."Nome",
      "Cognome" = EXCLUDED."Cognome",
      "DOB" = EXCLUDED."DOB",
      "Età" = EXCLUDED."Età",
      "Nazionalità" = EXCLUDED."Nazionalità",
      "Altezza" = EXCLUDED."Altezza",
      "Peso" = EXCLUDED."Peso",
      "Posiz" = EXCLUDED."Posiz",
      "Piede" = EXCLUDED."Piede",
      "PiedeDebole" = NULL,
      "Squadra" = EXCLUDED."Squadra",
      "Role1" = NULL, "Role2" = NULL, "Role3" = NULL,
      "OVR" = NULL, "POTN" = NULL,
      "Trait1" = NULL, "Trait2" = NULL, "IconTrait1" = NULL, "IconTrait2" = NULL,
      "BodyType" = NULL, "Emotion" = NULL, "MABI" = NULL,
      "FRED" = NULL, "RIFP" = NULL, "PREP" = NULL, "TUFP" = NULL, "POSP" = NULL, "RINP" = NULL,
      "MARC" = NULL, "CONT" = NULL, "AGGR" = NULL, "SCIV" = NULL, "INTR" = NULL,
      "PASC" = NULL, "PASL" = NULL, "CRSS" = NULL, "CTRP" = NULL, "VISI" = NULL, "EFFT" = NULL,
      "PIAZ" = NULL, "PTIR" = NULL, "TIRD" = NULL, "DRBL" = NULL, "TIRV" = NULL, "TSTA" = NULL, "FINA" = NULL,
      "ACCL" = NULL, "VELO" = NULL, "RESI" = NULL, "FRZA" = NULL, "AGIL" = NULL, "ELEV" = NULL, "RIFL" = NULL, "EQLB" = NULL, "PNIZ" = NULL, "CRIG" = NULL,
      "Stelle" = EXCLUDED."Stelle",
      "PreferredPosition2" = EXCLUDED."PreferredPosition2",
      "PreferredPosition3" = EXCLUDED."PreferredPosition3",
      "PreferredPosition4" = EXCLUDED."PreferredPosition4",
      encrypted_data = EXCLUDED.encrypted_data;

    v_count := v_count + 1;
  END LOOP;

  -- 3. Registra automazione
  INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details, updated_at)
  VALUES (
    'import_rookie_class',
    'Importa Classe Rookie (Zero-Knowledge AES-256)',
    now(),
    p_author,
    jsonb_build_object('rookies_imported', v_count, 'encrypted', true),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_run_at = EXCLUDED.last_run_at,
    last_run_by = EXCLUDED.last_run_by,
    details = EXCLUDED.details,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$;

-- 2. Aggiorna rpc_undo_draft_rookie: rimuove la cancellazione da ea_player_db
CREATE OR REPLACE FUNCTION public.rpc_undo_draft_rookie(
  p_pick_overall INT,
  p_rookie_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal_vault, extensions
AS $$
BEGIN
  -- 1. Resetta an_draft_board
  UPDATE public.an_draft_board
  SET rookie_id = NULL,
      picked_at = NULL,
      picked_by = NULL
  WHERE pick_overall = p_pick_overall;

  -- 2. Resetta an_rookie Squadra = NULL
  UPDATE public.an_rookie
  SET "Squadra" = NULL
  WHERE "ID" = p_rookie_id;

  -- 3. Rimuovi da an_player
  DELETE FROM public.an_player WHERE "ID" = p_rookie_id;

  -- Nota: il giocatore rimane conservato in ea_player_db come rookie master per EA FC 25

  RETURN jsonb_build_object('success', true, 'pick_overall', p_pick_overall);
END;
$$;

NOTIFY pgrst, 'reload schema';
