
-- Admin invites: an existing admin must issue + approve a code before anyone becomes admin
CREATE TABLE public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  email text,
  role app_role NOT NULL DEFAULT 'admin',
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  claimed_by uuid,
  claimed_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage admin invites" ON public.admin_invites
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Claimers view own invite" ON public.admin_invites
  FOR SELECT TO authenticated
  USING (claimed_by = auth.uid());

CREATE TRIGGER trg_admin_invites_touch BEFORE UPDATE ON public.admin_invites
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Credential recovery audit log
CREATE TABLE public.credential_recovery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type text NOT NULL,
  identifier_masked text NOT NULL,
  action text NOT NULL,
  user_id uuid,
  succeeded boolean NOT NULL DEFAULT false,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credential_recovery_log TO authenticated;
GRANT ALL ON public.credential_recovery_log TO service_role;
ALTER TABLE public.credential_recovery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view recovery log" ON public.credential_recovery_log
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users view own recovery log" ON public.credential_recovery_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
