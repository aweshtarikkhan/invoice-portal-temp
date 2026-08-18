-- Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- invoice, estimate, po, payment
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, type)
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_templates
CREATE POLICY "Users can view their organization's whatsapp templates"
    ON public.whatsapp_templates
    FOR SELECT
    USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their organization's whatsapp templates"
    ON public.whatsapp_templates
    FOR INSERT
    WITH CHECK (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their organization's whatsapp templates"
    ON public.whatsapp_templates
    FOR UPDATE
    USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()))
    WITH CHECK (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their organization's whatsapp templates"
    ON public.whatsapp_templates
    FOR DELETE
    USING (org_id IN (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Insert default templates trigger function
CREATE OR REPLACE FUNCTION public.create_default_whatsapp_templates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.whatsapp_templates (org_id, type, content)
    VALUES 
        (NEW.id, 'invoice', 'Hello [Client Name],
        
Please find attached your invoice [Invoice Number] for [Total Amount].
Due date: [Due Date]

View & pay online: [Portal Link]

Thank you for your business!
[Company Name]'),
        (NEW.id, 'estimate', 'Hello [Client Name],
        
Please find attached our estimate [Estimate Number] for [Total Amount].

View online: [Portal Link]

Let us know if you have any questions!
[Company Name]'),
        (NEW.id, 'payment', 'Hello [Client Name],
        
Thank you for your payment of [Total Amount] towards invoice [Invoice Number].

Your payment has been successfully recorded.

[Company Name]'),
        (NEW.id, 'po', 'Hello,
        
Please find attached our Purchase Order [PO Number] for [Total Amount].

Let us know when we can expect delivery.

Thank you,
[Company Name]');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default templates when an organization is created
DROP TRIGGER IF EXISTS on_organization_created_whatsapp_templates ON public.organizations;
CREATE TRIGGER on_organization_created_whatsapp_templates
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_whatsapp_templates();

-- Backfill existing organizations with default templates
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations LOOP
        INSERT INTO public.whatsapp_templates (org_id, type, content)
        VALUES 
            (org_record.id, 'invoice', 'Hello [Client Name],
            
Please find attached your invoice [Invoice Number] for [Total Amount].
Due date: [Due Date]

View & pay online: [Portal Link]

Thank you for your business!
[Company Name]'),
            (org_record.id, 'estimate', 'Hello [Client Name],
            
Please find attached our estimate [Estimate Number] for [Total Amount].

View online: [Portal Link]

Let us know if you have any questions!
[Company Name]'),
            (org_record.id, 'payment', 'Hello [Client Name],
            
Thank you for your payment of [Total Amount] towards invoice [Invoice Number].

Your payment has been successfully recorded.

[Company Name]'),
            (org_record.id, 'po', 'Hello,
            
Please find attached our Purchase Order [PO Number] for [Total Amount].

Let us know when we can expect delivery.

Thank you,
[Company Name]')
        ON CONFLICT (org_id, type) DO NOTHING;
    END LOOP;
END;
$$;

-- Setup Storage bucket for whatsapp documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('whatsapp_documents', 'whatsapp_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'whatsapp_documents');

CREATE POLICY "Authenticated users can upload whatsapp documents" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'whatsapp_documents');
