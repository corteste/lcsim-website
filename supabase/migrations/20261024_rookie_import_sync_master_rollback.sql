-- ==============================================================================
-- LCSIM - Rollback: Sincronizzazione Master Data EA FC 25 all'Import Rookie
-- ==============================================================================

-- Ripristina la rimozione da ea_player_db
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
  UPDATE public.an_draft_board
  SET rookie_id = NULL,
      picked_at = NULL,
      picked_by = NULL
  WHERE pick_overall = p_pick_overall;

  UPDATE public.an_rookie
  SET "Squadra" = NULL
  WHERE "ID" = p_rookie_id;

  DELETE FROM public.an_player WHERE "ID" = p_rookie_id;
  DELETE FROM public.ea_player_db WHERE playerid = p_rookie_id;

  RETURN jsonb_build_object('success', true, 'pick_overall', p_pick_overall);
END;
$$;

NOTIFY pgrst, 'reload schema';
