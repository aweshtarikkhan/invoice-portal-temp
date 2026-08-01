-- Add username to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS username TEXT;

-- Generate unique usernames for existing employees if username is null
UPDATE public.employees
SET username = lower(regexp_replace(name, '\s+', '', 'g')) || '_' || floor(random() * 1000)::text
WHERE username IS NULL;

-- Make username unique per organization
ALTER TABLE public.employees ADD CONSTRAINT uq_emp_username_org UNIQUE (org_id, username);

-- Create chat_groups table
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS public.chat_group_members (
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (group_id, employee_id)
);

-- Modify chat_messages for group support
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Enable RLS for new tables
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- Group RLS Policies
CREATE POLICY "Users can view groups in their org" ON public.chat_groups
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM public.employees WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create groups in their org" ON public.chat_groups
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM public.employees WHERE auth_user_id = auth.uid()
        )
    );

-- Group Members RLS Policies
CREATE POLICY "Users can view group members in their org" ON public.chat_group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_groups g
            JOIN public.employees e ON g.org_id = e.org_id
            WHERE g.id = chat_group_members.group_id AND e.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add group members in their org" ON public.chat_group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_groups g
            JOIN public.employees e ON g.org_id = e.org_id
            WHERE g.id = chat_group_members.group_id AND e.auth_user_id = auth.uid()
        )
    );

-- Drop old chat_messages policies to recreate them for group support
DROP POLICY IF EXISTS "Users can read their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.chat_messages;

-- Recreate Chat Messages Policies
CREATE POLICY "Users can read messages they are part of" ON public.chat_messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid()) OR
        group_id IN (
            SELECT group_id FROM public.chat_group_members 
            WHERE employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can update received or group messages" ON public.chat_messages
    FOR UPDATE USING (
        receiver_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid()) OR
        group_id IN (
            SELECT group_id FROM public.chat_group_members 
            WHERE employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
        )
    );

-- Realtime Setup (ensure tables are in publication)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_group_members;
