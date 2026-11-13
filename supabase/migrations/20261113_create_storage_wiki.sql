-- ==============================================================================
-- LCSIM - Creazione Bucket Supabase Storage: wiki
-- Utilizzato per archiviare le pagine Markdown (.md) della Wiki LCSIM
-- organizzate per cartelle (es. stagioni/stagione-1.md, squadre/..., ecc.).
-- ==============================================================================

-- 1. Inserimento del bucket pubblico se non esiste
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'wiki',
    'wiki',
    true,
    10485760, -- Limite 10 MB per file
    NULL
)
ON CONFLICT (id) DO UPDATE SET public = true, allowed_mime_types = NULL;

-- 2. Policy di lettura pubblica (anon e authenticated possono leggere i file .md)
DROP POLICY IF EXISTS "Public Read wiki" ON storage.objects;
CREATE POLICY "Public Read wiki"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'wiki');

-- 3. Policy di caricamento
DROP POLICY IF EXISTS "Upload wiki" ON storage.objects;
CREATE POLICY "Upload wiki"
ON storage.objects FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (bucket_id = 'wiki');

-- 4. Policy di modifica/aggiornamento
DROP POLICY IF EXISTS "Update wiki" ON storage.objects;
CREATE POLICY "Update wiki"
ON storage.objects FOR UPDATE
TO anon, authenticated, service_role
USING (bucket_id = 'wiki')
WITH CHECK (bucket_id = 'wiki');

-- 5. Policy di eliminazione
DROP POLICY IF EXISTS "Delete wiki" ON storage.objects;
CREATE POLICY "Delete wiki"
ON storage.objects FOR DELETE
TO anon, authenticated, service_role
USING (bucket_id = 'wiki');
