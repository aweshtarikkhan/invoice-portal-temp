-- Create WhatsApp Sessions Table
CREATE TABLE whatsapp_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'authenticating', 'connected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(org_id)
);

-- Create WhatsApp Chats Table
CREATE TABLE whatsapp_chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(org_id, client_phone)
);

-- Create WhatsApp Messages Table
CREATE TABLE whatsapp_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('me', 'client')),
  content TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for whatsapp_sessions
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own org's whatsapp sessions" 
  ON whatsapp_sessions FOR SELECT 
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own org's whatsapp sessions" 
  ON whatsapp_sessions FOR UPDATE 
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert their own org's whatsapp sessions" 
  ON whatsapp_sessions FOR INSERT 
  WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

-- RLS for whatsapp_chats
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own org's whatsapp chats" 
  ON whatsapp_chats FOR SELECT 
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert their own org's whatsapp chats" 
  ON whatsapp_chats FOR INSERT 
  WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own org's whatsapp chats" 
  ON whatsapp_chats FOR UPDATE 
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own org's whatsapp chats" 
  ON whatsapp_chats FOR DELETE 
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

-- RLS for whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages for their org's chats" 
  ON whatsapp_messages FOR SELECT 
  USING (chat_id IN (SELECT id FROM whatsapp_chats WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert messages for their org's chats" 
  ON whatsapp_messages FOR INSERT 
  WITH CHECK (chat_id IN (SELECT id FROM whatsapp_chats WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can update messages for their org's chats" 
  ON whatsapp_messages FOR UPDATE 
  USING (chat_id IN (SELECT id FROM whatsapp_chats WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));

-- Trigger to update whatsapp_sessions.updated_at
CREATE TRIGGER update_whatsapp_sessions_updated_at
BEFORE UPDATE ON whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
