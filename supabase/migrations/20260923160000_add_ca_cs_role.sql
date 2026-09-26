-- Add CA/CS role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ca_cs';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ca/cs';
