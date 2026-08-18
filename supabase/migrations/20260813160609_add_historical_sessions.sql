ALTER TABLE whatsapp_chats ADD COLUMN IF NOT EXISTS archived_session TEXT;

ALTER TABLE whatsapp_chats DROP CONSTRAINT IF EXISTS whatsapp_chats_org_id_client_phone_key;

-- We only want unique active chats. Historical chats can have duplicate phone numbers.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_chat ON whatsapp_chats(org_id, client_phone) WHERE archived_session IS NULL;

-- Function to archive active chats when a session is disconnected
CREATE OR REPLACE FUNCTION archive_whatsapp_session(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  v_session_name TEXT;
  v_count INT;
BEGIN
  -- Count how many distinct historical sessions exist for this org
  SELECT COUNT(DISTINCT archived_session) INTO v_count FROM whatsapp_chats WHERE org_id = p_org_id AND archived_session IS NOT NULL;
  
  -- Create a name like 'Session 1 (12-08-2026)'
  v_session_name := 'Session ' || (v_count + 1) || ' (' || to_char(now(), 'DD-MM-YYYY') || ')';
  
  -- Update all current active chats to this historical session
  UPDATE whatsapp_chats SET archived_session = v_session_name WHERE org_id = p_org_id AND archived_session IS NULL;
END;
$$ LANGUAGE plpgsql;
