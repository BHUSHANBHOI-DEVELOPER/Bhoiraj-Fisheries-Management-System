
CREATE POLICY "Docs users upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Docs users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

CREATE POLICY "Docs users update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

CREATE POLICY "Docs admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

CREATE POLICY "Avatars users manage own"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
