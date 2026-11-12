-- ==============================================================================
-- Rollback: Seeding Classifiche Storiche Regular Season (Stagioni 1 - 8)
-- Data: 2026-11-12
-- ==============================================================================

DELETE FROM public.an_standings
WHERE stag BETWEEN 1 AND 8;
