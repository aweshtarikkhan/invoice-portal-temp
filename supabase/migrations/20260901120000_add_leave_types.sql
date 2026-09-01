DO $ $ BEGIN
  ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'cl';
  ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'el_pl';
  ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'sl_ml';
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
EXCEPTION WHEN duplicate_object THEN null; END $ $;
