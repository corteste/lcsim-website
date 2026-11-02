-- ==============================================================================
-- LCSIM Migration: Crittografia Password app_user con bcrypt (pgcrypto)
-- Data: 02/11/2026
-- ==============================================================================

-- 1. Assicura che l'estensione pgcrypto sia attiva
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Aggiorna tutte le password esistenti in chiaro convertendole in hash bcrypt ($2a$10$...)
-- Vengono ignorate eventuali password già hashate con bcrypt
UPDATE public.app_user
SET password = crypt(password, gen_salt('bf', 10)),
    updated_at = NOW()
WHERE password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%';

-- 3. Aggiorna rpc_login per verificare l'hash con crypt()
CREATE OR REPLACE FUNCTION public.rpc_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user RECORD;
    v_team_id TEXT := NULL;
    v_team_name TEXT := NULL;
    v_team_abbr TEXT := NULL;
BEGIN
    SELECT * INTO v_user
    FROM public.app_user
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(p_username));

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Verifica password:
    -- Supporta sia l'hash bcrypt che fallback su testo in chiaro temporaneo
    IF v_user.password LIKE '$2a$%' OR v_user.password LIKE '$2b$%' THEN
        IF v_user.password <> crypt(p_password, v_user.password) THEN
            RETURN NULL;
        END IF;
    ELSE
        IF v_user.password <> p_password THEN
            RETURN NULL;
        END IF;
        -- Auto-migrazione a bcrypt al primo login se ancora in chiaro
        UPDATE public.app_user
        SET password = crypt(p_password, gen_salt('bf', 10)),
            updated_at = NOW()
        WHERE id = v_user.id;
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

GRANT EXECUTE ON FUNCTION public.rpc_login(text, text) TO anon, authenticated, service_role;

-- 4. Aggiorna rpc_claim_team per salvare la nuova password direttamente come hash bcrypt
CREATE OR REPLACE FUNCTION public.rpc_claim_team(p_team_id text, p_username text, p_password text, p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_team record;
    v_user_id uuid;
    v_existing_username record;
    v_existing_team record;
    v_hashed_password text;
BEGIN
    -- Check if team is active
    SELECT "TEAM_ID", "NAME", "NAME_ABBR", "MANAGER"
    INTO v_team
    FROM public.an_team
    WHERE "TEAM_ID" = p_team_id AND "ACTIVE" = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Squadra non trovata o non attiva.';
    END IF;

    -- Check if team already claimed
    SELECT id INTO v_existing_team
    FROM public.app_user
    WHERE team_id = p_team_id AND is_admin = false;

    IF FOUND THEN
        RAISE EXCEPTION 'Questa squadra è già stata scelta da un altro utente.';
    END IF;

    -- Check username availability
    SELECT id INTO v_existing_username
    FROM public.app_user
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(p_username));

    IF FOUND THEN
        RAISE EXCEPTION 'Questo username è già in uso. Scegline un altro.';
    END IF;

    -- Genera hash bcrypt sicuro
    v_hashed_password := crypt(p_password, gen_salt('bf', 10));

    -- Insert new user
    INSERT INTO public.app_user (username, password, name, team_id, is_admin)
    VALUES (
        LOWER(TRIM(p_username)),
        v_hashed_password,
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

GRANT EXECUTE ON FUNCTION public.rpc_claim_team(text, text, text, text) TO anon, authenticated, service_role;

-- 5. Aggiorna rpc_change_password per verificare e aggiornare la password con bcrypt
CREATE OR REPLACE FUNCTION public.rpc_change_password(
    p_username TEXT,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user RECORD;
    v_new_pw_clean TEXT;
    v_pw_matches BOOLEAN := false;
BEGIN
    v_new_pw_clean := TRIM(p_new_password);

    -- 1. Verifica che i campi non siano vuoti
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

    -- 2. Recupera l'utente
    SELECT id, username, password, name INTO v_user
    FROM public.app_user
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(p_username));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Utente non trovato.'
        );
    END IF;

    -- 3. Verifica password attuale (bcrypt o eventuale fallback)
    IF v_user.password LIKE '$2a$%' OR v_user.password LIKE '$2b$%' THEN
        v_pw_matches := (v_user.password = crypt(p_current_password, v_user.password));
    ELSE
        v_pw_matches := (v_user.password = p_current_password);
    END IF;

    IF NOT v_pw_matches THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La password attuale non è corretta.'
        );
    END IF;

    -- 4. Validazione lunghezza minima nuova password
    IF LENGTH(v_new_pw_clean) < 6 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La nuova password deve contenere almeno 6 caratteri.'
        );
    END IF;

    -- 5. Verifica che la nuova password sia diversa da quella attuale
    IF p_current_password = v_new_pw_clean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La nuova password deve essere diversa da quella attuale.'
        );
    END IF;

    -- 6. Aggiornamento password crittografata con bcrypt
    UPDATE public.app_user
    SET password = crypt(v_new_pw_clean, gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE id = v_user.id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password aggiornata con successo.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_change_password(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
