-- Script para RECREAR políticas de Supabase Storage
-- Este script primero elimina las políticas existentes y luego las crea de nuevo

-- ====================================================================
-- ELIMINAR POLÍTICAS EXISTENTES (si existen)
-- ====================================================================

-- attached-assets
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- ====================================================================
-- CREAR POLÍTICAS NUEVAS
-- ====================================================================

-- Políticas para attached-assets
CREATE POLICY "Public Read Access attached-assets" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'attached-assets');

CREATE POLICY "Authenticated Upload attached-assets" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'attached-assets');

CREATE POLICY "Authenticated Update attached-assets" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'attached-assets');

CREATE POLICY "Authenticated Delete attached-assets" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'attached-assets');

-- Políticas para lesson-resources
CREATE POLICY "Public Read Access lesson-resources" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'lesson-resources');

CREATE POLICY "Authenticated Upload lesson-resources" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'lesson-resources');

CREATE POLICY "Authenticated Update lesson-resources" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'lesson-resources');

CREATE POLICY "Authenticated Delete lesson-resources" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'lesson-resources');

-- Políticas para post-images
CREATE POLICY "Public Read Access post-images" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated Upload post-images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Authenticated Update post-images" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated Delete post-images" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'post-images');

-- Políticas para profile-images
CREATE POLICY "Public Read Access profile-images" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated Upload profile-images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Authenticated Update profile-images" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated Delete profile-images" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'profile-images');

-- ====================================================================
-- VERIFICAR POLÍTICAS CREADAS
-- ====================================================================

SELECT 
  policyname as "Nombre de Política",
  cmd as "Operación",
  roles as "Roles",
  CASE 
    WHEN policyname LIKE '%attached-assets%' THEN 'attached-assets'
    WHEN policyname LIKE '%lesson-resources%' THEN 'lesson-resources'
    WHEN policyname LIKE '%post-images%' THEN 'post-images'
    WHEN policyname LIKE '%profile-images%' THEN 'profile-images'
    ELSE 'otro'
  END as "Bucket"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY "Bucket", policyname;

