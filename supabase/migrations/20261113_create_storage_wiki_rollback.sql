-- ==============================================================================
-- ROLLBACK - Creazione Bucket Supabase Storage: wiki
-- ==============================================================================

DROP POLICY IF EXISTS "Delete wiki" ON storage.objects;
DROP POLICY IF EXISTS "Update wiki" ON storage.objects;
DROP POLICY IF EXISTS "Upload wiki" ON storage.objects;
DROP POLICY IF EXISTS "Public Read wiki" ON storage.objects;

DELETE FROM storage.objects WHERE bucket_id = 'wiki';
DELETE FROM storage.buckets WHERE id = 'wiki';
