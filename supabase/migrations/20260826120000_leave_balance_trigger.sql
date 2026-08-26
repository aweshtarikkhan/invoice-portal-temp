-- Auto-deduct and refund leave balances
CREATE OR REPLACE FUNCTION public.handle_leave_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If leave is approved (and wasn't approved before)
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status != 'approved') THEN
    -- Upsert the employee_leave_balances to increment 'used'
    INSERT INTO public.employee_leave_balances (org_id, employee_id, leave_type, used, accrued)
    VALUES (NEW.org_id, NEW.employee_id, NEW.leave_type, NEW.days, 0)
    ON CONFLICT (employee_id, leave_type)
    DO UPDATE SET used = public.employee_leave_balances.used + NEW.days;

  -- If leave is cancelled/rejected (and WAS approved before)
  ELSIF (NEW.status = 'rejected' OR NEW.status = 'cancelled' OR NEW.status = 'pending') AND TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    -- Decrease 'used'
    UPDATE public.employee_leave_balances
    SET used = GREATEST(used - NEW.days, 0)
    WHERE employee_id = NEW.employee_id AND leave_type = NEW.leave_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_leave_status_change ON public.leaves;
CREATE TRIGGER tr_leave_status_change
AFTER INSERT OR UPDATE OF status ON public.leaves
FOR EACH ROW
EXECUTE FUNCTION public.handle_leave_status_change();
