CREATE TABLE IF NOT EXISTS public.crm_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'Sales Executive',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_team_org_id ON public.crm_team(org_id);

ALTER TABLE public.crm_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view crm_team in their org" ON public.crm_team;
CREATE POLICY "Users can view crm_team in their org"
    ON public.crm_team FOR SELECT
    USING (org_id IN (SELECT get_user_org_id()));

DROP POLICY IF EXISTS "Users can insert crm_team in their org" ON public.crm_team;
CREATE POLICY "Users can insert crm_team in their org"
    ON public.crm_team FOR INSERT
    WITH CHECK (org_id IN (SELECT get_user_org_id()));

DROP POLICY IF EXISTS "Users can update crm_team in their org" ON public.crm_team;
CREATE POLICY "Users can update crm_team in their org"
    ON public.crm_team FOR UPDATE
    USING (org_id IN (SELECT get_user_org_id()));

DROP POLICY IF EXISTS "Users can delete crm_team in their org" ON public.crm_team;
CREATE POLICY "Users can delete crm_team in their org"
    ON public.crm_team FOR DELETE
    USING (org_id IN (SELECT get_user_org_id()));

GRANT ALL ON TABLE public.crm_team TO postgres, service_role, authenticated, anon;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_crm_team_updated_at ON public.crm_team;
CREATE TRIGGER update_crm_team_updated_at
    BEFORE UPDATE ON public.crm_team
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
