CREATE TABLE crm_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN ('lead_created', 'deal_won', 'ticket_created')),
    action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'convert_customer_and_invoice', 'send_whatsapp')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crm_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view crm_automations for their org"
ON crm_automations FOR SELECT
USING (org_id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can manage crm_automations for their org"
ON crm_automations FOR ALL
USING (org_id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE owner_id = auth.uid()
));

-- Function to handle auto-convert deal to customer
CREATE OR REPLACE FUNCTION handle_deal_won_automation()
RETURNS TRIGGER AS $$
DECLARE
    auto_record RECORD;
    new_client_id UUID;
BEGIN
    IF NEW.status = 'won' AND OLD.status != 'won' THEN
        -- Check if automation is active
        SELECT * INTO auto_record FROM crm_automations 
        WHERE org_id = NEW.org_id AND trigger_event = 'deal_won' AND action_type = 'convert_customer_and_invoice' AND is_active = true LIMIT 1;
        
        IF FOUND THEN
            -- Create customer
            INSERT INTO clients (org_id, display_name, email, phone, created_by)
            VALUES (NEW.org_id, NEW.name, NULL, NULL, NEW.owner_id)
            RETURNING id INTO new_client_id;
            
            -- Create draft invoice
            INSERT INTO invoices (org_id, client_id, invoice_number, status, issue_date, subtotal, total, created_by)
            VALUES (NEW.org_id, new_client_id, 'AUTO-' || substr(md5(random()::text), 1, 6), 'draft', CURRENT_DATE, NEW.amount, NEW.amount, NEW.owner_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_deal_won
AFTER UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION handle_deal_won_automation();
