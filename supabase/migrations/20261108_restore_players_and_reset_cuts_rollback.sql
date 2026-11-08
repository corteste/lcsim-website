-- ==============================================================================
-- Rollback: Reset e Ripristino Dati Giocatori (an_player) e Reset Tagli Pre-Produzione
-- File: supabase/migrations/20261108_restore_players_and_reset_cuts_rollback.sql
-- ==============================================================================

-- NOTA DI ROLLBACK:
-- Il ripristino dei dati giocatori e il reset dei tagli hanno riportato il database
-- allo stato baseline ufficiale di fabbrica (pre-produzione) basato sul file
-- Manageriale_EAFC_Database_Admin_-_DB_Giocatori.csv (660 giocatori intatti).
--
-- Se fosse necessario ricreare i test di taglio o le scelte compensatorie di prova:
-- 1. Eseguire la procedura guidata di test o simulare i tagli dalla schermata /amministrazione.
-- 2. Lanciare "Esegui Tagli Ufficiali di Lega" per rigenerare le scelte compensatorie
--    nel draft board e l'annuncio pubblico.

NOTIFY pgrst, 'reload schema';
