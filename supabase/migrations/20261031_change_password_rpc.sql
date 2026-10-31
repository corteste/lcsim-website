-- ==============================================================================
-- LCSIM - Modulo Cambio Password Autonomo (#16)
-- Crea la funzione RPC atomica rpc_change_password per consentire
-- a ciascun manager (e all'admin) di modificare in sicurezza la propria password.
-- ==============================================================================

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

    -- 2. Verifica credenziali attuali
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

    -- 3. Validazione lunghezza minima nuova password
    IF LENGTH(v_new_pw_clean) < 6 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La nuova password deve contenere almeno 6 caratteri.'
        );
    END IF;

    -- 4. Verifica che la nuova password sia diversa da quella attuale
    IF p_current_password = v_new_pw_clean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La nuova password deve essere diversa da quella attuale.'
        );
    END IF;

    -- 5. Aggiornamento password
    UPDATE public.app_user
    SET password = v_new_pw_clean
    WHERE id = v_user.id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password aggiornata con successo.'
    );
END;
$$;

-- Permessi di esecuzione per anon, authenticated e service_role
GRANT EXECUTE ON FUNCTION public.rpc_change_password(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.rpc_change_password(TEXT, TEXT, TEXT) IS
'Modifica in sicurezza la password di un utente app_user verificando la password attuale.';
