-- ==============================================================================
-- Rollback Migrazione: Selezione Calciatori Svincolati al Draft di Lega (Punto #40)
-- File: supabase/migrations/20261025_draft_free_agents_rollback.sql
-- ==============================================================================

-- 1. Rimozione rpc_draft_free_agent
DROP FUNCTION IF EXISTS public.rpc_draft_free_agent(INT, BIGINT, TEXT, TEXT);

-- 2. Ripristino rpc_undo_draft_rookie originale
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

-- 3. Ripristino colonne in an_draft_board
ALTER TABLE public.an_draft_board
  DROP COLUMN IF EXISTS player_type,
  DROP COLUMN IF EXISTS player_id;

NOTIFY pgrst, 'reload schema';
