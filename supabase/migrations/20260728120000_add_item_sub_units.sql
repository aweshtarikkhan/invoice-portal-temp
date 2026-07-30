-- Add sub-unit support
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS sub_unit_enabled boolean DEFAULT false;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS sub_unit text;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS sub_unit_conversion_rate numeric(15,2);
