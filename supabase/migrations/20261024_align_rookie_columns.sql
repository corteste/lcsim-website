-- ==============================================================================
-- LCSIM - Allinea colonne public.an_rookie con public.an_player
-- Aggiunge le colonne PreferredPosition2, PreferredPosition3, PreferredPosition4 e Role3
-- ==============================================================================

ALTER TABLE public.an_rookie
    ADD COLUMN IF NOT EXISTS "PreferredPosition2" TEXT,
    ADD COLUMN IF NOT EXISTS "PreferredPosition3" TEXT,
    ADD COLUMN IF NOT EXISTS "PreferredPosition4" TEXT,
    ADD COLUMN IF NOT EXISTS "Role3" TEXT;

NOTIFY pgrst, 'reload schema';
