-- ==============================================================================
-- LCSIM Migration: Scheda Squadra Ampliata con Stadio e Palmarès (Punto #45)
-- File: supabase/migrations/20261109_team_stadiums_and_palmares.sql
-- ==============================================================================

-- 1. Aggiungi colonne stadio alla tabella an_team
ALTER TABLE public.an_team
ADD COLUMN IF NOT EXISTS stadium_name TEXT,
ADD COLUMN IF NOT EXISTS stadium_city TEXT,
ADD COLUMN IF NOT EXISTS stadium_capacity INTEGER,
ADD COLUMN IF NOT EXISTS stadium_surface TEXT DEFAULT 'Erba Naturale',
ADD COLUMN IF NOT EXISTS stadium_year INTEGER,
ADD COLUMN IF NOT EXISTS stadium_image TEXT;

-- 2. Popola dati stadio per i 12 club di Serie A
UPDATE public.an_team SET
  stadium_name = 'Arena Conti',
  stadium_city = 'Roma',
  stadium_capacity = 45000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2018
WHERE UPPER(TRIM("TEAM_ID")) = 'ACD';

UPDATE public.an_team SET
  stadium_name = 'Oguorz Arena',
  stadium_city = 'Milano',
  stadium_capacity = 38000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2019
WHERE UPPER(TRIM("TEAM_ID")) = 'ACF';

UPDATE public.an_team SET
  stadium_name = 'Alvi Stadium',
  stadium_city = 'Alvisopoli',
  stadium_capacity = 32500,
  stadium_surface = 'Misto Erba/Sintetico',
  stadium_year = 2020
WHERE UPPER(TRIM("TEAM_ID")) = 'ALV';

UPDATE public.an_team SET
  stadium_name = 'PhoneHub Arena',
  stadium_city = 'Bologna',
  stadium_capacity = 52000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2017
WHERE UPPER(TRIM("TEAM_ID")) = 'APD';

UPDATE public.an_team SET
  stadium_name = 'Cosmo Arena',
  stadium_city = 'Firenze',
  stadium_capacity = 41000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2021
WHERE UPPER(TRIM("TEAM_ID")) = 'COS';

UPDATE public.an_team SET
  stadium_name = 'Eurosbin Stadium',
  stadium_city = 'Torino',
  stadium_capacity = 48500,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2018
WHERE UPPER(TRIM("TEAM_ID")) = 'EUR';

UPDATE public.an_team SET
  stadium_name = 'Mar''s Attack Stadium',
  stadium_city = 'Napoli',
  stadium_capacity = 55000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2017
WHERE UPPER(TRIM("TEAM_ID")) = 'MAR';

UPDATE public.an_team SET
  stadium_name = 'RSA Arena',
  stadium_city = 'Bergamo',
  stadium_capacity = 35000,
  stadium_surface = 'Misto Erba/Sintetico',
  stadium_year = 2021
WHERE UPPER(TRIM("TEAM_ID")) = 'OLD';

UPDATE public.an_team SET
  stadium_name = 'Panormus Stadium',
  stadium_city = 'Palermo',
  stadium_capacity = 44000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2019
WHERE UPPER(TRIM("TEAM_ID")) = 'PFC';

UPDATE public.an_team SET
  stadium_name = 'Stadio Adriana Cassini',
  stadium_city = 'Genova',
  stadium_capacity = 36000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2022
WHERE UPPER(TRIM("TEAM_ID")) = 'RMB';

UPDATE public.an_team SET
  stadium_name = 'Fortaleza dos Leoes',
  stadium_city = 'Cagliari',
  stadium_capacity = 39000,
  stadium_surface = 'Erba Naturale',
  stadium_year = 2018
WHERE UPPER(TRIM("TEAM_ID")) IN ('SKA', 'ASK');

UPDATE public.an_team SET
  stadium_name = 'Oops Stadium',
  stadium_city = 'Trento',
  stadium_capacity = 34000,
  stadium_surface = 'Misto Erba/Sintetico',
  stadium_year = 2020
WHERE UPPER(TRIM("TEAM_ID")) = 'VFC';

-- 3. Crea tabella team_trophies per la bacheca palmarès dettagliata per stagione
CREATE TABLE IF NOT EXISTS public.team_trophies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL REFERENCES public.an_team("TEAM_ID") ON DELETE CASCADE,
  trophy_type TEXT NOT NULL CHECK (trophy_type IN ('scudetto', 'supercoppa', 'coppa')),
  season_label TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  is_pre_season BOOLEAN DEFAULT FALSE,
  won_as_team_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pulisci eventuali record precedenti per evitare duplicati in seed
TRUNCATE TABLE public.team_trophies;

-- 4. Inserimento Albo d'Oro Ufficiale LCSIM (Punto #45)
-- SCUDETTI (Stagioni 1 - 10)
INSERT INTO public.team_trophies (team_id, trophy_type, season_label, season_number, is_pre_season, won_as_team_name, notes) VALUES
('MAR', 'scudetto', 'Stagione 1', 1, FALSE, 'Sbinnala Madrid', 'Campione di Serie A LCSIM S1 (Vinto come Sbinnala Madrid)'),
('MAR', 'scudetto', 'Stagione 2', 2, FALSE, 'Sbinnala Madrid', 'Campione di Serie A LCSIM S2 (Vinto come Sbinnala Madrid)'),
('ACD', 'scudetto', 'Stagione 3', 3, FALSE, 'AC Denti', 'Campione di Serie A LCSIM S3'),
('PFC', 'scudetto', 'Stagione 4', 4, FALSE, 'Panormus FC', 'Campione di Serie A LCSIM S4'),
('VFC', 'scudetto', 'Stagione 5', 5, FALSE, 'Valle FC', 'Campione di Serie A LCSIM S5'),
('ACD', 'scudetto', 'Stagione 6', 6, FALSE, 'AC Denti', 'Campione di Serie A LCSIM S6'),
('APD', 'scudetto', 'Stagione 7', 7, FALSE, 'Average Pegiò Drivers', 'Campione di Serie A LCSIM S7'),
('MAR', 'scudetto', 'Stagione 8', 8, FALSE, 'Mar''s Attack', 'Campione di Serie A LCSIM S8'),
('PFC', 'scudetto', 'Stagione 9', 9, FALSE, 'Panormus FC', 'Campione di Serie A LCSIM S9'),
('OLD', 'scudetto', 'Stagione 10', 10, FALSE, 'Old Bois', 'Campione di Serie A LCSIM S10');

-- SUPERCOPPE DI LEGA (Pre-Stagioni 5 - 10)
INSERT INTO public.team_trophies (team_id, trophy_type, season_label, season_number, is_pre_season, won_as_team_name, notes) VALUES
('ACD', 'supercoppa', 'Pre-Stagione 5', 5, TRUE, 'AC Denti', 'Vincitore Supercoppa di Lega Pre-S5'),
('VFC', 'supercoppa', 'Pre-Stagione 6', 6, TRUE, 'Valle FC', 'Vincitore Supercoppa di Lega Pre-S6'),
('ACD', 'supercoppa', 'Pre-Stagione 7', 7, TRUE, 'AC Denti', 'Vincitore Supercoppa di Lega Pre-S7'),
('APD', 'supercoppa', 'Pre-Stagione 8', 8, TRUE, 'Average Pegiò Drivers', 'Vincitore Supercoppa di Lega Pre-S8'),
('ACD', 'supercoppa', 'Pre-Stagione 9', 9, TRUE, 'AC Denti', 'Vincitore Supercoppa di Lega Pre-S9'),
('ALV', 'supercoppa', 'Pre-Stagione 10', 10, TRUE, 'Alvisopoli FC', 'Vincitore Supercoppa di Lega Pre-S10');

-- 5. Abilita RLS con policy di lettura pubblica
ALTER TABLE public.team_trophies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on team_trophies" ON public.team_trophies;
CREATE POLICY "Allow public read on team_trophies" ON public.team_trophies
FOR SELECT USING (true);

-- 6. RPC per Aggiornamento Completo Info Squadra (Staff e Stadio)
CREATE OR REPLACE FUNCTION public.rpc_update_team_profile(
  p_team_id TEXT,
  p_coach_name TEXT DEFAULT NULL,
  p_president_name TEXT DEFAULT NULL,
  p_stadium_name TEXT DEFAULT NULL,
  p_stadium_city TEXT DEFAULT NULL,
  p_stadium_capacity INTEGER DEFAULT NULL,
  p_stadium_surface TEXT DEFAULT NULL,
  p_stadium_year INTEGER DEFAULT NULL,
  p_acting_username TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_target_team_id TEXT;
BEGIN
  v_target_team_id := UPPER(TRIM(p_team_id));

  -- Verifica permessi se acting_username fornito
  IF p_acting_username IS NOT NULL AND TRIM(p_acting_username) <> '' THEN
    SELECT * INTO v_user
    FROM public.app_user
    WHERE LOWER(username) = LOWER(TRIM(p_acting_username));

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Utente non autorizzato.');
    END IF;

    IF NOT COALESCE(v_user.is_admin, false) AND UPPER(COALESCE(v_user.team_id, '')) <> v_target_team_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Non hai i permessi per modificare le informazioni di questo club.');
    END IF;
  END IF;

  -- Aggiorna Allenatore e Dati Stadio in an_team
  UPDATE public.an_team
  SET
    "MANAGER" = COALESCE(NULLIF(TRIM(p_coach_name), ''), "MANAGER"),
    stadium_name = COALESCE(NULLIF(TRIM(p_stadium_name), ''), stadium_name),
    stadium_city = COALESCE(NULLIF(TRIM(p_stadium_city), ''), stadium_city),
    stadium_capacity = COALESCE(p_stadium_capacity, stadium_capacity),
    stadium_surface = COALESCE(NULLIF(TRIM(p_stadium_surface), ''), stadium_surface),
    stadium_year = COALESCE(p_stadium_year, stadium_year)
  WHERE UPPER(TRIM("TEAM_ID")) = v_target_team_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Squadra non trovata.');
  END IF;

  -- Aggiorna Nome Presidente in app_user se specificato
  IF p_president_name IS NOT NULL AND TRIM(p_president_name) <> '' THEN
    UPDATE public.app_user
    SET name = TRIM(p_president_name),
        updated_at = NOW()
    WHERE UPPER(TRIM(team_id)) = v_target_team_id AND is_admin = false;
  END IF;

  RETURN jsonb_build_object('success', true, 'team_id', v_target_team_id);
END;
$$;
