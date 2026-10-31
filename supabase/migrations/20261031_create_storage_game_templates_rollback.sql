-- ==============================================================================
-- ROLLBACK - Creazione Bucket Supabase Storage: game-templates
-- ==============================================================================

DROP POLICY IF EXISTS "Update game-templates" ON storage.objects;
DROP POLICY IF EXISTS "Upload game-templates" ON storage.objects;
DROP POLICY IF EXISTS "Public Read game-templates" ON storage.objects;

DELETE FROM storage.objects WHERE bucket_id = 'game-templates';
DELETE FROM storage.buckets WHERE id = 'game-templates';
