DROP POLICY IF EXISTS "Public can view approved public members" ON public.members;
REVOKE SELECT ON public.members FROM anon;

DROP VIEW IF EXISTS public.members_public;
CREATE VIEW public.members_public AS
  SELECT id, full_name, surname, village, taluka, district, membership_number, join_date
  FROM public.members
  WHERE approval_status = 'approved' AND status = 'active' AND is_public = true;

ALTER VIEW public.members_public SET (security_invoker = off);
GRANT SELECT ON public.members_public TO anon, authenticated;