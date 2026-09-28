-- 1. Update remove_organization_member to clear profiles.org_id and unlink employees
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

  -- 1. Delete the member record
  DELETE FROM public.organization_members WHERE id = p_member_id;

  -- 2. If the removed member has a user_id:
  IF v_user_id IS NOT NULL THEN
    -- Update profiles.org_id: switch to another org if they have one, otherwise NULL
    UPDATE public.profiles
    SET org_id = (
      SELECT om.org_id 
      FROM public.organization_members om 
      WHERE om.user_id = v_user_id 
      LIMIT 1
    )
    WHERE user_id = v_user_id AND org_id = v_org_id;

    -- Also unlink from employees table for this org
    UPDATE public.employees
    SET auth_user_id = NULL
    WHERE org_id = v_org_id AND auth_user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Member removed successfully');
END;
$$;

-- 2. Create delete_my_user_account RPC
CREATE OR REPLACE FUNCTION public.delete_my_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_email text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Safety check: If user is owner of an active organization, prevent accidental self-deletion
  IF EXISTS (SELECT 1 FROM public.organizations WHERE owner_id = v_caller) THEN
    RAISE EXCEPTION 'Cannot delete account because you are the owner of an active organization. Please delete or transfer your organization first.';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_caller;

  -- 1. Unlink from employees table if linked
  UPDATE public.employees
  SET auth_user_id = NULL
  WHERE auth_user_id = v_caller;

  -- 2. Remove any organization membership
  DELETE FROM public.organization_members
  WHERE user_id = v_caller;

  -- 3. Delete from user_roles
  DELETE FROM public.user_roles
  WHERE user_id = v_caller;

  -- 4. Delete from profiles
  DELETE FROM public.profiles
  WHERE user_id = v_caller;

  -- 5. Delete from auth.users (cascades sessions, identities, mfa, etc.)
  DELETE FROM auth.users
  WHERE id = v_caller;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Account permanently deleted from database',
    'deleted_user_id', v_caller,
    'email', v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_organization_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_my_user_account() TO authenticated;
