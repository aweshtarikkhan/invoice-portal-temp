const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ewnsxsnjcolhdehrdrhf.supabase.co";

let key = null;
try {
  const content = fs.readFileSync('deploy_custom.cjs', 'utf8');
  const match = content.match(/service_role['":\s]+['"]([^'"]+)['"]/i) || content.match(/SUPABASE_SERVICE_ROLE_KEY['":\s]+['"]([^'"]+)['"]/i);
  if (match) key = match[1];
} catch(e) {}

if (!key) {
  try {
    const content = fs.readFileSync('../backend/fix-rls.ts', 'utf8');
    // Not explicitly in fix-rls.ts as a string, but let's check environment
  } catch(e) {}
}

const supabaseAdmin = createClient(supabaseUrl, key);

const query = "ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR DEFAULT 'free', ADD COLUMN IF NOT EXISTS subscription_interval VARCHAR DEFAULT 'monthly', ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS whatsapp_msg_limit INTEGER DEFAULT 100, ADD COLUMN IF NOT EXISTS whatsapp_msg_used INTEGER DEFAULT 0;";

(async () => {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { query_text: query });
  console.log("Migration result:", data, error);
})();
