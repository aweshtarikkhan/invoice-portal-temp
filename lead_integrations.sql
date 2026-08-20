CREATE TABLE lead_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('indiamart', 'justdial', 'meta')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, provider)
);

ALTER TABLE lead_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage lead integrations for their org"
ON lead_integrations FOR ALL
USING (org_id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM organizations WHERE owner_id = auth.uid()
));
