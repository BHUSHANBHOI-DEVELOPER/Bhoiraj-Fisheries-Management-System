CREATE POLICY "Members view shared documents"
ON public.documents FOR SELECT TO authenticated
USING (visibility IN ('members','public'));

DROP POLICY IF EXISTS "Docs read for authenticated" ON storage.objects;
CREATE POLICY "Docs read for authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Docs admin write" ON storage.objects;
CREATE POLICY "Docs admin write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Docs admin update" ON storage.objects;
CREATE POLICY "Docs admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'documents' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Docs admin delete storage" ON storage.objects;
CREATE POLICY "Docs admin delete storage"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.is_admin(auth.uid()));