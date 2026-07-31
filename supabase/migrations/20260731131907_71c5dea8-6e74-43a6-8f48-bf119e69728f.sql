-- 1. Alternative mobile numbers
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS alt_phone text;
ALTER TABLE public.membership_applications ADD COLUMN IF NOT EXISTS alt_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alt_phone text;

-- 2. Login OTP codes (server-only)
CREATE TABLE IF NOT EXISTS public.login_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  purpose text NOT NULL DEFAULT 'admin_login',
  code text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_otps_email_idx ON public.login_otps (email, purpose);
GRANT ALL ON public.login_otps TO service_role;
ALTER TABLE public.login_otps ENABLE ROW LEVEL SECURITY;

-- 3. Admin registration requests
CREATE TABLE IF NOT EXISTS public.admin_signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  alt_phone text,
  requested_role app_role NOT NULL DEFAULT 'admin',
  sponsor_email text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_signup_requests TO authenticated;
GRANT ALL ON public.admin_signup_requests TO service_role;
ALTER TABLE public.admin_signup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage admin signup requests" ON public.admin_signup_requests
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Requesters view own admin request" ON public.admin_signup_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER admin_signup_requests_touch BEFORE UPDATE ON public.admin_signup_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 4. Admin activity log
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_label text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_activity_log_created_idx ON public.admin_activity_log (created_at DESC);
GRANT SELECT ON public.admin_activity_log TO authenticated;
GRANT ALL ON public.admin_activity_log TO service_role;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view activity log" ON public.admin_activity_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 5. Site links (social), notice bar, visitor counter
CREATE TABLE IF NOT EXISTS public.site_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_links TO anon, authenticated;
GRANT ALL ON public.site_links TO service_role;
ALTER TABLE public.site_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active site links" ON public.site_links
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage site links" ON public.site_links
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.visitor_counter (
  id integer PRIMARY KEY DEFAULT 1,
  total bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visitor_counter_single_row CHECK (id = 1)
);
INSERT INTO public.visitor_counter (id, total) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.visitor_counter TO anon, authenticated;
GRANT ALL ON public.visitor_counter TO service_role;
ALTER TABLE public.visitor_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views visitor counter" ON public.visitor_counter
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.bump_visitor_counter()
RETURNS bigint LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.visitor_counter SET total = total + 1, updated_at = now() WHERE id = 1 RETURNING total;
$$;
GRANT EXECUTE ON FUNCTION public.bump_visitor_counter() TO anon, authenticated;

-- 6. Membership approval creates the member record automatically
CREATE OR REPLACE FUNCTION public.tg_apply_membership_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  next_no text;
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status, '') <> 'approved' THEN
    IF NOT EXISTS (SELECT 1 FROM public.members m WHERE m.phone = NEW.phone) THEN
      SELECT 'BMS-' || LPAD((COALESCE(COUNT(*), 0) + 1)::text, 5, '0') INTO next_no FROM public.members;
      INSERT INTO public.members (
        user_id, membership_number, full_name, surname, father_husband_name,
        dob, phone, alt_phone, email, aadhaar_number, aadhaar_last4, pan, eshram_number,
        village, taluka, district, address, approval_status, approved_at, approved_by,
        status, is_public, created_by
      ) VALUES (
        NEW.user_id, next_no, NEW.full_name, NEW.surname, NEW.father_husband_name,
        NEW.dob, NEW.phone, NEW.alt_phone, NEW.email, NEW.aadhaar_number, RIGHT(NEW.aadhaar_number, 4),
        NEW.pan, NEW.eshram_number, NEW.village, NEW.taluka, NEW.district, NEW.address,
        'approved', now(), NEW.reviewed_by, 'active', true, NEW.reviewed_by
      );
      IF NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles SET membership_number = next_no, phone = COALESCE(phone, NEW.phone),
          alt_phone = COALESCE(alt_phone, NEW.alt_phone), village = COALESCE(village, NEW.village),
          taluka = COALESCE(taluka, NEW.taluka), district = COALESCE(district, NEW.district)
        WHERE id = NEW.user_id;
      END IF;
    END IF;
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS membership_applications_validate ON public.membership_applications;
CREATE TRIGGER membership_applications_validate BEFORE INSERT ON public.membership_applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_membership_application();

DROP TRIGGER IF EXISTS membership_applications_approval ON public.membership_applications;
CREATE TRIGGER membership_applications_approval BEFORE UPDATE ON public.membership_applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_apply_membership_approval();

-- 7. Deletion rights
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (recipient_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete audit reports" ON public.audit_reports;
CREATE POLICY "Admins delete audit reports" ON public.audit_reports
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- 8. Admin/Chairman full view of members already covered by "Admins manage members".
-- Ensure authenticated members can see the public directory too.
DROP POLICY IF EXISTS "Members view public directory" ON public.members;
CREATE POLICY "Members view public directory" ON public.members
  FOR SELECT TO authenticated USING (approval_status = 'approved' AND status = 'active' AND is_public = true);
