-- Clear test data
TRUNCATE TABLE public.membership_applications CASCADE;
TRUNCATE TABLE public.members CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.grievances CASCADE;
TRUNCATE TABLE public.documents CASCADE;
TRUNCATE TABLE public.audit_reports CASCADE;
TRUNCATE TABLE public.achievements CASCADE;
TRUNCATE TABLE public.dams CASCADE;
TRUNCATE TABLE public.promo_images CASCADE;
TRUNCATE TABLE public.admin_signup_requests CASCADE;
TRUNCATE TABLE public.admin_activity_log CASCADE;
TRUNCATE TABLE public.credential_recovery_log CASCADE;
TRUNCATE TABLE public.password_history CASCADE;
TRUNCATE TABLE public.login_otps CASCADE;

UPDATE public.visitor_counter SET total = 0 WHERE id = 1;

-- The Admin Gmail account must be able to sign in as Admin AND as Chairman.
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role FROM public.profiles p
WHERE lower(p.email) = 'bhushanbhoi04052004@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;