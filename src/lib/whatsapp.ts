import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || "http://localhost:3010/api";

export function normalizeWhatsappNumber(raw?: string | null, defaultCC = "91"): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return defaultCC + digits;
  return digits;
}

export async function openWhatsappShare(opts: {
  phone?: string | null;
  message: string;
  orgId?: string;
}) {
  if (!opts.orgId || !opts.phone) {
    toast({ title: "Error", description: "Missing organization or phone number.", variant: "destructive" });
    return;
  }

  const phone = normalizeWhatsappNumber(opts.phone);

  try {
    const res = await fetch(`${WHATSAPP_SERVICE_URL}/message/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id: opts.orgId,
        phone,
        text: opts.message,
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      toast({ title: "Failed to Send", description: errorData.error || "Please check your WhatsApp connection.", variant: "destructive" });
      return;
    }

    toast({ title: "WhatsApp Sent!", description: "Message dispatched successfully." });
  } catch (err: any) {
    console.error(err);
    toast({ title: "Error", description: err.message || "Failed to reach WhatsApp service.", variant: "destructive" });
  }
}



export const DEFAULT_TEMPLATES: Record<string, string[]> = {
  invoice: [
    "Hello {{client_name}},\n\nPlease find your invoice *{{document_no}}* for {{total}} (due {{due_date}}).\n\nView & pay online: {{portal_link}}\n\nThank you,\n{{org_name}}",
    "Hi {{client_name}},\n\nYour invoice {{document_no}} for the amount of {{total}} has been generated. \nItems:\n{{items}}\n\nSubtotal: {{subtotal}}\nTax: {{tax}}\nDiscount: {{discount}}\nTDS: {{tds}}\nAdjustment: {{adjustment}}\n*Total: {{total}}*\n\nYou can view or download it here: {{portal_link}}\n\nRegards,\n{{org_name}}"
  ],
  estimate: [
    "Hello {{client_name}},\n\nPlease find your estimate *{{document_no}}* for {{total}}.\n\nView online: {{portal_link}}\n\nThank you,\n{{org_name}}",
    "Hi {{client_name}},\n\nWe have created an estimate {{document_no}} for you. The estimated total is {{total}}.\n\nYou can review it here: {{portal_link}}\n\nRegards,\n{{org_name}}"
  ],
  purchase_order: [
    "Hello {{client_name}},\n\nPlease find our Purchase Order *{{document_no}}* for {{total}}.\n\nView online: {{portal_link}}\n\nThank you,\n{{org_name}}",
    "Hi {{client_name}},\n\nWe have issued Purchase Order {{document_no}} for the amount of {{total}}.\n\nYou can review the PO here: {{portal_link}}\n\nRegards,\n{{org_name}}"
  ],
  bill: [
    "Hello {{client_name}},\n\nWe have recorded your bill *{{document_no}}* for {{total}} (due {{due_date}}).\n\nThank you,\n{{org_name}}",
    "Hi {{client_name}},\n\nBill {{document_no}} for the amount of {{total}} has been entered into our system.\n\nRegards,\n{{org_name}}"
  ]
};

export async function getWhatsappTemplate(orgId: string, type: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('content')
      .eq('org_id', orgId)
      .eq('type', type)
      .eq('is_default', true)
      .maybeSingle();

    if (data?.content) {
      return data.content;
    }
  } catch (e) {
    console.error("Error fetching template", e);
  }
  
  // Fallback to first default template
  return DEFAULT_TEMPLATES[type]?.[0] || "";
}

export function compileWhatsappMessage(template: string, data: Record<string, any>): string {
  let result = template;
  
  const bracketMappings: Record<string, any> = {
    '[Client Name]': data.client_name,
    '[Invoice Number]': data.document_no,
    '[Estimate Number]': data.document_no,
    '[PO Number]': data.document_no,
    '[Bill Number]': data.document_no,
    '[Total Amount]': data.total,
    '[Due Date]': data.due_date,
    '[Portal Link]': data.portal_link,
    '[Company Name]': data.org_name,
  };
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      result = result.split(`{{${key}}}`).join(String(value));
    }
  }

  for (const [key, value] of Object.entries(bracketMappings)) {
    if (value !== null && value !== undefined) {
      result = result.split(key).join(String(value));
    } else {
      result = result.split(key).join('');
    }
  }
  
  // Clean up any unreplaced placeholders
  result = result.replace(/{{[^}]+}}/g, '');
  
  return result.trim();
}
