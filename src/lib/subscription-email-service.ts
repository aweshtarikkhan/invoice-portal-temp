import { supabase } from "@/integrations/supabase/client";
import {
  SubscriptionInvoiceData,
  getSubscriptionInvoiceBase64,
} from "./subscription-invoice-pdf";

/**
 * Builds the responsive HTML email template for subscription activation.
 */
export function buildSubscriptionEmailHTML(data: SubscriptionInvoiceData): string {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(data.totalAmount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Assay Biz Subscription & Tax Invoice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
          
          <!-- Top Navy Header with Assay Biz Brand Colors -->
          <tr>
            <td style="background: linear-gradient(135deg, #160e3d 0%, #28166f 100%); padding: 36px 36px 30px; text-align: left; border-bottom: 4px solid #e77817;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Assay Biz Styled Logo -->
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.1;">
                      <span style="color: #e77817;">A</span><span style="color: #ffffff;">ssay</span> <span style="color: #e77817;">Biz</span>
                    </h1>
                    <p style="margin: 6px 0 0; color: #cbd5e1; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">
                      GST Invoicing & Business OS
                    </p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; background-color: rgba(231, 120, 23, 0.2); border: 1px solid rgba(231, 120, 23, 0.5); color: #ffaa47; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 12px; rounded: 9999px; border-radius: 20px;">
                      ✓ Payment Verified
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Celebration & Personal Greeting -->
          <tr>
            <td style="padding: 36px 36px 20px;">
              <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px 18px; margin-bottom: 24px; width: 100%; box-sizing: border-box;">
                <p style="margin: 0; color: #047857; font-size: 14px; font-weight: 700;">
                  🎉 Subscription Activated Successfully!
                </p>
                <p style="margin: 4px 0 0; color: #065f46; font-size: 13px;">
                  Your payment of <strong>${formattedAmount}</strong> has been received and verified. Your software features are immediately unlocked.
                </p>
              </div>

              <p style="margin: 0 0 16px; color: #334155; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.customerName || "Customer"}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">
                Thank you for subscribing to <strong>Assay Biz</strong> for <strong>${data.organizationName || "your business"}</strong>. We are thrilled to partner with you to automate your invoicing, inventory, staff management, and business accounting.
              </p>

              <!-- Plan Details Summary Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="background-color: #f1f5f9; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      Subscription & Tax Invoice Summary
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Active Plan</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right;">${data.planDisplayName}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Billing Cycle</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right; text-transform: capitalize;">${data.billingCycle}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Validity Period</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${data.periodStart} &mdash; ${data.periodEnd}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Tax Invoice Number</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${data.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Razorpay Payment ID</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-family: monospace; font-weight: 600; text-align: right;">${data.razorpayPaymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; background-color: #fef3c7; color: #92400e; font-size: 14px; font-weight: 700;">Total Amount Paid (Inclusive of 18% GST)</td>
                  <td style="padding: 16px 20px; background-color: #fef3c7; color: #b45309; font-size: 18px; font-weight: 900; text-align: right;">${formattedAmount}</td>
                </tr>
              </table>

              <!-- Attachment Callout -->
              <div style="padding: 16px 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0; color: #166534; font-size: 13px; line-height: 1.5;">
                  📎 <strong>Tax Invoice Attached:</strong> Your official GST-compliant tax invoice PDF (<strong>${data.invoiceNumber}.pdf</strong>) is attached with this email for your input tax credit (ITC) and accounting records.
                </p>
              </div>

              <!-- Launch Dashboard CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="https://satahinvoice.com/dashboard" target="_blank" style="display: inline-block; background-color: #e77817; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(231, 120, 23, 0.4); text-align: center;">
                      Open Assay Biz Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Support & Helpline Information -->
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; line-height: 1.6;">
                Have questions or need assistance setting up your team? We are here to help:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.7;">
                <li><strong>Priority Support:</strong> +91 94248 25919 (Mon &ndash; Sat, 9:30 AM &ndash; 7:00 PM IST)</li>
                <li><strong>Billing Helpline:</strong> billing@assaybiz.com</li>
                <li><strong>WhatsApp Assistance:</strong> Directly from your web dashboard</li>
              </ul>

              <p style="margin: 0; color: #334155; font-size: 14px; font-weight: 600;">
                Warm regards,<br />
                <span style="color: #e77817;">Team Assay Biz</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 36px; text-align: center;">
              <p style="margin: 0 0 6px; color: #94a3b8; font-size: 11px;">
                Assay Biz Technologies Pvt. Ltd. • GSTIN: 23AABCS1429B1Z8 • SAC Code: 998313
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} Assay Biz. All rights reserved. 100% Made in India.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface SendSubscriptionEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

/**
 * Sends the subscription confirmation email with official GST Tax Invoice PDF attached.
 * Features dual-dispatch (Supabase Edge Function + Live API proxy fallback) to guarantee delivery.
 */
export async function sendSubscriptionInvoiceEmail(
  invoiceData: SubscriptionInvoiceData,
  orgId: string
): Promise<SendSubscriptionEmailResult> {
  const recipientEmail = (invoiceData.customerEmail || "").trim();
  if (!recipientEmail) {
    console.warn("sendSubscriptionInvoiceEmail: No customer email provided.");
    return { success: false, error: "Recipient email is missing." };
  }

  const invoiceNumber = invoiceData.invoiceNumber || `AB-SUB-${Date.now().toString().slice(-6)}`;
  const subject = `🎉 Subscription Activated: Assay Biz Tax Invoice #${invoiceNumber}`;
  const htmlContent = buildSubscriptionEmailHTML({
    ...invoiceData,
    invoiceNumber,
  });

  // 1. Generate PDF in Base64
  let pdfBase64 = "";
  try {
    pdfBase64 = getSubscriptionInvoiceBase64({
      ...invoiceData,
      invoiceNumber,
    });
  } catch (pdfErr) {
    console.error("Failed to generate subscription invoice PDF:", pdfErr);
  }

  const attachments = pdfBase64
    ? [
        {
          filename: `AssayBiz_Invoice_${invoiceNumber}.pdf`,
          content: pdfBase64,
          content_type: "application/pdf",
        },
      ]
    : [];

  // 2. Primary Dispatch Pathway: Supabase Edge Function (send-custom-email -> send-email-dispatcher -> AWS SES)
  try {
    console.log(`[Email Dispatch] Attempting primary edge function dispatch to ${recipientEmail}...`);
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
      "send-custom-email",
      {
        body: {
          orgId,
          to: recipientEmail,
          subject,
          html: htmlContent,
          attachments,
        },
      }
    );

    if (!edgeError && edgeData?.success) {
      console.log("[Email Dispatch] Primary edge function sent successfully:", edgeData);
      return { success: true, messageId: edgeData.resend_id || edgeData.messageId, provider: "supabase-edge" };
    }

    if (edgeError) {
      console.warn("[Email Dispatch] Edge function returned error, falling back to direct API proxy:", edgeError);
    }
  } catch (err: any) {
    console.warn("[Email Dispatch] Edge function threw exception, falling back to direct API proxy:", err);
  }

  // 3. Fallback Pathway: Direct EC2 / VPS API proxy (/api/email/send -> AWS SES Outbound SMTP)
  try {
    console.log(`[Email Dispatch] Attempting direct API fallback dispatch to ${recipientEmail}...`);
    const apiUrl = typeof window !== "undefined" && window.location.origin
      ? `${window.location.origin}/api/email/send`
      : "http://13.201.228.83/api/email/send";

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId,
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: `Your Assay Biz subscription (${invoiceData.planDisplayName}) has been activated. Amount Paid: Rs ${invoiceData.totalAmount}. Payment ID: ${invoiceData.razorpayPaymentId}.`,
        attachments,
      }),
    });

    if (res.ok) {
      const resData = await res.json();
      console.log("[Email Dispatch] Direct API fallback sent successfully:", resData);
      return { success: true, messageId: resData.messageId, provider: "direct-api" };
    }

    const errText = await res.text();
    console.error("[Email Dispatch] Direct API fallback failed:", errText);
    return { success: false, error: errText };
  } catch (fallbackErr: any) {
    console.error("[Email Dispatch] Direct API fallback threw error:", fallbackErr);
    return { success: false, error: fallbackErr.message };
  }
}
