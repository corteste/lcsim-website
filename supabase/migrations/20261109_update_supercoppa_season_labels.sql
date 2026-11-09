-- ==============================================================================
-- LCSIM Migration: Allineamento Denominazione Stagione Supercoppa di Lega
-- File: supabase/migrations/20261109_update_supercoppa_season_labels.sql
-- ==============================================================================

-- La vittoria della supercoppa pre-campionato si riferisce alla stagione precedente
-- Es. La prima supercoppa giocata pre-S5 si riferisce alla Stagione 4

UPDATE public.team_trophies
SET season_label = 'Stagione 4', season_number = 4, is_pre_season = FALSE, notes = 'Vincitore Supercoppa di Lega S4'
WHERE trophy_type = 'supercoppa' AND season_label = 'Pre-Stagione 5';

UPDATE public.team_trophies
SET season_label = 'Stagione 5', season_number = 5, is_pre_season = FALSE, notes = 'Vincitore Supercoppa di Lega S5'
WHERE trophy_type = 'supercoppa' AND season_label = 'Pre-Stagione 6';

UPDATE public.team_trophies
SET season_label = 'Stagione 6', season_number = 6, is_pre_season = FALSE, notes = 'Vincitore Supercoppa di Lega S6'
WHERE trophy_type = 'supercoppa' AND season_label = 'Pre-Stagione 7';

UPDATE public.team_trophies
SET season_label = 'Stagione 7', season_number = 7, is_pre_season = FALSE, notes = 'Vincitore Supercoppa di Lega S7'
WHERE trophy_type = 'supercoppa' AND season_label = 'Pre-Stagione 8';

UPDATE public.team_trophies
SET season_label = 'Stagione 8', season_number = 8, is_pre_season = FALSE, notes = 'Vincitore Supercoppa di Lega S8'
WHERE trophy_type = 'supercoppa' AND season_label = 'Pre-Stagione 9';

UPDATE public.team_trophies
SET season_label = 'Stagione 9', season_number = 9, is_pre_season = FALSE, notes = 'Vincitore Supercoppa di Lega S9'
WHERE trophy_type = 'supercoppa' AND season_label = 'Pre-Stagione 10';
