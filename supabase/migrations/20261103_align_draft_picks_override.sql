-- ==============================================================================
-- LCSIM Migration: Allineamento Scelte Draft come Override Admin (Nessun Badge Scambio)
-- Data: 03/11/2026
-- File: supabase/migrations/20261103_align_draft_picks_override.sql
-- Descrizione: Allinea original_team_id = team_id per tutte le scelte del draft board
--              modificate o riassegnate dall'Admin, in modo che il sistema le consideri
--              scelte dirette senza mostrare badge o scritte di scambio nella Draft Room.
-- ==============================================================================

UPDATE public.an_draft_board
SET original_team_id = team_id
WHERE original_team_id IS DISTINCT FROM team_id;

NOTIFY pgrst, 'reload schema';
