const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL="(.*)"/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);
async function checkPlans() {
  const { data, error } = await supabase.from('plans').select('*');
  console.log(JSON.stringify(data, null, 2));
}
checkPlans();
