-- ==============================================================================
-- LCSIM Rollback: Ripristino original_team_id per scelte scambiate precedentemente
-- File: supabase/migrations/20261103_align_draft_picks_override_rollback.sql
-- ==============================================================================

UPDATE public.an_draft_board SET original_team_id = 'COS' WHERE pick_overall IN (23, 47);
UPDATE public.an_draft_board SET original_team_id = 'EUR' WHERE pick_overall IN (24, 48);

NOTIFY pgrst, 'reload schema';
