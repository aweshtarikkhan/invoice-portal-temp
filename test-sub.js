import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://api.aassaybiz.com'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.NRbb_rsz4M7sEltMAtEec-k5fMBFhLvJkAz57yjdWmU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Fetching get_platform_dashboard_data...");
  const { data: dashData, error: dashError } = await supabase.rpc('get_platform_dashboard_data');
  if (dashError) {
    console.error("Dashboard error:", dashError);
  } else {
    console.log("Dashboard data:", JSON.stringify(dashData.organizations[0].subscription, null, 2));
  }

  console.log("Fetching organization_subscriptions directly...");
  const { data: subData, error: subError } = await supabase
    .from('organization_subscriptions')
    .select('*');
  if (subError) {
    console.error("Direct fetch error:", subError);
  } else {
    console.log("Direct fetch data:", subData);
  }
}

test();
