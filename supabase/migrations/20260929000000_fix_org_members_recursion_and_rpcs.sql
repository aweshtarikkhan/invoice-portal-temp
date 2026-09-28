-- 1. Create SECURITY DEFINER function to check if a user is an org admin/owner without recursing
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.organization_members WHERE org_id = _org_id AND user_id = _user_id AND role IN ('owner'::app_role, 'admin'::app_role)
  );
$$;

-- 2. Drop existing recursive policies on organization_members
DROP POLICY IF EXISTS "Admins can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.organization_members;

-- 3. Re-create non-recursive policies using is_org_admin
CREATE POLICY "Admins can insert members" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_admin(org_id, auth.uid())
  );

CREATE POLICY "Admins can update members" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    public.is_org_admin(org_id, auth.uid())
  );

CREATE POLICY "Admins can delete members" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    public.is_org_admin(org_id, auth.uid())
  );

-- 4. Create dedicated RPC function for removing organization members safely
CREATE OR REPLACE FUNCTION public.remove_organization_member(p_member_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_caller uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT org_id, user_id INTO v_org_id, v_user_id
  FROM public.organization_members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Check if caller is owner or admin of this org
  v_is_admin := public.is_org_admin(v_org_id, v_caller);

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'You do not have permission to remove members from this organization';
  END IF;

  -- Cannot remove yourself if you are the organization owner
  IF EXISTS (SELECT 1 FROM public.organizations WHERE id = v_org_id AND owner_id = v_user_id) THEN
    RAISE EXCEPTION 'Cannot remove the business owner from their own organization';
  END IF;

  DELETE FROM public.organization_members WHERE id = p_member_id;

  RETURN jsonb_build_object('success', true, 'message', 'Member removed successfully');
END;
$$;

-- 5. Create dedicated RPC function for updating member role and permissions safely
CREATE OR REPLACE FUNCTION public.update_organization_member_access(
  p_member_id uuid,
  p_role text DEFAULT NULL,
  p_permissions text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_caller uuid := auth.uid();
  v_is_admin boolean;
  v_app_role app_role;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT org_id INTO v_org_id
  FROM public.organization_members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  v_is_admin := public.is_org_admin(v_org_id, v_caller);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'You do not have permission to edit members of this organization';
  END IF;

  IF p_role IS NOT NULL AND p_permissions IS NOT NULL THEN
    v_app_role := p_role::app_role;
    UPDATE public.organization_members
    SET role = v_app_role, permissions = p_permissions
    WHERE id = p_member_id;
  ELSIF p_permissions IS NOT NULL THEN
    UPDATE public.organization_members
    SET permissions = p_permissions
    WHERE id = p_member_id;
  ELSIF p_role IS NOT NULL THEN
    v_app_role := p_role::app_role;
    UPDATE public.organization_members
    SET role = v_app_role
    WHERE id = p_member_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Member updated successfully');
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.remove_organization_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_organization_member_access(uuid, text, text[]) TO authenticated, service_role;
