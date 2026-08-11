import { QRCodeSVG } from "qrcode.react";
import { CorporateBlueInvoiceTemplate } from "./CorporateBlueInvoiceTemplate";

interface StyledInvoiceTemplateProps {
  org: any;
  invoice: any;
  lines: any[];
  fmt: (n: number) => string;
  type?: "invoice" | "estimate" | "bill" | "po";
  taxBreakdown?: { name: string; amount: number }[];
  isInterstate?: boolean;
}

const getTitleText = (type: string) => {
  if (type === "estimate") return "ESTIMATE";
  if (type === "po") return "PURCHASE ORDER";
  if (type === "bill") return "BILL";
  return "TAX INVOICE";
};

export function StyledInvoiceTemplate({ org, invoice, lines, fmt, type = "invoice", taxBreakdown, isInterstate }: StyledInvoiceTemplateProps) {
  if (org?.template_style === "corporate_blue") {
    return (
      <CorporateBlueInvoiceTemplate
        org={org}
        invoice={invoice}
        lines={lines}
        fmt={fmt}
        type={type}
        taxBreakdown={taxBreakdown}
        isInterstate={isInterstate}
      />
    );
  }

  const accent = (org?.template_accent_color as string) || "#2563eb";
  const font = (org?.template_font as string) || "Inter, system-ui, sans-serif";
  const showLogo = org?.template_show_logo !== false;

  const clientName = (invoice.clients as any)?.display_name || "";
  const clientGst = (invoice.clients as any)?.tax_number;
  const number = type === "estimate" ? invoice.estimate_number : (type === "po" ? invoice.po_number : invoice.invoice_number);
  const balanceDue = type === "estimate" ? Number(invoice.total) : Number(invoice.balance_due ?? invoice.total);
  const hasGst = Boolean(org?.gst_number);

  const addressLines: string[] = [];
  if (org?.address) {
    try {
      const a = typeof org.address === "string" ? JSON.parse(org.address) : org.address;
      if (a?.street) addressLines.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) addressLines.push(cityLine);
      if (a?.country) addressLines.push(a.country);
    } catch {}
  }

  const billToAddressLines: string[] = [];
  if (invoice?.billing_address) {
    try {
      const a = typeof invoice.billing_address === "string" ? JSON.parse(invoice.billing_address) : invoice.billing_address;
      if (a?.street) billToAddressLines.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) billToAddressLines.push(cityLine);
      if (a?.country) billToAddressLines.push(a.country);
    } catch {}
  }

  const shipToAddressLines: string[] = [];
  if (invoice?.shipping_address) {
    try {
      const a = typeof invoice.shipping_address === "string" ? JSON.parse(invoice.shipping_address) : invoice.shipping_address;
      if (a?.street) shipToAddressLines.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) shipToAddressLines.push(cityLine);
      if (a?.country) shipToAddressLines.push(a.country);
    } catch {}
  }

  const thStyle = { background: "#f4f4f5", color: "#18181b", padding: "8px 10px", fontWeight: 600, borderBottom: "1px solid #e4e4e7", fontSize: 11, textAlign: "right" as const };
  const tdStyle = { padding: "8px 10px", borderBottom: "1px solid #f4f4f5", verticalAlign: "top", textAlign: "right" as const };

  return (
    <div
      className="bg-white text-zinc-900"
      style={{
        fontFamily: font,
        fontSize: 12,
        lineHeight: 1.5,
        padding: "20px 32px",
        color: "#000",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${accent}`, paddingBottom: 16, marginBottom: 20 }}>
        <div>
          {showLogo && org?.logo_url && (
            <img src={org.logo_url} alt={org.name} style={{ maxHeight: 64, maxWidth: 200, objectFit: "contain", marginBottom: 12 }} />
          )}
          <div style={{ fontWeight: 800, fontSize: 18, color: accent }}>{org?.name}</div>
          {addressLines.map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: "#3f3f46" }}>{l}</div>
          ))}
          {org?.phone && <div style={{ fontSize: 11, color: "#3f3f46" }}>Tel: {org.phone}</div>}
          {org?.email && <div style={{ fontSize: 11, color: "#3f3f46" }}>{org.email}</div>}
          {org?.gst_enabled && org?.gst_number && (
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>GSTIN: {org.gst_number}</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: 0.5, color: accent }}>{getTitleText(type)}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "#71717a", marginRight: 8 }}>Invoice#:</span>
            <span style={{ fontWeight: 600 }}>{number}</span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#71717a", marginRight: 8 }}>Date:</span>
            <span style={{ fontWeight: 600 }}>{invoice.issue_date}</span>
          </div>
          {type === "invoice" && invoice.due_date && (
            <div>
              <span style={{ fontSize: 11, color: "#71717a", marginRight: 8 }}>Due Date:</span>
              <span style={{ fontWeight: 600 }}>{invoice.due_date}</span>
            </div>
          )}
          {type === "estimate" && invoice.expiry_date && (
            <div>
              <span style={{ fontSize: 11, color: "#71717a", marginRight: 8 }}>Valid Till:</span>
              <span style={{ fontWeight: 600 }}>{invoice.expiry_date}</span>
            </div>
          )}
          {invoice.reference_number && (
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#71717a", marginRight: 8 }}>Ref#:</span>
              <span>{invoice.reference_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Bill To</div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{clientName}</div>
          {billToAddressLines.map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: "#3f3f46" }}>{l}</div>
          ))}
          {clientGst && org?.gst_enabled && org?.show_client_gst && (
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>GSTIN: {clientGst}</div>
          )}
        </div>
        {shipToAddressLines.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Ship To</div>
            {shipToAddressLines.map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: "#3f3f46" }}>{l}</div>
            ))}
          </div>
        )}
      </div>

      {/* IRN & E-Invoice Details */}
      {(invoice.irn || invoice.ack_no) && (
        <div style={{ marginBottom: 20, padding: 12, border: "1px solid #e4e4e7", borderRadius: 6, background: "#fafafa" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>E-Invoice Details</div>
          <div style={{ display: "grid", gridTemplateColumns: invoice.irn_qr ? "1fr auto" : "1fr", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11 }}>
              {invoice.irn && <div style={{ gridColumn: "span 2" }}><span style={{ color: "#71717a" }}>IRN:</span> <strong style={{ display: "block", wordBreak: "break-all" }}>{invoice.irn}</strong></div>}
              {invoice.ack_no && <div><span style={{ color: "#71717a" }}>Ack No:</span> <strong style={{ display: "block" }}>{invoice.ack_no}</strong></div>}
              {invoice.ack_date && <div><span style={{ color: "#71717a" }}>Ack Date:</span> <strong style={{ display: "block" }}>{invoice.ack_date}</strong></div>}
            </div>
            {invoice.irn_qr && (
              <div>
                <QRCodeSVG value={invoice.irn_qr} size={64} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* E-Way Bill Details */}
      {invoice.eway_bill_no && (
        <div style={{ marginBottom: 20, padding: 12, border: "1px solid #e4e4e7", borderRadius: 6, background: "#fafafa" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>E-Way Bill Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 11 }}>
            <div><span style={{ color: "#71717a" }}>E-Way Bill No:</span> <strong style={{ display: "block" }}>{invoice.eway_bill_no}</strong></div>
            {invoice.eway_vehicle_no && <div><span style={{ color: "#71717a" }}>Vehicle No:</span> <strong style={{ display: "block" }}>{invoice.eway_vehicle_no}</strong></div>}
            {invoice.eway_transport_mode && <div><span style={{ color: "#71717a" }}>Transport Mode:</span> <strong style={{ display: "block" }}>{invoice.eway_transport_mode}</strong></div>}
            {invoice.eway_distance_km && <div><span style={{ color: "#71717a" }}>Distance (Km):</span> <strong style={{ display: "block" }}>{invoice.eway_distance_km}</strong></div>}
          </div>
        </div>
      )}

      {/* Line Items */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, border: "1px solid #e4e4e7" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "left", width: 30 }}>#</th>
            <th style={{ ...thStyle, textAlign: "left" }}>Item &amp; Description</th>
            <th style={{ ...thStyle, textAlign: "left", width: 60 }}>HSN/SAC</th>
            <th style={{ ...thStyle, width: 60 }}>Qty</th>
            <th style={{ ...thStyle, width: 80 }}>Rate</th>
            {hasGst && !isInterstate && (
              <>
                <th style={{ ...thStyle, width: 80 }}>CGST</th>
                <th style={{ ...thStyle, width: 80 }}>SGST</th>
              </>
            )}
            {hasGst && isInterstate && (
              <th style={{ ...thStyle, width: 80 }}>IGST</th>
            )}
            <th style={{ ...thStyle, width: 100 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => {
            const taxAmount = Number(line.tax_amount || 0);
            const isZeroTax = taxAmount === 0;
            const halfTax = taxAmount / 2;
            
            // Try to infer tax rate from amount, if we have rate and amount
            const lineAmt = Number(line.amount || 1); 
            // the exact rate is usually not in the line, but we can compute % roughly for display if needed. 
            // In typical Indian invoices, rate % is shown under the amount, or just the amount.
            // We will just show the amount.
            
            return (
              <tr key={line.id}>
                <td style={{ ...tdStyle, textAlign: "left" }}>{idx + 1}</td>
                <td style={{ ...tdStyle, textAlign: "left" }}>
                  <div style={{ fontWeight: 600 }}>{line.name}</div>
                  {line.description && <div style={{ fontSize: 10, color: "#52525b", marginTop: 2, whiteSpace: "pre-wrap" }}>{line.description}</div>}
                </td>
                <td style={{ ...tdStyle, textAlign: "left", fontSize: 11 }}>{line.hsn_code || "-"}</td>
                <td style={{ ...tdStyle }}>
                  <div style={{ fontWeight: 600 }}>
                    {line.quantity}
                    {line.unit && <span style={{ fontSize: 10, color: "#71717a", marginLeft: 2 }}>{line.unit}</span>}
                  </div>
                  {invoice?.show_sub_units !== false && line.sub_unit && line.sub_unit_conversion_rate && Number(line.sub_unit_conversion_rate) > 1 && line.unit?.toLowerCase() !== line.sub_unit?.toLowerCase() && (
                    <div style={{ fontSize: 9, color: "#71717a", marginTop: 2 }}>
                      (= {(Number(line.quantity) * Number(line.sub_unit_conversion_rate)).toLocaleString("en-IN", { maximumFractionDigits: 2 })} {line.sub_unit})
                    </div>
                  )}
                </td>
                <td style={{ ...tdStyle }}>
                  <div style={{ fontWeight: 600 }}>{hasGst ? Number(line.rate).toFixed(2) : (Number(line.amount || 0) / (Number(line.quantity) || 1)).toFixed(2)}</div>
                  {Number(line.discount) > 0 && (
                    <div style={{ fontSize: 9, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>
                      {line.discount}% disc.
                    </div>
                  )}
                  {line.sub_unit && Number(line.sub_unit_conversion_rate) > 1 && line.unit?.toLowerCase() !== line.sub_unit?.toLowerCase() && (
                    <div style={{ fontSize: 9, color: "#71717a", marginTop: 2 }}>
                      1 {line.unit} = {line.sub_unit_conversion_rate} {line.sub_unit}
                    </div>
                  )}
                </td>
                {hasGst && !isInterstate && (
                  <>
                    <td style={{ ...tdStyle }}>{isZeroTax ? "-" : fmt(halfTax)}</td>
                    <td style={{ ...tdStyle }}>{isZeroTax ? "-" : fmt(halfTax)}</td>
                  </>
                )}
                {hasGst && isInterstate && (
                  <td style={{ ...tdStyle }}>{isZeroTax ? "-" : fmt(taxAmount)}</td>
                )}
                <td style={{ ...tdStyle, fontWeight: 700 }}>
                  {fmt(hasGst ? lineAmt - taxAmount : lineAmt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals & Notes */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40 }}>
        
        {/* Left Side: Notes & Bank Details & QR */}
        <div style={{ flex: 1 }}>
          {invoice.notes && invoice.notes.trim() && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 11, whiteSpace: "pre-wrap", color: "#3f3f46" }}>{invoice.notes.trim()}</div>
            </div>
          )}
          {(invoice.terms_conditions || invoice.terms || invoice.default_terms || org?.default_terms) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 4 }}>Terms &amp; Conditions</div>
              <div style={{ fontSize: 11, whiteSpace: "pre-wrap", color: "#3f3f46" }}>
                {(invoice.terms_conditions || invoice.terms || invoice.default_terms || org?.default_terms).trim()}
              </div>
            </div>
          )}

          {(() => {
            const invoiceBank = invoice?.bank_details;
            const isBankDisabled = invoiceBank && invoiceBank.enabled === false;
            const bankAccName = invoiceBank?.bank_account_name || (!isBankDisabled ? (org?.bank_account_name || org?.name) : null);
            const bankName = invoiceBank?.bank_name || (!isBankDisabled ? org?.bank_name : null);
            const bankAccNum = invoiceBank?.bank_account_number || (!isBankDisabled ? org?.bank_account_number : null);
            const bankIfsc = invoiceBank?.bank_ifsc || (!isBankDisabled ? org?.bank_ifsc : null);
            const bankBranch = invoiceBank?.bank_branch || (!isBankDisabled ? org?.bank_branch : null);
            const hasBankDetails = !isBankDisabled && Boolean(bankName || bankAccNum || bankIfsc);

            if (!hasBankDetails) return null;
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 4 }}>Bank Details</div>
                <div style={{ fontSize: 11, color: "#3f3f46", display: "flex", flexDirection: "column", gap: 2 }}>
                  {bankAccName && <div>Account Name: <span style={{ fontWeight: 600 }}>{bankAccName}</span></div>}
                  {bankName && <div>Bank Name: <span style={{ fontWeight: 600 }}>{bankName}</span></div>}
                  {bankAccNum && <div>Account No: <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{bankAccNum}</span></div>}
                  {bankIfsc && <div>IFSC Code: <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{bankIfsc}</span></div>}
                  {bankBranch && <div>Branch: <span style={{ fontWeight: 600 }}>{bankBranch}</span></div>}
                </div>
              </div>
            );
          })()}
          
          {org?.qr_code_enabled && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: 12, border: "1px dashed #d4d4d8", borderRadius: 6 }}>
              <QRCodeSVG
                value={
                  org?.upi_id
                    ? `upi://pay?pa=${org.upi_id}&pn=${encodeURIComponent(org.name || "")}&am=${balanceDue.toFixed(2)}&cu=${invoice.currency_code || "INR"}&tn=${encodeURIComponent(`Payment for ${number}`)}`
                    : `${window.location.origin}/portal/invoice/${invoice.id}`
                }
                size={80}
                level="M"
              />
              <div style={{ fontSize: 11 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{org?.upi_id ? "Scan to Pay" : "Scan to View"}</div>
                {org?.upi_id && <div>UPI: <b>{org.upi_id}</b></div>}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Totals */}
        <div style={{ width: 320, background: "#fafafa", padding: 16, borderRadius: 8, border: "1px solid #e4e4e7" }}>
          <Row label="Subtotal" value={fmt(Number(invoice.subtotal ?? invoice.total))} />
          
          {Number(invoice.total_discount) > 0 && (
            <Row label="Discount" value={"-${fmt(Number(invoice.total_discount))}"} />
          )}

          {hasGst && taxBreakdown && taxBreakdown.length > 0 ? (
            taxBreakdown.map((t, idx) => (
              <Row key={idx} label={t.name} value={fmt(t.amount)} />
            ))
          ) : hasGst && Number(invoice.total_tax) > 0 ? (
            <Row label="Tax" value={fmt(Number(invoice.total_tax))} />
          ) : null}

          {Number(invoice.shipping_charge) > 0 && (
            <Row label="Shipping" value={fmt(Number(invoice.shipping_charge))} />
          )}
          
          {Number(invoice.adjustment) !== 0 && (
            <Row label={invoice.adjustment_name || "Adjustment"} value={Number(invoice.adjustment).toFixed(2)} />
          )}
          
          {invoice.tds_tcs_applicable && Number(invoice.tds_tcs_amount) > 0 && (
            <Row 
              label={`${invoice.tds_tcs_type?.toUpperCase() || "TDS"} (${invoice.tds_tcs_rate || 0}%)`} 
              value={`${invoice.tds_tcs_type === "tds" ? "-" : "+"}${fmt(Number(invoice.tds_tcs_amount))}`} 
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0 8px", paddingTop: 12, borderTop: "2px solid #e4e4e7", fontSize: 16, fontWeight: 800 }}>
            <span>Total</span>
            <span style={{ color: accent }}>{fmt(Number(invoice.total))}</span>
          </div>

          {type === "invoice" && Number(invoice.amount_paid) > 0 && (
            <div style={{ borderTop: "1px dashed #d4d4d8", paddingTop: 8, marginTop: 8 }}>
              <Row label="Amount Paid" value={fmt(Number(invoice.amount_paid))} />
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4, fontWeight: 700, fontSize: 13 }}>
                <span>Balance Due</span>
                <span>{fmt(balanceDue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Authorized Signature */}
      <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: 200 }}>
          <div style={{ height: 60, borderBottom: "1px solid #d4d4d8", marginBottom: 8 }}></div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Authorized Signature</div>
          <div style={{ fontSize: 10, color: "#71717a", marginTop: 2 }}>{org?.name}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
      <span style={{ color: "#52525b" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
