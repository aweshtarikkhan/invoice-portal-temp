CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read messages where they are the sender or receiver
CREATE POLICY "Users can read their own messages" ON public.chat_messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
    );

-- Allow users to insert messages where they are the sender
CREATE POLICY "Users can insert messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
    );

-- Allow users to update messages where they are the receiver (for marking as read)
CREATE POLICY "Users can update their received messages" ON public.chat_messages
    FOR UPDATE USING (
        receiver_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
