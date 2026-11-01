-- Rollback: Fix table names in refresh_standings_for_season
-- Date: 2026-11-01

CREATE OR REPLACE FUNCTION public.refresh_standings_for_season(p_stag integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Empty stub rollback
  NULL;
END;
$$;
