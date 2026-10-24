-- ==============================================================================
-- LCSIM - Rollback aggiunta colonna tactical_settings
-- ==============================================================================

ALTER TABLE public.an_team_tactic
    DROP COLUMN IF EXISTS tactical_settings;

ALTER TABLE public.team_formation_history
    DROP COLUMN IF EXISTS tactical_settings;

ALTER TABLE public.team_lineup_snapshots
    DROP COLUMN IF EXISTS tactical_settings;

NOTIFY pgrst, 'reload schema';
