import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ewnsxsnjcolhdehrdrhf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bnN4c25qY29saGRlaHJkcmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzA4NDUsImV4cCI6MjA5OTg0Njg0NX0.OIMzCCy7XwHq0-V0jN60SUbslNIL5MINI3EdyR42ojk'
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
