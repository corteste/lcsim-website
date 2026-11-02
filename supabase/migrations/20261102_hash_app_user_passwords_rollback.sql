-- ==============================================================================
-- LCSIM Rollback: Ripristino funzioni RPC rpc_login, rpc_claim_team, rpc_change_password
-- NOTA: Poiché le password sono state trasformate in hash bcrypt irreversibile a senso unico,
-- il rollback del dato a monte non può ripristinare il testo in chiaro originario.
-- Questo script ripristina la logica delle funzioni precedente alla migrazione.
-- ==============================================================================

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

    IF v_user.team_id IS NOT NULL AND TRIM(v_user.team_id) <> '' THEN
        SELECT "TEAM_ID", "NAME", COALESCE("NAME_ABBR", "NAME")
        INTO v_team_id, v_team_name, v_team_abbr
        FROM public.an_team
        WHERE "TEAM_ID" = v_user.team_id;

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

CREATE OR REPLACE FUNCTION public.rpc_claim_team(p_team_id text, p_username text, p_password text, p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team record;
    v_user_id uuid;
    v_existing_username record;
    v_existing_team record;
BEGIN
    SELECT "TEAM_ID", "NAME", "NAME_ABBR", "MANAGER"
    INTO v_team
    FROM public.an_team
    WHERE "TEAM_ID" = p_team_id AND "ACTIVE" = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Squadra non trovata o non attiva.';
    END IF;

    SELECT id INTO v_existing_team
    FROM public.app_user
    WHERE team_id = p_team_id AND is_admin = false;

    IF FOUND THEN
        RAISE EXCEPTION 'Questa squadra è già stata scelta da un altro utente.';
    END IF;

    SELECT id INTO v_existing_username
    FROM public.app_user
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(p_username));

    IF FOUND THEN
        RAISE EXCEPTION 'Questo username è già in uso. Scegline un altro.';
    END IF;

    INSERT INTO public.app_user (username, password, name, team_id, is_admin)
    VALUES (
        LOWER(TRIM(p_username)),
        p_password,
        COALESCE(NULLIF(TRIM(p_name), ''), v_team."MANAGER", p_username),
        p_team_id,
        false
    )
    RETURNING id INTO v_user_id;

    RETURN json_build_object(
        'id', v_user_id,
        'username', LOWER(TRIM(p_username)),
        'name', COALESCE(NULLIF(TRIM(p_name), ''), v_team."MANAGER", p_username),
        'team', v_team."TEAM_ID",
        'teamFullName', v_team."NAME",
        'teamAbbr', COALESCE(v_team."NAME_ABBR", v_team."TEAM_ID"),
        'isAdmin', false
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_change_password(
    p_username TEXT,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user RECORD;
    v_new_pw_clean TEXT;
BEGIN
    v_new_pw_clean := TRIM(p_new_password);

    IF p_username IS NULL OR TRIM(p_username) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Nome utente non valido o sessione non attiva.'
        );
    END IF;

    IF p_current_password IS NULL OR p_current_password = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Inserisci la password attuale.'
        );
    END IF;

    SELECT id, username, password, name INTO v_user
    FROM public.app_user
    WHERE LOWER(username) = LOWER(TRIM(p_username))
      AND password = p_current_password;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La password attuale non è corretta.'
        );
    END IF;

    IF LENGTH(v_new_pw_clean) < 6 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La nuova password deve contenere almeno 6 caratteri.'
        );
    END IF;

    IF p_current_password = v_new_pw_clean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La nuova password deve essere diversa da quella attuale.'
        );
    END IF;

    UPDATE public.app_user
    SET password = v_new_pw_clean
    WHERE id = v_user.id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password aggiornata con successo.'
    );
END;
$$;
