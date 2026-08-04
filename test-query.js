import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function testQuery() {
  const { data, error } = await supabase.from('items').select('*, custom_field_values(field_value, custom_field_definitions(field_name))').limit(1);
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS");
  }
}

testQuery();
