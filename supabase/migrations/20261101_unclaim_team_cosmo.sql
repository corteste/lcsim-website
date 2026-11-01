-- ==============================================================================
-- LCSIM Migration: Rimuovi login Cosmo FC per rendere la squadra libera
-- Data: 01/11/2026
-- ==============================================================================

DELETE FROM public.app_user
WHERE LOWER(username) = 'cosmo' OR team_id = 'COS';
