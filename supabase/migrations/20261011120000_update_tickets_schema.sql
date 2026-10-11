-- Add new columns for Support Tickets requirements
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_number TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notification_channel TEXT DEFAULT 'both' CHECK (notification_channel IN ('email', 'whatsapp', 'both'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_note TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS closing_comment TEXT;

-- Make client_id nullable as tickets can be for leads only
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;
ALTER TABLE tickets ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE tickets ADD CONSTRAINT tickets_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Add lead_id to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;

-- Update status check constraint to support 'in_progress'
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('open', 'pending', 'in_progress', 'resolved', 'closed'));
