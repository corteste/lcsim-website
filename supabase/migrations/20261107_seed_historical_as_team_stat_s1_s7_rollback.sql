-- ==============================================================================
-- ROLLBACK: Rimozione statistiche storiche squadre as_team_stat (Stagioni 1-7)
-- ==============================================================================

DELETE FROM public.as_team_stat
WHERE "STAG" BETWEEN 1 AND 7;
