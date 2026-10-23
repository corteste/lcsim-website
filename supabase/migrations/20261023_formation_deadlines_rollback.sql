-- Rollback per le tabelle di scadenza formazioni e snapshot
DROP TABLE IF EXISTS public.team_lineup_snapshots CASCADE;
DROP TABLE IF EXISTS public.league_deadlines CASCADE;
