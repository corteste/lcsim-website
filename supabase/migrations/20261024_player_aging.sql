-- ==============================================================================
-- Migrazione: Automatizzazione Applica Invecchiamenti & Gestione Ritiri (Punto #10)
-- File: supabase/migrations/20261024_player_aging.sql
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

  -- 2. Applicazione del decadimento attributi su an_player (per i calciatori over 30)
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

  -- 3. Incremento anagrafico (+1 anno) e sfasamento date (-365 giorni) su tutti i calciatori ATTIVI
  -- NOTA: I calciatori già con Squadra = 'RITIRATO' NON devono essere invecchiati!
  UPDATE public.an_player
  SET 
    "Età" = "Età" + 1, 
    "DOB" = "DOB" - 365
  WHERE "Squadra" != 'RITIRATO' OR "Squadra" IS NULL;

  GET DIAGNOSTICS v_aged_count = ROW_COUNT;

  -- Sincronizzazione birthdate (-365 giorni) su ea_player_db per i soli calciatori attivi
  UPDATE public.ea_player_db ea
  SET birthdate = ea.birthdate - 365
  FROM public.an_player p
  WHERE ea.playerid = p."ID" AND (p."Squadra" != 'RITIRATO' OR p."Squadra" IS NULL);

  GET DIAGNOSTICS v_ea_aged_count = ROW_COUNT;

  -- 4. Ufficializzazione dei ritiri (calciatori che passano a 35+ anni)
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
      tactical_settings = CASE
        WHEN t.tactical_settings ? 'setPieces' THEN
          jsonb_set(
            t.tactical_settings,
            '{setPieces}',
            (
              SELECT COALESCE(
                jsonb_object_agg(
                  sp_key,
                  CASE 
                    WHEN jsonb_typeof(sp_val) = 'number' AND (sp_val #>> '{}')::BIGINT = ANY(p_retiring_ids) THEN NULL 
                    ELSE sp_val 
                  END
                ),
                '{}'::jsonb
              )
              FROM jsonb_each(t.tactical_settings->'setPieces') AS sp(sp_key, sp_val)
            )
          )
        ELSE t.tactical_settings
      END;

    -- D. Rimuovi da eventuali liste di mercato o tagli pendenti
    DELETE FROM public.as_player_market WHERE "PLAYER_ID_FK" = ANY(p_retiring_ids);
    DELETE FROM public.team_cuts_registry WHERE player_id = ANY(p_retiring_ids);
  END IF;

  -- 5. Inserimento del comunicato ufficiale automatico in bacheca (league_announcements)
  IF p_announcement_content IS NOT NULL AND trim(p_announcement_content) != '' THEN
    INSERT INTO public.league_announcements (
      title,
      content,
      category,
      priority,
      is_pinned,
      is_banner,
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
