import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async () => {
  try {
    // 1. Fetch all active IndiaMart configurations
    const { data: configs, error: configError } = await supabase
      .from('lead_integrations')
      .select('*')
      .eq('provider', 'indiamart')
      .eq('is_active', true);

    if (configError) throw configError;
    if (!configs || configs.length === 0) {
      return new Response("No active IndiaMart integrations found", { status: 200 });
    }

    let processedCount = 0;

    // 2. Loop through each company's config
    for (const integration of configs) {
      const { mobile, crm_key } = integration.config;
      
      if (!mobile || !crm_key) continue;

      // 3. Fetch from IndiaMart API
      // Standard IndiaMart API endpoint
      const imUrl = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${crm_key}&start_time=${getPastTime(15)}&end_time=${getCurrentTime()}`;
      
      try {
        const response = await fetch(imUrl);
        const data = await response.json();

        // Check if JD returned leads (assuming standard IM response structure)
        if (data && data.CODE === 200 && data.RESPONSE && data.RESPONSE.length > 0) {
          
          for (const item of data.RESPONSE) {
            // Map IndiaMart lead to our CRM
            const leadData = {
              org_id: integration.org_id,
              name: item.SENDER_NAME || 'IndiaMart Lead',
              phone: item.SENDER_MOBILE || null,
              email: item.SENDER_EMAIL || null,
              company: item.SENDER_COMPANY || null,
              source: 'IndiaMart',
              status: 'new',
              notes: `Product: ${item.SUBJECT}\nMessage: ${item.QUERY_MESSAGE}`
            };

            // Avoid duplicates (simplified check by phone)
            const { data: existing } = await supabase
              .from('leads')
              .select('id')
              .eq('org_id', integration.org_id)
              .eq('phone', leadData.phone)
              .single();

            if (!existing) {
              await supabase.from('leads').insert(leadData);
              processedCount++;
            }
          }
        }
        
        // Update last sync time
        await supabase
          .from('lead_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);

      } catch (err) {
        console.error(`Error processing IndiaMart for org ${integration.org_id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Helper functions for IndiaMart time format (DD-MMM-YYYY HH:mm:ss)
function getCurrentTime() {
  // Mock function for current time formatting
  return encodeURIComponent("20-Aug-2026 12:00:00");
}
function getPastTime(minutes: number) {
  // Mock function for past time formatting
  return encodeURIComponent("20-Aug-2026 11:45:00"); 
}
