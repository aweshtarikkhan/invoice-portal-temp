import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import nodemailer from "npm:nodemailer@6.9.10";

import handlebars from "npm:handlebars@4.7.8";

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

interface DispatcherRequest {
  orgId: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
  templateVars?: Record<string, any>;
  sourceEntityId?: string;
  sourceEntityType?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orgId, to, subject, html, text, attachments, templateVars, sourceEntityId, sourceEntityType }: DispatcherRequest = await req.json();

    if (!orgId || !to || !subject || !html) {
      throw new Error("Missing required parameters (orgId, to, subject, html)");
    }

    const toArray = Array.isArray(to) ? to : [to];

    // Compile templates if variables are provided
    let finalSubject = subject;
    let finalHtml = html;
    let finalText = text || "See HTML version";

    if (templateVars && Object.keys(templateVars).length > 0) {
      try {
        const subjectTemplate = handlebars.compile(subject);
        finalSubject = subjectTemplate(templateVars);

        const htmlTemplate = handlebars.compile(html);
        finalHtml = htmlTemplate(templateVars);
        
        if (text) {
          const textTemplate = handlebars.compile(text);
          finalText = textTemplate(templateVars);
        }
      } catch (compileErr) {
        console.error("Handlebars compilation error:", compileErr);
      }
    }

    // Fetch org email settings
    const { data: settings } = await supabase
      .from("organization_email_settings")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle();

    const providerType = settings?.provider_type || "default";
    const fromName = settings?.from_name || "Assay Biz";
    const fromEmail = settings?.from_email || "no-reply@satahinvoice.com";

    let sendSuccess = false;
    let senderAddress = `${fromName} <${fromEmail}>`;
    let resendId: string | null = null;

    if (providerType === "smtp" || providerType === "gmail") {
      // Send via custom SMTP or Gmail App Password
      if (!settings?.smtp_host || !settings?.smtp_user || !settings?.smtp_pass) {
        throw new Error("SMTP credentials incomplete. Please check Email Settings.");
      }

      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port || 587,
        secure: settings.smtp_secure ?? false, // true for 465, false for other ports
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_pass,
        },
      });

      senderAddress = `${fromName} <${settings.smtp_user}>`;

      const mailOptions: any = {
        from: senderAddress,
        to: toArray.join(", "),
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, "base64"),
          contentType: a.content_type,
        }));
      }

      await transporter.sendMail(mailOptions);
      sendSuccess = true;

    } else if (providerType === "resend_domain") {
      // Send via Resend using Custom Verified Domain
      if (settings?.domain_status !== "verified") {
        throw new Error(`Custom domain is not verified yet. Current status: ${settings?.domain_status || 'pending'}`);
      }

      senderAddress = `${fromName} <${fromEmail}>`;

      const resendPayload: any = {
        from: senderAddress,
        to: toArray,
        subject: finalSubject,
        html: finalHtml,
      };

      if (attachments && attachments.length > 0) {
        resendPayload.attachments = attachments;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(resendPayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(`Resend API error: ${JSON.stringify(resData)}`);
      }
      sendSuccess = true;
      resendId = resData.id;
    } else {
      // Default: Resend platform email
      senderAddress = "Assay Biz <no-reply@satahinvoice.com>";

      const resendPayload: any = {
        from: senderAddress,
        to: toArray,
        subject: finalSubject,
        html: finalHtml,
      };

      if (attachments && attachments.length > 0) {
        resendPayload.attachments = attachments;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(resendPayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(`Resend API error: ${JSON.stringify(resData)}`);
      }
      sendSuccess = true;
      resendId = resData.id;
    }

    // Log email to DB
    const dbAttachments = attachments?.map((a) => ({
      filename: a.filename,
      content_type: a.content_type,
    })) || [];

    const { error: logError } = await supabase.from("emails").insert({
      org_id: orgId,
      direction: "outbound",
      from_email: senderAddress,
      to_email: toArray.join(", "),
      subject: finalSubject,
      body_text: finalText,
      body_html: finalHtml,
      attachments: dbAttachments,
      status: "sent",
      source_entity_id: sourceEntityId,
      source_entity_type: sourceEntityType,
      resend_id: resendId,
    });

    if (logError) {
      console.error("Failed to log email to database:", logError);
    }

    return new Response(JSON.stringify({ success: true, provider: providerType, sender: senderAddress }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Email Dispatcher error:", error);
    return new Response(JSON.stringify({ error: error.message || error.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
