-- ==============================================================================
-- LCSIM Migration Rollback: Tabella Premi Individuali & Palmarès Calciatori (Punto #76)
-- File: supabase/migrations/20261112_player_awards_and_palmares_rollback.sql
-- ==============================================================================

DROP TABLE IF EXISTS public.player_awards CASCADE;
