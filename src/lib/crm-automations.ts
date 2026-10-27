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

/**
 * Dynamic Task Due Reminder — WhatsApp Message Generator
 * Captures all fields: Task Title, Type, Priority, Due Date & Time, Assignee, Lead, Deal, Notes, Org
 */
export function getTaskDueWhatsappText(
  org: any,
  task: any,
  assignee: { name: string; phone?: string; role?: string }
): string {
  const companyName = org?.name || "Assay Biz";
  const dueDateStr = task.due_at
    ? new Date(task.due_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Immediate";
  const priority = task.priority || "Medium";
  const taskType = task.activity_type || "Follow-up";
  const leadInfo = task.leadName || task.lead?.name;
  const leadCompany = task.leadCompany || task.lead?.company;
  const dealTitle = task.dealTitle || task.opportunity?.title;

  return `⏰ *TASK DUE REMINDER — SALES ACTION REQUIRED*

Hi *${assignee.name || "Sales Executive"}*${assignee.role ? ` (${assignee.role})` : ""},

Your scheduled CRM task is *Due Now / Approaching Deadline*:

📌 *Task Title:* ${task.subject || task.title || "CRM Task"}
🏷️ *Task Type:* ${taskType}
⚡ *Priority:* ${priority}
⏰ *Due Date & Time:* ${dueDateStr}
${leadInfo ? `👤 *Customer / Lead:* ${leadInfo}${leadCompany ? ` (${leadCompany})` : ""}\n` : ""}${dealTitle ? `💼 *Opportunity:* ${dealTitle}\n` : ""}${task.body ? `📝 *Notes:* ${task.body}\n` : ""}🏢 *Organization:* ${companyName}

👉 *Action Needed:* Please connect with the client or execute this task promptly, and update status in your CRM dashboard.`;
}

/**
 * Dynamic Task Due Reminder — Branded Email HTML Generator
 * Captures all fields in high-impact branded table layout
 */
export function getTaskDueEmailHtml(
  org: any,
  task: any,
  assignee: { name: string; email?: string; role?: string }
): string {
  const companyName = org?.name || "Assay Biz";
  const dueDateStr = task.due_at
    ? new Date(task.due_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Immediate";
  const priority = task.priority || "Medium";
  const taskType = task.activity_type || "Follow-up";
  const leadInfo = task.leadName || task.lead?.name;
  const leadCompany = task.leadCompany || task.lead?.company;
  const dealTitle = task.dealTitle || task.opportunity?.title;

  return buildBrandedEmailHtml({
    logoUrl: org?.logo_url || "https://aassaybiz.com/email-logo.png",
    companyName,
    companyEmail: org?.email || "support@aassaybiz.com",
    badgeText: "TASK DUE DEADLINE · SALES ACTION",
    title: `Task Due Reminder: ${task.subject || task.title || "CRM Task"}`,
    subtitle: `Scheduled task has reached its due deadline in ${companyName}`,
    recipientName: assignee.name,
    introText: `This is an automated notification that an assigned sales task has reached or is approaching its deadline.`,
    details: [
      { label: "Task Title", value: task.subject || task.title || "Sales Task", isHighlight: true },
      { label: "Task Type", value: taskType },
      { label: "Priority", value: priority, isHighlight: priority === "Urgent" || priority === "High" },
      { label: "Due Date & Time", value: dueDateStr, isHighlight: true },
      ...(leadInfo ? [{ label: "Related Lead", value: `${leadInfo}${leadCompany ? ` (${leadCompany})` : ""}` }] : []),
      ...(dealTitle ? [{ label: "Related Deal", value: dealTitle }] : []),
    ],
    customBodyHtml: `
      ${task.body ? `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Task Description / Instructions:</p>
          <p style="margin: 0; font-size: 14px; color: #0f172a; line-height: 1.5;">${task.body}</p>
        </div>
      ` : ""}
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-top: 16px; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
          Please log into your CRM Dashboard -> Calendar / Activities to complete this task and update status.
        </p>
      </div>
    `,
  });
}

/**
 * Dynamic Custom Reminder — WhatsApp Message Generator
 * Captures all fields: Custom Reminder Timestamp, Due Date, Type, Priority, Lead, Deal, Notes, Org
 */
export function getTaskCustomReminderWhatsappText(
  org: any,
  task: any,
  assignee: { name: string; phone?: string; role?: string }
): string {
  const companyName = org?.name || "Assay Biz";
  const dueDateStr = task.due_at
    ? new Date(task.due_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Immediate";
  const customReminderStr = task.custom_reminder_at || (task.reminder_type?.startsWith("custom:") ? task.reminder_type.slice(7) : null);
  const reminderTimeFormatted = customReminderStr
    ? new Date(customReminderStr).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Scheduled Reminder";

  const priority = task.priority || "Medium";
  const taskType = task.activity_type || "Follow-up";
  const leadInfo = task.leadName || task.lead?.name;
  const leadCompany = task.leadCompany || task.lead?.company;
  const dealTitle = task.dealTitle || task.opportunity?.title;

  return `🔔 *CUSTOM TASK REMINDER — AUTO NOTIFICATION*

Hi *${assignee.name || "Sales Executive"}*${assignee.role ? ` (${assignee.role})` : ""},

This is your scheduled *Custom Reminder* for the following CRM task:

📌 *Task Title:* ${task.subject || task.title || "CRM Task"}
🏷️ *Task Type:* ${taskType}
⚡ *Priority:* ${priority}
⏰ *Task Due Date:* ${dueDateStr}
⏱️ *Reminder Scheduled For:* ${reminderTimeFormatted}
${leadInfo ? `👤 *Customer / Lead:* ${leadInfo}${leadCompany ? ` (${leadCompany})` : ""}\n` : ""}${dealTitle ? `💼 *Opportunity / Deal:* ${dealTitle}\n` : ""}${task.body ? `📝 *Notes & Instructions:* ${task.body}\n` : ""}🏢 *Organization:* ${companyName}

👉 *Status:* ${task.status || "Pending"}
Please check your CRM dashboard or Calendar to execute this task before the due time.`;
}

/**
 * Dynamic Custom Reminder — Branded Email HTML Generator
 * Captures all updated fields dynamically
 */
export function getTaskCustomReminderEmailHtml(
  org: any,
  task: any,
  assignee: { name: string; email?: string; role?: string }
): string {
  const companyName = org?.name || "Assay Biz";
  const dueDateStr = task.due_at
    ? new Date(task.due_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Immediate";
  const customReminderStr = task.custom_reminder_at || (task.reminder_type?.startsWith("custom:") ? task.reminder_type.slice(7) : null);
  const reminderTimeFormatted = customReminderStr
    ? new Date(customReminderStr).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Scheduled Reminder";

  const priority = task.priority || "Medium";
  const taskType = task.activity_type || "Follow-up";
  const leadInfo = task.leadName || task.lead?.name;
  const leadCompany = task.leadCompany || task.lead?.company;
  const dealTitle = task.dealTitle || task.opportunity?.title;

  return buildBrandedEmailHtml({
    logoUrl: org?.logo_url || "https://aassaybiz.com/email-logo.png",
    companyName,
    companyEmail: org?.email || "support@aassaybiz.com",
    badgeText: "CUSTOM REMINDER · SALES TASK",
    title: `Custom Task Reminder: ${task.subject || task.title || "CRM Task"}`,
    subtitle: `Scheduled custom reminder alert triggered for ${assignee.name}`,
    recipientName: assignee.name,
    introText: `This automated custom reminder was scheduled for ${reminderTimeFormatted} to alert you about an upcoming task due on ${dueDateStr}.`,
    details: [
      { label: "Task Title", value: task.subject || task.title || "Sales Task", isHighlight: true },
      { label: "Task Type", value: taskType },
      { label: "Priority", value: priority, isHighlight: priority === "Urgent" || priority === "High" },
      { label: "Due Date & Time", value: dueDateStr, isHighlight: true },
      { label: "Custom Reminder At", value: reminderTimeFormatted },
      ...(leadInfo ? [{ label: "Related Lead", value: `${leadInfo}${leadCompany ? ` (${leadCompany})` : ""}` }] : []),
      ...(dealTitle ? [{ label: "Related Deal", value: dealTitle }] : []),
    ],
    customBodyHtml: `
      ${task.body ? `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Task Description / Instructions:</p>
          <p style="margin: 0; font-size: 14px; color: #0f172a; line-height: 1.5;">${task.body}</p>
        </div>
      ` : ""}
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-top: 16px; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
          Log into your CRM Dashboard -> Calendar / Activities to review details and update task status once completed.
        </p>
      </div>
    `,
  });
}

/**
 * Task Activity Reminder & Assignment Notification
 * Dispatches WhatsApp and/or Email to the assigned sales executive
 * Checks crm_automations settings and auto-captures all dynamic fields
 */
export async function sendActivityReminderNotification({
  org,
  activity,
  assignee,
}: {
  org: any;
  activity: any;
  assignee: any;
}) {
  if (!assignee || !org?.id) return;

  try {
    // Check automations configuration from crm_automations table
    const { data: automations } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("org_id", org.id);

    const isCustom = activity.reminder_type?.startsWith("custom:");
    
    // Check whether WhatsApp & Email automations are enabled (defaults to true if not explicitly disabled)
    const checkActive = (action: string) => {
      if (!automations || automations.length === 0) return true;
      const found = automations.find((a: any) => a.action_type === action);
      return found ? found.is_active : true;
    };

    const allowWhatsapp = isCustom
      ? checkActive("send_custom_reminder_whatsapp")
      : checkActive("send_task_due_whatsapp");

    const allowEmail = isCustom
      ? checkActive("send_custom_reminder_email")
      : checkActive("send_task_due_email");

    const taskTitle = activity.subject || activity.title || "CRM Task";

    // 1. WhatsApp Dispatch
    if (allowWhatsapp && assignee.phone) {
      const waText = isCustom
        ? getTaskCustomReminderWhatsappText(org, activity, assignee)
        : getTaskDueWhatsappText(org, activity, assignee);

      openWhatsappShare({
        orgId: org.id,
        phone: assignee.phone,
        message: waText,
      }).catch((err) => console.error("Error sending activity WA reminder:", err));
    }

    // 2. Email Dispatch
    if (allowEmail && assignee.email) {
      const subject = isCustom
        ? `🔔 Custom Task Reminder: ${taskTitle} (${activity.priority || "Medium"} Priority)`
        : `⏰ Task Due Reminder: ${taskTitle} (${activity.priority || "Medium"} Priority)`;

      const html = isCustom
        ? getTaskCustomReminderEmailHtml(org, activity, assignee)
        : getTaskDueEmailHtml(org, activity, assignee);

      supabase.functions.invoke("send-custom-email", {
        body: { to: assignee.email, subject, html, orgId: org.id },
      }).catch((err) => console.error("Error sending activity Email reminder:", err));
    }
  } catch (err) {
    console.error("Error executing task reminder automation:", err);
  }
}

/**
 * Calculates the exact trigger timestamp for a task reminder
 * - "10_min" -> due_at - 10 minutes
 * - "1_hour" -> due_at - 60 minutes
 * - "1_day"  -> due_at - 24 hours
 * - "custom:<ISO>" -> exact custom date & time selected by user
 */
export function getScheduledReminderTime(activity: {
  due_at?: string | null;
  reminder_type?: string | null;
}): Date | null {
  if (!activity.due_at || !activity.reminder_type || activity.reminder_type === "none") {
    return null;
  }

  // Custom reminder timestamp
  if (activity.reminder_type.startsWith("custom:")) {
    const customIso = activity.reminder_type.slice(7);
    const parsed = new Date(customIso);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const due = new Date(activity.due_at);
  if (isNaN(due.getTime())) return null;

  if (activity.reminder_type === "10_min") {
    return new Date(due.getTime() - 10 * 60 * 1000);
  }
  if (activity.reminder_type === "1_hour") {
    return new Date(due.getTime() - 60 * 60 * 1000);
  }
  if (activity.reminder_type === "1_day") {
    return new Date(due.getTime() - 24 * 60 * 60 * 1000);
  }

  return null;
}

/**
 * Check and process active due/custom task reminders
 * Runs periodically to dispatch WhatsApp & Email alerts when the scheduled reminder time arrives
 */
export async function checkAndProcessDueTaskReminders(org: any) {
  if (!org?.id) return;

  try {
    const now = new Date();
    // Fetch pending activities with a reminder set and an assigned executive
    const { data: activities, error } = await (supabase as any)
      .from("activities")
      .select("*, leads(name, company), opportunities(title)")
      .eq("org_id", org.id)
      .neq("reminder_type", "none")
      .not("owner_id", "is", null)
      .neq("status", "Completed")
      .is("completed_at", null)
      .limit(50);

    if (error || !activities || activities.length === 0) return;

    // Fetch team members
    const { data: team } = await supabase
      .from("crm_team")
      .select("*")
      .eq("org_id", org.id)
      .eq("is_active", true);

    const teamMap = new Map<string, any>();
    (team || []).forEach((m: any) => teamMap.set(m.id, m));

    for (const act of activities) {
      const scheduledTime = getScheduledReminderTime(act);
      if (!scheduledTime) continue;

      // Check if scheduled time has arrived and is within past 2 hours
      const diffMs = now.getTime() - scheduledTime.getTime();
      const isDue = diffMs >= 0 && diffMs <= 2 * 60 * 60 * 1000;

      if (isDue) {
        // Prevent duplicate alerts in localStorage
        const storageKey = `crm_reminder_sent_${act.id}_${act.reminder_type}`;
        if (localStorage.getItem(storageKey)) continue;

        const assignee = teamMap.get(act.owner_id);
        if (assignee) {
          await sendActivityReminderNotification({
            org,
            activity: act,
            assignee,
          });
          localStorage.setItem(storageKey, new Date().toISOString());
        }
      }
    }
  } catch (err) {
    console.error("Error in checkAndProcessDueTaskReminders:", err);
  }
}

export interface LeadStatusItem {
  v: string;
  l: string;
  cls: string;
  value?: string;
  label?: string;
  color?: string;
  is_default?: boolean;
}

export function normalizeLeadStatus(s: any): LeadStatusItem {
  const v = s?.v || s?.value || "";
  const l = s?.l || s?.label || (v ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ") : "Status");
  const cls = s?.cls || s?.color || "bg-slate-100 text-slate-800 border-slate-300";
  return {
    v,
    l,
    cls,
    value: v,
    label: l,
    color: s?.color || cls,
    is_default: Boolean(s?.is_default),
  };
}

export const DEFAULT_LEAD_STATUSES: LeadStatusItem[] = [
  { v: "new", l: "New", value: "new", label: "New", cls: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600", color: "#64748b", is_default: true },
  { v: "contacted", l: "Contacted", value: "contacted", label: "Contacted", cls: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700", color: "#3b82f6", is_default: true },
  { v: "follow_up", l: "Follow-up", value: "follow_up", label: "Follow-up", cls: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700", color: "#f59e0b", is_default: true },
  { v: "qualified", l: "Qualified", value: "qualified", label: "Qualified", cls: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700", color: "#8b5cf6", is_default: true },
  { v: "converted", l: "Converted", value: "converted", label: "Converted", cls: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700", color: "#10b981", is_default: true },
  { v: "lost", l: "Lost", value: "lost", label: "Lost", cls: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700", color: "#ef4444", is_default: true },
];

export async function fetchOrgLeadStatuses(orgId: string): Promise<LeadStatusItem[]> {
  if (!orgId) return DEFAULT_LEAD_STATUSES;
  try {
    const { data } = await (supabase as any)
      .from("crm_automations")
      .select("config")
      .eq("org_id", orgId)
      .eq("trigger_event", "lead_settings")
      .eq("action_type", "custom_statuses")
      .maybeSingle();

    if (data?.config?.statuses && Array.isArray(data.config.statuses) && data.config.statuses.length > 0) {
      return data.config.statuses.map(normalizeLeadStatus);
    }
  } catch (e) {
    console.error("Error fetching lead statuses:", e);
  }
  return DEFAULT_LEAD_STATUSES;
}

export async function saveOrgLeadStatuses(orgId: string, statuses: LeadStatusItem[]): Promise<boolean> {
  if (!orgId) return false;
  try {
    const normalized = statuses.map(normalizeLeadStatus);
    const { data: existing } = await (supabase as any)
      .from("crm_automations")
      .select("id")
      .eq("org_id", orgId)
      .eq("trigger_event", "lead_settings")
      .eq("action_type", "custom_statuses")
      .maybeSingle();

    if (existing?.id) {
      await (supabase as any)
        .from("crm_automations")
        .update({ config: { statuses: normalized } })
        .eq("id", existing.id);
    } else {
      await (supabase as any)
        .from("crm_automations")
        .insert({
          org_id: orgId,
          name: "Custom Lead Statuses",
          trigger_event: "lead_settings",
          action_type: "custom_statuses",
          config: { statuses: normalized },
          is_active: true,
        });
    }
    return true;
  } catch (e) {
    console.error("Error saving lead statuses:", e);
    return false;
  }
}

export async function triggerActionLoggedLeadStatusUpdate(orgId: string, leadId: string, currentLeadStatus?: string): Promise<string | null> {
  if (!orgId || !leadId) return null;
  try {
    const { data } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("org_id", orgId)
      .eq("trigger_event", "action_logged_status_update")
      .eq("is_active", true)
      .maybeSingle();

    if (!data) return null;

    const targetStatus = data.config?.target_status || "follow_up";
    const triggerStatus = data.config?.from_status || "new";

    if (!currentLeadStatus || currentLeadStatus === triggerStatus || currentLeadStatus === "new") {
      await (supabase as any)
        .from("leads")
        .update({ status: targetStatus })
        .eq("id", leadId);
      return targetStatus;
    }
  } catch (e) {
    console.error("Error updating lead status on action logged:", e);
  }
  return null;
}

export async function ensureAdminInCrmTeam(orgId: string, user?: any, fallbackEmail?: string): Promise<any> {
  if (!orgId) return null;
  try {
    let currentUser = user;
    if (!currentUser) {
      const { data } = await supabase.auth.getUser();
      currentUser = data?.user;
    }
    const adminEmail = currentUser?.email || fallbackEmail;
    if (!adminEmail) return null;

    const { data: existing } = await (supabase as any)
      .from("crm_team")
      .select("*")
      .eq("org_id", orgId)
      .eq("email", adminEmail)
      .maybeSingle();

    if (existing) return existing;

    const name = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.first_name || adminEmail.split("@")[0] || "Admin";
    const { data: created, error } = await (supabase as any)
      .from("crm_team")
      .insert({
        org_id: orgId,
        name: `${name} (Admin)`,
        email: adminEmail,
        phone: currentUser?.user_metadata?.phone || currentUser?.phone || null,
        role: "Sales Manager",
        is_active: true,
      })
      .select("*")
      .single();

    if (!error && created) return created;
  } catch (e) {
    console.error("Error ensuring admin in crm_team:", e);
  }
  return null;
}

export interface LeadSourcePriorityRule {
  source: string;
  priority: "hot" | "warm" | "cold";
}

export interface LeadSourceAssignmentRule {
  source: string;
  member_id: string;
  member_name?: string;
}

export async function fetchLeadSourceRules(orgId: string): Promise<{
  priorityActive: boolean;
  priorityRules: LeadSourcePriorityRule[];
  assignmentActive: boolean;
  assignmentRules: LeadSourceAssignmentRule[];
}> {
  if (!orgId) return { priorityActive: false, priorityRules: [], assignmentActive: false, assignmentRules: [] };
  try {
    const { data } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("org_id", orgId)
      .in("trigger_event", ["lead_source_priority", "lead_source_assignment"]);

    const priRow = data?.find((r: any) => r.trigger_event === "lead_source_priority");
    const assRow = data?.find((r: any) => r.trigger_event === "lead_source_assignment");

    return {
      priorityActive: priRow ? priRow.is_active : false,
      priorityRules: priRow?.config?.rules || [],
      assignmentActive: assRow ? assRow.is_active : false,
      assignmentRules: assRow?.config?.rules || [],
    };
  } catch (e) {
    console.error("Error fetching lead source rules:", e);
    return { priorityActive: false, priorityRules: [], assignmentActive: false, assignmentRules: [] };
  }
}

export async function saveLeadSourcePriorityRules(orgId: string, isActive: boolean, rules: LeadSourcePriorityRule[]): Promise<boolean> {
  if (!orgId) return false;
  try {
    const { data: existing } = await (supabase as any)
      .from("crm_automations")
      .select("id")
      .eq("org_id", orgId)
      .eq("trigger_event", "lead_source_priority")
      .maybeSingle();

    if (existing?.id) {
      await (supabase as any)
        .from("crm_automations")
        .update({ is_active: isActive, config: { rules } })
        .eq("id", existing.id);
    } else {
      await (supabase as any)
        .from("crm_automations")
        .insert({
          org_id: orgId,
          name: "Source-Based Lead Priority",
          trigger_event: "lead_source_priority",
          action_type: "set_priority",
          config: { rules },
          is_active: isActive,
        });
    }
    return true;
  } catch (e) {
    console.error("Error saving lead source priority rules:", e);
    return false;
  }
}

export async function saveLeadSourceAssignmentRules(orgId: string, isActive: boolean, rules: LeadSourceAssignmentRule[]): Promise<boolean> {
  if (!orgId) return false;
  try {
    const { data: existing } = await (supabase as any)
      .from("crm_automations")
      .select("id")
      .eq("org_id", orgId)
      .eq("trigger_event", "lead_source_assignment")
      .maybeSingle();

    if (existing?.id) {
      await (supabase as any)
        .from("crm_automations")
        .update({ is_active: isActive, config: { rules } })
        .eq("id", existing.id);
    } else {
      await (supabase as any)
        .from("crm_automations")
        .insert({
          org_id: orgId,
          name: "Source-Based Lead Auto-Assignment",
          trigger_event: "lead_source_assignment",
          action_type: "assign_rep",
          config: { rules },
          is_active: isActive,
        });
    }
    return true;
  } catch (e) {
    console.error("Error saving lead source assignment rules:", e);
    return false;
  }
}

export const DEFAULT_ACTIVITY_TYPES = [
  "Call",
  "Meeting",
  "Email",
  "Follow-up",
  "Demo",
  "Site Visit",
  "Note",
  "Support Ticket",
];

export async function fetchCustomActivityTypes(orgId: string): Promise<string[]> {
  try {
    const cached = localStorage.getItem(`crm_custom_act_types_${orgId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  try {
    const { data } = await (supabase as any)
      .from("crm_automations")
      .select("config")
      .eq("org_id", orgId)
      .eq("trigger_event", "lead_settings")
      .eq("action_type", "custom_activity_types")
      .maybeSingle();

    if (data?.config?.types && Array.isArray(data.config.types)) {
      const merged = Array.from(new Set([...DEFAULT_ACTIVITY_TYPES, ...data.config.types]));
      try { localStorage.setItem(`crm_custom_act_types_${orgId}`, JSON.stringify(merged)); } catch (_) {}
      return merged;
    }
  } catch (e) {
    console.error("Error fetching custom activity types:", e);
  }
  return DEFAULT_ACTIVITY_TYPES;
}

export async function saveCustomActivityType(orgId: string, newType: string): Promise<string[]> {
  const trimmed = newType.trim();
  if (!trimmed) return DEFAULT_ACTIVITY_TYPES;
  const current = await fetchCustomActivityTypes(orgId);
  if (!current.includes(trimmed)) {
    const updated = [...current, trimmed];
    try {
      localStorage.setItem(`crm_custom_act_types_${orgId}`, JSON.stringify(updated));
      const { data: existing } = await (supabase as any)
        .from("crm_automations")
        .select("id")
        .eq("org_id", orgId)
        .eq("trigger_event", "lead_settings")
        .eq("action_type", "custom_activity_types")
        .maybeSingle();

      if (existing?.id) {
        await (supabase as any)
          .from("crm_automations")
          .update({ config: { types: updated } })
          .eq("id", existing.id);
      } else {
        await (supabase as any)
          .from("crm_automations")
          .insert({
            org_id: orgId,
            name: "Custom Activity Types",
            trigger_event: "lead_settings",
            action_type: "custom_activity_types",
            config: { types: updated },
            is_active: true,
          });
      }
    } catch (e) {
      console.error("Error saving custom activity type:", e);
    }
    return updated;
  }
  return current;
}


