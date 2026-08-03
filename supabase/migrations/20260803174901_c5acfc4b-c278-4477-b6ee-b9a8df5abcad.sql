ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique
  ON public.profiles (lower(user_id)) WHERE user_id IS NOT NULL;

ALTER TABLE public.membership_applications ALTER COLUMN aadhaar_number DROP NOT NULL;

DROP TRIGGER IF EXISTS membership_applications_validate ON public.membership_applications;
DROP TRIGGER IF EXISTS trg_validate_membership_application ON public.membership_applications;
CREATE TRIGGER trg_validate_membership_application
BEFORE INSERT OR UPDATE ON public.membership_applications
FOR EACH ROW EXECUTE FUNCTION public.validate_membership_application();

CREATE OR REPLACE FUNCTION public.validate_membership_application()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.aadhaar_number IS NOT NULL AND NEW.aadhaar_number <> '' AND NEW.aadhaar_number !~ '^[0-9]{12}$' THEN
    RAISE EXCEPTION 'Aadhaar number must be exactly 12 digits when provided';
  END IF;
  IF NEW.phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Mobile number must be exactly 10 digits';
  END IF;
  IF NEW.alt_phone IS NOT NULL AND NEW.alt_phone <> '' AND NEW.alt_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Alternate mobile number must be exactly 10 digits';
  END IF;
  IF NEW.alt_phone = NEW.phone THEN
    RAISE EXCEPTION 'Alternate mobile number must be different from the primary mobile number';
  END IF;
  IF NEW.dob > (CURRENT_DATE - INTERVAL '20 years') THEN
    RAISE EXCEPTION 'Applicant must be at least 20 years old';
  END IF;
  IF NEW.pan IS NOT NULL AND NEW.pan <> '' AND NEW.pan !~ '^[A-Z]{5}[0-9]{4}[A-Z]$' THEN
    RAISE EXCEPTION 'PAN must look like ABCDE1234F';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.phone IN (NEW.phone, NULLIF(NEW.alt_phone, ''))
       OR m.alt_phone IN (NEW.phone, NULLIF(NEW.alt_phone, ''))
  ) THEN
    RAISE EXCEPTION 'This mobile number is already registered';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.membership_applications a
    WHERE a.id <> NEW.id
      AND a.status <> 'rejected'
      AND (a.phone IN (NEW.phone, NULLIF(NEW.alt_phone, ''))
        OR a.alt_phone IN (NEW.phone, NULLIF(NEW.alt_phone, '')))
  ) THEN
    RAISE EXCEPTION 'This mobile number already has an active application';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_apply_membership_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_no text;
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status, '') <> 'approved' THEN
    IF NOT EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = NEW.user_id OR m.phone = NEW.phone) THEN
      SELECT 'BMS-' || LPAD((COALESCE(COUNT(*), 0) + 1)::text, 5, '0')
      INTO next_no FROM public.members;
      INSERT INTO public.members (
        user_id, membership_number, full_name, surname, father_husband_name,
        dob, phone, alt_phone, email, aadhaar_number, aadhaar_last4, pan, eshram_number,
        village, taluka, district, address, approval_status, approved_at, approved_by,
        status, is_public, created_by
      ) VALUES (
        NEW.user_id, next_no, NEW.full_name, NEW.surname, NEW.father_husband_name,
        NEW.dob, NEW.phone, NEW.alt_phone, NEW.email, NULLIF(NEW.aadhaar_number, ''),
        CASE WHEN NEW.aadhaar_number IS NULL OR NEW.aadhaar_number = '' THEN NULL ELSE RIGHT(NEW.aadhaar_number, 4) END,
        NEW.pan, NEW.eshram_number, NEW.village, NEW.taluka, NEW.district, NEW.address,
        'approved', now(), NEW.reviewed_by, 'active', true, NEW.reviewed_by
      );
      IF NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET membership_number = next_no,
            phone = COALESCE(phone, NEW.phone),
            alt_phone = COALESCE(alt_phone, NEW.alt_phone),
            village = COALESCE(village, NEW.village),
            taluka = COALESCE(taluka, NEW.taluka),
            district = COALESCE(district, NEW.district)
        WHERE id = NEW.user_id;
      END IF;
    END IF;
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS membership_applications_approval ON public.membership_applications;
CREATE TRIGGER membership_applications_approval
BEFORE UPDATE ON public.membership_applications
FOR EACH ROW EXECUTE FUNCTION public.tg_apply_membership_approval();