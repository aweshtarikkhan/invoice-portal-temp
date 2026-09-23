export interface BrandEmailOptions {
  logoUrl?: string | null;
  companyName?: string;
  companyEmail?: string;
  badgeText?: string;
  title: string;
  subtitle?: string;
  recipientName?: string;
  introText?: string;
  amountLabel?: string;
  amountValue?: string;
  details?: Array<{ label: string; value: string; isHighlight?: boolean }>;
  actionButton?: {
    label: string;
    url: string;
  };
  attachmentNote?: string;
  customBodyHtml?: string;
}

export function buildBrandedEmailHtml(options: BrandEmailOptions): string {
  const isValidHttpUrl = (url?: string | null) => {
    if (!url) return false;
    const t = url.trim();
    return (t.startsWith("http://") || t.startsWith("https://")) && !t.includes("blob:");
  };

  const logoUrl = isValidHttpUrl(options.logoUrl) ? options.logoUrl!.trim() : "https://aassaybiz.com/email-logo.png";
  const companyName = options.companyName?.trim() || "Aassay Biz";
  const companyEmail = options.companyEmail?.trim() || "support@aassaybiz.com";

  const detailsRows = options.details && options.details.length > 0
    ? options.details.map((d, i) => `
      <tr>
        <td style="padding: 13px 18px; color: #64748b; border-bottom: ${i === options.details!.length - 1 ? 'none' : '1px solid #e2e8f0'}; font-size: 14px;">${d.label}:</td>
        <td style="padding: 13px 18px; font-weight: ${d.isHighlight ? '700' : '600'}; text-align: right; color: ${d.isHighlight ? '#dc2626' : '#0f172a'}; border-bottom: ${i === options.details!.length - 1 ? 'none' : '1px solid #e2e8f0'}; font-size: 14px;">${d.value}</td>
      </tr>
    `).join("")
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="background-color: #f1f5f9; padding: 36px 16px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); margin: 0 auto;">
      
      <!-- AssayBiz Brand Header with Signature Navy Blue & Brand Orange Accent -->
      <tr>
        <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px 28px; text-align: center; border-bottom: 4px solid #e77817;">
          <!-- Crisp Real Logo Container -->
          <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px; border: 1px solid rgba(231, 120, 23, 0.25);">
            <img src="${logoUrl}" alt="${companyName}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
          </div>
          ${options.badgeText ? `
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; background-color: rgba(231, 120, 23, 0.2); border: 1px solid #e77817; color: #ffedd5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px;">
              ${options.badgeText}
            </span>
          </div>` : ""}
          <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${options.title}</h1>
          <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">${options.subtitle || "Everything you need. One smart platform"}</p>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding: 32px 28px;">
          ${options.recipientName ? `<p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>${options.recipientName}</strong>,</p>` : ""}
          ${options.introText ? `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">${options.introText}</p>` : ""}

          ${options.customBodyHtml ? `<div style="margin: 20px 0; color: #334155; line-height: 1.6; font-size: 14px;">${options.customBodyHtml}</div>` : ""}

          <!-- Amount Spotlight with Warm Orange Accents -->
          ${options.amountValue ? `
          <div style="background: linear-gradient(180deg, #fffaf5 0%, #ffedd5 100%); border: 1.5px solid #fed7aa; border-top: 4px solid #e77817; border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(231, 120, 23, 0.08);">
            <span style="display: inline-block; background-color: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 12px; margin-bottom: 8px;">
              ${options.amountLabel || "Total Amount Due"}
            </span>
            <span style="font-size: 34px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; display: block;">${options.amountValue}</span>
          </div>
          ` : ""}

          <!-- Key Details Table -->
          ${detailsRows ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 26px; overflow: hidden;">
            ${detailsRows}
          </table>
          ` : ""}

          <!-- Action Button in Brand Orange -->
          ${options.actionButton ? `
          <div style="text-align: center; margin: 30px 0 22px 0;">
            <a href="${options.actionButton.url}" target="_blank" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(231, 120, 23, 0.35); letter-spacing: 0.3px;">
              ${options.actionButton.label} &rarr;
            </a>
          </div>
          ` : ""}

          <!-- PDF Attachment Notice in Warm Tint -->
          ${options.attachmentNote ? `
          <div style="background-color: #fffaf5; border: 1px dashed #fdba74; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #9a3412; margin-top: 22px;">
            📎 <strong>Attachment:</strong> ${options.attachmentNote}
          </div>
          ` : ""}
        </td>
      </tr>

      <!-- Footer with Brand Accents -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0 0 6px 0;">Questions? Reply directly to this email or contact us at <a href="mailto:${companyEmail}" style="color: #e77817; text-decoration: none; font-weight: 600;">${companyEmail}</a></p>
          <p style="margin: 0; color: #94a3b8; font-size: 11px;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}
