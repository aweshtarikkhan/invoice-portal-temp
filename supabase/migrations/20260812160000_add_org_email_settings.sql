CREATE TABLE IF NOT EXISTS public.organization_email_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  provider_type text DEFAULT 'default' CHECK (provider_type IN ('default', 'resend_domain', 'smtp', 'gmail')),
  from_name text DEFAULT 'Assay Biz',
  from_email text DEFAULT 'no-reply@satahinvoice.com',
  
  -- Resend Custom Domain fields
  resend_domain_id text,
  domain_name text,
  dns_records jsonb DEFAULT '[]'::jsonb,
  domain_status text DEFAULT 'pending',
  
  -- SMTP fields
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_user text,
  smtp_pass text,
  smtp_secure boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.organization_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email settings for their org" ON public.organization_email_settings
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));

CREATE POLICY "Users can insert email settings for their org" ON public.organization_email_settings
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));

CREATE POLICY "Users can update email settings for their org" ON public.organization_email_settings
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));
