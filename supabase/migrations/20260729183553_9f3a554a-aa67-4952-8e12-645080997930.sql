DROP VIEW IF EXISTS public.members_public;

CREATE VIEW public.members_public
WITH (security_invoker = on) AS
  SELECT id, full_name, surname, village, taluka, district, membership_number, join_date
  FROM public.members
  WHERE approval_status = 'approved' AND status = 'active' AND is_public = true;

GRANT SELECT ON public.members_public TO anon, authenticated;

-- Column-level grant: anon may only ever read these columns of members.
GRANT SELECT (id, full_name, surname, village, taluka, district, membership_number, join_date, approval_status, status, is_public)
  ON public.members TO anon;

CREATE POLICY "Public can view approved public members"
  ON public.members FOR SELECT TO anon
  USING (approval_status = 'approved' AND status = 'active' AND is_public = true);