-- Migration: Add missing metadata, title, month, and total_employees columns to payroll_runs
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS month text,
  ADD COLUMN IF NOT EXISTS total_employees integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.payroll_runs
  ALTER COLUMN period_month DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.payroll_status'::regtype 
    AND enumlabel = 'completed'
  ) THEN
    ALTER TYPE public.payroll_status ADD VALUE 'completed';
  END IF;
END$$;
