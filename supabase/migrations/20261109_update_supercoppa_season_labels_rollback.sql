-- ==============================================================================
-- LCSIM Migration Rollback: Allineamento Denominazione Stagione Supercoppa di Lega
-- File: supabase/migrations/20261109_update_supercoppa_season_labels_rollback.sql
-- ==============================================================================

UPDATE public.team_trophies
SET season_label = 'Pre-Stagione 5', season_number = 5, is_pre_season = TRUE, notes = 'Vincitore Supercoppa di Lega Pre-S5'
WHERE trophy_type = 'supercoppa' AND season_label = 'Stagione 4' AND team_id = 'ACD';

UPDATE public.team_trophies
SET season_label = 'Pre-Stagione 6', season_number = 6, is_pre_season = TRUE, notes = 'Vincitore Supercoppa di Lega Pre-S6'
WHERE trophy_type = 'supercoppa' AND season_label = 'Stagione 5' AND team_id = 'VFC';

UPDATE public.team_trophies
SET season_label = 'Pre-Stagione 7', season_number = 7, is_pre_season = TRUE, notes = 'Vincitore Supercoppa di Lega Pre-S7'
WHERE trophy_type = 'supercoppa' AND season_label = 'Stagione 6' AND team_id = 'ACD';

UPDATE public.team_trophies
SET season_label = 'Pre-Stagione 8', season_number = 8, is_pre_season = TRUE, notes = 'Vincitore Supercoppa di Lega Pre-S8'
WHERE trophy_type = 'supercoppa' AND season_label = 'Stagione 7' AND team_id = 'APD';

UPDATE public.team_trophies
SET season_label = 'Pre-Stagione 9', season_number = 9, is_pre_season = TRUE, notes = 'Vincitore Supercoppa di Lega Pre-S9'
WHERE trophy_type = 'supercoppa' AND season_label = 'Stagione 8' AND team_id = 'ACD';

UPDATE public.team_trophies
SET season_label = 'Pre-Stagione 10', season_number = 10, is_pre_season = TRUE, notes = 'Vincitore Supercoppa di Lega Pre-S10'
WHERE trophy_type = 'supercoppa' AND season_label = 'Stagione 9' AND team_id = 'ALV';
