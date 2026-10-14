-- Secure activate_org_plans in PostgreSQL
CREATE OR REPLACE FUNCTION public.activate_org_plans(
  p_org_id uuid,
  p_plan_names text[],
  p_billing_cycle text DEFAULT 'monthly'::text,
  p_employee_count integer DEFAULT 3,
  p_razorpay_order_id text DEFAULT NULL::text,
  p_razorpay_payment_id text DEFAULT NULL::text,
  p_coupon_code text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_name text;
  v_plan_id uuid;
  v_eff_plan text;
  v_has_suite boolean := false;
  v_days int := CASE WHEN p_billing_cycle = 'yearly' THEN 365 ELSE 30 END;
  v_coupon_valid int := 0;
BEGIN
  IF p_plan_names IS NULL OR array_length(p_plan_names, 1) IS NULL THEN
    p_plan_names := ARRAY['free'];
  END IF;

  -- CRITICAL SECURITY CHECK:
  -- If payment ID is 'FREE_PLAN', empty, or null, paid plans (hr, suite, crm, accounting, promotion) CANNOT be activated
  -- UNLESS a verified 100% coupon exists in the coupons table!
  IF (p_razorpay_payment_id IS NULL OR p_razorpay_payment_id = 'FREE_PLAN' OR p_razorpay_payment_id = '' OR p_razorpay_payment_id LIKE 'COUPON_FREE%') THEN
    IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
      SELECT count(*) INTO v_coupon_valid
      FROM public.coupons
      WHERE upper(code) = upper(btrim(p_coupon_code))
        AND is_active = true
        AND ((discount_type = 'percentage' AND discount_value >= 100) OR discount_type = 'free');
      
      IF v_coupon_valid = 0 THEN
        -- No 100% coupon: strictly force free plan only
        p_plan_names := ARRAY['free'];
      END IF;
    ELSE
      -- No payment and no coupon: strictly force free plan only
      p_plan_names := ARRAY['free'];
    END IF;
  END IF;

  DELETE FROM public.subscriptions WHERE org_id = p_org_id;

  FOREACH v_plan_name IN ARRAY p_plan_names
  LOOP
    SELECT id INTO v_plan_id FROM public.plans WHERE name = v_plan_name LIMIT 1;
    IF v_plan_id IS NOT NULL THEN
      INSERT INTO public.subscriptions (
        id,
        org_id,
        plan_id,
        status,
        billing_cycle,
        employee_count,
        razorpay_order_id,
        razorpay_payment_id,
        current_period_start,
        current_period_end,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        p_org_id,
        v_plan_id,
        'active',
        p_billing_cycle,
        CASE WHEN v_plan_name = 'free' THEN 3 ELSE p_employee_count END,
        p_razorpay_order_id,
        p_razorpay_payment_id,
        now()::text,
        (now() + (v_days || ' days')::interval)::text,
        now(),
        now()
      );
    END IF;

    IF v_plan_name IN ('suite', 'plan_3') OR v_plan_name ILIKE '%suite%' THEN
      v_has_suite := true;
    END IF;
  END LOOP;

  IF v_has_suite THEN
    v_eff_plan := 'suite';
  ELSE
    SELECT COALESCE(string_agg(DISTINCT pl.name, '+'), 'free')
    INTO v_eff_plan
    FROM public.subscriptions sub
    JOIN public.plans pl ON pl.id = sub.plan_id
    WHERE sub.org_id = p_org_id AND sub.status = 'active';

    IF v_eff_plan IS NULL OR v_eff_plan = '' THEN
      v_eff_plan := 'free';
    END IF;
  END IF;

  UPDATE public.organizations
  SET
    subscription_plan = v_eff_plan,
    subscription_interval = p_billing_cycle,
    subscription_end_date = (now() + (v_days || ' days')::interval)::text,
    enabled_features = CASE
      WHEN v_eff_plan = 'free' THEN to_jsonb(ARRAY['sales', 'catalog', 'people', 'crm'])
      WHEN v_eff_plan = 'suite' THEN to_jsonb(ARRAY['sales', 'catalog', 'purchases', 'accounting', 'people', 'crm', 'marketing', 'reports', 'outreach'])
      ELSE (
        SELECT COALESCE(json_agg(DISTINCT elem)::jsonb, to_jsonb(ARRAY['sales', 'catalog']))
        FROM public.subscriptions s
        JOIN public.plans p ON p.id = s.plan_id,
        jsonb_array_elements(COALESCE(p.feature_keys, '[]'::jsonb)) as elem
        WHERE s.org_id = p_org_id
      )
    END
  WHERE id = p_org_id;

  RETURN json_build_object('success', true, 'plan', v_eff_plan);
END;
$$;
