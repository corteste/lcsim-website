-- ==============================================================================
-- LCSIM - Migrazione: Crittografia Zero-Knowledge Classe Rookie (AES-256)
-- 
-- Obiettivo:
-- 1. Nessuno (nemmeno il gestore/sviluppatore con privilegi di root/superuser su Supabase)
--    può visualizzare le statistiche, OVR, potenziale o tratti dei rookie direttamente
--    dal Table Editor di Supabase. Tutte le colonne sensibili in public.an_rookie sono NULL
--    e salvate cifrate in `encrypted_data BYTEA` con algoritmo AES-256 (pgcrypto).
-- 2. La chiave di cifratura viene impostata dall'Admin neutrale della Lega quando importa
--    i rookie da /admin/automazioni.
-- 3. La funzione protetta `rpc_get_scouted_rookies(p_team_id, p_admin_passphrase)` decifra
--    in memoria ed espone ESCLUSIVAMENTE gli attributi sbloccati per ciascuna squadra
--    in base ai gettoni spesi (0G: solo anagrafica, 1G: range 10, 2G: range 3 + tratti count,
--    3G: tratti esatti + ruoli tattici, 5G: tutto sbloccato esatto).
-- 4. Quando un rookie viene scelto al Draft, `rpc_draft_rookie` decifra la sua scheda
--    e lo trasferisce ufficialmente nella rosa attiva in `public.an_player`.
-- ==============================================================================

-- 1. Estensione Crittografica
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Schema di Sicurezza Isolato (Inaccessibile da PostgREST e Table Editor)
CREATE SCHEMA IF NOT EXISTS internal_vault;
REVOKE ALL ON SCHEMA internal_vault FROM PUBLIC, anon, authenticated;
GRANT ALL ON SCHEMA internal_vault TO postgres, service_role;

