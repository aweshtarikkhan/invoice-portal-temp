-- Allow employees to manage their own leaves
CREATE POLICY "leaves_emp_select" ON public.leaves FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

CREATE POLICY "leaves_emp_insert" ON public.leaves FOR INSERT TO authenticated WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

CREATE POLICY "leaves_emp_update" ON public.leaves FOR UPDATE TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

CREATE POLICY "leaves_emp_delete" ON public.leaves FOR DELETE TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

-- Fix attendance regularizations RLS (was incorrectly checking employee_id = auth.uid())
DROP POLICY IF EXISTS "reg_emp_select" ON public.attendance_regularizations;
DROP POLICY IF EXISTS "reg_emp_insert" ON public.attendance_regularizations;

CREATE POLICY "reg_emp_select" ON public.attendance_regularizations FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

CREATE POLICY "reg_emp_insert" ON public.attendance_regularizations FOR INSERT TO authenticated WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

-- Fix attendances RLS for employees
DROP POLICY IF EXISTS "attendances_emp_select" ON public.attendances;
DROP POLICY IF EXISTS "attendances_emp_insert" ON public.attendances;
DROP POLICY IF EXISTS "attendances_emp_update" ON public.attendances;

CREATE POLICY "attendances_emp_select" ON public.attendances FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

CREATE POLICY "attendances_emp_insert" ON public.attendances FOR INSERT TO authenticated WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);

CREATE POLICY "attendances_emp_update" ON public.attendances FOR UPDATE TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
);
