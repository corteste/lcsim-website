-- ==============================================================================
-- LCSIM - Migrazione: Funzione RPC Ripristino & Integrità Draft Board (60 Scelte)
-- ==============================================================================

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

  -- Se mancano slot per completare i 5 round da 12 scelte (60 totali)
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

    -- Riallinea gli scambi approvati ed eseguiti (Picks scambiate sul mercato)
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

NOTIFY pgrst, 'reload schema';
