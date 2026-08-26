
-- Clear existing subscriptions (must be done before deleting plans due to foreign keys)
DELETE FROM public.subscriptions;
DELETE FROM public.plans;

-- Insert Free Plan
INSERT INTO public.plans (id, name, display_name, plan_type, price_monthly, price_yearly, feature_keys, features, sort_order)
VALUES ('plan_1', 'free', 'Free Plan', 'tiered', 0, 0, '["sales", "catalog"]'::jsonb, '["50 Invoices/month", "Client management (up to 100 clients)", "Inventory Management (up to 100 items)"]'::jsonb, 1);

-- Insert Plan 2
INSERT INTO public.plans (id, name, display_name, plan_type, price_monthly, price_yearly, feature_keys, features, sort_order)
VALUES ('plan_2', 'plan_2', 'Sales & Inventory', 'tiered', 99, 999, '["sales", "catalog"]'::jsonb, '["All Sales item feature", "All item inventory management", "Unlimited Invoices & Clients"]'::jsonb, 2);

-- Insert Plan 3
INSERT INTO public.plans (id, name, display_name, plan_type, price_monthly, price_yearly, feature_keys, features, sort_order)
VALUES ('plan_3', 'plan_3', 'Complete Business', 'tiered', 299, 2999, '["sales", "catalog", "purchases", "accounting", "reports", "crm", "marketing"]'::jsonb, '["All Plan 2 features", "Purchases", "Accounting", "Reports", "Includes Complete CRM", "Includes Marketing"]'::jsonb, 3);

-- Insert Plan 4
INSERT INTO public.plans (id, name, display_name, plan_type, price_monthly, price_yearly, feature_keys, features, employee_limit, employee_price_extra, sort_order)
VALUES ('plan_4', 'plan_4', 'HR & People', 'tiered', 199, 1999, '["people"]'::jsonb, '["Complete HR & People", "Up to 20 employees", "?29 per extra employee"]'::jsonb, 20, 29, 4);

-- Insert Plan 5
INSERT INTO public.plans (id, name, display_name, plan_type, price_monthly, price_yearly, feature_keys, features, sort_order)
VALUES ('plan_5', 'plan_5', 'Complete CRM', 'tiered', 99, 999, '["crm"]'::jsonb, '["Complete CRM Module", "Lead Pipeline", "Activities"]'::jsonb, 5);

-- Insert Plan 6
INSERT INTO public.plans (id, name, display_name, plan_type, price_monthly, price_yearly, feature_keys, features, sort_order)
VALUES ('plan_6', 'plan_6', 'Marketing', 'tiered', 99, 999, '["marketing"]'::jsonb, '["Marketing Campaigns", "WhatsApp Bulk Messaging"]'::jsonb, 6);


-- Update the RPC to support multiple plans
CREATE OR REPLACE FUNCTION public.get_my_org_subscription(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_active_count integer;
  v_features jsonb;
  v_employee_limit integer;
  v_employee_count integer;
  v_current_period_end timestamp with time zone;
  v_plan_names text;
  v_plan_display_names text;
BEGIN
  -- Count how many active/trial subscriptions there are
  SELECT COUNT(*) INTO v_active_count
  FROM public.subscriptions s
  WHERE s.org_id = p_org_id AND s.status IN ('active', 'trial', 'courtesy');

  -- Ensure expired trials are updated
  UPDATE public.subscriptions 
  SET status = 'expired', updated_at = NOW()
  WHERE org_id = p_org_id AND status = 'trial' AND trial_ends_at < NOW();

  -- If NO active subscriptions (including free), we return a fallback "free" state
  IF v_active_count = 0 THEN
    RETURN jsonb_build_object(
      'plan_name',        'free',
      'plan_display_name','Free Plan',
      'plan_type',        'tiered',
      'status',           'active',
      'billing_cycle',    'monthly',
      'trial_ends_at',    NULL,
      'trial_plan_name',  NULL,
      'enabled_features', '["sales", "catalog"]'::jsonb,
      'employee_limit',   NULL,
      'employee_count',   0,
      'current_period_end', NULL
    );
  END IF;

  -- Aggregate active plans data
  SELECT 
    string_agg(p.name, ' + '),
    string_agg(p.display_name, ' + '),
    SUM(p.employee_limit),
    MAX(s.employee_count),
    MAX(s.current_period_end)
  INTO 
    v_plan_names,
    v_plan_display_names,
    v_employee_limit,
    v_employee_count,
    v_current_period_end
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.org_id = p_org_id AND s.status IN ('active', 'trial', 'courtesy');

  -- Aggregate features safely handling JSONB arrays
  SELECT COALESCE(jsonb_agg(DISTINCT elem), '[]'::jsonb) INTO v_features
  FROM (
      SELECT jsonb_array_elements_text(p.feature_keys) as elem
      FROM public.subscriptions s
      JOIN public.plans p ON p.id = s.plan_id
      WHERE s.org_id = p_org_id AND s.status IN ('active', 'trial', 'courtesy')
  ) subq;

  RETURN jsonb_build_object(
    'plan_name',          COALESCE(v_plan_names, 'free'),
    'plan_display_name',  COALESCE(v_plan_display_names, 'Free Plan'),
    'plan_type',          'tiered',
    'status',             'active',
    'billing_cycle',      'monthly',
    'trial_ends_at',      NULL,
    'trial_plan_name',    NULL,
    'enabled_features',   v_features,
    'employee_limit',     v_employee_limit,
    'employee_count',     COALESCE(v_employee_count, 0),
    'current_period_end', v_current_period_end
  );
END;
$function$;

