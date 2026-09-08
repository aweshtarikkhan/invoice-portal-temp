ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20); ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS pan_enabled BOOLEAN DEFAULT false;
