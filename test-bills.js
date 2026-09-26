import { createClient } from '@supabase/supabase-js';

const url = "https://api.aassaybiz.com";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.NRbb_rsz4M7sEltMAtEec-k5fMBFhLvJkAz57yjdWmU";

const supabase = createClient(url, key);

async function run() {
  console.log("=== BillsPage style ===");
  const { data: bData, error: bError } = await supabase.from("bills").select("*, vendors(name)");
  console.log("Bills:", bData?.length, "Error:", bError?.message);

  console.log("=== GstReturnsPage style ===");
  const { data: gData, error: gError } = await supabase.from("bills").select("*, vendors(name)").neq("status", "void").neq("status", "draft");
  console.log("GstReturns Bills:", gData?.length, "Error:", gError?.message);
}
run();
