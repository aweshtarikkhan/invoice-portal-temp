import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, domainName, domainId, orgId } = await req.json();

    if (!orgId) {
      throw new Error("Missing orgId");
    }

    if (action === "create") {
      if (!domainName) throw new Error("Missing domainName");

      // Register domain in Resend
      const res = await fetch("https://api.resend.com/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({ name: domainName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      // Update org email settings in database
      const { error: dbError } = await supabase
        .from("organization_email_settings")
        .upsert(
          {
            org_id: orgId,
            resend_domain_id: data.id,
            domain_name: data.name,
            dns_records: data.records || [],
            domain_status: data.status || "pending",
            provider_type: "resend_domain",
          },
          { onConflict: "org_id" }
        );

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "verify") {
      if (!domainId) throw new Error("Missing domainId");

      // Trigger verification in Resend
      const verifyRes = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
      });

      const verifyData = await verifyRes.json();
      
      // Get updated domain status from Resend
      const getRes = await fetch(`https://api.resend.com/domains/${domainId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
      });
      const getDomainData = await getRes.json();

      const newStatus = getDomainData.status || "pending";

      const { error: updateError } = await supabase
        .from("organization_email_settings")
        .update({
          domain_status: newStatus,
          dns_records: getDomainData.records || [],
        })
        .eq("org_id", orgId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true, status: newStatus, data: getDomainData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "get") {
      if (!domainId) throw new Error("Missing domainId");

      const res = await fetch(`https://api.resend.com/domains/${domainId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
      });
      const data = await res.json();

      const newStatus = data.status || "pending";

      await supabase
        .from("organization_email_settings")
        .update({
          domain_status: newStatus,
          dns_records: data.records || [],
        })
        .eq("org_id", orgId);

      return new Response(JSON.stringify({ success: true, status: newStatus, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Resend domain error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
