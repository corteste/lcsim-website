-- ==============================================================================
-- Migrazione: Invecchiamento solo anagrafico per calciatori ritirati (Punto #35)
-- File: supabase/migrations/20261025_player_aging_retired.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_apply_player_aging(
  p_admin_name TEXT,
  p_decay_updates JSONB,
  p_retiring_ids BIGINT[],
  p_announcement_title TEXT,
  p_announcement_content TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aged_active_count INT := 0;
  v_aged_retired_count INT := 0;
  v_aged_count INT := 0;
  v_ea_aged_count INT := 0;
  v_decayed_count INT := 0;
  v_ea_decayed_count INT := 0;
  v_retired_count INT := 0;
  v_ea_retired_count INT := 0;
BEGIN
  -- 1. Verifica permessi di sicurezza o parametri
  IF p_admin_name IS NULL OR trim(p_admin_name) = '' THEN
    p_admin_name := 'Amministratore LCSIM';
  END IF;

  -- 2. Applicazione del decadimento attributi su an_player (per i soli calciatori over 30 in attività)
  IF p_decay_updates IS NOT NULL AND jsonb_array_length(p_decay_updates) > 0 THEN
    UPDATE public.an_player p
    SET
      "OVR" = u.ovr,
      "RIFP" = u.rifp,
      "TUFP" = u.tufp,
      "TSTA" = u.tsta,
      "ACCL" = u.accl,
      "VELO" = u.velo,
      "RESI" = u.resi,
      "FRZA" = u.frza,
      "AGIL" = u.agil,
      "ELEV" = u.elev,
      "RIFL" = u.rifl,
      "EQLB" = u.eqlb
    FROM jsonb_to_recordset(p_decay_updates) AS u(
      id BIGINT,
      ovr BIGINT,
      rifp BIGINT,
      tufp BIGINT,
      tsta BIGINT,
      accl BIGINT,
      velo BIGINT,
      resi BIGINT,
      frza BIGINT,
      agil BIGINT,
      elev BIGINT,
      rifl BIGINT,
      eqlb BIGINT
    )
    WHERE p."ID" = u.id;

    GET DIAGNOSTICS v_decayed_count = ROW_COUNT;

    -- Sincronizzazione attributi su ea_player_db
    UPDATE public.ea_player_db ea
    SET
      overallrating = u.ovr,
      gkreflexes = u.rifp,
      gkdiving = u.tufp,
      headingaccuracy = u.tsta,
      acceleration = u.accl,
      sprintspeed = u.velo,
      stamina = u.resi,
      strength = u.frza,
      agility = u.agil,
      jumping = u.elev,
      reactions = u.rifl,
      balance = u.eqlb
    FROM jsonb_to_recordset(p_decay_updates) AS u(
      id BIGINT,
      ovr BIGINT,
      rifp BIGINT,
      tufp BIGINT,
      tsta BIGINT,
      accl BIGINT,
      velo BIGINT,
      resi BIGINT,
      frza BIGINT,
      agil BIGINT,
      elev BIGINT,
      rifl BIGINT,
      eqlb BIGINT
    )
    WHERE ea.playerid = u.id;

    GET DIAGNOSTICS v_ea_decayed_count = ROW_COUNT;
  END IF;

  -- 3. Incremento anagrafico (+1 anno) e sfasamento date (-365 giorni)
  -- 3a. Calciatori ATTIVI (in rosa o svincolati)
  UPDATE public.an_player
  SET 
    "Età" = "Età" + 1, 
    "DOB" = "DOB" - 365
  WHERE "Squadra" != 'RITIRATO' OR "Squadra" IS NULL;

  GET DIAGNOSTICS v_aged_active_count = ROW_COUNT;

  -- 3b. Calciatori GIÀ RITIRATI (invecchiamento SOLO anagrafico e data, nessun decadimento attributi/OVR)
  UPDATE public.an_player
  SET 
    "Età" = "Età" + 1, 
    "DOB" = "DOB" - 365
  WHERE "Squadra" = 'RITIRATO';

  GET DIAGNOSTICS v_aged_retired_count = ROW_COUNT;

  v_aged_count := v_aged_active_count + v_aged_retired_count;

  -- Sincronizzazione birthdate (-365 giorni) su ea_player_db per tutti i calciatori censiti in an_player (attivi e ritirati)
  UPDATE public.ea_player_db ea
  SET birthdate = ea.birthdate - 365
  FROM public.an_player p
  WHERE ea.playerid = p."ID";

  GET DIAGNOSTICS v_ea_aged_count = ROW_COUNT;

  -- 4. Ufficializzazione dei nuovi ritiri (calciatori che passano a 35+ anni in questa annata)
  IF p_retiring_ids IS NOT NULL AND array_length(p_retiring_ids, 1) > 0 THEN
    -- A. an_player: imposta status RITIRATO e rimuove numero di maglia
    UPDATE public.an_player
    SET "Squadra" = 'RITIRATO', "NumeroMaglia" = NULL
    WHERE "ID" = ANY(p_retiring_ids);

    GET DIAGNOSTICS v_retired_count = ROW_COUNT;

    -- B. ea_player_db: imposta isretiring = 1
    UPDATE public.ea_player_db
    SET isretiring = 1
    WHERE playerid = ANY(p_retiring_ids);

    GET DIAGNOSTICS v_ea_retired_count = ROW_COUNT;

    -- C. Rimuovi da formazioni salvate in an_team_tactic (starters, bench_order, setPieces)
    UPDATE public.an_team_tactic t
    SET 
      starters = (
        SELECT COALESCE(
          jsonb_agg(
            CASE 
              WHEN jsonb_typeof(elem) = 'number' AND (elem #>> '{}')::BIGINT = ANY(p_retiring_ids) THEN NULL 
              ELSE elem 
            END
          ),
          '[]'::jsonb
        )
        FROM jsonb_array_elements(t.starters) AS elem
      ),
      bench_order = (
        SELECT COALESCE(
          jsonb_agg(elem),
          '[]'::jsonb
        )
        FROM jsonb_array_elements(t.bench_order) AS elem
        WHERE NOT (jsonb_typeof(elem) = 'number' AND (elem #>> '{}')::BIGINT = ANY(p_retiring_ids))
      ),
      penalty_taker = CASE WHEN penalty_taker = ANY(p_retiring_ids) THEN NULL ELSE penalty_taker END,
      free_kick_taker = CASE WHEN free_kick_taker = ANY(p_retiring_ids) THEN NULL ELSE free_kick_taker END,
      left_corner_taker = CASE WHEN left_corner_taker = ANY(p_retiring_ids) THEN NULL ELSE left_corner_taker END,
      right_corner_taker = CASE WHEN right_corner_taker = ANY(p_retiring_ids) THEN NULL ELSE right_corner_taker END,
      captain = CASE WHEN captain = ANY(p_retiring_ids) THEN NULL ELSE captain END;
  END IF;

  -- 5. Creazione annuncio ufficiale (se richiesto)
  IF p_announcement_content IS NOT NULL AND trim(p_announcement_content) != '' THEN
    INSERT INTO public.league_announcements (
      title,
      content,
      category,
      priority,
      is_active,
      is_pinned,
      author_name
    ) VALUES (
      COALESCE(p_announcement_title, 'Passaggio di Stagione: Invecchiamento Calciatori e Annuncio Ritiri'),
      p_announcement_content,
      'generale',
      'high',
      true,
      false,
      p_admin_name
    );
  END IF;

  -- 6. Registrazione stato in league_automation_state
  INSERT INTO public.league_automation_state (
    id,
    action_name,
    last_run_at,
    last_run_by,
    details
  ) VALUES (
    'aging_players',
    'Applica Invecchiamento Calciatori',
    timezone('utc'::text, now()),
    p_admin_name,
    jsonb_build_object(
      'aged_count', v_aged_count,
      'aged_active_count', v_aged_active_count,
      'aged_retired_count', v_aged_retired_count,
      'ea_aged_count', v_ea_aged_count,
      'decayed_count', v_decayed_count,
      'ea_decayed_count', v_ea_decayed_count,
      'retired_count', v_retired_count,
      'ea_retired_count', v_ea_retired_count,
      'meta', p_details
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    last_run_at = EXCLUDED.last_run_at,
    last_run_by = EXCLUDED.last_run_by,
    details = EXCLUDED.details,
    updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object(
    'success', true,
    'aged_count', v_aged_count,
    'aged_active_count', v_aged_active_count,
    'aged_retired_count', v_aged_retired_count,
    'ea_aged_count', v_ea_aged_count,
    'decayed_count', v_decayed_count,
    'ea_decayed_count', v_ea_decayed_count,
    'retired_count', v_retired_count,
    'ea_retired_count', v_ea_retired_count
  );
END;
$$;

-- Permessi di esecuzione
GRANT EXECUTE ON FUNCTION public.rpc_apply_player_aging TO anon, authenticated, service_role;
