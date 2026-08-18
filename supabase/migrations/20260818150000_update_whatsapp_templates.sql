-- Drop the UNIQUE constraint on (org_id, type)
ALTER TABLE public.whatsapp_templates DROP CONSTRAINT IF EXISTS whatsapp_templates_org_id_type_key;

-- Add new columns
ALTER TABLE public.whatsapp_templates 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- For existing templates (which were unique per org and type), they are the defaults!
UPDATE public.whatsapp_templates SET is_default = true WHERE is_default = false;
