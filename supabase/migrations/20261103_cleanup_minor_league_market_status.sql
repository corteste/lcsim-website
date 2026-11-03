-- ==============================================================================
-- LCSIM Migration: Rimozione Status di Mercato per Serie Minore, Svincolati e Ritirati
-- Data: 03/11/2026
-- File: supabase/migrations/20261103_cleanup_minor_league_market_status.sql
-- Descrizione: 
-- 1. Elimina da as_player_market tutti i record di calciatori che non appartengono
--    alla Serie A (svincolati con Squadra NULL o '', ritirati con Squadra = 'RITIRATO',
--    o serie minore con Squadra LIKE 'B - %').
-- 2. Crea un trigger automatico su an_player ("Squadra") che, ogni volta che un giocatore
--    passa a svincolato, ritirato o in serie minore (ad es. per tagli, invecchiamento o trasferimenti),
--    rimuove automaticamente ed atomicamente il suo status da as_player_market.
-- ==============================================================================

-- 1. Pulizia record esistenti
DELETE FROM public.as_player_market
WHERE "PLAYER_ID_FK" IN (
  SELECT "ID" FROM public.an_player
  WHERE "Squadra" IS NULL 
     OR TRIM("Squadra") = '' 
     OR "Squadra" = 'RITIRATO' 
     OR "Squadra" LIKE 'B - %'
     OR "Squadra" LIKE 'B-%'
);

-- 2. Funzione Trigger per rimozione automatica al cambio squadra
CREATE OR REPLACE FUNCTION public.trg_cleanup_player_market_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se il calciatore passa a svincolato (NULL / ''), ritirato ('RITIRATO') o serie minore ('B - %')
  IF NEW."Squadra" IS NULL 
     OR TRIM(NEW."Squadra") = '' 
     OR NEW."Squadra" = 'RITIRATO' 
     OR NEW."Squadra" LIKE 'B - %' 
     OR NEW."Squadra" LIKE 'B-%' THEN
    DELETE FROM public.as_player_market WHERE "PLAYER_ID_FK" = NEW."ID";
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Assegnazione Trigger su an_player
DROP TRIGGER IF EXISTS trg_an_player_cleanup_market ON public.an_player;
CREATE TRIGGER trg_an_player_cleanup_market
AFTER UPDATE OF "Squadra" ON public.an_player
FOR EACH ROW
EXECUTE FUNCTION public.trg_cleanup_player_market_status();

NOTIFY pgrst, 'reload schema';
