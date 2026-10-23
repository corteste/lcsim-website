-- ==============================================================================
-- LCSIM - Aggiornamento Ruoli: Admin Neutro (Senza Squadra) e Manager APD
-- ==============================================================================

-- 1. Aggiorna rpc_login per gestire utenti Admin senza alcuna squadra (team_id NULL)
CREATE OR REPLACE FUNCTION public.rpc_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_team RECORD;
    v_team_id TEXT := NULL;
    v_team_name TEXT := NULL;
    v_team_abbr TEXT := NULL;
BEGIN
    SELECT * INTO v_user
    FROM public.app_user
    WHERE LOWER(username) = LOWER(TRIM(p_username))
      AND password = p_password;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Se l'utente ha una squadra associata, recupera i dettagli della società
    IF v_user.team_id IS NOT NULL AND TRIM(v_user.team_id) <> '' THEN
        SELECT * INTO v_team
        FROM public.an_team
        WHERE "TEAM_ID" = v_user.team_id;

        IF FOUND THEN
            v_team_id := v_team.TEAM_ID;
            v_team_name := v_team.NAME;
            v_team_abbr := COALESCE(v_team.NAME_ABBR, v_team.NAME);
        ELSE
            v_team_id := v_user.team_id;
            v_team_name := v_user.team_id;
            v_team_abbr := v_user.team_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'name', v_user.name,
        'team', v_team_id,
        'teamFullName', v_team_name,
        'teamAbbr', v_team_abbr,
        'isAdmin', COALESCE(v_user.is_admin, false)
    );
END;
$$;

-- 2. Aggiorna utente 'admin': Super Admin neutrale, nessuna squadra assegnata
UPDATE public.app_user
SET 
    is_admin = true,
    team_id = NULL,
    name = 'Amministratore LCSIM',
    updated_at = timezone('utc'::text, now())
WHERE username = 'admin';

-- 3. Aggiorna utente 'cotestekkio': Manager ufficiale APD (non admin)
UPDATE public.app_user
SET 
    is_admin = false,
    team_id = 'APD',
    name = 'Stefano Cortese',
    updated_at = timezone('utc'::text, now())
WHERE username = 'cotestekkio';
