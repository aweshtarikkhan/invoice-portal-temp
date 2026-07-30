-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships, or memberships in orgs they belong to
CREATE POLICY "Users can view members of their orgs" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Only owner/admin can insert/update/delete members in their org
CREATE POLICY "Admins can insert members" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = public.organization_members.org_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update members" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = public.organization_members.org_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete members" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = public.organization_members.org_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Helper function to get the user's role in the currently active organization
CREATE OR REPLACE FUNCTION public.get_current_org_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_members 
  WHERE user_id = auth.uid() 
  AND org_id = public.get_user_org_id()
  LIMIT 1;
$$;

-- Trigger to automatically add creator to organization_members as owner
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- Backfill existing organizations (make the creator/profile owner an 'owner' in the org)
INSERT INTO public.organization_members (org_id, user_id, role)
SELECT org_id, user_id, 'owner'::public.app_role
FROM public.profiles
WHERE org_id IS NOT NULL
ON CONFLICT (org_id, user_id) DO NOTHING;


