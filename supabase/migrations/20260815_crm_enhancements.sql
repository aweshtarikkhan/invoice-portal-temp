-- CRM Enhancements: Add priority field to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'warm' CHECK (priority IN ('hot', 'warm', 'cold'));