-- 3. Tabella Vault per la Passphrase di Cifratura
CREATE TABLE IF NOT EXISTS internal_vault.rookie_key (
  id INT PRIMARY KEY DEFAULT 1,
  vault_passphrase TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
REVOKE ALL ON TABLE internal_vault.rookie_key FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE internal_vault.rookie_key TO postgres, service_role;

-- 4. Aggiunta Colonna Dati Cifrati in public.an_rookie
ALTER TABLE public.an_rookie
  ADD COLUMN IF NOT EXISTS encrypted_data BYTEA;

-- 5. Funzioni Matematiche Ausiliarie per il Calcolo dei Range di Scouting
CREATE OR REPLACE FUNCTION internal_vault.get_range10_mid(val NUMERIC)
RETURNS NUMERIC AS $$
  SELECT CASE WHEN val IS NULL THEN NULL ELSE (FLOOR(val / 10.0) * 10.0) + 5.0 END;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION internal_vault.get_range3_mid(val NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  decade NUMERIC;
  unit NUMERIC;
BEGIN
  IF val IS NULL THEN RETURN NULL; END IF;
  decade := FLOOR(val / 10.0) * 10.0;
  unit := MOD(val, 10.0);
  IF unit <= 2.0 THEN
    RETURN decade + 1.0;
  ELSIF unit <= 5.0 THEN
    RETURN decade + 4.0;
  ELSE
    RETURN decade + 7.5;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. RPC: Importazione Rookie con Cifratura AES-256 Zero-Knowledge
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
  v_rookie_ids BIGINT[] := ARRAY[]::BIGINT[];
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

    v_rookie_ids := array_append(v_rookie_ids, (v_pub->>'id')::BIGINT);

    -- Inserisci in public.an_rookie con tutti gli attributi sensibili a NULL!
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
      NULL, -- PiedeDebole nascosto
      v_pub->>'squadra',
      0,    -- XP iniziale
      NULL, NULL, NULL, -- Role1, Role2, Role3 nascosti
      NULL, NULL,       -- OVR, POTN nascosti
      NULL, NULL, NULL, NULL, -- Tratti nascosti
      NULL, NULL, NULL,       -- BodyType, Emotion, MABI nascosti
      -- 35 attributi fisici/tecnici TUTTI A NULL:
      NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      -- Accessori estetici:
      NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      COALESCE((v_pub->>'stelle')::INT, 3),
      NULL, -- NumeroMaglia
      v_pub->>'preferredPosition2',
      v_pub->>'preferredPosition3',
      v_pub->>'preferredPosition4',
      v_enc -- Dati criptati
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

  -- 3. Rimuovi eventuali righe rookie da public.ea_player_db (protezione leakage master)
  IF array_length(v_rookie_ids, 1) > 0 THEN
    DELETE FROM public.ea_player_db WHERE playerid = ANY(v_rookie_ids);
  END IF;

  -- 4. Registra automazione
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

-- 7. RPC: Lettura Selettiva Dati Scouting per Squadra (o Admin con Passphrase)
CREATE OR REPLACE FUNCTION public.rpc_get_scouted_rookies(
  p_team_id TEXT,
  p_admin_passphrase TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal_vault, extensions
AS $$
DECLARE
  v_key TEXT;
  v_is_admin_mode BOOLEAN := FALSE;
  v_row RECORD;
  v_tokens INT;
  v_sec JSONB;
  v_item JSONB;
  v_result JSONB := '[]'::JSONB;
BEGIN
  -- Recupera chiave del vault
  SELECT vault_passphrase INTO v_key FROM internal_vault.rookie_key WHERE id = 1;

  IF p_admin_passphrase IS NOT NULL AND v_key IS NOT NULL AND p_admin_passphrase = v_key THEN
    v_is_admin_mode := TRUE;
  END IF;

  FOR v_row IN
    SELECT
      r."ID", r."Nome", r."Cognome", r."DOB", r."Età", r."Nazionalità",
      r."Altezza", r."Peso", r."Posiz", r."Piede", r."Squadra",
      r."Stelle", r."XP",
      r."PreferredPosition2", r."PreferredPosition3", r."PreferredPosition4",
      r.encrypted_data,
      COALESCE(s.tokens_spent, 0) AS tokens_spent
    FROM public.an_rookie r
    LEFT JOIN public.an_rookie_scouting s
      ON s.rookie_id = r."ID" AND s.team_id = p_team_id
    ORDER BY r."ID" ASC
  LOOP
    v_tokens := v_row.tokens_spent;

    -- Oggetto base con campi sempre pubblici
    v_item := jsonb_build_object(
      'ID', v_row."ID",
      'Nome', v_row."Nome",
      'Cognome', v_row."Cognome",
      'DOB', v_row."DOB",
      'Età', v_row."Età",
      'Nazionalità', v_row."Nazionalità",
      'Altezza', v_row."Altezza",
      'Peso', v_row."Peso",
      'Posiz', v_row."Posiz",
      'Piede', v_row."Piede",
      'Squadra', v_row."Squadra",
      'Stelle', v_row."Stelle",
      'XP', v_row."XP",
      'PreferredPosition2', v_row."PreferredPosition2",
      'PreferredPosition3', v_row."PreferredPosition3",
      'PreferredPosition4', v_row."PreferredPosition4",
      'tokens_spent', v_tokens
    );

    -- Se abbiamo la chiave e ci sono dati criptati:
    IF v_key IS NOT NULL AND v_row.encrypted_data IS NOT NULL THEN
      BEGIN
        v_sec := pgp_sym_decrypt(v_row.encrypted_data, v_key)::jsonb;
      EXCEPTION WHEN OTHERS THEN
        v_sec := NULL;
      END;
    ELSE
      v_sec := NULL;
    END IF;

    -- Se Admin Mode con passphrase corretta: TUTTO IN CHIARO
    IF v_is_admin_mode AND v_sec IS NOT NULL THEN
      v_item := v_item || v_sec;
      v_item := jsonb_set(v_item, '{OVR}', COALESCE(v_sec->'OVR', 'null'::jsonb));
    ELSIF v_sec IS NOT NULL THEN
      -- Modalità Manager: applica rigorosamente le fasce di gettoni!

      -- Fascia 5G: Tutto esatto
      IF v_tokens >= 5 THEN
        v_item := v_item || v_sec;

      -- Fascia 3G: Tratti esatti, Ruoli tattici, Piede debole, MABI, Emotion + Range 3
      ELSIF v_tokens >= 3 THEN
        v_item := v_item || jsonb_build_object(
          'OVR', NULL,
          'Role1', v_sec->'Role1',
          'Role2', v_sec->'Role2',
          'Role3', v_sec->'Role3',
          'Trait1', v_sec->'Trait1',
          'Trait2', v_sec->'Trait2',
          'IconTrait1', v_sec->'IconTrait1',
          'IconTrait2', v_sec->'IconTrait2',
          'Tratti', v_sec->'Tratti',
          'Emotion', v_sec->'Emotion',
          'PiedeDebole', v_sec->'PiedeDebole',
          'MABI', v_sec->'MABI',
          -- Reparto DIF
          'CONT', internal_vault.get_range3_mid((v_sec->>'CONT')::NUMERIC),
          'SCIV', internal_vault.get_range3_mid((v_sec->>'SCIV')::NUMERIC),
          'MARC', internal_vault.get_range3_mid((v_sec->>'MARC')::NUMERIC),
          'AGGR', internal_vault.get_range3_mid((v_sec->>'AGGR')::NUMERIC),
          'INTR', internal_vault.get_range3_mid((v_sec->>'INTR')::NUMERIC),
          -- Reparto PAS
          'PASC', internal_vault.get_range3_mid((v_sec->>'PASC')::NUMERIC),
          'PASL', internal_vault.get_range3_mid((v_sec->>'PASL')::NUMERIC),
          'CRSS', internal_vault.get_range3_mid((v_sec->>'CRSS')::NUMERIC),
          'CTRP', internal_vault.get_range3_mid((v_sec->>'CTRP')::NUMERIC),
          'VISI', internal_vault.get_range3_mid((v_sec->>'VISI')::NUMERIC),
          'EFFT', internal_vault.get_range3_mid((v_sec->>'EFFT')::NUMERIC),
          -- Reparto ATT
          'FINA', internal_vault.get_range3_mid((v_sec->>'FINA')::NUMERIC),
          'PIAZ', internal_vault.get_range3_mid((v_sec->>'PIAZ')::NUMERIC),
          'PTIR', internal_vault.get_range3_mid((v_sec->>'PTIR')::NUMERIC),
          'TIRD', internal_vault.get_range3_mid((v_sec->>'TIRD')::NUMERIC),
          'TIRV', internal_vault.get_range3_mid((v_sec->>'TIRV')::NUMERIC),
          'DRBL', internal_vault.get_range3_mid((v_sec->>'DRBL')::NUMERIC),
          'TSTA', internal_vault.get_range3_mid((v_sec->>'TSTA')::NUMERIC),
          -- Reparto FIS
          'VELO', internal_vault.get_range3_mid((v_sec->>'VELO')::NUMERIC),
          'ACCL', internal_vault.get_range3_mid((v_sec->>'ACCL')::NUMERIC),
          'AGIL', internal_vault.get_range3_mid((v_sec->>'AGIL')::NUMERIC),
          'RESI', internal_vault.get_range3_mid((v_sec->>'RESI')::NUMERIC),
          'FRZA', internal_vault.get_range3_mid((v_sec->>'FRZA')::NUMERIC),
          'ELEV', internal_vault.get_range3_mid((v_sec->>'ELEV')::NUMERIC),
          'EQLB', internal_vault.get_range3_mid((v_sec->>'EQLB')::NUMERIC),
          'RIFL', internal_vault.get_range3_mid((v_sec->>'RIFL')::NUMERIC),
          -- Reparto POR
          'PREP', internal_vault.get_range3_mid((v_sec->>'PREP')::NUMERIC),
          'POSP', internal_vault.get_range3_mid((v_sec->>'POSP')::NUMERIC),
          'RINP', internal_vault.get_range3_mid((v_sec->>'RINP')::NUMERIC),
          'RIFP', internal_vault.get_range3_mid((v_sec->>'RIFP')::NUMERIC),
          'TUFP', internal_vault.get_range3_mid((v_sec->>'TUFP')::NUMERIC),
          -- Reparto CPZ & Freddezza
          'PNIZ', internal_vault.get_range3_mid((v_sec->>'PNIZ')::NUMERIC),
          'CRIG', internal_vault.get_range3_mid((v_sec->>'CRIG')::NUMERIC),
          'FRED', internal_vault.get_range3_mid((v_sec->>'FRED')::NUMERIC)
        );

      -- Fascia 2G: Range 3, Emotion, Conteggio Tratti (nomi tratti e ruoli nascosti)
      ELSIF v_tokens >= 2 THEN
        v_item := v_item || jsonb_build_object(
          'OVR', NULL,
          'Role1', NULL,
          'Role2', NULL,
          'Role3', NULL,
          'Trait1', NULL,
          'Trait2', NULL,
          'IconTrait1', NULL,
          'IconTrait2', NULL,
          'Tratti', NULL,
          'TraitsCount', (
            CASE WHEN v_sec->>'Trait1' IS NOT NULL AND v_sec->>'Trait1' != '' AND v_sec->>'Trait1' != 'Nessuno' THEN 1 ELSE 0 END +
            CASE WHEN v_sec->>'Trait2' IS NOT NULL AND v_sec->>'Trait2' != '' AND v_sec->>'Trait2' != 'Nessuno' THEN 1 ELSE 0 END +
            CASE WHEN v_sec->>'IconTrait1' IS NOT NULL AND v_sec->>'IconTrait1' != '' AND v_sec->>'IconTrait1' != 'Nessuno' THEN 1 ELSE 0 END +
            CASE WHEN v_sec->>'IconTrait2' IS NOT NULL AND v_sec->>'IconTrait2' != '' AND v_sec->>'IconTrait2' != 'Nessuno' THEN 1 ELSE 0 END
          ),
          'Emotion', v_sec->'Emotion',
          'PiedeDebole', NULL,
          'MABI', NULL,
          -- Reparto DIF
          'CONT', internal_vault.get_range3_mid((v_sec->>'CONT')::NUMERIC),
          'SCIV', internal_vault.get_range3_mid((v_sec->>'SCIV')::NUMERIC),
          'MARC', internal_vault.get_range3_mid((v_sec->>'MARC')::NUMERIC),
          'AGGR', internal_vault.get_range3_mid((v_sec->>'AGGR')::NUMERIC),
          'INTR', internal_vault.get_range3_mid((v_sec->>'INTR')::NUMERIC),
          -- Reparto PAS
          'PASC', internal_vault.get_range3_mid((v_sec->>'PASC')::NUMERIC),
          'PASL', internal_vault.get_range3_mid((v_sec->>'PASL')::NUMERIC),
          'CRSS', internal_vault.get_range3_mid((v_sec->>'CRSS')::NUMERIC),
          'CTRP', internal_vault.get_range3_mid((v_sec->>'CTRP')::NUMERIC),
          'VISI', internal_vault.get_range3_mid((v_sec->>'VISI')::NUMERIC),
          'EFFT', internal_vault.get_range3_mid((v_sec->>'EFFT')::NUMERIC),
          -- Reparto ATT
          'FINA', internal_vault.get_range3_mid((v_sec->>'FINA')::NUMERIC),
          'PIAZ', internal_vault.get_range3_mid((v_sec->>'PIAZ')::NUMERIC),
          'PTIR', internal_vault.get_range3_mid((v_sec->>'PTIR')::NUMERIC),
          'TIRD', internal_vault.get_range3_mid((v_sec->>'TIRD')::NUMERIC),
          'TIRV', internal_vault.get_range3_mid((v_sec->>'TIRV')::NUMERIC),
          'DRBL', internal_vault.get_range3_mid((v_sec->>'DRBL')::NUMERIC),
          'TSTA', internal_vault.get_range3_mid((v_sec->>'TSTA')::NUMERIC),
          -- Reparto FIS
          'VELO', internal_vault.get_range3_mid((v_sec->>'VELO')::NUMERIC),
          'ACCL', internal_vault.get_range3_mid((v_sec->>'ACCL')::NUMERIC),
          'AGIL', internal_vault.get_range3_mid((v_sec->>'AGIL')::NUMERIC),
          'RESI', internal_vault.get_range3_mid((v_sec->>'RESI')::NUMERIC),
          'FRZA', internal_vault.get_range3_mid((v_sec->>'FRZA')::NUMERIC),
          'ELEV', internal_vault.get_range3_mid((v_sec->>'ELEV')::NUMERIC),
          'EQLB', internal_vault.get_range3_mid((v_sec->>'EQLB')::NUMERIC),
          'RIFL', internal_vault.get_range3_mid((v_sec->>'RIFL')::NUMERIC),
          -- Reparto POR
          'PREP', internal_vault.get_range3_mid((v_sec->>'PREP')::NUMERIC),
          'POSP', internal_vault.get_range3_mid((v_sec->>'POSP')::NUMERIC),
          'RINP', internal_vault.get_range3_mid((v_sec->>'RINP')::NUMERIC),
          'RIFP', internal_vault.get_range3_mid((v_sec->>'RIFP')::NUMERIC),
          'TUFP', internal_vault.get_range3_mid((v_sec->>'TUFP')::NUMERIC),
          -- Reparto CPZ & Freddezza
          'PNIZ', internal_vault.get_range3_mid((v_sec->>'PNIZ')::NUMERIC),
          'CRIG', internal_vault.get_range3_mid((v_sec->>'CRIG')::NUMERIC),
          'FRED', internal_vault.get_range3_mid((v_sec->>'FRED')::NUMERIC)
        );

      -- Fascia 1G: Stima Abilità (Range 10), tutto il resto nascosto
      ELSIF v_tokens >= 1 THEN
        v_item := v_item || jsonb_build_object(
          'OVR', NULL,
          'Role1', NULL,
          'Role2', NULL,
          'Role3', NULL,
          'Trait1', NULL,
          'Trait2', NULL,
          'IconTrait1', NULL,
          'IconTrait2', NULL,
          'Tratti', NULL,
          'Emotion', NULL,
          'PiedeDebole', NULL,
          'MABI', NULL,
          -- Reparto DIF
          'CONT', internal_vault.get_range10_mid((v_sec->>'CONT')::NUMERIC),
          'SCIV', internal_vault.get_range10_mid((v_sec->>'SCIV')::NUMERIC),
          'MARC', internal_vault.get_range10_mid((v_sec->>'MARC')::NUMERIC),
          'AGGR', internal_vault.get_range10_mid((v_sec->>'AGGR')::NUMERIC),
          'INTR', internal_vault.get_range10_mid((v_sec->>'INTR')::NUMERIC),
          -- Reparto PAS
          'PASC', internal_vault.get_range10_mid((v_sec->>'PASC')::NUMERIC),
          'PASL', internal_vault.get_range10_mid((v_sec->>'PASL')::NUMERIC),
          'CRSS', internal_vault.get_range10_mid((v_sec->>'CRSS')::NUMERIC),
          'CTRP', internal_vault.get_range10_mid((v_sec->>'CTRP')::NUMERIC),
          'VISI', internal_vault.get_range10_mid((v_sec->>'VISI')::NUMERIC),
          'EFFT', internal_vault.get_range10_mid((v_sec->>'EFFT')::NUMERIC),
          -- Reparto ATT
          'FINA', internal_vault.get_range10_mid((v_sec->>'FINA')::NUMERIC),
          'PIAZ', internal_vault.get_range10_mid((v_sec->>'PIAZ')::NUMERIC),
          'PTIR', internal_vault.get_range10_mid((v_sec->>'PTIR')::NUMERIC),
          'TIRD', internal_vault.get_range10_mid((v_sec->>'TIRD')::NUMERIC),
          'TIRV', internal_vault.get_range10_mid((v_sec->>'TIRV')::NUMERIC),
          'DRBL', internal_vault.get_range10_mid((v_sec->>'DRBL')::NUMERIC),
          'TSTA', internal_vault.get_range10_mid((v_sec->>'TSTA')::NUMERIC),
          -- Reparto FIS
          'VELO', internal_vault.get_range10_mid((v_sec->>'VELO')::NUMERIC),
          'ACCL', internal_vault.get_range10_mid((v_sec->>'ACCL')::NUMERIC),
          'AGIL', internal_vault.get_range10_mid((v_sec->>'AGIL')::NUMERIC),
          'RESI', internal_vault.get_range10_mid((v_sec->>'RESI')::NUMERIC),
          'FRZA', internal_vault.get_range10_mid((v_sec->>'FRZA')::NUMERIC),
          'ELEV', internal_vault.get_range10_mid((v_sec->>'ELEV')::NUMERIC),
          'EQLB', internal_vault.get_range10_mid((v_sec->>'EQLB')::NUMERIC),
          'RIFL', internal_vault.get_range10_mid((v_sec->>'RIFL')::NUMERIC),
          -- Reparto POR
          'PREP', internal_vault.get_range10_mid((v_sec->>'PREP')::NUMERIC),
          'POSP', internal_vault.get_range10_mid((v_sec->>'POSP')::NUMERIC),
          'RINP', internal_vault.get_range10_mid((v_sec->>'RINP')::NUMERIC),
          'RIFP', internal_vault.get_range10_mid((v_sec->>'RIFP')::NUMERIC),
          'TUFP', internal_vault.get_range10_mid((v_sec->>'TUFP')::NUMERIC),
          -- Reparto CPZ & Freddezza
          'PNIZ', internal_vault.get_range10_mid((v_sec->>'PNIZ')::NUMERIC),
          'CRIG', internal_vault.get_range10_mid((v_sec->>'CRIG')::NUMERIC),
          'FRED', internal_vault.get_range10_mid((v_sec->>'FRED')::NUMERIC)
        );
      END IF;
    END IF;

    v_result := v_result || jsonb_build_array(v_item);
  END LOOP;

  RETURN v_result;
END;
$$;

-- 8. RPC: Esecuzione Scelta Draft (Assegnazione, Decifratura ed Entrata in an_player)
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
BEGIN
  -- 1. Verifica che la scelta non sia già stata effettuata
  IF EXISTS (
    SELECT 1 FROM public.an_draft_board
    WHERE pick_overall = p_pick_overall AND rookie_id IS NOT NULL
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

  -- 5. Aggiorna an_draft_board
  UPDATE public.an_draft_board
  SET rookie_id = p_rookie_id,
      picked_at = now(),
      picked_by = p_picked_by
  WHERE pick_overall = p_pick_overall;

  -- 6. Se abbiamo i dati decifrati, inserisci/aggiorna in an_player!
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

    -- 7. Inserisci anche in ea_player_db per EA FC 25
    v_ea := v_sec->'fullEaRow';
    IF v_ea IS NOT NULL THEN
      -- Se presente fullEaRow, inserisci in ea_player_db
      BEGIN
        INSERT INTO public.ea_player_db SELECT * FROM jsonb_populate_record(NULL::public.ea_player_db, v_ea)
        ON CONFLICT (playerid) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Non bloccare se mismatch di colonna non critica
      END;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'pick_overall', p_pick_overall,
    'rookie_id', p_rookie_id,
    'team_id', p_team_id
  );
END;
$$;

-- 9. RPC: Annullamento Scelta Draft (Undo Admin)
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

  -- 4. Rimuovi da ea_player_db
  DELETE FROM public.ea_player_db WHERE playerid = p_rookie_id;

  RETURN jsonb_build_object('success', true, 'pick_overall', p_pick_overall);
END;
$$;

-- 10. Permessi di Esecuzione RPC
GRANT EXECUTE ON FUNCTION public.rpc_import_encrypted_rookies TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_get_scouted_rookies TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_draft_rookie TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_undo_draft_rookie TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
