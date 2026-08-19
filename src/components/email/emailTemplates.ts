export const DEFAULT_TEMPLATES = {
  invoice: {
    subject: "New Invoice from {{company_name}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
    <h2 style="margin: 0; color: #334155;">New Invoice from {{company_name}}</h2>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{client_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Thank you for your business. Here are the details of your new invoice:</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 5px 0; color: #64748b;">Invoice Number:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{invoice_number}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Invoice Date:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{invoice_date}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Due Date:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{due_date}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 14px; color: #64748b; display: block; margin-bottom: 5px;">Total Amount Due</span>
      <span style="font-size: 32px; font-weight: bold; color: #0f172a;">{{total_amount}}</span>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{payment_link}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Invoice & Pay</a>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #eaeaea; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">If you have any questions, please contact us at {{company_email}}</p>
  </div>
</div>`.trim(),
    directAmountHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #2563eb; padding: 30px; text-align: center; color: white;">
    <h3 style="margin: 0; font-weight: normal; opacity: 0.9;">INVOICE AMOUNT</h3>
    <h1 style="margin: 10px 0 0; font-size: 42px;">{{total_amount}}</h1>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{client_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Your invoice <strong>{{invoice_number}}</strong> from <strong>{{company_name}}</strong> is ready and attached to this email.</p>
    <table style="width: 100%; border-top: 1px solid #eaeaea; border-bottom: 1px solid #eaeaea; margin: 20px 0; padding: 15px 0;">
      <tr><td style="color: #64748b; padding: 5px 0;">Due Date:</td><td style="font-weight: bold; text-align: right; color: #ef4444;">{{due_date}}</td></tr>
    </table>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{payment_link}}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pay Now</a>
    </div>
  </div>
</div>`.trim()
  },
  estimate: {
    subject: "New Estimate from {{company_name}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
    <h2 style="margin: 0; color: #334155;">New Estimate from {{company_name}}</h2>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{client_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Thank you for your interest. Here is your estimate:</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 5px 0; color: #64748b;">Estimate Number:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{estimate_number}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Date:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 14px; color: #64748b; display: block; margin-bottom: 5px;">Estimated Amount</span>
      <span style="font-size: 32px; font-weight: bold; color: #0f172a;">{{total_amount}}</span>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{portal_link}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Estimate</a>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #eaeaea; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">If you have any questions, please contact us at {{company_email}}</p>
  </div>
</div>`.trim(),
    directAmountHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #10b981; padding: 30px; text-align: center; color: white;">
    <h3 style="margin: 0; font-weight: normal; opacity: 0.9;">ESTIMATED TOTAL</h3>
    <h1 style="margin: 10px 0 0; font-size: 42px;">{{total_amount}}</h1>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{client_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Please review the attached estimate <strong>{{estimate_number}}</strong> from <strong>{{company_name}}</strong>.</p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{portal_link}}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Full Estimate</a>
    </div>
  </div>
</div>`.trim()
  },
  po: {
    subject: "Purchase Order from {{company_name}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
    <h2 style="margin: 0; color: #334155;">Purchase Order from {{company_name}}</h2>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{vendor_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Please find attached our purchase order:</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 5px 0; color: #64748b;">PO Number:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{po_number}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Date:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{date}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 14px; color: #64748b; display: block; margin-bottom: 5px;">Total Order Amount</span>
      <span style="font-size: 32px; font-weight: bold; color: #0f172a;">{{total_amount}}</span>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #eaeaea; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">Please let us know if you have any questions.</p>
  </div>
</div>`.trim(),
    directAmountHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #8b5cf6; padding: 30px; text-align: center; color: white;">
    <h3 style="margin: 0; font-weight: normal; opacity: 0.9;">PURCHASE ORDER AMOUNT</h3>
    <h1 style="margin: 10px 0 0; font-size: 42px;">{{total_amount}}</h1>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{vendor_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">We have attached Purchase Order <strong>{{po_number}}</strong> from <strong>{{company_name}}</strong> for your processing.</p>
  </div>
</div>`.trim()
  },
  bill: {
    subject: "Bill from {{company_name}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
    <h2 style="margin: 0; color: #334155;">Bill from {{company_name}}</h2>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{client_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Here are the details for your bill:</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 5px 0; color: #64748b;">Bill Number:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{bill_number}}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Due Date:</td><td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a;">{{due_date}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 14px; color: #64748b; display: block; margin-bottom: 5px;">Total Amount</span>
      <span style="font-size: 32px; font-weight: bold; color: #0f172a;">{{total_amount}}</span>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #eaeaea; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">Thank you.</p>
  </div>
</div>`.trim(),
    directAmountHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #f59e0b; padding: 30px; text-align: center; color: white;">
    <h3 style="margin: 0; font-weight: normal; opacity: 0.9;">BILL AMOUNT</h3>
    <h1 style="margin: 10px 0 0; font-size: 42px;">{{total_amount}}</h1>
  </div>
  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; color: #475569;">Hi <strong>{{client_name}}</strong>,</p>
    <p style="font-size: 16px; color: #475569;">Your bill <strong>{{bill_number}}</strong> is ready and attached below. Please note the due date: <strong>{{due_date}}</strong>.</p>
  </div>
</div>`.trim()
  }
};
