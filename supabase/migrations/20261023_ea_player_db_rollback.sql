-- ==============================================================================
-- ROLLBACK: LCSIM - Tabella Master EA FC 25 (public.ea_player_db)
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_sync_training_to_ea_player ON public.an_player_training;
DROP FUNCTION IF EXISTS public.fn_sync_training_to_ea_player();

DROP TRIGGER IF EXISTS trg_sync_an_to_ea_player ON public.an_player;
DROP FUNCTION IF EXISTS public.fn_sync_an_to_ea_player();

DROP FUNCTION IF EXISTS public.recompute_ea_player_from_an_and_training(BIGINT);

DROP TRIGGER IF EXISTS trg_sync_ea_to_an_player ON public.ea_player_db;
DROP FUNCTION IF EXISTS public.fn_sync_ea_to_an_player();

DROP FUNCTION IF EXISTS public.encode_ea_trait2(TEXT);
DROP FUNCTION IF EXISTS public.encode_ea_trait1(TEXT);
DROP FUNCTION IF EXISTS public.encode_ea_role(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.encode_ea_position(TEXT);

DROP FUNCTION IF EXISTS public.decode_ea_trait2(BIGINT);
DROP FUNCTION IF EXISTS public.decode_ea_trait1(BIGINT, BOOLEAN);
DROP FUNCTION IF EXISTS public.decode_ea_role(BIGINT);
DROP FUNCTION IF EXISTS public.decode_ea_position(BIGINT);
DROP FUNCTION IF EXISTS public.decode_ea_nationality(BIGINT);

DROP TABLE IF EXISTS public.ea_player_db;

ALTER TABLE public.an_player
    DROP COLUMN IF EXISTS "Role3",
    DROP COLUMN IF EXISTS "PreferredPosition2",
    DROP COLUMN IF EXISTS "PreferredPosition3",
    DROP COLUMN IF EXISTS "PreferredPosition4";
