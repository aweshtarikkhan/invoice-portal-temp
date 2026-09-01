-- ==========================================
-- LEAVE SYSTEM EXPANSION SCRIPT
-- Copy and paste this into the Supabase SQL Editor
-- ==========================================

-- 1. Add new values to the leave_type ENUM
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'el_pl';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'comp_off';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'maternity';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'paternity';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'bereavement';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'marriage';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'study';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'jury_duty';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'od';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'wfh';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'half_day';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'lwp';
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'ncns';

-- 2. Drop restrict constraints on leave policies & balances to allow new types
ALTER TABLE public.leave_policies DROP CONSTRAINT IF EXISTS leave_policies_leave_type_check;
ALTER TABLE public.employee_leave_balances DROP CONSTRAINT IF EXISTS employee_leave_balances_leave_type_check;

-- 3. Drop status constraint on attendances to allow all statuses
ALTER TABLE public.attendances DROP CONSTRAINT IF EXISTS attendances_status_check;

-- 4. Auto-deduct balances when HR sets leave via Attendance Grid
CREATE OR REPLACE FUNCTION public.handle_grid_leave_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If old was leave, refund
  IF TG_OP = 'UPDATE' AND OLD.status = 'paid_leave' AND OLD.override_status IS NOT NULL THEN
    UPDATE public.employee_leave_balances
    SET used = GREATEST(used - 1, 0)
    WHERE employee_id = OLD.employee_id AND leave_type = OLD.override_status;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.status = 'paid_leave' AND OLD.override_status IS NOT NULL THEN
    UPDATE public.employee_leave_balances
    SET used = GREATEST(used - 1, 0)
    WHERE employee_id = OLD.employee_id AND leave_type = OLD.override_status;
  END IF;

  -- If new is leave, deduct
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'paid_leave' AND NEW.override_status IS NOT NULL THEN
    INSERT INTO public.employee_leave_balances (org_id, employee_id, leave_type, used, accrued)
    VALUES (NEW.org_id, NEW.employee_id, NEW.override_status, 1, 0)
    ON CONFLICT (employee_id, leave_type)
    DO UPDATE SET used = public.employee_leave_balances.used + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_grid_leave_status_change ON public.attendance;
CREATE TRIGGER tr_grid_leave_status_change
AFTER INSERT OR UPDATE OR DELETE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.handle_grid_leave_status_change();
