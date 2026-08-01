-- ============================================================
-- Attendance Status Expansion
-- Add: late, approved_leave to attendance table
-- Add: computed_status, override_status, hr_note to attendance
-- ============================================================

-- Expand the status check constraint on the HR attendance grid table
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS computed_status  TEXT,   -- auto from shift rules
  ADD COLUMN IF NOT EXISTS override_status  TEXT,   -- HR manual override
  ADD COLUMN IF NOT EXISTS hr_note          TEXT;   -- optional HR note

-- Update leave-related status in attendance if stored as 'paid_leave'
-- Add column to track which leave id was deducted (to prevent double deduction)
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS leave_id UUID REFERENCES public.leaves(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS leave_deducted BOOLEAN DEFAULT false;

-- Expand the employee clock-in attendances table status too
ALTER TABLE public.attendances
  DROP CONSTRAINT IF EXISTS attendances_status_check;

ALTER TABLE public.attendances
  ADD CONSTRAINT attendances_status_check
    CHECK (status IN ('present','late','half_day','absent','approved_leave','holiday'));

-- Add computed_status to attendances (employee portal clock-in records)
ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS computed_status TEXT
    CHECK (computed_status IN ('present','late','half_day','absent','approved_leave','holiday'));
