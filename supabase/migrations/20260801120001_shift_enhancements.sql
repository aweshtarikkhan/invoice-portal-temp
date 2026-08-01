-- ============================================================
-- Shift Enhancements + Employee Shift Assignment
-- ============================================================

-- 1. Add timing detail fields to shifts table
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS grace_minutes   INT  DEFAULT 15,
  ADD COLUMN IF NOT EXISTS late_start      TIME DEFAULT '09:15:00',
  ADD COLUMN IF NOT EXISTS late_end        TIME DEFAULT '10:30:00',
  ADD COLUMN IF NOT EXISTS half_day_start  TIME DEFAULT '10:30:00',
  ADD COLUMN IF NOT EXISTS half_day_end    TIME DEFAULT '14:00:00';

-- 2. Employee ↔ Shift assignment (one active shift per employee)
CREATE TABLE IF NOT EXISTS public.employee_shifts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id    UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id       UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id)   -- one active shift per employee
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_shifts TO authenticated;
GRANT ALL ON public.employee_shifts TO service_role;

ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emp_shifts_org_select" ON public.employee_shifts
  FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());

CREATE POLICY "emp_shifts_org_mod" ON public.employee_shifts
  FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- Employees can see their own shift
CREATE POLICY "emp_shifts_self_select" ON public.employee_shifts
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid()));
