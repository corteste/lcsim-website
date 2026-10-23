-- ==============================================================================
-- LCSIM - Fix rpc_login: Gestione corretta colonne uppercase an_team e team_id NULL
-- ==============================================================================

DROP FUNCTION IF EXISTS public.rpc_login(text, text);

CREATE OR REPLACE FUNCTION public.rpc_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
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

    -- Se l'utente ha una squadra associata, recupera i dettagli da an_team
    IF v_user.team_id IS NOT NULL AND TRIM(v_user.team_id) <> '' THEN
        SELECT "TEAM_ID", "NAME", COALESCE("NAME_ABBR", "NAME")
        INTO v_team_id, v_team_name, v_team_abbr
        FROM public.an_team
        WHERE "TEAM_ID" = v_user.team_id;

        -- Fallback se il team_id non è presente in an_team
        IF v_team_id IS NULL THEN
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
