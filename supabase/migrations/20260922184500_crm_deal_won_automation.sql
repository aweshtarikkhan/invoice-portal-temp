-- Migration: Fix and enable handle_deal_won_automation trigger on opportunities
CREATE OR REPLACE FUNCTION handle_deal_won_automation()
RETURNS TRIGGER AS $$
DECLARE
    auto_record RECORD;
    lead_rec RECORD;
    target_client_id UUID;
    new_invoice_id UUID;
    new_inv_number TEXT;
    is_now_won BOOLEAN := false;
    was_already_won BOOLEAN := false;
BEGIN
    -- Check if new stage is a Won stage
    SELECT COALESCE(is_won, false) INTO is_now_won 
    FROM pipeline_stages 
    WHERE id = NEW.stage_id;

    IF TG_OP = 'UPDATE' THEN
        SELECT COALESCE(is_won, false) INTO was_already_won 
        FROM pipeline_stages 
        WHERE id = OLD.stage_id;
    END IF;

    -- Only proceed if transitioning to Won
    IF is_now_won AND (TG_OP = 'INSERT' OR NOT was_already_won OR OLD.stage_id IS DISTINCT FROM NEW.stage_id) THEN
        -- Check if CRM automation is enabled for this org
        SELECT * INTO auto_record 
        FROM crm_automations 
        WHERE org_id = NEW.org_id 
          AND trigger_event = 'deal_won' 
          AND action_type = 'convert_customer_and_invoice' 
          AND is_active = true 
        LIMIT 1;

        IF FOUND THEN
            target_client_id := NEW.client_id;

            -- If no client linked yet, check lead
            IF target_client_id IS NULL AND NEW.lead_id IS NOT NULL THEN
                SELECT * INTO lead_rec FROM leads WHERE id = NEW.lead_id;
                IF FOUND THEN
                    -- Check if client already exists with same email or phone in org
                    SELECT id INTO target_client_id FROM clients 
                    WHERE org_id = NEW.org_id 
                      AND (
                        (email IS NOT NULL AND email = lead_rec.email) 
                        OR (display_name = lead_rec.name)
                      )
                    LIMIT 1;

                    -- If not, create a new client from lead
                    IF target_client_id IS NULL THEN
                        INSERT INTO clients (
                            org_id, display_name, company_name, email, phone, status
                        ) VALUES (
                            NEW.org_id, 
                            COALESCE(lead_rec.name, 'Customer from ' || NEW.title),
                            lead_rec.company,
                            lead_rec.email,
                            lead_rec.phone,
                            'active'
                        ) RETURNING id INTO target_client_id;
                    END IF;
                END IF;
            END IF;

            -- If still no client, create one using the opportunity title
            IF target_client_id IS NULL THEN
                INSERT INTO clients (
                    org_id, display_name, status
                ) VALUES (
                    NEW.org_id,
                    NEW.title,
                    'active'
                ) RETURNING id INTO target_client_id;
            END IF;

            -- Generate sequential invoice number for this org
            SELECT 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD((COALESCE(MAX(SUBSTRING(invoice_number FROM '\d+$')::integer), 0) + 1)::text, 4, '0')
            INTO new_inv_number
            FROM invoices
            WHERE org_id = NEW.org_id AND invoice_number ~ '^INV-\d{4}-\d+$';

            IF new_inv_number IS NULL THEN
                new_inv_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-0001';
            END IF;

            -- Create Draft Invoice
            INSERT INTO invoices (
                org_id, client_id, invoice_number, status, issue_date, due_date,
                currency_code, subtotal, total, balance_due, amount_paid,
                notes
            ) VALUES (
                NEW.org_id,
                target_client_id,
                new_inv_number,
                'draft',
                CURRENT_DATE,
                (CURRENT_DATE + interval '30 days')::date,
                COALESCE(NEW.currency, 'INR'),
                COALESCE(NEW.amount, 0),
                COALESCE(NEW.amount, 0),
                COALESCE(NEW.amount, 0),
                0,
                'Auto-generated from won deal: ' || NEW.title
            ) RETURNING id INTO new_invoice_id;

            -- Create invoice line item
            INSERT INTO invoice_lines (
                invoice_id, name, description, quantity, rate, amount, sort_order
            ) VALUES (
                new_invoice_id,
                NEW.title,
                'Deal Won: ' || NEW.title,
                1,
                COALESCE(NEW.amount, 0),
                COALESCE(NEW.amount, 0),
                0
            );

            -- Link client back to opportunity if missing
            NEW.client_id := target_client_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_won ON opportunities;
CREATE TRIGGER on_deal_won
BEFORE INSERT OR UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION handle_deal_won_automation();
