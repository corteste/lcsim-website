-- Migrazione: Rimozione del calciatore di test Tiago Teixeira (ID 50711)
-- Tabella 1: an_rookie (tabella dei rookie)
-- Tabella 2: ea_player_db (tabella master FC 25 esportata)

BEGIN;

DELETE FROM an_rookie WHERE "ID" = '50711';
DELETE FROM ea_player_db WHERE playerid = '50711';

COMMIT;
