-- ==============================================================================
-- LCSIM Rollback: Ripristino execute_official_cuts alla versione del 31/10/2026
-- File: supabase/migrations/20261103_cuts_gk_exception_rollback.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.execute_official_cuts(
  p_admin_name TEXT DEFAULT 'Amministratore LCSIM'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_non_compliant JSONB := '[]'::jsonb;
  v_team RECORD;
  v_player RECORD;
  v_released_count INT := 0;
  v_announcement_content TEXT := '';
  v_comp_announcement TEXT := '';
  v_team_players TEXT;
  v_team_count INT;
  v_cuts_count INT;
  v_min_cuts INT;
  v_max_cuts INT;
  v_post_roster INT;
  v_team_gk_count INT;
  v_cut_gk_count INT;
  v_post_gk INT;
  v_picks_count INT;
  v_comp_picks INT;
  v_post_assets INT;
  v_res_players JSONB := '[]'::jsonb;
  v_comp_picks_generated JSONB := '[]'::jsonb;

  v_r1_teams TEXT[] := ARRAY[]::TEXT[];
  v_team_id TEXT;
  v_comp_slot INT;
  v_temp_neg INT := -1;
BEGIN
  -- A. Verifica conformità per tutte le squadre attive (Serie A)
  FOR v_team IN
    SELECT "TEAM_ID", "NAME"
    FROM public.an_team
    WHERE "ACTIVE" = true AND "TEAM_ID" != 'RITIRATO'
    ORDER BY "NAME"
  LOOP
    SELECT COUNT(*) INTO v_team_count
    FROM public.an_player
    WHERE "Squadra" = v_team."TEAM_ID";

    SELECT COUNT(*) INTO v_cuts_count
    FROM public.team_cuts_registry
    WHERE team_id = v_team."TEAM_ID";

    SELECT COUNT(*) INTO v_team_gk_count
    FROM public.an_player
    WHERE "Squadra" = v_team."TEAM_ID" AND "Posiz" = 'POR';

    SELECT COUNT(*) INTO v_cut_gk_count
    FROM public.team_cuts_registry c
    JOIN public.an_player p ON p."ID" = c.player_id
    WHERE c.team_id = v_team."TEAM_ID" AND p."Posiz" = 'POR';

    SELECT COUNT(*) INTO v_picks_count
    FROM public.an_draft_board
    WHERE team_id = v_team."TEAM_ID" 
      AND (is_compensatory = false OR is_compensatory IS NULL)
      AND rookie_id IS NULL AND player_id IS NULL;

    v_post_roster := v_team_count - v_cuts_count;
    v_post_gk := v_team_gk_count - v_cut_gk_count;
    
    IF v_post_roster <= 16 AND v_post_roster >= 13 THEN
      v_comp_picks := 16 - v_post_roster;
    ELSE
      v_comp_picks := 0;
    END IF;

    v_post_assets := v_post_roster + v_picks_count + v_comp_picks;
    v_min_cuts := GREATEST(0, v_team_count - 16, v_team_count + v_picks_count + v_comp_picks - 21);
    v_max_cuts := GREATEST(0, v_team_count - 13);

    IF v_post_roster > 16 OR v_post_roster < 13 OR v_post_gk < 2 OR v_post_assets > 21 THEN
      v_non_compliant := v_non_compliant || jsonb_build_object(
        'team_id', v_team."TEAM_ID",
        'team_name', v_team."NAME",
        'current_roster', v_team_count,
        'cuts_count', v_cuts_count,
        'min_cuts', v_min_cuts,
        'max_cuts', v_max_cuts,
        'post_roster', v_post_roster,
        'current_gk', v_team_gk_count,
        'cut_gk', v_cut_gk_count,
        'post_gk', v_post_gk,
        'picks_count', v_picks_count,
        'comp_picks', v_comp_picks,
        'post_assets', v_post_assets
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_non_compliant) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Alcune squadre non rispettano i requisiti post-tagli (13-16 giocatori, massimo 21 asset con scelte compensatorie, minimo 2 portieri).',
      'non_compliant_teams', v_non_compliant
    );
  END IF;

  SELECT COUNT(*) INTO v_cuts_count FROM public.team_cuts_registry;
  IF v_cuts_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nessun giocatore presente nella lista tagli da svincolare.',
      'non_compliant_teams', '[]'::jsonb
    );
  END IF;

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

  UPDATE public.an_player
  SET "Squadra" = NULL, "NumeroMaglia" = NULL
  WHERE "ID" IN (SELECT player_id FROM public.team_cuts_registry);

  DELETE FROM public.as_player_market
  WHERE "PLAYER_ID_FK" IN (SELECT player_id FROM public.team_cuts_registry);

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

  DELETE FROM public.an_draft_board WHERE is_compensatory = true;

  SELECT ARRAY_AGG(original_team_id ORDER BY pick_in_round ASC)
  INTO v_r1_teams
  FROM public.an_draft_board
  WHERE round = 1 AND (is_compensatory = false OR is_compensatory IS NULL);

  IF v_r1_teams IS NULL OR array_length(v_r1_teams, 1) = 0 THEN
    SELECT ARRAY_AGG("TEAM_ID" ORDER BY "NAME" ASC)
    INTO v_r1_teams
    FROM public.an_team
    WHERE "ACTIVE" = true AND "TEAM_ID" != 'RITIRATO';
  END IF;

  v_temp_neg := -1000;

  v_comp_slot := 13;
  FOREACH v_team_id IN ARRAY v_r1_teams LOOP
    SELECT COUNT(*) INTO v_post_roster FROM public.an_player WHERE "Squadra" = v_team_id;
    IF v_post_roster <= 13 THEN
      INSERT INTO public.an_draft_board (
        pick_overall, round, pick_in_round, team_id, original_team_id,
        rookie_id, player_id, player_type, picked_at, picked_by,
        is_compensatory, compensatory_reason
      ) VALUES (
        v_temp_neg, 2, v_comp_slot, v_team_id, v_team_id,
        NULL, NULL, 'rookie', NULL, NULL,
        true, 'Scelta compensatoria Round 2 (Rosa post-tagli a ' || v_post_roster || ' giocatori)'
      );
      v_temp_neg := v_temp_neg - 1;
      v_comp_slot := v_comp_slot + 1;
      v_comp_picks_generated := v_comp_picks_generated || jsonb_build_object(
        'round', 2,
        'team_id', v_team_id,
        'roster_size', v_post_roster
      );
    END IF;
  END LOOP;

  v_comp_slot := 13;
  FOREACH v_team_id IN ARRAY v_r1_teams LOOP
    SELECT COUNT(*) INTO v_post_roster FROM public.an_player WHERE "Squadra" = v_team_id;
    IF v_post_roster <= 14 THEN
      INSERT INTO public.an_draft_board (
        pick_overall, round, pick_in_round, team_id, original_team_id,
        rookie_id, player_id, player_type, picked_at, picked_by,
        is_compensatory, compensatory_reason
      ) VALUES (
        v_temp_neg, 3, v_comp_slot, v_team_id, v_team_id,
        NULL, NULL, 'rookie', NULL, NULL,
        true, 'Scelta compensatoria Round 3 (Rosa post-tagli a ' || v_post_roster || ' giocatori)'
      );
      v_temp_neg := v_temp_neg - 1;
      v_comp_slot := v_comp_slot + 1;
      v_comp_picks_generated := v_comp_picks_generated || jsonb_build_object(
        'round', 3,
        'team_id', v_team_id,
        'roster_size', v_post_roster
      );
    END IF;
  END LOOP;

  v_comp_slot := 13;
  FOREACH v_team_id IN ARRAY v_r1_teams LOOP
    SELECT COUNT(*) INTO v_post_roster FROM public.an_player WHERE "Squadra" = v_team_id;
    IF v_post_roster <= 15 THEN
      INSERT INTO public.an_draft_board (
        pick_overall, round, pick_in_round, team_id, original_team_id,
        rookie_id, player_id, player_type, picked_at, picked_by,
        is_compensatory, compensatory_reason
      ) VALUES (
        v_temp_neg, 4, v_comp_slot, v_team_id, v_team_id,
        NULL, NULL, 'rookie', NULL, NULL,
        true, 'Scelta compensatoria Round 4 (Rosa post-tagli a ' || v_post_roster || ' giocatori)'
      );
      v_temp_neg := v_temp_neg - 1;
      v_comp_slot := v_comp_slot + 1;
      v_comp_picks_generated := v_comp_picks_generated || jsonb_build_object(
        'round', 4,
        'team_id', v_team_id,
        'roster_size', v_post_roster
      );
    END IF;
  END LOOP;

  UPDATE public.an_draft_board
  SET pick_overall = -ABS(pick_overall) - 10000;

  WITH ordered AS (
    SELECT ctid, ROW_NUMBER() OVER (ORDER BY round ASC, pick_in_round ASC) AS new_pick_overall
    FROM public.an_draft_board
  )
  UPDATE public.an_draft_board b
  SET pick_overall = o.new_pick_overall
  FROM ordered o
  WHERE b.ctid = o.ctid;

  IF jsonb_array_length(v_comp_picks_generated) > 0 THEN
    v_comp_announcement := E'\n### ⚖️ Assegnazione Scelte Compensatorie al Draft (Punto #32)\n' ||
      'In conformità con il regolamento di Lega, a seguito della dimensione finale della rosa post-tagli sono state assegnate le seguenti scelte compensatorie:\n\n';
    FOR v_team IN
      SELECT DISTINCT t."TEAM_ID", t."NAME"
      FROM public.an_team t
      WHERE t."TEAM_ID" IN (
        SELECT elem->>'team_id' FROM jsonb_array_elements(v_comp_picks_generated) elem
      )
      ORDER BY t."NAME"
    LOOP
      v_comp_announcement := v_comp_announcement || '• **' || v_team."NAME" || '**: ';
      SELECT string_agg('Round ' || (elem->>'round'), ', ') INTO v_team_players
      FROM jsonb_array_elements(v_comp_picks_generated) elem
      WHERE elem->>'team_id' = v_team."TEAM_ID";
      v_comp_announcement := v_comp_announcement || v_team_players || E'\n';
    END LOOP;
    v_announcement_content := v_announcement_content || v_comp_announcement;
  END IF;

  INSERT INTO public.league_announcements (
    title,
    content,
    category,
    priority,
    is_pinned,
    is_banner,
    author_name
  ) VALUES (
    'Ufficializzazione Tagli di Lega e Scelte Compensatorie Draft',
    v_announcement_content,
    'mercato',
    'high',
    true,
    false,
    p_admin_name
  );

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
      'released_players', v_res_players,
      'compensatory_picks', v_comp_picks_generated
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    last_run_at = EXCLUDED.last_run_at,
    last_run_by = EXCLUDED.last_run_by,
    details = EXCLUDED.details,
    updated_at = timezone('utc'::text, now());

  DELETE FROM public.team_cuts_registry;

  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count,
    'released_players', v_res_players,
    'compensatory_picks', v_comp_picks_generated
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_official_cuts TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
