-- MEMBERS additions
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS father_husband_name text,
  ADD COLUMN IF NOT EXISTS aadhaar_number text,
  ADD COLUMN IF NOT EXISTS eshram_number text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS members_phone_unique ON public.members (phone) WHERE phone IS NOT NULL;

-- Public-safe view of approved members
CREATE OR REPLACE VIEW public.members_public
WITH (security_invoker = on) AS
  SELECT id, full_name, surname, village, taluka, district, membership_number, join_date
  FROM public.members
  WHERE approval_status = 'approved' AND status = 'active' AND is_public = true;

GRANT SELECT ON public.members_public TO anon, authenticated;

CREATE POLICY "Public can view approved public members"
  ON public.members FOR SELECT TO anon
  USING (approval_status = 'approved' AND status = 'active' AND is_public = true);

GRANT SELECT ON public.members TO anon;

-- MEMBERSHIP APPLICATIONS
CREATE TABLE IF NOT EXISTS public.membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  father_husband_name text,
  surname text,
  phone text NOT NULL,
  email text,
  aadhaar_number text NOT NULL,
  pan text,
  eshram_number text,
  dob date NOT NULL,
  village text,
  taluka text,
  district text,
  address text,
  status text NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS membership_applications_phone_pending
  ON public.membership_applications (phone) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_applications TO authenticated;
GRANT ALL ON public.membership_applications TO service_role;
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants insert own application" ON public.membership_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Applicants view own application" ON public.membership_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Admins manage applications" ON public.membership_applications
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_membership_application()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.aadhaar_number !~ '^[0-9]{12}$' THEN
    RAISE EXCEPTION 'Aadhaar number must be exactly 12 digits';
  END IF;
  IF NEW.phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Mobile number must be exactly 10 digits';
  END IF;
  IF NEW.dob > (CURRENT_DATE - INTERVAL '20 years') THEN
    RAISE EXCEPTION 'Applicant must be at least 20 years old';
  END IF;
  IF NEW.pan IS NOT NULL AND NEW.pan <> '' AND NEW.pan !~ '^[A-Z]{5}[0-9]{4}[A-Z]$' THEN
    RAISE EXCEPTION 'PAN must look like ABCDE1234F';
  END IF;
  IF EXISTS (SELECT 1 FROM public.members m WHERE m.phone = NEW.phone) THEN
    RAISE EXCEPTION 'This mobile number is already registered';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_membership_application
  BEFORE INSERT OR UPDATE ON public.membership_applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_membership_application();

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid,
  is_broadcast boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  body text,
  link text,
  category text NOT NULL DEFAULT 'general',
  read_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR is_broadcast = true OR is_admin(auth.uid()));
CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "Admins manage notifications" ON public.notifications
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- PROMO IMAGES
CREATE TABLE IF NOT EXISTS public.promo_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  caption text,
  image_url text NOT NULL,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_images TO authenticated;
GRANT ALL ON public.promo_images TO service_role;
ALTER TABLE public.promo_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active promos" ON public.promo_images FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage promos" ON public.promo_images FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  body text,
  image_url text,
  achieved_on date,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views published achievements" ON public.achievements FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- DAMS / LAKES
CREATE TABLE IF NOT EXISTS public.dams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  village text,
  taluka text,
  district text,
  water_area text,
  capacity text,
  description text,
  image_url text,
  latest_news text,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dams TO authenticated;
GRANT ALL ON public.dams TO service_role;
ALTER TABLE public.dams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views published dams" ON public.dams FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins manage dams" ON public.dams FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- SCHEMES
CREATE TABLE IF NOT EXISTS public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  body text,
  image_url text,
  external_url text,
  category text DEFAULT 'central',
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schemes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schemes TO authenticated;
GRANT ALL ON public.schemes TO service_role;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views published schemes" ON public.schemes FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins manage schemes" ON public.schemes FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- EDITABLE SITE CONTENT (About, certificates, etc.)
CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  title text,
  body text,
  image_url text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views site content" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage site content" ON public.site_content FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_touch_promo BEFORE UPDATE ON public.promo_images FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_touch_ach BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_touch_dams BEFORE UPDATE ON public.dams FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_touch_schemes BEFORE UPDATE ON public.schemes FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();