-- ==============================================================================
-- Rollback: 20261031_set_views_security_invoker_rollback.sql
-- Descrizione: Ripristina le viste allo stato predefinito (security_invoker = off).
-- ==============================================================================

ALTER VIEW public."VIEW_PLAYER_STATS" RESET (security_invoker);
ALTER VIEW public."AS_PLAYER_STAT" RESET (security_invoker);
ALTER VIEW public."AS_TEAM_STAT" RESET (security_invoker);
ALTER VIEW public.view_player_stats RESET (security_invoker);
ALTER VIEW public.view_team_stats RESET (security_invoker);
