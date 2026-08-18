import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from("email_templates").select("*").limit(1);
  console.log("email_templates:", data ? "EXISTS" : "MISSING", error ? error.message : "");
  const { data: d2, error: e2 } = await supabase.from("marketing_templates").select("*").limit(1);
  console.log("marketing_templates:", d2 ? "EXISTS" : "MISSING", e2 ? e2.message : "");
}
run();
