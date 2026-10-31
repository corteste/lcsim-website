-- ==============================================================================
-- Migrazione: Calcolo Peggioramenti Giocatori (In-Season / Prestazionali) - Punto #25
-- File: supabase/migrations/20261031_performance_decay.sql
-- ==============================================================================

-- 1. Inserimento o aggiornamento dell'automazione in league_automation_state
INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details)
VALUES (
  'performance_decay',
  'Peggioramenti Prestazionali In-Season',
  NULL,
  NULL,
  '{"note": "Nessuna esecuzione registrata"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2. Funzione RPC atomica per applicare i peggioramenti prestazionali a an_player e ea_player_db
CREATE OR REPLACE FUNCTION public.rpc_apply_performance_decay(
  p_admin_name TEXT,
  p_season INT,
  p_decay_updates JSONB,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INT := 0;
  v_ea_updated_count INT := 0;
BEGIN
  IF p_admin_name IS NULL OR trim(p_admin_name) = '' THEN
    p_admin_name := 'Amministratore LCSIM';
  END IF;

  IF p_decay_updates IS NOT NULL AND jsonb_array_length(p_decay_updates) > 0 THEN
    -- Aggiornamento attributi e OVR su an_player
    UPDATE public.an_player p
    SET
      "OVR" = u.ovr,
      "RIFP" = u.rifp,
      "PREP" = u.prep,
      "TUFP" = u.tufp,
      "POSP" = u.posp,
      "RINP" = u.rinp,
      "MARC" = u.marc,
      "CONT" = u.cont,
      "AGGR" = u.aggr,
      "SCIV" = u.sciv,
      "INTR" = u.intr,
      "PASC" = u.pasc,
      "PASL" = u.pasl,
      "CRSS" = u.crss,
      "CTRP" = u.ctrp,
      "VISI" = u.visi,
      "EFFT" = u.efft,
      "POTN" = u.potn,
      "PIAZ" = u.piaz,
      "PTIR" = u.ptir,
      "TIRD" = u.tird,
      "DRBL" = u.drbl,
      "TIRV" = u.tirv,
      "TSTA" = u.tsta,
      "FINA" = u.fina,
      "ACCL" = u.accl,
      "VELO" = u.velo,
      "RESI" = u.resi,
      "FRZA" = u.frza,
      "AGIL" = u.agil,
      "ELEV" = u.elev,
      "RIFL" = u.rifl,
      "EQLB" = u.eqlb,
      "PNIZ" = u.pniz,
      "CRIG" = u.crig,
      "FRED" = u.fred
    FROM jsonb_to_recordset(p_decay_updates) AS u(
      id BIGINT,
      ovr BIGINT,
      rifp BIGINT,
      prep BIGINT,
      tufp BIGINT,
      posp BIGINT,
      rinp BIGINT,
      marc BIGINT,
      cont BIGINT,
      aggr BIGINT,
      sciv BIGINT,
      intr BIGINT,
      pasc BIGINT,
      pasl BIGINT,
      crss BIGINT,
      ctrp BIGINT,
      visi BIGINT,
      efft BIGINT,
      potn BIGINT,
      piaz BIGINT,
      ptir BIGINT,
      tird BIGINT,
      drbl BIGINT,
      tirv BIGINT,
      tsta BIGINT,
      fina BIGINT,
      accl BIGINT,
      velo BIGINT,
      resi BIGINT,
      frza BIGINT,
      agil BIGINT,
      elev BIGINT,
      rifl BIGINT,
      eqlb BIGINT,
      pniz BIGINT,
      crig BIGINT,
      fred BIGINT
    )
    WHERE p."ID" = u.id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- Sincronizzazione attributi su ea_player_db
    UPDATE public.ea_player_db ea
    SET
      overallrating = u.ovr,
      gkreflexes = u.rifp,
      gkhandling = u.prep,
      gkdiving = u.tufp,
      gkpositioning = u.posp,
      gkkicking = u.rinp,
      defensiveawareness = u.marc,
      standingtackle = u.cont,
      aggression = u.aggr,
      slidingtackle = u.sciv,
      interceptions = u.intr,
      shortpassing = u.pasc,
      longpassing = u.pasl,
      crossing = u.crss,
      ballcontrol = u.ctrp,
      vision = u.visi,
      curve = u.efft,
      shotpower = u.potn,
      positioning = u.piaz,
      freekickaccuracy = u.ptir,
      longshots = u.tird,
      dribbling = u.drbl,
      volleys = u.tirv,
      headingaccuracy = u.tsta,
      finishing = u.fina,
      acceleration = u.accl,
      sprintspeed = u.velo,
      stamina = u.resi,
      strength = u.frza,
      agility = u.agil,
      jumping = u.elev,
      reactions = u.rifl,
      balance = u.eqlb,
      penalties = u.pniz,
      composure = u.crig
    FROM jsonb_to_recordset(p_decay_updates) AS u(
      id BIGINT,
      ovr BIGINT,
      rifp BIGINT,
      prep BIGINT,
      tufp BIGINT,
      posp BIGINT,
      rinp BIGINT,
      marc BIGINT,
      cont BIGINT,
      aggr BIGINT,
      sciv BIGINT,
      intr BIGINT,
      pasc BIGINT,
      pasl BIGINT,
      crss BIGINT,
      ctrp BIGINT,
      visi BIGINT,
      efft BIGINT,
      potn BIGINT,
      piaz BIGINT,
      ptir BIGINT,
      tird BIGINT,
      drbl BIGINT,
      tirv BIGINT,
      tsta BIGINT,
      fina BIGINT,
      accl BIGINT,
      velo BIGINT,
      resi BIGINT,
      frza BIGINT,
      agil BIGINT,
      elev BIGINT,
      rifl BIGINT,
      eqlb BIGINT,
      pniz BIGINT,
      crig BIGINT,
      fred BIGINT
    )
    WHERE ea.playerid = u.id;

    GET DIAGNOSTICS v_ea_updated_count = ROW_COUNT;
  END IF;

  -- 3. Registrazione dello stato automazione
  INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details, updated_at)
  VALUES (
    'performance_decay',
    'Peggioramenti Prestazionali In-Season',
    NOW(),
    p_admin_name,
    p_details,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_run_at = NOW(),
    last_run_by = p_admin_name,
    details = p_details,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'season', p_season,
    'updated_count', v_updated_count,
    'ea_updated_count', v_ea_updated_count
  );
END;
$$;

-- Permessi di esecuzione
GRANT EXECUTE ON FUNCTION public.rpc_apply_performance_decay(TEXT, INT, JSONB, JSONB) TO authenticated, service_role, anon;
