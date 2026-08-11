import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load from parent dir
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

console.log("URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Fetching user...");
  // Let's just find the latest organization created in the last 1 hour that has no members.
  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (orgErr) {
    console.error("Error fetching orgs:", orgErr);
    return;
  }

  console.log("Latest Orgs:", orgs);

  for (const org of orgs) {
    const { data: members } = await supabase
      .from("organization_members")
      .select("id")
      .eq("org_id", org.id);
      
    if (!members || members.length === 0) {
      console.log(`Org ${org.name} (${org.id}) HAS NO MEMBERS!`);
      // We should assign it to the user. Who is the user? 
      // The user email is probably 'awesh.etpl@gmail.com' or the one from the session.
      // Let's get the user id for awesh.etpl@gmail.com or whatever their email is.
      const { data: users } = await supabase
        .from("profiles")
        .select("id, email, user_id")
        .order("created_at", { ascending: true })
        .limit(10);
        
      console.log("Profiles:", users);
    } else {
      console.log(`Org ${org.name} has ${members.length} members.`);
    }
  }
}

fix();
