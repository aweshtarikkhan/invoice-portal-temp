CREATE OR REPLACE FUNCTION admin_set_plans(p_org_id UUID, p_plan_names TEXT[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM platform_admins WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Delete all existing subscriptions for the org
  DELETE FROM public.subscriptions WHERE org_id = p_org_id;

  -- If the only plan is 'free' or empty, we just leave it deleted (or handle 'free' specially)
  -- But actually we should just insert 'free' if they want. Wait, 'free' plan might exist in plans table.
  -- Let's just iterate over p_plan_names and insert.
  FOREACH v_plan_name IN ARRAY p_plan_names
  LOOP
    SELECT id INTO v_plan_id FROM public.plans WHERE name = v_plan_name;
    
    IF v_plan_id IS NOT NULL THEN
      INSERT INTO public.subscriptions (org_id, plan_id, status, billing_cycle)
      VALUES (p_org_id, v_plan_id, 'active', 'monthly')
      ON CONFLICT (org_id, plan_id) DO NOTHING;
    END IF;
  END LOOP;
  
  -- If empty array or no valid plans found, maybe we default to 'free' if it exists.
  -- If the user provided 'free', it will be inserted if 'free' is in the plans table.
END;
$$;
