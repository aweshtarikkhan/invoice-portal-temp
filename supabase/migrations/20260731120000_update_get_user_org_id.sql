-- Update get_user_org_id function to fallback to organization_members if profile org_id is null
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT org_id FROM public.profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL),
    (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
  );
$$;
