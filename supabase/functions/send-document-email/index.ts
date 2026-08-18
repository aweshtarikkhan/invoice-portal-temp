import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://app.assaybiz.com";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  entityId: string;
  entityType: "invoice" | "estimate" | "purchase_order" | "bill";
  recipientEmail: string;
  orgId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const { entityId, entityType, recipientEmail, orgId }: EmailRequest = await req.json();

    if (!entityId || !entityType || !recipientEmail) {
      throw new Error("Missing required parameters");
    }

    let subject = "";
    let message = "";
    
    // Convert underscore to nice text (e.g. purchase_order -> Purchase Order)
    const formattedType = entityType
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    subject = `Your ${formattedType} from Assay Biz`;
    message = `
      <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb;">Your ${formattedType} is Ready</h2>
        <p>Hello,</p>
        <p>Please find attached your recent ${formattedType.toLowerCase()}. You can view or download it by clicking the link below.</p>
        <div style="margin: 30px 0;">
          <a href="${APP_URL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Document</a>
        </div>
        <p>If you have any questions, please reply to this email.</p>
        <p>Best regards,<br>The Assay Biz Team</p>
      </div>
    `;

    // If orgId is provided, route through dispatcher so user settings (SMTP / Custom Domain) are respected
    if (orgId) {
      const dispatcherRes = await fetch(`${supabaseUrl}/functions/v1/send-email-dispatcher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          orgId,
          to: recipientEmail,
          subject,
          html: message,
        }),
      });

      const result = await dispatcherRes.json();
      if (!dispatcherRes.ok) {
        throw new Error(result.error || "Failed to dispatch document email");
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fallback if no orgId provided
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Assay Biz <no-reply@satahinvoice.com>",
        to: [recipientEmail],
        subject: subject,
        html: message,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
