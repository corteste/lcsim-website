-- ==============================================================================
-- Rollback: Logica Scelte Compensatorie al Draft (Punto #32)
-- File: supabase/migrations/20261031_compensatory_draft_picks_rollback.sql
-- ==============================================================================

-- 1. Rimozione scelte compensatorie e ripristino numerazione base 1..60
DELETE FROM public.an_draft_board WHERE is_compensatory = true;

UPDATE public.an_draft_board
SET pick_overall = (round - 1) * 12 + pick_in_round;

-- 2. Ripristino check constraints originali
ALTER TABLE public.an_draft_board DROP CONSTRAINT IF EXISTS an_draft_board_pick_in_round_check;
ALTER TABLE public.an_draft_board ADD CONSTRAINT an_draft_board_pick_in_round_check CHECK (((pick_in_round >= 1) AND (pick_in_round <= 12)));

ALTER TABLE public.an_draft_board DROP CONSTRAINT IF EXISTS an_draft_board_pick_overall_check;
ALTER TABLE public.an_draft_board ADD CONSTRAINT an_draft_board_pick_overall_check CHECK (((pick_overall >= 1) AND (pick_overall <= 60)));

-- 3. Rimozione colonne aggiunte
ALTER TABLE public.an_draft_board
  DROP COLUMN IF EXISTS is_compensatory,
  DROP COLUMN IF EXISTS compensatory_reason;

-- 4. Ripristino rpc_ensure_draft_board
CREATE OR REPLACE FUNCTION public.rpc_ensure_draft_board()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round_order TEXT[] := ARRAY['COS', 'EUR', 'RMB', 'VFC', 'ACD', 'ACF', 'MAR', 'APD', 'OLD', 'SKA', 'PFC', 'ALV'];
  v_round INT;
  v_pick_in_round INT;
  v_pick_overall INT;
  v_team TEXT;
  v_trade RECORD;
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM public.an_draft_board;

  IF v_count < 60 THEN
    FOR v_round IN 1..5 LOOP
      FOR v_pick_in_round IN 1..12 LOOP
        v_pick_overall := (v_round - 1) * 12 + v_pick_in_round;
        v_team := v_round_order[v_pick_in_round];

        INSERT INTO public.an_draft_board (
          pick_overall, round, pick_in_round, team_id, original_team_id, rookie_id, picked_at, picked_by
        ) VALUES (
          v_pick_overall, v_round, v_pick_in_round, v_team, v_team, NULL, NULL, NULL
        )
        ON CONFLICT (pick_overall) DO NOTHING;
      END LOOP;
    END LOOP;

    FOR v_trade IN 
      SELECT sender_team, receiver_team, offered_pick_numbers, requested_pick_numbers 
      FROM public.market_trades 
      WHERE status = 'completed'
    LOOP
      IF v_trade.offered_pick_numbers IS NOT NULL AND array_length(v_trade.offered_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.receiver_team
        WHERE pick_overall = ANY(v_trade.offered_pick_numbers);
      END IF;

      IF v_trade.requested_pick_numbers IS NOT NULL AND array_length(v_trade.requested_pick_numbers, 1) > 0 THEN
        UPDATE public.an_draft_board
        SET team_id = v_trade.sender_team
        WHERE pick_overall = ANY(v_trade.requested_pick_numbers);
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'total_picks', 60);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_ensure_draft_board() TO anon, authenticated, service_role;

-- 5. Ripristino execute_official_cuts alla versione del Punto #33
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
  v_team_gk_count INT;
  v_cut_gk_count INT;
  v_post_gk INT;
  v_picks_count INT;
  v_post_assets INT;
  v_res_players JSONB := '[]'::jsonb;
BEGIN
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
    WHERE team_id = v_team."TEAM_ID" AND rookie_id IS NULL AND player_id IS NULL;

    v_post_roster := v_team_count - v_cuts_count;
    v_post_gk := v_team_gk_count - v_cut_gk_count;
    v_post_assets := v_post_roster + v_picks_count;
    v_min_cuts := GREATEST(0, v_team_count - 16, v_team_count + v_picks_count - 21);
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
        'post_assets', v_post_assets
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_non_compliant) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Alcune squadre non rispettano i requisiti post-tagli (13-16 giocatori, massimo 21 asset tra giocatori e scelte draft, minimo 2 portieri).',
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

  DELETE FROM public.team_cuts_registry;

  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count,
    'released_players', v_res_players
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_official_cuts TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
