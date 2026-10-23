-- ==============================================================================
-- LCSIM - Rollback allineamento colonne public.an_rookie
-- ==============================================================================

ALTER TABLE public.an_rookie
    DROP COLUMN IF EXISTS "PreferredPosition2",
    DROP COLUMN IF EXISTS "PreferredPosition3",
    DROP COLUMN IF EXISTS "PreferredPosition4",
    DROP COLUMN IF EXISTS "Role3";

NOTIFY pgrst, 'reload schema';
