-- 1. Fix columns in subscriptions table from uuid to text
ALTER TABLE public.subscriptions ALTER COLUMN razorpay_order_id TYPE text USING razorpay_order_id::text;
ALTER TABLE public.subscriptions ALTER COLUMN razorpay_payment_id TYPE text USING razorpay_payment_id::text;

-- 2. Drop all conflicting overloads of activate_org_plans
DROP FUNCTION IF EXISTS public.activate_org_plans(uuid, text[], text, integer);
DROP FUNCTION IF EXISTS public.activate_org_plans(uuid, text[], text, integer, text, text, text);
DROP FUNCTION IF EXISTS public.activate_org_plans(uuid, text[], text, numeric, text, text, text);

-- 3. Create single, clean, robust activate_org_plans function
CREATE OR REPLACE FUNCTION public.activate_org_plans(
  p_org_id uuid,
  p_plan_names text[],
  p_billing_cycle text DEFAULT 'monthly'::text,
  p_employee_count numeric DEFAULT 3,
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
  v_coupon_id uuid := NULL;
  v_final_emp_count numeric;
  v_all_features jsonb;
BEGIN
  IF p_plan_names IS NULL OR array_length(p_plan_names, 1) IS NULL THEN
    p_plan_names := ARRAY['free'];
  END IF;

  -- CHECK PAYMENT / PROMO CODE:
  -- If payment ID is 'FREE_PLAN', empty, null, or coupon zero payment:
  -- Verify if a valid coupon exists in coupons table
  IF (p_razorpay_payment_id IS NULL OR p_razorpay_payment_id = 'FREE_PLAN' OR p_razorpay_payment_id = '' OR p_razorpay_payment_id LIKE 'COUPON_FREE%') THEN
    IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
      SELECT id INTO v_coupon_id
      FROM public.coupons
      WHERE upper(code) = upper(btrim(p_coupon_code))
        AND is_active = true
        AND (
          (discount_type = 'percentage' AND discount_value >= 100) 
          OR discount_type = 'free'
          OR (discount_type = 'flat' AND discount_value > 0)
        )
      LIMIT 1;

      IF v_coupon_id IS NOT NULL THEN
        v_coupon_valid := 1;
      END IF;
      
      IF v_coupon_valid = 0 THEN
        -- If no valid 100% / full coupon, strictly fallback to free plan
        p_plan_names := ARRAY['free'];
      END IF;
    ELSE
      -- No payment and no coupon: strictly free plan
      p_plan_names := ARRAY['free'];
    END IF;
  END IF;

  -- Delete previous active subscriptions for this organization
  DELETE FROM public.subscriptions WHERE org_id = p_org_id;

  FOREACH v_plan_name IN ARRAY p_plan_names
  LOOP
    SELECT id INTO v_plan_id FROM public.plans WHERE name = v_plan_name LIMIT 1;
    -- Fallback case-insensitive match
    IF v_plan_id IS NULL THEN
      SELECT id INTO v_plan_id FROM public.plans WHERE lower(name) = lower(v_plan_name) LIMIT 1;
    END IF;

    IF v_plan_id IS NOT NULL THEN
      -- Determine employee capacity for this plan
      IF v_plan_name = 'free' THEN
        v_final_emp_count := 3;
      ELSIF v_plan_name IN ('hr', 'plan_4', 'suite', 'plan_3') THEN
        v_final_emp_count := GREATEST(COALESCE(p_employee_count, 25), 25);
      ELSE
        v_final_emp_count := 3;
      END IF;

      INSERT INTO public.subscriptions (
        id,
        org_id,
        plan_id,
        status,
        billing_cycle,
        employee_count,
        razorpay_order_id,
        razorpay_payment_id,
        coupon_id,
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
        v_final_emp_count,
        p_razorpay_order_id,
        p_razorpay_payment_id,
        v_coupon_id,
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

  -- Determine effective plan string
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

  -- Calculate all enabled features (always including core base features)
  IF v_eff_plan = 'suite' THEN
    v_all_features := to_jsonb(ARRAY['sales', 'catalog', 'purchases', 'accounting', 'reports', 'people', 'crm', 'marketing', 'outreach', 'banking', 'tally_sync']);
  ELSIF v_eff_plan = 'free' THEN
    v_all_features := to_jsonb(ARRAY['sales', 'catalog', 'people', 'crm', 'marketing']);
  ELSE
    -- Aggregate from all active subscriptions and ensure base features are preserved
    SELECT COALESCE(
      jsonb_agg(DISTINCT elem) || '["sales", "catalog", "people", "crm", "marketing"]'::jsonb,
      to_jsonb(ARRAY['sales', 'catalog', 'people', 'crm', 'marketing'])
    )
    INTO v_all_features
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id,
    jsonb_array_elements_text(COALESCE(p.feature_keys, '[]'::jsonb)) as elem
    WHERE s.org_id = p_org_id;
  END IF;

  -- Update organization
  UPDATE public.organizations
  SET
    subscription_plan = v_eff_plan,
    subscription_interval = p_billing_cycle,
    subscription_end_date = (now() + (v_days || ' days')::interval)::text,
    enabled_features = v_all_features
  WHERE id = p_org_id;

  RETURN json_build_object('success', true, 'plan', v_eff_plan, 'features', v_all_features);
END;
$$;

-- 4. Create validate_coupon RPC function
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code text,
  p_billing_cycle text DEFAULT 'monthly'::text,
  p_plan_name text DEFAULT 'all'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon record;
  v_discount_val numeric;
BEGIN
  IF p_code IS NULL OR btrim(p_code) = '' THEN
    RETURN json_build_object('valid', false, 'error', 'Coupon code is required');
  END IF;

  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE upper(code) = upper(btrim(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid promo code');
  END IF;

  IF v_coupon.is_active IS NOT TRUE THEN
    RETURN json_build_object('valid', false, 'error', 'Promo code is inactive or has expired');
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.used_count, 0) >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Promo code usage limit has been reached');
  END IF;

  -- Check billing cycle if specified
  IF v_coupon.applicable_cycles IS NOT NULL 
     AND jsonb_typeof(v_coupon.applicable_cycles) = 'array' 
     AND NOT (v_coupon.applicable_cycles @> '["all"]'::jsonb)
     AND NOT (v_coupon.applicable_cycles @> to_jsonb(p_billing_cycle)) THEN
    RETURN json_build_object('valid', false, 'error', 'Promo code is not applicable to ' || p_billing_cycle || ' billing');
  END IF;

  -- Flat discounts are stored in paise (e.g. 710000 = ₹7,100). Convert to rupees for frontend.
  IF v_coupon.discount_type = 'flat' THEN
    v_discount_val := round(v_coupon.discount_value / 100.0, 2);
  ELSE
    v_discount_val := v_coupon.discount_value;
  END IF;

  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_discount_val,
    'description', COALESCE(v_coupon.description, 
      CASE 
        WHEN v_coupon.discount_type = 'percentage' THEN v_coupon.discount_value || '% discount applied!'
        ELSE '₹' || v_discount_val || ' discount applied!'
      END
    )
  );
END;
$$;

-- 5. Create redeem_coupon RPC function
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_code text,
  p_org_id uuid,
  p_discount_applied numeric DEFAULT 0,
  p_order_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon_id uuid;
BEGIN
  IF p_code IS NULL OR btrim(p_code) = '' THEN
    RETURN json_build_object('success', false, 'error', 'No coupon code');
  END IF;

  SELECT id INTO v_coupon_id
  FROM public.coupons
  WHERE upper(code) = upper(btrim(p_code))
  LIMIT 1;

  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = COALESCE(used_count, 0) + 1,
        is_active = CASE 
          WHEN max_uses IS NOT NULL AND (COALESCE(used_count, 0) + 1) >= max_uses THEN false 
          ELSE is_active 
        END
    WHERE id = v_coupon_id;

    BEGIN
      INSERT INTO public.coupon_redemptions (
        id, coupon_id, org_id, discount_applied, redeemed_at
      ) VALUES (
        gen_random_uuid(), v_coupon_id, p_org_id, p_discount_applied, now()::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- ignore redemption log collision
    END;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.activate_org_plans(uuid, text[], text, numeric, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, uuid, numeric, text) TO anon, authenticated, service_role;

-- 7. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
