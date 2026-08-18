CREATE TABLE IF NOT EXISTS public.emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  direction text CHECK (direction IN ('inbound', 'outbound')),
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'sent',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emails for their org" ON public.emails
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));

CREATE POLICY "Users can insert emails for their org" ON public.emails
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));
  
CREATE POLICY "Users can update emails for their org" ON public.emails
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid() OR user_id = auth.uid()
  ));

-- Storage Bucket for email attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email_attachments', 'email_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Users can upload email attachments for their org" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'email_attachments' AND 
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE org_id = (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Users can view email attachments for their org" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'email_attachments' AND 
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE org_id = (storage.foldername(name))[1]::uuid)
);
