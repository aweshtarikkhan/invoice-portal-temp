import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    
    if (!orgId) {
      return new Response(JSON.stringify({ error: "Missing org_id" }), { status: 400 });
    }

    // Verify if Justdial integration is active for this org
    const { data: integration, error: intError } = await supabase
      .from('lead_integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', 'justdial')
      .eq('is_active', true)
      .single();

    if (intError || !integration) {
      return new Response(JSON.stringify({ error: "Justdial integration not active for this org" }), { status: 403 });
    }

    // Parse Justdial payload
    // Note: JD sends data in specific formats, often form-data or JSON. 
    // We assume JSON here, but you might need to adjust based on JD's actual format.
    const payload = await req.json();

    // Map JD payload to our CRM fields
    const leadData = {
      org_id: orgId,
      name: payload.name || payload.lead_name || 'Justdial Lead',
      phone: payload.mobile || payload.phone || null,
      email: payload.email || null,
      company: payload.company || null,
      source: 'Justdial',
      status: 'new',
      notes: `Received via Justdial Webhook. Category: ${payload.category || 'N/A'}, City: ${payload.city || 'N/A'}`
    };

    // Insert into CRM
    const { error: insertError } = await supabase.from('leads').insert(leadData);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, message: "Lead captured successfully" }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
