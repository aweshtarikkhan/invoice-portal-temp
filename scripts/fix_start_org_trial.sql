CREATE OR REPLACE FUNCTION public.start_org_trial(p_org_id uuid, p_plan_name text DEFAULT 'free')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_free_plan_id uuid;
BEGIN
  -- Security: All newly created businesses or trials strictly start on Free Plan.
  -- Paid plans (HR, CRM, Accounting, Promotion, Suite) MUST be purchased through Razorpay.
  SELECT id INTO v_free_plan_id FROM public.plans WHERE name = 'free' LIMIT 1;
  
  UPDATE public.organizations
  SET
    subscription_plan = 'free',
    subscription_interval = 'free',
    subscription_end_date = (now() + interval '180 days')::text,
    enabled_features = to_jsonb(ARRAY['sales', 'catalog', 'people', 'crm'])
  WHERE id = p_org_id;

  DELETE FROM public.subscriptions WHERE org_id = p_org_id;

  INSERT INTO public.subscriptions (
    id,
    org_id,
    plan_id,
    status,
    billing_cycle,
    employee_count,
    current_period_start,
    current_period_end,
    trial_ends_at,
    trial_plan_name,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_org_id,
    v_free_plan_id,
    'active',
    'free',
    3,
    now()::text,
    (now() + interval '180 days')::text,
    (now() + interval '180 days')::text,
    'free',
    now(),
    now()
  );

  RETURN json_build_object('success', true, 'plan', 'free');
END;
$$;
