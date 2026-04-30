-- ============================================================
-- Nocarbontr — Auth Trigger v2
-- Fix: public.org_type schema prefix + search_path
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_name_val TEXT;
  tax_id_val   TEXT;
  org_type_val TEXT;
BEGIN
  org_name_val := NEW.raw_user_meta_data->>'org_name';
  tax_id_val   := NEW.raw_user_meta_data->>'tax_id';
  org_type_val := NEW.raw_user_meta_data->>'org_type';

  -- Metadata eksikse sessizce çık (OAuth vb.)
  IF org_name_val IS NULL OR tax_id_val IS NULL OR org_type_val IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.organizations (name, tax_id, type, subscription_status, trial_ends_at)
  VALUES (
    org_name_val,
    tax_id_val,
    org_type_val::public.org_type,
    'TRIAL',
    NOW() + INTERVAL '3 days'
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
