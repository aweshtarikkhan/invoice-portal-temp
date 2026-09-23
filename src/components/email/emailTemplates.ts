export const DEFAULT_TEMPLATES = {
  invoice: {
    subject: "Tax Invoice {{invoice_number}} from {{company_name}}",
    html: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); margin: 0 auto;">
    <!-- Brand Header with Authentic AssayBiz Blue & Orange Accent -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px 28px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px; border: 1px solid rgba(231, 120, 23, 0.25);">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; background-color: rgba(231, 120, 23, 0.2); border: 1px solid #e77817; color: #ffedd5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px;">
            Tax Invoice
          </span>
        </div>
        <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Invoice #{{invoice_number}}</h1>
        <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Issued by {{company_name}}</p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{client_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">Thank you for your business. Please find below the summary of your invoice from <strong>{{company_name}}</strong>:</p>

        <!-- Amount Spotlight Card with Logo Orange Accents -->
        <div style="background: linear-gradient(180deg, #fffaf5 0%, #ffedd5 100%); border: 1.5px solid #fed7aa; border-top: 4px solid #e77817; border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(231, 120, 23, 0.08);">
          <span style="display: inline-block; background-color: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 12px; margin-bottom: 8px;">
            Total Amount Due
          </span>
          <span style="font-size: 34px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; display: block;">{{total_amount}}</span>
        </div>

        <!-- Details Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 26px; overflow: hidden;">
          <tr>
            <td style="padding: 13px 18px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Invoice Number:</td>
            <td style="padding: 13px 18px; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #e2e8f0;">{{invoice_number}}</td>
          </tr>
          <tr>
            <td style="padding: 13px 18px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Invoice Date:</td>
            <td style="padding: 13px 18px; font-weight: 600; text-align: right; color: #0f172a; border-bottom: 1px solid #e2e8f0;">{{invoice_date}}</td>
          </tr>
          <tr>
            <td style="padding: 13px 18px; color: #64748b;">Due Date:</td>
            <td style="padding: 13px 18px; font-weight: 700; text-align: right; color: #dc2626;">{{due_date}}</td>
          </tr>
        </table>

        <!-- High-Impact CTA Button in Logo Orange -->
        <div style="text-align: center; margin: 30px 0 22px 0;">
          <a href="{{payment_link}}" target="_blank" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(231, 120, 23, 0.35); letter-spacing: 0.3px;">
            View &amp; Pay Invoice &rarr;
          </a>
        </div>

        <!-- PDF Attachment Callout in Soft Warm Theme -->
        <div style="background-color: #fffaf5; border: 1px dashed #fdba74; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #9a3412; margin-top: 22px;">
          📎 <strong>Official PDF Attached:</strong> A printable copy of your invoice is attached to this email.
        </div>
      </td>
    </tr>

    <!-- Footer with Aassay Biz Brand Styling -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0 0 6px 0;">Need help or have questions? Contact us at <a href="mailto:{{company_email}}" style="color: #e77817; text-decoration: none; font-weight: 600;">{{company_email}}</a></p>
        <p style="margin: 0; color: #94a3b8; font-size: 11px;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim(),
    directAmountHtml: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px;">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #fed7aa;">INVOICE AMOUNT DUE</p>
        <h1 style="margin: 8px 0 0 0; font-size: 36px; font-weight: 800; color: #ffffff;">{{total_amount}}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{client_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">Your invoice <strong>{{invoice_number}}</strong> from <strong>{{company_name}}</strong> is ready and attached to this email.</p>
        <table width="100%" style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin: 20px 0; padding: 12px 0; font-size: 14px;">
          <tr><td style="color: #64748b; padding: 8px 0;">Due Date:</td><td style="font-weight: 700; text-align: right; color: #dc2626;">{{due_date}}</td></tr>
        </table>
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="{{payment_link}}" target="_blank" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(231, 120, 23, 0.35);">Pay Now &rarr;</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim()
  },
  estimate: {
    subject: "Quotation {{estimate_number}} from {{company_name}}",
    html: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
    <!-- Brand Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px 28px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px; border: 1px solid rgba(231, 120, 23, 0.25);">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; background-color: rgba(231, 120, 23, 0.2); border: 1px solid #e77817; color: #ffedd5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px;">
            QUOTATION
          </span>
        </div>
        <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Quotation #{{estimate_number}}</h1>
        <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Prepared by {{company_name}}</p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{client_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">Thank you for your interest. Please review our official quotation below:</p>

        <!-- Amount Box -->
        <div style="background: linear-gradient(180deg, #fffaf5 0%, #ffedd5 100%); border: 1.5px solid #fed7aa; border-top: 4px solid #e77817; border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(231, 120, 23, 0.08);">
          <span style="display: inline-block; background-color: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 12px; margin-bottom: 8px;">
            Quoted Amount
          </span>
          <span style="font-size: 34px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; display: block;">{{total_amount}}</span>
        </div>

        <!-- Details Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 26px; overflow: hidden;">
          <tr>
            <td style="padding: 13px 18px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Quotation Number:</td>
            <td style="padding: 13px 18px; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #e2e8f0;">{{estimate_number}}</td>
          </tr>
          <tr>
            <td style="padding: 13px 18px; color: #64748b;">Date:</td>
            <td style="padding: 13px 18px; font-weight: 600; text-align: right; color: #0f172a;">{{date}}</td>
          </tr>
        </table>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0 22px 0;">
          <a href="{{portal_link}}" target="_blank" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(231, 120, 23, 0.35); letter-spacing: 0.3px;">View Quotation Online &rarr;</a>
        </div>

        <!-- PDF Attachment Callout -->
        <div style="background-color: #fffaf5; border: 1px dashed #fdba74; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #9a3412; margin-top: 22px;">
          📎 <strong>Quotation PDF Attached:</strong> An official copy of your quotation is attached to this email.
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0 0 6px 0;">If you have questions or wish to approve this quotation, please contact us at <a href="mailto:{{company_email}}" style="color: #e77817; text-decoration: none; font-weight: 600;">{{company_email}}</a></p>
        <p style="margin: 0; color: #94a3b8; font-size: 11px;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim(),
    directAmountHtml: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px;">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #fed7aa;">QUOTED TOTAL</p>
        <h1 style="margin: 8px 0 0 0; font-size: 36px; font-weight: 800; color: #ffffff;">{{total_amount}}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{client_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">Please review the attached quotation <strong>{{estimate_number}}</strong> from <strong>{{company_name}}</strong>.</p>
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="{{portal_link}}" target="_blank" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(231, 120, 23, 0.35);">View Full Quotation &rarr;</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim()
  },
  po: {
    subject: "Purchase Order {{po_number}} from {{company_name}}",
    html: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
    <!-- Brand Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px 28px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px; border: 1px solid rgba(231, 120, 23, 0.25);">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; background-color: rgba(231, 120, 23, 0.2); border: 1px solid #e77817; color: #ffedd5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px;">
            Purchase Order
          </span>
        </div>
        <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">PO #{{po_number}}</h1>
        <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Issued by {{company_name}}</p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{vendor_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">Please find attached our official Purchase Order from <strong>{{company_name}}</strong>:</p>

        <!-- Amount Box -->
        <div style="background: linear-gradient(180deg, #fffaf5 0%, #ffedd5 100%); border: 1.5px solid #fed7aa; border-top: 4px solid #e77817; border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(231, 120, 23, 0.08);">
          <span style="display: inline-block; background-color: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 12px; margin-bottom: 8px;">
            Total Order Amount
          </span>
          <span style="font-size: 34px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; display: block;">{{total_amount}}</span>
        </div>

        <!-- Details Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 26px; overflow: hidden;">
          <tr>
            <td style="padding: 13px 18px; color: #64748b; border-bottom: 1px solid #e2e8f0;">PO Number:</td>
            <td style="padding: 13px 18px; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #e2e8f0;">{{po_number}}</td>
          </tr>
          <tr>
            <td style="padding: 13px 18px; color: #64748b;">Date:</td>
            <td style="padding: 13px 18px; font-weight: 600; text-align: right; color: #0f172a;">{{date}}</td>
          </tr>
        </table>

        <!-- PDF Attachment Callout -->
        <div style="background-color: #fffaf5; border: 1px dashed #fdba74; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #9a3412; margin-top: 22px;">
          📎 <strong>Purchase Order Attached:</strong> Please review the attached PDF and confirm acceptance and dispatch timelines.
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0 0 6px 0;">Questions? Contact us at <a href="mailto:{{company_email}}" style="color: #e77817; text-decoration: none; font-weight: 600;">{{company_email}}</a></p>
        <p style="margin: 0; color: #94a3b8; font-size: 11px;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim(),
    directAmountHtml: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px;">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #fed7aa;">PURCHASE ORDER AMOUNT</p>
        <h1 style="margin: 8px 0 0 0; font-size: 36px; font-weight: 800; color: #ffffff;">{{total_amount}}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{vendor_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">We have attached Purchase Order <strong>{{po_number}}</strong> from <strong>{{company_name}}</strong> for your processing.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim()
  },
  bill: {
    subject: "Purchase Invoice / Bill {{bill_number}} from {{company_name}}",
    html: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
    <!-- Brand Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px 28px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px; border: 1px solid rgba(231, 120, 23, 0.25);">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; background-color: rgba(231, 120, 23, 0.2); border: 1px solid #e77817; color: #ffedd5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px;">
            Purchase Invoice
          </span>
        </div>
        <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Bill #{{bill_number}}</h1>
        <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Recorded by {{company_name}}</p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{client_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">Here are the recorded details for purchase invoice / bill #{{bill_number}}:</p>

        <!-- Amount Box -->
        <div style="background: linear-gradient(180deg, #fffaf5 0%, #ffedd5 100%); border: 1.5px solid #fed7aa; border-top: 4px solid #e77817; border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(231, 120, 23, 0.08);">
          <span style="display: inline-block; background-color: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 12px; margin-bottom: 8px;">
            Total Bill Amount
          </span>
          <span style="font-size: 34px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; display: block;">{{total_amount}}</span>
        </div>

        <!-- Details Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 26px; overflow: hidden;">
          <tr>
            <td style="padding: 13px 18px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Bill Number:</td>
            <td style="padding: 13px 18px; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #e2e8f0;">{{bill_number}}</td>
          </tr>
          <tr>
            <td style="padding: 13px 18px; color: #64748b;">Due Date:</td>
            <td style="padding: 13px 18px; font-weight: 700; text-align: right; color: #dc2626;">{{due_date}}</td>
          </tr>
        </table>

        <!-- PDF Attachment Callout -->
        <div style="background-color: #fffaf5; border: 1px dashed #fdba74; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 13px; color: #9a3412; margin-top: 22px;">
          📎 <strong>Purchase Invoice PDF Attached:</strong> An official copy of this bill has been attached to this email.
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0 0 6px 0;">Questions? Contact us at <a href="mailto:{{company_email}}" style="color: #e77817; text-decoration: none; font-weight: 600;">{{company_email}}</a></p>
        <p style="margin: 0; color: #94a3b8; font-size: 11px;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim(),
    directAmountHtml: `
<div style="background-color: #f1f5f9; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #e77817;">
        <div style="background-color: #ffffff; display: inline-block; padding: 8px 22px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); margin-bottom: 16px;">
          <img src="{{company_logo}}" alt="{{company_name}}" width="160" height="38" border="0" style="height: 38px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
        </div>
        <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #fed7aa;">BILL AMOUNT</p>
        <h1 style="margin: 8px 0 0 0; font-size: 36px; font-weight: 800; color: #ffffff;">{{total_amount}}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">Dear <strong>{{client_name}}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">Your bill <strong>{{bill_number}}</strong> is ready and attached below. Please note the due date: <strong>{{due_date}}</strong>.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">Powered by <a href="https://aassaybiz.com" target="_blank" style="text-decoration: none; font-weight: 700;"><span style="color: #e77817;">A</span><span style="color: #28166f;">assay</span> <span style="color: #e77817;">Biz</span></a> &bull; Everything you need. One smart platform</p>
      </td>
    </tr>
  </table>
</div>`.trim()
  }
};
