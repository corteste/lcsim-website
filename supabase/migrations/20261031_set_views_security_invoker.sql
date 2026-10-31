-- ==============================================================================
-- Migrazione: 20261031_set_views_security_invoker.sql
-- Descrizione: Imposta security_invoker = on su tutte le viste di statistiche
--              (view_player_stats, view_team_stats, VIEW_PLAYER_STATS, AS_PLAYER_STAT, AS_TEAM_STAT)
--              risolvendo gli avvisi del Security Advisor di Supabase e garantendo
--              il rispetto del Row Level Security delle tabelle sottostanti.
-- ==============================================================================

ALTER VIEW public."VIEW_PLAYER_STATS" SET (security_invoker = on);
ALTER VIEW public."AS_PLAYER_STAT" SET (security_invoker = on);
ALTER VIEW public."AS_TEAM_STAT" SET (security_invoker = on);
ALTER VIEW public.view_player_stats SET (security_invoker = on);
ALTER VIEW public.view_team_stats SET (security_invoker = on);
