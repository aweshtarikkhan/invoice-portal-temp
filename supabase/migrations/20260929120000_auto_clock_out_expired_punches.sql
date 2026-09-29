-- Migration: Auto Clock Out Expired Punches at 08:59 AM before next shift start

ALTER TABLE public.attendances ADD COLUMN IF NOT EXISTS is_auto_clock_out BOOLEAN DEFAULT false;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS is_auto_clock_out BOOLEAN DEFAULT false;

DROP FUNCTION IF EXISTS public.auto_clock_out_expired_punches(uuid);

CREATE OR REPLACE FUNCTION public.auto_clock_out_expired_punches(p_org_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_shift_start time;
  v_cutoff_ts timestamptz;
  v_auto_out_time text;
  v_updated_count int := 0;
BEGIN
  FOR v_rec IN 
    SELECT a.id, a.employee_id, a.org_id, a.date, a.clock_in_time
    FROM public.attendances a
    WHERE a.clock_in_time IS NOT NULL 
      AND a.clock_out_time IS NULL
      AND (p_org_id IS NULL OR a.org_id = p_org_id)
  LOOP
    SELECT COALESCE(s.start_time, '09:00:00'::time)
    INTO v_shift_start
    FROM public.employee_shifts es
    JOIN public.shifts s ON s.id = es.shift_id
    WHERE es.employee_id = v_rec.employee_id
    LIMIT 1;

    IF v_shift_start IS NULL THEN
      SELECT COALESCE(s.start_time, '09:00:00'::time)
      INTO v_shift_start
      FROM public.employees e
      JOIN public.shifts s ON s.id = e.shift_id
      WHERE e.id = v_rec.employee_id
      LIMIT 1;
    END IF;

    IF v_shift_start IS NULL THEN
      SELECT COALESCE(s.start_time, '09:00:00'::time)
      INTO v_shift_start
      FROM public.shifts s
      WHERE s.org_id = v_rec.org_id AND s.is_default = true
      LIMIT 1;
    END IF;

    IF v_shift_start IS NULL THEN
      v_shift_start := '09:00:00'::time;
    END IF;

    BEGIN
      v_cutoff_ts := ((v_rec.date::date + interval '1 day') + (v_shift_start - interval '1 minute')) AT TIME ZONE 'Asia/Kolkata';
    EXCEPTION WHEN OTHERS THEN
      v_cutoff_ts := ((now()::date) + '08:59:00'::time) AT TIME ZONE 'Asia/Kolkata';
    END;

    IF now() >= v_cutoff_ts THEN
      v_auto_out_time := to_char(v_cutoff_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

      UPDATE public.attendances
      SET 
        clock_out_time = v_auto_out_time,
        is_auto_clock_out = true,
        clock_out_location = jsonb_build_object(
          'auto', true, 
          'is_auto_clock_out', true, 
          'reason', 'Auto Clock Out at ' || to_char(v_shift_start - interval '1 minute', 'HH12:MI AM')
        )
      WHERE id = v_rec.id;

      UPDATE public.attendance
      SET 
        clock_out_time = v_auto_out_time,
        is_auto_clock_out = true,
        hr_note = CASE 
          WHEN hr_note IS NULL OR hr_note = '' THEN '[Auto Logout]'
          WHEN hr_note NOT LIKE '%[Auto Logout]%' THEN hr_note || ' [Auto Logout]'
          ELSE hr_note
        END
      WHERE employee_id = v_rec.employee_id 
        AND attendance_date = v_rec.date::date;

      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'updated_count', v_updated_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_clock_out_expired_punches(uuid) TO authenticated, anon, public;
