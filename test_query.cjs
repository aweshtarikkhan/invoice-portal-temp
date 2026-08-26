require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  console.log("Fetching...");
  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(display_name, email, tax_number, phone, address, billing_address, shipping_address), custom_field_values(value, custom_field_definitions(field_name))')
    .limit(1);
  console.log('Error:', error);
  console.log('Data count:', data ? data.length : null);
}
run();
