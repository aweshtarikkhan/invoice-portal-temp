import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

// Make sure to use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from("organization_email_settings").select("domain_status, resend_domain_id, domain_name, org_id");
  console.log("DB Data:", data);
  if (error) console.error("Error:", error);
}
run();
