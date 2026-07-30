require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Checking organization_members...");
  const { data, error } = await supabase.from('organization_members').select('*');
  console.log("Data:", data);
  if (error) console.error("Error:", error);
}

test();
