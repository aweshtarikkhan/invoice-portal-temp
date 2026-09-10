// Simulate the exact import to find which step fails
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ewnsxsnjcolhdehrdrhf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bnN4c25qY29saGRlaHJkcmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzA4NDUsImV4cCI6MjA5OTg0Njg0NX0.OIMzCCy7XwHq0-V0jN60SUbslNIL5MINI3EdyR42ojk'
);

async function main() {
  // Check if any invoices with IM/ prefix already exist
  const { data: existing, error: fetchErr } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', 'IM/%');
  
  if (fetchErr) {
    console.log('Error fetching:', fetchErr.message);
    return;
  }
  
  console.log(`Found ${existing?.length || 0} existing invoices with IM/ prefix:`);
  if (existing && existing.length > 0) {
    existing.slice(0, 10).forEach(inv => console.log(`  - ${inv.invoice_number}`));
    if (existing.length > 10) console.log(`  ... and ${existing.length - 10} more`);
  }

  // Now try inserting a test invoice to see exact error
  console.log('\n=== TEST INSERT ===');
  const { data, error } = await supabase.from('invoices').insert({
    org_id: '00000000-0000-0000-0000-000000000000', // dummy, just to see error
    client_id: '00000000-0000-0000-0000-000000000000',
    invoice_number: 'TEST_IMPORT_DEBUG_' + Date.now(),
    issue_date: '2026-04-01',
    due_date: '2026-05-01',
    total: 100,
    subtotal: 100,
    balance_due: 100,
    amount_paid: 0,
    status: 'draft',
  }).select('id').single();
  
  if (error) {
    console.log('Test insert error:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error.details);
  } else {
    console.log('Test insert succeeded, cleaning up...');
    await supabase.from('invoices').delete().eq('id', data.id);
  }

  // Also check: what org_ids exist?
  const { data: orgs } = await supabase.from('organizations').select('id, name').limit(5);
  console.log('\nOrganizations:', orgs);
}

main().catch(console.error);
