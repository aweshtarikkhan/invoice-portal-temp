import { supabase } from "@/integrations/supabase/client";

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  content_type?: string;
}

export interface DispatchEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  orgId: string;
  fromName?: string;
  fromEmail?: string;
  attachments?: EmailAttachment[];
}

export const getBackendApiUrl = (endpoint: string) => {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `https://aassaybiz.com${endpoint}`;
    }
  }
  return endpoint;
};

export async function dispatchEmail(payload: DispatchEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // 1. Primary Pathway: Direct Backend API (/api/email/send)
  // Connects directly to AWS SES SDK using live verified identities (e.g. no-reply@aweshkhan.site) & SMTP
  try {
    const url = getBackendApiUrl("/api/email/send");
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: payload.orgId,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        fromName: payload.fromName,
        fromEmail: payload.fromEmail,
        attachments: payload.attachments,
      }),
    });

    const resData = await resp.json().catch(() => null);
    if (resp.ok && resData?.success) {
      return { success: true, messageId: resData.messageId };
    }
    if (resData?.error) {
      console.warn("Direct backend mailer returned error, attempting edge function fallback:", resData.error);
    }
  } catch (backendErr) {
    console.warn("Direct backend mailer unreachable, attempting edge function fallback:", backendErr);
  }

  // 2. Secondary Pathway: Supabase Edge Function (send-custom-email)
  try {
    const { data, error } = await supabase.functions.invoke("send-custom-email", {
      body: payload,
    });

    if (error) {
      let detailedMsg = error.message;
      if ((error as any)?.context?.json) {
        try {
          const json = await (error as any).context.json();
          if (json?.error) detailedMsg = json.error;
        } catch {}
      }
      throw new Error(detailedMsg || "Failed to dispatch email via cloud function");
    }
    if (data?.error) {
      throw new Error(data.error);
    }

    return { success: true, messageId: data?.messageId || data?.resend_id };
  } catch (edgeErr: any) {
    console.error("All email dispatch pathways failed:", edgeErr);
    return { success: false, error: edgeErr.message || "Failed to send email" };
  }
}
