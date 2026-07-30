-- Employee Holidays
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT DEFAULT 'public' CHECK (type IN ('public', 'optional', 'company')),
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holidays_org_select" ON public.holidays FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "holidays_org_mod" ON public.holidays FOR ALL TO authenticated USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());

-- Attendance Regularization Requests
CREATE TABLE IF NOT EXISTS public.attendance_regularizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES public.attendances(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    requested_clock_in TIMESTAMPTZ,
    requested_clock_out TIMESTAMPTZ,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_regularizations TO authenticated;
GRANT ALL ON public.attendance_regularizations TO service_role;
ALTER TABLE public.attendance_regularizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reg_org_select" ON public.attendance_regularizations FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "reg_org_mod" ON public.attendance_regularizations FOR ALL TO authenticated USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "reg_emp_select" ON public.attendance_regularizations FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "reg_emp_insert" ON public.attendance_regularizations FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID, -- NULL if it's for all HRs in the org, otherwise specific auth user id (HR or Employee)
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'leave_request', 'regularization_request', 'announcement', 'leave_approved'
    is_read BOOLEAN DEFAULT false,
    reference_id UUID, -- ID of the leave/regularization
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_org_select" ON public.notifications FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "notif_org_mod" ON public.notifications FOR ALL TO authenticated USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "notif_emp_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
