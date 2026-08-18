-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject_template text NOT NULL,
  body_html_template text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email templates for their org" ON public.email_templates
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));

CREATE POLICY "Users can insert email templates for their org" ON public.email_templates
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));
  
CREATE POLICY "Users can update email templates for their org" ON public.email_templates
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));

CREATE POLICY "Users can delete email templates for their org" ON public.email_templates
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));

-- Add tracking columns to emails table
ALTER TABLE public.emails 
  ADD COLUMN IF NOT EXISTS source_entity_id uuid,
  ADD COLUMN IF NOT EXISTS source_entity_type text,
  ADD COLUMN IF NOT EXISTS resend_id text;

-- Also update existing status check constraint if it exists, or just let it accept 'draft', 'failed', 'delivered', 'bounced', 'opened'
-- In 20260812150000_add_emails_table.sql, status is text DEFAULT 'sent'. There is no CHECK constraint on status, so we are good to use new statuses.
