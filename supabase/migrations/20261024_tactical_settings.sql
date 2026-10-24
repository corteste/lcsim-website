-- ==============================================================================
-- LCSIM - Aggiunta colonna tactical_settings su an_team_tactic, team_formation_history e team_lineup_snapshots
-- Permette il salvataggio delle istruzioni FC IQ (Team Tactics & Player Roles/Focus)
-- ==============================================================================

ALTER TABLE public.an_team_tactic
    ADD COLUMN IF NOT EXISTS tactical_settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.team_formation_history
    ADD COLUMN IF NOT EXISTS tactical_settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.team_lineup_snapshots
    ADD COLUMN IF NOT EXISTS tactical_settings JSONB DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
