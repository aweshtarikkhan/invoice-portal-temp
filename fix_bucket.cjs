
const { createClient } = require('@supabase/supabase-js');
const url = 'https://ewnsxsnjcolhdehrdrhf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bnN4c25qY29saGRlaHJkcmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzA4NDUsImV4cCI6MjA5OTg0Njg0NX0.OIMzCCy7XwHq0-V0jN60SUbslNIL5MINI3EdyR42ojk';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.storage.createBucket('employee-documents', { public: false });
  console.log('Create Bucket:', data, error);
}
run();

