-- Support Tickets Table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket Messages Table (for the conversation thread)
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'customer', 'system')),
    sender_id UUID, -- Either an auth.users id or clients id based on sender_type
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets for their org"
ON tickets FOR SELECT
USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can create tickets for their org"
ON tickets FOR INSERT
WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can update tickets for their org"
ON tickets FOR UPDATE
USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can delete tickets for their org"
ON tickets FOR DELETE
USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE owner_id = auth.uid()
));

-- RLS for ticket messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their org's tickets"
ON ticket_messages FOR SELECT
USING (ticket_id IN (
    SELECT id FROM tickets WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
));

CREATE POLICY "Users can create messages for their org's tickets"
ON ticket_messages FOR INSERT
WITH CHECK (ticket_id IN (
    SELECT id FROM tickets WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
));

