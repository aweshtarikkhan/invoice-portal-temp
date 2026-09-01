-- ==========================================
-- LEAVE TRANSACTIONS (CREDITS/DEDUCTIONS)
-- Copy and paste this into the Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.leave_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  amount NUMERIC(5,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'deduction', 'expiry')),
  expiry_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leave_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lt_org_select" ON public.leave_transactions;
CREATE POLICY "lt_org_select" ON public.leave_transactions 
  FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "lt_org_mod" ON public.leave_transactions;
CREATE POLICY "lt_org_mod" ON public.leave_transactions 
  FOR ALL TO authenticated 
  USING (org_id = public.get_user_org_id()) 
  WITH CHECK (org_id = public.get_user_org_id());

GRANT ALL ON public.leave_transactions TO authenticated;
GRANT ALL ON public.leave_transactions TO service_role;
