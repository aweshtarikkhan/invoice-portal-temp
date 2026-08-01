-- ============================================================
-- Leave Balance System
-- leave_policies: org-level annual limits & monthly accrual
-- employee_leave_balances: per-employee running balance
-- ============================================================

-- 1. Leave Policies (org-level config)
CREATE TABLE IF NOT EXISTS public.leave_policies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  leave_type    TEXT NOT NULL CHECK (leave_type IN ('casual','sick','paid')),
  annual_limit  INT  NOT NULL DEFAULT 0,
  monthly_accrual NUMERIC(5,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, leave_type)
);

-- Seed default policies when a row is missing (safe upsert handled from app)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_policies TO authenticated;
GRANT ALL ON public.leave_policies TO service_role;

ALTER TABLE public.leave_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_policies_org_select" ON public.leave_policies
  FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());

CREATE POLICY "leave_policies_org_mod" ON public.leave_policies
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- 2. Employee Leave Balances
CREATE TABLE IF NOT EXISTS public.employee_leave_balances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type   TEXT NOT NULL CHECK (leave_type IN ('casual','sick','paid')),
  used         NUMERIC(5,2) DEFAULT 0,
  accrued      NUMERIC(5,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, leave_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_leave_balances TO authenticated;
GRANT ALL ON public.employee_leave_balances TO service_role;

ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;

-- HR / org admins can see all balances in their org
CREATE POLICY "elb_org_select" ON public.employee_leave_balances
  FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());

CREATE POLICY "elb_org_mod" ON public.employee_leave_balances
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- Employees can see their own balance
CREATE POLICY "elb_emp_select" ON public.employee_leave_balances
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid()));
