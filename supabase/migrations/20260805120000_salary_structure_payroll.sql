-- Migration for Salary Structure & Flexible Payroll Range
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS salary_structure jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;
