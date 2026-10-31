-- ==============================================================================
-- LCSIM - Creazione Bucket Supabase Storage: game-templates
-- Utilizzato per archiviare file master, template e file multimediali
-- (DB_NEW_MASTER.txt, inni di squadra, foto giocatori, loghi squadre, bandiere)
-- liberando oltre 45 MB per ogni build dal deployment storage di Vercel.
-- ==============================================================================

-- 1. Inserimento del bucket pubblico se non esiste (allowed_mime_types NULL = supporta tutti i media)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'game-templates',
    'game-templates',
    true,
    52428800, -- Limite 50 MB per file
    NULL
)
ON CONFLICT (id) DO UPDATE SET public = true, allowed_mime_types = NULL;

-- 2. Policy di lettura pubblica (anon e authenticated possono scaricare i template)
DROP POLICY IF EXISTS "Public Read game-templates" ON storage.objects;
CREATE POLICY "Public Read game-templates"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'game-templates');

-- 3. Policy di caricamento da client autenticati e service_role
DROP POLICY IF EXISTS "Upload game-templates" ON storage.objects;
CREATE POLICY "Upload game-templates"
ON storage.objects FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (bucket_id = 'game-templates');

-- 4. Policy di modifica/aggiornamento
DROP POLICY IF EXISTS "Update game-templates" ON storage.objects;
CREATE POLICY "Update game-templates"
ON storage.objects FOR UPDATE
TO anon, authenticated, service_role
USING (bucket_id = 'game-templates');
