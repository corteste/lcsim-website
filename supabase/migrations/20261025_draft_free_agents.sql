-- ==============================================================================
-- Migrazione: Selezione Calciatori Svincolati al Draft di Lega (Punto #40)
-- File: supabase/migrations/20261025_draft_free_agents.sql
-- ==============================================================================

-- 1. Estensione tabella an_draft_board con colonne player_id e player_type
ALTER TABLE public.an_draft_board
  ADD COLUMN IF NOT EXISTS player_id BIGINT REFERENCES public.an_player("ID"),
  ADD COLUMN IF NOT EXISTS player_type TEXT DEFAULT 'rookie';

-- 2. Backfill scelte pregresse
UPDATE public.an_draft_board
SET player_id = rookie_id, player_type = 'rookie'
WHERE rookie_id IS NOT NULL AND player_id IS NULL;

-- 3. Aggiornamento rpc_draft_rookie per popolare coerentemente player_id e player_type
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

-- 4. Nuova RPC: rpc_draft_free_agent (Tesseramento Svincolato al Draft)
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

-- 5. Aggiornamento rpc_undo_draft_rookie (supporta annullamento sia di rookie che di svincolati)
CREATE OR REPLACE FUNCTION public.rpc_undo_draft_rookie(
  p_pick_overall INT,
  p_rookie_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal_vault, extensions
AS $$
DECLARE
  v_pick RECORD;
BEGIN
  SELECT * INTO v_pick FROM public.an_draft_board WHERE pick_overall = p_pick_overall;

  -- 1. Resetta an_draft_board
  UPDATE public.an_draft_board
  SET rookie_id = NULL,
      player_id = NULL,
      player_type = 'rookie',
      picked_at = NULL,
      picked_by = NULL
  WHERE pick_overall = p_pick_overall;

  -- 2. Se era uno svincolato (free_agent), svincola il calciatore in an_player (senza cancellarlo!)
  IF v_pick.player_type = 'free_agent' OR v_pick.rookie_id IS NULL THEN
    UPDATE public.an_player
    SET "Squadra" = NULL
    WHERE "ID" = COALESCE(v_pick.player_id, p_rookie_id);

    RETURN jsonb_build_object('success', true, 'pick_overall', p_pick_overall, 'type', 'free_agent');
  END IF;

  -- 3. Se era un rookie, ripristina Squadra = NULL in an_rookie e cancella la riga temporanea da an_player ed ea_player_db
  UPDATE public.an_rookie
  SET "Squadra" = NULL
  WHERE "ID" = p_rookie_id;

  DELETE FROM public.an_player WHERE "ID" = p_rookie_id;
  DELETE FROM public.ea_player_db WHERE playerid = p_rookie_id;

  RETURN jsonb_build_object('success', true, 'pick_overall', p_pick_overall, 'type', 'rookie');
END;
$$;

-- 6. Permessi RPC
GRANT EXECUTE ON FUNCTION public.rpc_draft_rookie TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_draft_free_agent TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_undo_draft_rookie TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
