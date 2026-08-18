import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from("organization_email_settings").select("domain_status, resend_domain_id, org_id");
  console.log("DB Data:", data);
  console.log("Error:", error);
}
run();
