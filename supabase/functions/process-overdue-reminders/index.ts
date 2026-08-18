import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_SERVICE_URL = Deno.env.get("WHATSAPP_SERVICE_URL") || "http://host.docker.internal:3010/api";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function normalizeWhatsappNumber(raw?: string | null, defaultCC = "91"): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return defaultCC + digits;
  return digits;
}

const DEFAULT_INVOICE_TEMPLATE = "Hi {{client_name}},\n\nThis is a friendly reminder that your invoice {{document_no}} for the amount of {{total}} was due on {{due_date}} and is currently overdue. \n\nYou can view or download it here: {{portal_link}}\n\nRegards,\n{{org_name}}";

export function compileWhatsappMessage(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value === null || value === undefined ? '' : String(value));
  }
  result = result.replace(/{{[^}]+}}/g, '');
  return result;
}

const fmt = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);

serve(async (req) => {
  try {
    // Verify authorization if triggered via HTTP (e.g. pg_net cron)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 1. Fetch all orgs with automation enabled
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, name, currency_code")
      .eq("automate_overdue_reminders", true);

    if (orgsError) throw orgsError;
    if (!orgs || orgs.length === 0) {
      return new Response("No organizations with automation enabled", { status: 200 });
    }

    const orgIds = orgs.map(o => o.id);

    // 2. Fetch all overdue invoices that haven't had a reminder sent yet
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (*),
        invoice_lines (*)
      `)
      .in("org_id", orgIds)
      .eq("status", "sent")
      .is("last_reminder_sent_at", null)
      .lt("due_date", new Date().toISOString().split('T')[0]); // Due date is in the past

    if (invoicesError) throw invoicesError;

    let sentCount = 0;

    for (const invoice of invoices || []) {
      const org = orgs.find(o => o.id === invoice.org_id);
      if (!org) continue;

      const client = invoice.clients;
      if (!client) continue;

      // Only process if unpaid (total > amount_paid)
      if (Number(invoice.total) <= Number(invoice.amount_paid)) {
        continue;
      }

      let emailSent = false;
      let whatsappSent = false;

      // Ensure portal token exists
      let token = "";
      const { data: existingToken } = await supabase.from("portal_tokens").select("token").eq("entity_type", "invoice").eq("entity_id", invoice.id).maybeSingle();
      if (existingToken?.token) {
        token = existingToken.token;
      } else {
        const { data: newToken } = await supabase.from("portal_tokens").insert({ org_id: org.id, entity_type: "invoice", entity_id: invoice.id }).select("token").single();
        if (newToken) token = newToken.token;
      }
      
      const portalLink = token ? `${Deno.env.get("PUBLIC_APP_URL") || "https://app.assaybiz.com"}/portal/${token}` : "";

      // Send Email
      if (client.email) {
        try {
          const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-document-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              orgId: org.id,
              entityId: invoice.id,
              entityType: "invoice",
              recipientEmail: client.email
            }),
          });
          if (emailRes.ok) emailSent = true;
        } catch (e) {
          console.error(`Failed to send email for invoice ${invoice.id}`, e);
        }
      }

      // Send WhatsApp
      if (client.phone) {
        try {
          // Fetch template
          const { data: tmplData } = await supabase
            .from('whatsapp_templates')
            .select('content')
            .eq('org_id', org.id)
            .eq('type', 'invoice')
            .eq('is_default', true)
            .maybeSingle();

          const template = tmplData?.content || DEFAULT_INVOICE_TEMPLATE;

          const txt = compileWhatsappMessage(template, {
            client_name: client.display_name,
            document_no: invoice.invoice_number,
            total: fmt(Number(invoice.total), org.currency_code),
            due_date: invoice.due_date || "",
            subtotal: fmt(Number(invoice.subtotal), org.currency_code),
            tax: fmt(Number(invoice.total_tax), org.currency_code),
            discount: fmt(Number(invoice.total_discount), org.currency_code),
            tds: invoice.tds_amount ? fmt(Number(invoice.tds_amount), org.currency_code) : "0.00",
            adjustment: invoice.adjustment ? fmt(Number(invoice.adjustment), org.currency_code) : "0.00",
            items: invoice.invoice_lines.map((l: any) => `- ${l.name || 'Item'} x${l.quantity}`).join('\n'),
            portal_link: portalLink,
            org_name: org.name
          });

          const waRes = await fetch(`${WHATSAPP_SERVICE_URL}/message/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              org_id: org.id,
              phone: normalizeWhatsappNumber(client.phone),
              text: txt,
            })
          });

          if (waRes.ok) whatsappSent = true;
        } catch (e) {
          console.error(`Failed to send WhatsApp for invoice ${invoice.id}`, e);
        }
      }

      // Update invoice if any reminder was sent
      if (emailSent || whatsappSent) {
        await supabase
          .from("invoices")
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq("id", invoice.id);
        sentCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, processed: sentCount }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error processing reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
