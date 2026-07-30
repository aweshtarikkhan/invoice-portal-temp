-- Add weekly_offs column to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS weekly_offs integer[] DEFAULT '{0}';
