-- Partner Reseller System
-- Partners are resellers who get referral codes and can resell accounts

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  max_users INT NOT NULL DEFAULT 10,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.partner_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  coupon_code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Platform admins can do everything on partners
CREATE POLICY "Platform admins can manage partners"
  ON public.partners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins WHERE id = auth.uid()
    )
  );

-- Partners can read their own row (matched by user_id)
CREATE POLICY "Partners can view own record"
  ON public.partners
  FOR SELECT
  USING (user_id = auth.uid());

-- Anyone can read a partner row by referral_code (for signup validation) 
-- We allow this via a service-level check in the app (anon read for referral_code lookup)
CREATE POLICY "Public can read partners for referral code validation"
  ON public.partners
  FOR SELECT
  USING (true);

-- RLS Policies for partner_coupons table
ALTER TABLE public.partner_coupons ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all coupons
CREATE POLICY "Platform admins can manage partner coupons"
  ON public.partner_coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins WHERE id = auth.uid()
    )
  );

-- Partners can manage their own coupons
CREATE POLICY "Partners can manage own coupons"
  ON public.partner_coupons
  FOR ALL
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

-- Public can read active coupons for validation
CREATE POLICY "Public can read active coupons"
  ON public.partner_coupons
  FOR SELECT
  USING (is_active = true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_partners_referral_code ON public.partners(referral_code);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_coupons_partner_id ON public.partner_coupons(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_coupons_code ON public.partner_coupons(coupon_code);
