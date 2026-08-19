-- Add type column to email_templates to support multiple document types
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'invoice';
