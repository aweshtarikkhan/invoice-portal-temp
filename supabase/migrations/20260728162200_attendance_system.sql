-- Add location compulsory setting to organizations
ALTER TABLE public.organizations 
ADD COLUMN attendance_location_compulsory BOOLEAN DEFAULT false;

-- Create employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_code TEXT,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    designation TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Employee Policies
CREATE POLICY "Users can view their organization's employees"
    ON public.employees FOR SELECT
    USING (org_id IN (SELECT org_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert employees for their organization"
    ON public.employees FOR INSERT
    WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update their organization's employees"
    ON public.employees FOR UPDATE
    USING (org_id IN (SELECT org_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Employees can view their own profile"
    ON public.employees FOR SELECT
    USING (id = auth.uid());

-- Create attendances table
CREATE TABLE public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_in_location JSONB, -- {lat, lng, accuracy}
    clock_out_location JSONB, -- {lat, lng, accuracy}
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'half-day', 'absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(employee_id, date)
);

-- Enable RLS
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Attendance Policies
CREATE POLICY "Users can view their organization's attendances"
    ON public.attendances FOR SELECT
    USING (org_id IN (SELECT org_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert attendances for their organization"
    ON public.attendances FOR INSERT
    WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update their organization's attendances"
    ON public.attendances FOR UPDATE
    USING (org_id IN (SELECT org_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Employees can view their own attendances"
    ON public.attendances FOR SELECT
    USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert their own attendances"
    ON public.attendances FOR INSERT
    WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update their own attendances"
    ON public.attendances FOR UPDATE
    USING (employee_id = auth.uid());
