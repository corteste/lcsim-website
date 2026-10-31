-- ==============================================================================
-- Rollback: 20261031_drop_legacy_uppercase_stats_views_rollback.sql
-- Descrizione: Ripristina le viste alias uppercase verso le tabelle lowercase.
-- ==============================================================================

CREATE OR REPLACE VIEW public."AS_TEAM_STAT" WITH (security_invoker = on) AS
SELECT * FROM public.as_team_stat;

CREATE OR REPLACE VIEW public."AS_PLAYER_STAT" WITH (security_invoker = on) AS
SELECT * FROM public.as_player_stat;

CREATE OR REPLACE VIEW public."VIEW_PLAYER_STATS" WITH (security_invoker = on) AS
SELECT * FROM public.view_player_stats;

GRANT SELECT ON public."AS_TEAM_STAT" TO anon, authenticated, service_role;
GRANT SELECT ON public."AS_PLAYER_STAT" TO anon, authenticated, service_role;
GRANT SELECT ON public."VIEW_PLAYER_STATS" TO anon, authenticated, service_role;
