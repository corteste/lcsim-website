-- ==============================================================================
-- LCSIM Migration Rollback: Scheda Squadra Ampliata con Stadio e Palmarès (#45)
-- File: supabase/migrations/20261109_team_stadiums_and_palmares_rollback.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_update_team_profile;

DROP TABLE IF EXISTS public.team_trophies;

ALTER TABLE public.an_team
DROP COLUMN IF EXISTS stadium_name,
DROP COLUMN IF EXISTS stadium_city,
DROP COLUMN IF EXISTS stadium_capacity,
DROP COLUMN IF EXISTS stadium_surface,
DROP COLUMN IF EXISTS stadium_year,
DROP COLUMN IF EXISTS stadium_image;
