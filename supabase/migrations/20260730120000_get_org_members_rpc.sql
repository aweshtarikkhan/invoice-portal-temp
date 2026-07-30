-- Create RPC to fetch organization members with status
CREATE OR REPLACE FUNCTION public.get_org_members_with_status(target_org_id uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  email text,
  role text,
  permissions jsonb,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  -- Only allow if the caller is an admin or owner of the target_org_id
  SELECT 
    om.id AS member_id,
    om.user_id,
    au.email::text,
    om.role::text,
    om.permissions,
    CASE 
      WHEN au.last_sign_in_at IS NULL THEN 'Pending Invite'
      ELSE 'Active'
    END AS status
  FROM public.organization_members om
  JOIN auth.users au ON au.id = om.user_id
  WHERE om.org_id = target_org_id
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE org_id = target_org_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    );
$$;
