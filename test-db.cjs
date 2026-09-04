const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ewnsxsnjcolhdehrdrhf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bnN4c25qY29saGRlaHJkcmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzA4NDUsImV4cCI6MjA5OTg0Njg0NX0.OIMzCCy7XwHq0-V0jN60SUbslNIL5MINI3EdyR42ojk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  console.log(data ? Object.keys(data[0]) : error);
}
run();
