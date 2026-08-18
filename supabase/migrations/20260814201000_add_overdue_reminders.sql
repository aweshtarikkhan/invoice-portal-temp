-- Add setting to automate overdue reminders
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS automate_overdue_reminders BOOLEAN DEFAULT false;

-- Add tracking for the last reminder sent
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;

-- Enable pg_cron and pg_net extensions if not already enabled (requires superuser, managed by Supabase platform)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the cron job to call the edge function daily at 8:00 AM UTC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-overdue-reminders'
  ) THEN
    PERFORM cron.schedule(
      'process-overdue-reminders',
      '30 2 * * *', -- Every day at 8:00 AM IST (2:30 AM UTC)
      $$
      SELECT net.http_post(
          url:='https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/process-overdue-reminders',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.sub', true) || '"}',
          body:='{}'
      );
      $$
    );
  END IF;
END
$$;
