CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'reset_yearly_whatsapp_quota',
  '0 0 1 1 *',
  'UPDATE public.organizations SET whatsapp_msg_used = 0;'
);
