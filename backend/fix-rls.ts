import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const query = `
    CREATE POLICY "holidays_employee_select" ON public.holidays FOR SELECT TO authenticated USING (
        org_id IN (SELECT org_id FROM public.employees WHERE auth_user_id = auth.uid())
    );
  `;
  const { error } = await supabaseAdmin.rpc('exec_sql', { query_text: query }).catch(console.error);
  if (error) {
    console.error(error);
  } else {
    console.log("Success");
  }
}
run();
