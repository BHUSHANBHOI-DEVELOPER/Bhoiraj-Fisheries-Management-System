CREATE TABLE public.grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_reply text,
  handled_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.grievances TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grievances TO authenticated;
GRANT ALL ON public.grievances TO service_role;

ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone may submit a grievance" ON public.grievances
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins read grievances" ON public.grievances
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update grievances" ON public.grievances
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete grievances" ON public.grievances
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER grievances_touch BEFORE UPDATE ON public.grievances
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TABLE public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  changed_by uuid,
  changed_by_label text,
  method text NOT NULL DEFAULT 'self_reset',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.password_history TO authenticated;
GRANT ALL ON public.password_history TO service_role;

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read password history" ON public.password_history
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users read own password history" ON public.password_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX password_history_user_idx ON public.password_history(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.society_snapshot()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM public.members WHERE approval_status = 'approved'),
    'documents', (SELECT count(*) FROM public.documents),
    'audits', (SELECT count(*) FROM public.audit_reports),
    'achievements', (SELECT count(*) FROM public.achievements WHERE is_published),
    'dams', (SELECT count(*) FROM public.dams WHERE is_published),
    'schemes', (SELECT count(*) FROM public.schemes WHERE is_published)
  );
$$;

GRANT EXECUTE ON FUNCTION public.society_snapshot() TO anon, authenticated;