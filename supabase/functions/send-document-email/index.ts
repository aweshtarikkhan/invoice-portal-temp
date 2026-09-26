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

    subject = `Your ${formattedType} from Aassay Biz`;
    message = `
      <div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px 28px; text-align: center; border-bottom: 4px solid #e77817;">
              <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px; border: 1px solid rgba(231, 120, 23, 0.25);">
                <img src="https://aassaybiz.com/email-logo.png" alt="Aassay Biz" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
              </div>
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; background-color: rgba(231, 120, 23, 0.2); border: 1px solid #e77817; color: #ffedd5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px;">
                  ${formattedType}
                </span>
              </div>
              <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Your ${formattedType} is Ready</h1>
              <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Everything you need. One smart platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Hello,</p>
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">Please find attached your recent <strong>${formattedType.toLowerCase()}</strong>. You can view or download it directly using the button below:</p>
              <div style="text-align: center; margin: 30px 0 22px 0;">
                <a href="${APP_URL}" target="_blank" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(231, 120, 23, 0.35); letter-spacing: 0.3px;">View Document Online &rarr;</a>
              </div>
              <div style="background-color: #fffaf5; border: 1px dashed #fdba74; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #9a3412; margin-top: 22px;">
                📎 <strong>Document Ready:</strong> Access this document anytime from your portal.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0;">If you have any questions, please reply directly to this email.</p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">Powered by <a href="https://aassaybiz.com" target="_blank" style="color: #1e3a8a; text-decoration: none; font-weight: 700;">Aassay Biz</a> &bull; Everything you need. One smart platform</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Route through central dispatcher so AWS SES or organization SMTP settings are respected
    const effectiveOrgId = orgId || "platform";
    const dispatcherRes = await fetch(`${supabaseUrl}/functions/v1/send-email-dispatcher`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        orgId: effectiveOrgId,
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
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
