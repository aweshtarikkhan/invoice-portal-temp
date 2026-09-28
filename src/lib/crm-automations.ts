import { supabase } from "@/integrations/supabase/client";
import { buildBrandedEmailHtml } from "@/lib/brand-email-template";
import { openWhatsappShare, normalizeWhatsappNumber } from "@/lib/whatsapp";
import { toast } from "sonner";

export interface DealAutomationParams {
  org: any;
  deal: {
    id: string;
    title: string;
    amount?: number | string | null;
    client_id?: string | null;
    lead_id?: string | null;
    [key: string]: any;
  };
  stage?: {
    id?: string;
    name?: string;
    is_won?: boolean;
    [key: string]: any;
  };
}

export interface LeadAutomationParams {
  org: any;
  lead: {
    id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    org_id: string;
    [key: string]: any;
  };
}

export function getDealWonEmailHtml(org: any, deal: any, recipient: { name: string; email?: string }): string {
  const companyName = org?.name || "Assay Biz";
  const amountStr = deal?.amount ? `₹${Number(deal.amount).toLocaleString("en-IN")}` : "Confirmed";

  return buildBrandedEmailHtml({
    logoUrl: org?.logo_url || "https://aassaybiz.com/email-logo.png",
    companyName,
    companyEmail: org?.email || "support@aassaybiz.com",
    badgeText: "DEAL WON · ONBOARDING CONFIRMED",
    title: `Congratulations & Welcome Aboard!`,
    subtitle: `We are thrilled to officially welcome you to ${companyName}`,
    recipientName: recipient.name,
    introText: `Thank you for choosing ${companyName}! We are honored by your trust and partnership. Your deal has been officially confirmed, and our team is already preparing to deliver an outstanding experience.`,
    amountLabel: "Deal Value",
    amountValue: amountStr,
    details: [
      { label: "Deal Title", value: deal.title || "Sales Partnership" },
      { label: "Status", value: "Won & Confirmed", isHighlight: false },
      { label: "Partner Company", value: companyName },
      { label: "Confirmation Date", value: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    ],
    customBodyHtml: `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
          🚀 What happens next?
        </h3>
        <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.7;">
          <li style="margin-bottom: 6px;"><strong>Dedicated Onboarding:</strong> Our account manager will initiate your kickoff within 24 hours.</li>
          <li style="margin-bottom: 6px;"><strong>Documentation & Scope:</strong> All deliverables, milestones, and shared resources are being organized.</li>
          <li><strong>Direct Support Line:</strong> You have priority access to our support desk whenever you need assistance.</li>
        </ol>
      </div>

      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 18px; text-align: center; border: 1px solid #bfdbfe; margin-top: 16px;">
        <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #1e40af;">HAVE QUESTIONS OR NEED IMMEDIATE HELP?</p>
        <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
          Reach out directly to us at <strong>${org?.email || "support@aassaybiz.com"}</strong>
          ${org?.phone ? ` or call <strong>${org.phone}</strong>` : ""}
        </p>
      </div>
    `,
  });
}

export function getDealWonWhatsappText(org: any, deal: any, recipient: { name: string; phone?: string }): string {
  const companyName = org?.name || "Assay Biz";
  const amountStr = deal?.amount ? `₹${Number(deal.amount).toLocaleString("en-IN")}` : "Confirmed";
  const phone = org?.phone || org?.company_phone || "our support desk";

  return `🎉 *Congratulations & Welcome to ${companyName}!*

Dear *${recipient.name || "Valued Client"}*,

We are delighted to confirm that your deal *"${deal?.title || "Partnership"}"* is now officially *Won & Confirmed*! 🚀

💼 *Deal Value:* ${amountStr}
🏢 *Partner:* ${companyName}
📅 *Date:* ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}

We are truly honored to partner with you and are dedicated to your complete success and satisfaction.

👉 *Next Steps:*
• Our onboarding specialist will reach out to you shortly.
• Your dedicated services are now being activated.
• Feel free to reply directly to this WhatsApp message anytime!

📞 *Need immediate assistance?*
Contact: ${phone} | ${org?.email || "support@aassaybiz.com"}

Warm regards,
*Team ${companyName}*`;
}

export function getLeadWelcomeEmailHtml(org: any, lead: any): string {
  const companyName = org?.name || "Assay Biz";
  return buildBrandedEmailHtml({
    logoUrl: org?.logo_url || "https://aassaybiz.com/email-logo.png",
    companyName,
    companyEmail: org?.email || "support@aassaybiz.com",
    badgeText: "CRM WELCOME",
    title: `Welcome, ${lead.name}!`,
    subtitle: `Thank you for connecting with ${companyName}`,
    recipientName: lead.name,
    introText: `Thank you for your interest in our products and services. A dedicated representative from our team will review your requirements and reach out to you shortly.`,
    customBodyHtml: `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #0f172a;">What happens next?</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
          <li>Our team is reviewing your information.</li>
          <li>We will connect via phone or email to discuss how we can help.</li>
          <li>In the meantime, feel free to explore our offerings or reply to this email.</li>
        </ul>
      </div>
    `,
  });
}

export function getLeadWelcomeWhatsappText(org: any, lead: any): string {
  const companyName = org?.name || "Assay Biz";
  return `👋 *Hello ${lead.name || "there"}, Welcome to ${companyName}!*

Thank you for your interest in our solutions. We have successfully registered your inquiry${lead.company ? ` for *${lead.company}*` : ""}.

A dedicated representative from our team will get in touch with you shortly to assist you with the best options tailored to your needs.

In the meantime, feel free to reply directly to this chat if you have any questions!

Warm regards,
*Team ${companyName}*
📞 ${org?.phone || "Customer Support"}`;
}

/**
 * Trigger Deal Won Automations:
 * Checks active crm_automations for deal_won and executes Email and/or WhatsApp
 */
export async function triggerDealWonAutomations({ org, deal, stage }: DealAutomationParams) {
  if (!org?.id || !deal?.id) return;

  try {
    // 1. Check which automations are enabled for deal_won
    const { data: automations, error: autoErr } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("org_id", org.id)
      .eq("trigger_event", "deal_won")
      .eq("is_active", true);

    if (autoErr || !automations || automations.length === 0) return;

    // 2. Resolve client/lead details
    let customerName = "Valued Customer";
    let customerEmail: string | null = null;
    let customerPhone: string | null = null;

    if (deal.client_id) {
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("display_name, email, phone, company_name")
        .eq("id", deal.client_id)
        .maybeSingle();

      if (client) {
        customerName = client.display_name || client.company_name || customerName;
        customerEmail = client.email || null;
        customerPhone = client.phone || null;
      }
    }

    if (!customerEmail && deal.lead_id) {
      const { data: lead } = await (supabase as any)
        .from("leads")
        .select("name, email, phone, company")
        .eq("id", deal.lead_id)
        .maybeSingle();

      if (lead) {
        if (customerName === "Valued Customer") customerName = lead.name || customerName;
        if (!customerEmail) customerEmail = lead.email || null;
        if (!customerPhone) customerPhone = lead.phone || null;
      }
    }

    // 3. Process Email Automation
    const hasEmailAuto = automations.some((a: any) => a.action_type === "send_deal_won_email");
    if (hasEmailAuto && customerEmail) {
      const subject = `🎉 Congratulations & Welcome to ${org.name || "Assay Biz"}! Deal Confirmed: ${deal.title}`;
      const html = getDealWonEmailHtml(org, deal, { name: customerName, email: customerEmail });

      supabase.functions.invoke("send-custom-email", {
        body: { to: customerEmail, subject, html, orgId: org.id },
      }).catch((err: any) => console.error("Error dispatching deal won email:", err));

      // Log in activities table
      await (supabase as any).from("activities").insert({
        org_id: org.id,
        activity_type: "email",
        subject: `Auto Email: Deal Won Onboarding sent to ${customerEmail}`,
        body: `Automated congratulatory email dispatched for deal: "${deal.title}" (Value: ${deal.amount || 0})`,
        opportunity_id: deal.id,
        client_id: deal.client_id || null,
        lead_id: deal.lead_id || null,
        completed_at: new Date().toISOString(),
      });

      toast.success(`Deal Won welcome email sent to ${customerEmail}!`);
    }

    // 4. Process WhatsApp Automation
    const hasWhatsappAuto = automations.some((a: any) => a.action_type === "send_deal_won_whatsapp");
    if (hasWhatsappAuto && customerPhone) {
      const waText = getDealWonWhatsappText(org, deal, { name: customerName, phone: customerPhone });

      // Attempt sending via WhatsApp Service or open wa.me
      await openWhatsappShare({
        orgId: org.id,
        phone: customerPhone,
        message: waText,
      });

      // Log in activities table
      await (supabase as any).from("activities").insert({
        org_id: org.id,
        activity_type: "whatsapp",
        subject: `Auto WhatsApp: Deal Won Message sent to ${customerPhone}`,
        body: waText,
        opportunity_id: deal.id,
        client_id: deal.client_id || null,
        lead_id: deal.lead_id || null,
        completed_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Failed to run deal won automation:", err);
  }
}

/**
 * Trigger Lead Created Automations:
 * Checks active crm_automations for lead_created and executes Email and/or WhatsApp
 */
export async function triggerLeadCreatedAutomations({ org, lead }: LeadAutomationParams) {
  if (!org?.id || !lead) return;

  try {
    const { data: automations } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("org_id", org.id)
      .eq("trigger_event", "lead_created")
      .eq("is_active", true);

    if (!automations || automations.length === 0) return;

    // Email Automation
    const hasEmail = automations.some((a: any) => a.action_type === "send_email");
    if (hasEmail && lead.email) {
      const subject = `Welcome to ${org?.name || "Assay Biz"}, ${lead.name || "Partner"}!`;
      const html = getLeadWelcomeEmailHtml(org, lead);

      supabase.functions.invoke("send-custom-email", {
        body: { to: lead.email, subject, html, orgId: org.id },
      }).catch((err: any) => console.error("Error sending lead welcome email:", err));

      if (lead.id) {
        await (supabase as any).from("activities").insert({
          org_id: org.id,
          activity_type: "email",
          subject: `Auto Email: Welcome Email sent to ${lead.email}`,
          body: `Automated CRM lead welcome email dispatched.`,
          lead_id: lead.id,
          completed_at: new Date().toISOString(),
        });
      }
    }

    // WhatsApp Automation
    const hasWhatsapp = automations.some((a: any) => a.action_type === "send_whatsapp");
    if (hasWhatsapp && lead.phone) {
      const text = getLeadWelcomeWhatsappText(org, lead);
      await openWhatsappShare({
        orgId: org.id,
        phone: lead.phone,
        message: text,
      });

      if (lead.id) {
        await (supabase as any).from("activities").insert({
          org_id: org.id,
          activity_type: "whatsapp",
          subject: `Auto WhatsApp: Greeting sent to ${lead.phone}`,
          body: text,
          lead_id: lead.id,
          completed_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("Failed to run lead created automation:", err);
  }
}
