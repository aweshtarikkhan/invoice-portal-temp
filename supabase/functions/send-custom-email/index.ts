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

interface Attachment {
  filename: string;
  content: string; // base64
  content_type?: string;
}

interface CustomEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Attachment[];
  orgId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, attachments, orgId }: CustomEmailRequest = await req.json();

    if (!to || !subject || !html || !orgId) {
      throw new Error("Missing required parameters");
    }

    // Call the central dispatcher function
    const dispatcherRes = await fetch(`${supabaseUrl}/functions/v1/send-email-dispatcher`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        orgId,
        to,
        subject,
        html,
        attachments,
      }),
    });

    const result = await dispatcherRes.json();
    if (!dispatcherRes.ok) {
      throw new Error(result.error || "Failed to dispatch email");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending custom email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
