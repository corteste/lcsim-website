-- ============================================================================
-- MIGRATION: 20261024_market_cuts.sql
-- DESCRIZIONE: Tabella registro tagli per team (team_cuts_registry), RLS policies,
--              funzione RPC atomica execute_official_cuts e registrazione automazione.
-- ============================================================================

-- 1. Tabella registro tagli dei team
CREATE TABLE IF NOT EXISTS public.team_cuts_registry (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.an_player("ID") ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES public.an_team("TEAM_ID") ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_team_cuts_player UNIQUE (player_id)
);

CREATE INDEX IF NOT EXISTS idx_team_cuts_team ON public.team_cuts_registry(team_id);
CREATE INDEX IF NOT EXISTS idx_team_cuts_player ON public.team_cuts_registry(player_id);

-- 2. Abilitazione RLS (Allineato allo standard delle tabelle di mercato e draft)
ALTER TABLE public.team_cuts_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on team_cuts_registry" ON public.team_cuts_registry;
CREATE POLICY "Allow all on team_cuts_registry"
ON public.team_cuts_registry
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Inserimento record iniziale in league_automation_state se non presente
INSERT INTO public.league_automation_state (id, action_name, last_run_at, last_run_by, details)
VALUES (
  'official_cuts',
  'Ufficializza Tagli di Lega',
  NULL,
  NULL,
  '{"note": "Nessuna esecuzione registrata"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. Funzione RPC atomica per la verifica e l'ufficializzazione dei tagli
CREATE OR REPLACE FUNCTION public.execute_official_cuts(
  p_admin_name TEXT DEFAULT 'Amministratore LCSIM'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_non_compliant JSONB := '[]'::jsonb;
  v_team RECORD;
  v_player RECORD;
  v_released_count INT := 0;
  v_announcement_content TEXT := '';
  v_team_players TEXT;
  v_team_count INT;
  v_cuts_count INT;
  v_min_cuts INT;
  v_max_cuts INT;
  v_post_roster INT;
  v_res_players JSONB := '[]'::jsonb;
BEGIN
  -- A. Verifica conformità per tutte le squadre attive (Serie A)
  FOR v_team IN
    SELECT "TEAM_ID", "NAME"
    FROM public.an_team
    WHERE "ACTIVE" = true AND "TEAM_ID" != 'RITIRATO'
    ORDER BY "NAME"
  LOOP
    -- Conteggio giocatori attivi in rosa
    SELECT COUNT(*) INTO v_team_count
    FROM public.an_player
    WHERE "Squadra" = v_team."TEAM_ID";

    -- Conteggio tagli selezionati
    SELECT COUNT(*) INTO v_cuts_count
    FROM public.team_cuts_registry
    WHERE team_id = v_team."TEAM_ID";

    v_post_roster := v_team_count - v_cuts_count;
    v_min_cuts := GREATEST(0, v_team_count - 16);
    v_max_cuts := GREATEST(0, v_team_count - 13);

    -- Una squadra è inadempiente se dopo i tagli ha più di 16 giocatori (tagliati < min_cuts)
    -- oppure meno di 13 giocatori (tagliati > max_cuts)
    IF v_post_roster > 16 OR v_post_roster < 13 THEN
      v_non_compliant := v_non_compliant || jsonb_build_object(
        'team_id', v_team."TEAM_ID",
        'team_name', v_team."NAME",
        'current_roster', v_team_count,
        'cuts_count', v_cuts_count,
        'min_cuts', v_min_cuts,
        'max_cuts', v_max_cuts,
        'post_roster', v_post_roster
      );
    END IF;
  END LOOP;

  -- Se ci sono squadre inadempienti, interrompi e restituisci l'elenco esatto
  IF jsonb_array_length(v_non_compliant) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Alcune squadre non hanno completato la lista tagli prevista.',
      'non_compliant_teams', v_non_compliant
    );
  END IF;

  -- B. Se non ci sono tagli registrati in tutta la lega
  SELECT COUNT(*) INTO v_cuts_count FROM public.team_cuts_registry;
  IF v_cuts_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nessun giocatore presente nella lista tagli da svincolare.',
      'non_compliant_teams', '[]'::jsonb
    );
  END IF;

  -- C. Costruzione del comunicato ufficiale e raccolta dati
  v_announcement_content := 'La Lega LCSIM ha ufficializzato la procedura dei tagli dei calciatori. I seguenti giocatori sono stati ufficialmente svincolati e passano allo status di Free Agent:' || E'\n\n';

  FOR v_team IN
    SELECT DISTINCT t."TEAM_ID", t."NAME"
    FROM public.team_cuts_registry c
    JOIN public.an_team t ON t."TEAM_ID" = c.team_id
    ORDER BY t."NAME"
  LOOP
    v_team_players := '';
    FOR v_player IN
      SELECT p."ID", p."Nome", p."Cognome", p."Posiz", p."OVR"
      FROM public.team_cuts_registry c
      JOIN public.an_player p ON p."ID" = c.player_id
      WHERE c.team_id = v_team."TEAM_ID"
      ORDER BY p."OVR" DESC, p."Cognome" ASC
    LOOP
      v_team_players := v_team_players || '• ' || v_player."Nome" || ' ' || v_player."Cognome" || ' (' || v_player."Posiz" || ', OVR ' || COALESCE(v_player."OVR"::text, '-') || ')' || E'\n';
      v_res_players := v_res_players || jsonb_build_object(
        'id', v_player."ID",
        'name', v_player."Nome" || ' ' || v_player."Cognome",
        'team', v_team."NAME",
        'pos', v_player."Posiz",
        'ovr', v_player."OVR"
      );
      v_released_count := v_released_count + 1;
    END LOOP;

    v_announcement_content := v_announcement_content || '### ' || v_team."NAME" || E'\n' || v_team_players || E'\n';
  END LOOP;

  -- D. Svincolo atomico in an_player
  UPDATE public.an_player
  SET "Squadra" = NULL, "NumeroMaglia" = NULL
  WHERE "ID" IN (SELECT player_id FROM public.team_cuts_registry);

  -- E. Pulizia da as_player_market
  DELETE FROM public.as_player_market
  WHERE "PLAYER_ID_FK" IN (SELECT player_id FROM public.team_cuts_registry);

  -- F. Pulizia da formazioni salvate in an_team_tactic (starters, bench_order, setPieces)
  UPDATE public.an_team_tactic t
  SET 
    starters = (
      SELECT COALESCE(
        jsonb_agg(
          CASE 
            WHEN jsonb_typeof(elem) = 'number' AND (elem #>> '{}')::bigint IN (SELECT player_id FROM public.team_cuts_registry) THEN NULL 
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
      WHERE NOT (jsonb_typeof(elem) = 'number' AND (elem #>> '{}')::bigint IN (SELECT player_id FROM public.team_cuts_registry))
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
                  WHEN jsonb_typeof(sp_val) = 'number' AND (sp_val #>> '{}')::bigint IN (SELECT player_id FROM public.team_cuts_registry) THEN NULL 
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

  -- G. Pubblicazione Comunicato Ufficiale di Lega
  INSERT INTO public.league_announcements (
    title,
    content,
    category,
    priority,
    is_pinned,
    is_banner,
    author_name
  ) VALUES (
    'Ufficializzazione Tagli di Lega e Svincoli',
    v_announcement_content,
    'mercato',
    'high',
    true,
    false,
    p_admin_name
  );

  -- H. Aggiornamento stato automazione in league_automation_state
  INSERT INTO public.league_automation_state (
    id,
    action_name,
    last_run_at,
    last_run_by,
    details
  ) VALUES (
    'official_cuts',
    'Ufficializza Tagli di Lega',
    timezone('utc'::text, now()),
    p_admin_name,
    jsonb_build_object(
      'released_count', v_released_count,
      'released_players', v_res_players
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    last_run_at = EXCLUDED.last_run_at,
    last_run_by = EXCLUDED.last_run_by,
    details = EXCLUDED.details,
    updated_at = timezone('utc'::text, now());

  -- I. Svuotamento del registro tagli
  DELETE FROM public.team_cuts_registry;

  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count,
    'released_players', v_res_players
  );
END;
$$;
