import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { numberToWords } from "@/lib/number-to-words";
import { INDIAN_STATES } from "@/lib/constants";
import { MapPin, Phone, Mail, Globe, CreditCard, FileText, Calendar, Building2, User, ShieldCheck, QrCode } from "lucide-react";

interface CorporateBlueInvoiceTemplateProps {
  org: any;
  invoice: any;
  lines: any[];
  fmt: (n: number) => string;
  type?: "invoice" | "estimate" | "bill" | "po";
  taxBreakdown?: { name: string; amount: number; rate?: number }[];
  isInterstate?: boolean;
}

function formatAmountInWords(num: number): string {
  const rounded = Math.round(num * 100) / 100;
  const integerPart = Math.floor(Math.abs(rounded));
  const decimalPart = Math.round((Math.abs(rounded) - integerPart) * 100);
  let words = numberToWords(integerPart) + " Rupees";
  if (decimalPart > 0) {
    words += " and " + numberToWords(decimalPart) + " Paise";
  }
  return words + " Only";
}

export function CorporateBlueInvoiceTemplate({
  org,
  invoice,
  lines,
  fmt,
  type = "invoice",
  taxBreakdown = [],
  isInterstate = false,
}: CorporateBlueInvoiceTemplateProps) {
  const primaryBlue = "#0a47d0";
  const darkNavy = "#002060";
  const lightBlueBg = "#eef4ff";
  const lightBorder = "#c7d2fe";

  const clientName = (invoice.clients as any)?.display_name || (invoice.vendors as any)?.name || (invoice.vendors as any)?.display_name || invoice.client_name || "Client Name";
  const clientGst = (invoice.clients as any)?.tax_number || (invoice.vendors as any)?.tax_number || invoice.client_gst;
  const clientPhone = (invoice.clients as any)?.phone || (invoice.vendors as any)?.phone || invoice.client_phone;
  const number = type === "estimate" ? invoice.estimate_number : (type === "po" ? invoice.po_number : (type === "bill" ? invoice.bill_number : invoice.invoice_number));
  const balanceDue = type === "estimate" ? Number(invoice.total) : Number(invoice.balance_due ?? invoice.total);

  // Address parsing
  const addressLines: string[] = useMemo(() => {
    if (!org?.address) return [];
    try {
      const a = typeof org.address === "string" ? JSON.parse(org.address) : org.address;
      const res: string[] = [];
      if (a?.street) res.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) res.push(cityLine);
      if (a?.country) res.push(a.country);
      return res;
    } catch {
      return [String(org.address)];
    }
  }, [org?.address]);

  const billToAddressLines: string[] = useMemo(() => {
    if (!invoice?.billing_address) return [];
    try {
      const a = typeof invoice.billing_address === "string" ? JSON.parse(invoice.billing_address) : invoice.billing_address;
      const res: string[] = [];
      if (a?.street) res.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) res.push(cityLine);
      if (a?.country) res.push(a.country);
      return res;
    } catch {
      return [String(invoice.billing_address)];
    }
  }, [invoice?.billing_address]);

  // Place of Supply
  const placeOfSupply = useMemo(() => {
    const pos = invoice.place_of_supply || (invoice.billing_address as any)?.state || org?.state;
    if (!pos) return "Maharashtra (27)";
    const foundState = INDIAN_STATES.find(s => s.code === pos || s.name.toLowerCase() === String(pos).toLowerCase());
    if (foundState) return `${foundState.name} (${foundState.code})`;
    return String(pos);
  }, [invoice.place_of_supply, invoice.billing_address, org?.state]);

  // Detailed tax rates mapping for middle breakdown
  const taxGroupBreakdown = useMemo(() => {
    const map: Record<number, number> = {}; // rate % -> taxable amount
    for (const l of lines) {
      const rate = Number(l.tax_rate || l.gst_rate || (l.tax_amount > 0 && l.amount > 0 ? Math.round((l.tax_amount / l.amount) * 100) : 0));
      const taxAmt = Number(l.tax_amount || 0);
      if (taxAmt > 0) {
        map[rate] = (map[rate] || 0) + taxAmt;
      }
    }
    return Object.entries(map).map(([rateStr, totalTaxAmt]) => ({
      rate: Number(rateStr),
      amount: totalTaxAmt,
    }));
  }, [lines]);

  const totalQty = useMemo(() => lines.reduce((acc, l) => acc + Number(l.quantity || 0), 0), [lines]);
  const totalTax = useMemo(() => Number(invoice.total_tax || 0), [invoice.total_tax]);
  const subtotal = useMemo(() => Number(invoice.subtotal || invoice.total), [invoice.subtotal, invoice.total]);
  const grandTotal = useMemo(() => Number(invoice.total || 0), [invoice.total]);

  const titleText = type === "estimate" ? "ESTIMATE" : (type === "po" ? "PURCHASE ORDER" : (type === "bill" ? "BILL" : "TAX INVOICE"));

  return (
    <div
      className="bg-white text-slate-800"
      style={{
        fontFamily: "'Inter', sans-serif, system-ui",
        fontSize: 12,
        lineHeight: 1.4,
        padding: "24px 32px",
        color: "#0f172a",
        minHeight: "297mm",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        {/* Company Info Left */}
        <div style={{ flex: 1, paddingRight: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            {org?.template_show_logo !== false && org?.logo_url ? (
              <img src={org.logo_url} alt={org.name} style={{ maxHeight: 54, maxWidth: 180, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 42, height: 42, background: primaryBlue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontWeight: 900, fontSize: 22 }}>
                A
              </div>
            )}
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: darkNavy, letterSpacing: -0.3, lineHeight: 1.1 }}>
                {org?.name || "COMPANY NAME"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {org?.tagline || "Your Tagline Goes Here"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 10, fontSize: 11, color: "#334155" }}>
            {addressLines.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin style={{ width: 13, height: 13, color: primaryBlue, flexShrink: 0 }} />
                <span>{addressLines.join(", ")}</span>
              </div>
            )}
            {org?.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone style={{ width: 13, height: 13, color: primaryBlue, flexShrink: 0 }} />
                <span>{org.phone}</span>
              </div>
            )}
            {org?.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail style={{ width: 13, height: 13, color: primaryBlue, flexShrink: 0 }} />
                <span>{org.email}</span>
              </div>
            )}
            {org?.website && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Globe style={{ width: 13, height: 13, color: primaryBlue, flexShrink: 0 }} />
                <span>{org.website}</span>
              </div>
            )}
            {org?.gst_enabled && org?.gst_number && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginTop: 2 }}>
                <Building2 style={{ width: 13, height: 13, color: primaryBlue, flexShrink: 0 }} />
                <span>GSTIN: {org.gst_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1.5, background: "#cbd5e1", margin: "0 16px" }} />

        {/* Invoice Meta Right */}
        <div style={{ width: 300, textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: darkNavy, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {titleText}
          </div>
          <div style={{ height: 3.5, background: primaryBlue, width: "100%", marginTop: 4, marginBottom: 14, borderRadius: 2 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              <div style={{ background: lightBlueBg, color: primaryBlue, padding: 4, borderRadius: 4 }}>
                <FileText style={{ width: 14, height: 14 }} />
              </div>
              <span style={{ fontWeight: 700, width: 100, textAlign: "left" }}>Invoice No.</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>: {number}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              <div style={{ background: lightBlueBg, color: primaryBlue, padding: 4, borderRadius: 4 }}>
                <Calendar style={{ width: 14, height: 14 }} />
              </div>
              <span style={{ fontWeight: 700, width: 100, textAlign: "left" }}>Invoice Date</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>: {invoice.issue_date || invoice.bill_date || invoice.date || "-"}</span>
            </div>

            {(type === "invoice" || type === "bill") && invoice.due_date && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ background: lightBlueBg, color: primaryBlue, padding: 4, borderRadius: 4 }}>
                  <Calendar style={{ width: 14, height: 14 }} />
                </div>
                <span style={{ fontWeight: 700, width: 100, textAlign: "left" }}>Due Date</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>: {invoice.due_date}</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              <div style={{ background: lightBlueBg, color: primaryBlue, padding: 4, borderRadius: 4 }}>
                <MapPin style={{ width: 14, height: 14 }} />
              </div>
              <span style={{ fontWeight: 700, width: 100, textAlign: "left" }}>Place of Supply</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>: {placeOfSupply}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BILL TO Section */}
      <div style={{ border: `1px solid ${lightBorder}`, borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: lightBlueBg, borderBottom: `1px solid ${lightBorder}`, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8, color: primaryBlue, fontWeight: 800, fontSize: 12 }}>
          <User style={{ width: 15, height: 15 }} />
          <span>BILL TO</span>
        </div>
        <div style={{ padding: "10px 14px", fontSize: 11, background: "#ffffff" }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: darkNavy, marginBottom: 2 }}>{clientName}</div>
          {billToAddressLines.map((line, idx) => (
            <div key={idx} style={{ color: "#475569" }}>{line}</div>
          ))}
          <div style={{ display: "flex", gap: 24, marginTop: 6, fontWeight: 600, color: "#1e293b" }}>
            {clientGst && <div>GSTIN : <span style={{ fontWeight: 700 }}>{clientGst}</span></div>}
            {clientPhone && <div>Mobile : <span style={{ fontWeight: 700 }}>{clientPhone}</span></div>}
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, border: "1px solid #cbd5e1" }}>
        <thead>
          <tr style={{ background: primaryBlue, color: "#ffffff", fontSize: 11, fontWeight: 700 }}>
            <th style={{ padding: "8px 6px", textAlign: "center", width: 36, borderRight: "1px solid #2563eb" }}>#</th>
            <th style={{ padding: "8px 10px", textAlign: "left", borderRight: "1px solid #2563eb" }}>DESCRIPTION</th>
            <th style={{ padding: "8px 6px", textAlign: "center", width: 90, borderRight: "1px solid #2563eb" }}>HSN / SAC</th>
            <th style={{ padding: "8px 6px", textAlign: "center", width: 50, borderRight: "1px solid #2563eb" }}>QTY</th>
            <th style={{ padding: "8px 10px", textAlign: "right", width: 90, borderRight: "1px solid #2563eb" }}>RATE (₹)</th>
            <th style={{ padding: "8px 6px", textAlign: "center", width: 70, borderRight: "1px solid #2563eb" }}>GST %</th>
            <th style={{ padding: "8px 10px", textAlign: "right", width: 110, borderRight: "1px solid #2563eb" }}>GST AMOUNT (₹)</th>
            <th style={{ padding: "8px 10px", textAlign: "right", width: 100 }}>TOTAL (₹)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => {
            const taxAmt = Number(line.tax_amount || 0);
            const lineAmt = Number(line.amount || 0);
            const gstRate = line.tax_rate || line.gst_rate || (taxAmt > 0 && lineAmt > 0 ? Math.round((taxAmt / lineAmt) * 100) : 0);
            const lineTotal = lineAmt + taxAmt;

            return (
              <tr key={line.id || idx} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #e2e8f0" }}>{idx + 1}</td>
                <td style={{ padding: "8px 10px", textAlign: "left", borderRight: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{line.name}</div>
                  {line.description && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, whiteSpace: "pre-wrap" }}>{line.description}</div>}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #e2e8f0", color: "#475569" }}>{line.hsn_code || "-"}</td>
                <td style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #e2e8f0", fontWeight: 600 }}>{line.quantity}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", borderRight: "1px solid #e2e8f0" }}>{Number(line.rate).toFixed(2)}</td>
                <td style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>{gstRate > 0 ? `${gstRate}%` : "-"}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", borderRight: "1px solid #e2e8f0" }}>{taxAmt > 0 ? taxAmt.toFixed(2) : "-"}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          {/* Summary Row */}
          <tr style={{ background: "#f1f5f9", fontWeight: 800, borderTop: "2px solid #cbd5e1" }}>
            <td colSpan={2} style={{ padding: "8px 10px", textAlign: "center", borderRight: "1px solid #cbd5e1" }}>TOTAL</td>
            <td style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #cbd5e1" }}>-</td>
            <td style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #cbd5e1" }}>{totalQty}</td>
            <td style={{ padding: "8px 10px", textAlign: "right", borderRight: "1px solid #cbd5e1" }}>-</td>
            <td style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #cbd5e1" }}>-</td>
            <td style={{ padding: "8px 10px", textAlign: "right", borderRight: "1px solid #cbd5e1" }}>{totalTax.toFixed(2)}</td>
            <td style={{ padding: "8px 10px", textAlign: "right", color: darkNavy, fontSize: 13 }}>{grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Middle Section: Notes & Tax Breakdown */}
      <div style={{ display: "flex", gap: 32, marginBottom: 24, alignItems: "flex-start" }}>
        {/* Left Side: Notes */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: darkNavy, marginBottom: 4, textDecoration: "underline" }}>Notes:</div>
          <div style={{ fontSize: 11, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {invoice.notes ? (
              invoice.notes
            ) : (
              <>
                1. Please make the payment within the due date.<br />
                2. Interest @ 18% p.a. will be charged on overdue invoices.
              </>
            )}
          </div>
          
          <div style={{ textAlign: "center", marginTop: 36, color: primaryBlue, fontFamily: "serif", fontStyle: "italic", fontSize: 13, fontWeight: 600 }}>
            —— Thank you for your business! ——
          </div>
        </div>

        {/* Right Side: Totals & Tax Breakdown */}
        <div style={{ width: 330, fontSize: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ color: "#475569" }}>Total Items</span>
            <span style={{ fontWeight: 700 }}>: {lines.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ color: "#475569" }}>Total GST Amount</span>
            <span style={{ fontWeight: 700 }}>: ₹ {totalTax.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ color: "#475569" }}>Total Amount</span>
            <span style={{ fontWeight: 700 }}>: ₹ {subtotal.toFixed(2)}</span>
          </div>

          <div style={{ borderTop: "1px dashed #cbd5e1", margin: "6px 0" }} />

          {/* Explicit GST Breakdown Rows */}
          {taxGroupBreakdown.length > 0 ? (
            taxGroupBreakdown.map((tb) => {
              if (!isInterstate) {
                const halfRate = tb.rate / 2;
                const halfTax = tb.amount / 2;
                return (
                  <div key={tb.rate}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span style={{ color: "#475569" }}>CGST @ {halfRate}%</span>
                      <span style={{ fontWeight: 700 }}>: ₹ {halfTax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span style={{ color: "#475569" }}>SGST @ {halfRate}%</span>
                      <span style={{ fontWeight: 700 }}>: ₹ {halfTax.toFixed(2)}</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={tb.rate} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span style={{ color: "#475569" }}>IGST @ {tb.rate}%</span>
                    <span style={{ fontWeight: 700 }}>: ₹ {tb.amount.toFixed(2)}</span>
                  </div>
                );
              }
            })
          ) : taxBreakdown && taxBreakdown.length > 0 ? (
            taxBreakdown.map((tb, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ color: "#475569" }}>{tb.name}</span>
                <span style={{ fontWeight: 700 }}>: ₹ {tb.amount.toFixed(2)}</span>
              </div>
            ))
          ) : null}

          {/* TCS / TDS */}
          {invoice.tds_tcs_applicable && Number(invoice.tds_tcs_amount) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ color: "#475569" }}>{invoice.tds_tcs_type?.toUpperCase() || "TDS"} @ {invoice.tds_tcs_rate || 0}% (Optional)</span>
              <span style={{ fontWeight: 700 }}>: {invoice.tds_tcs_type === "tds" ? "-" : "+"} ₹ {Number(invoice.tds_tcs_amount).toFixed(2)}</span>
            </div>
          )}

          {/* GRAND TOTAL BOX */}
          <div style={{ background: lightBlueBg, border: `1px solid ${lightBorder}`, borderRadius: 6, padding: "8px 12px", marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 900, fontSize: 15, color: darkNavy }}>GRAND TOTAL</span>
              <span style={{ fontWeight: 900, fontSize: 20, color: primaryBlue }}>₹ {grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: 10, color: "#334155", textAlign: "center", marginTop: 4, fontStyle: "italic" }}>
              ( Amount in Words: {formatAmountInWords(grandTotal)} )
            </div>
          </div>
        </div>
      </div>

      {/* 5. Footer Grid: Bank Details, Terms, QR & Signature */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 1fr", gap: 16, paddingTop: 14, borderTop: "1.5px solid #cbd5e1", fontSize: 11 }}>
        {/* Bank Details */}
        <div>
          <div style={{ fontWeight: 800, color: darkNavy, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <CreditCard style={{ width: 14, height: 14, color: primaryBlue }} />
            <span>BANK DETAILS</span>
          </div>
          <div style={{ fontSize: 10, color: "#334155", display: "flex", flexDirection: "column", gap: 2 }}>
            <div>Account Name : <span style={{ fontWeight: 600 }}>{org?.bank_account_name || org?.name || "Company Name"}</span></div>
            <div>Bank Name : <span style={{ fontWeight: 600 }}>{org?.bank_name || "HDFC Bank"}</span></div>
            <div>Account No. : <span style={{ fontWeight: 600 }}>{org?.bank_account_number || "50200012345678"}</span></div>
            <div>IFSC Code : <span style={{ fontWeight: 600 }}>{org?.bank_ifsc || "HDFC0001234"}</span></div>
            <div>Branch : <span style={{ fontWeight: 600 }}>{org?.bank_branch || "City Center Branch"}</span></div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div>
          <div style={{ fontWeight: 800, color: darkNavy, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <ShieldCheck style={{ width: 14, height: 14, color: primaryBlue }} />
            <span>TERMS &amp; CONDITIONS</span>
          </div>
          <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.4 }}>
            {invoice.terms ? (
              <div style={{ whiteSpace: "pre-wrap" }}>{invoice.terms}</div>
            ) : (
              <>
                1. Goods once sold will not be taken back.<br />
                2. Warranty is applicable as per manufacturer policy only.<br />
                3. Subject to jurisdiction only.
              </>
            )}
            <div style={{ textAlign: "center", marginTop: 8, fontStyle: "italic", color: primaryBlue, fontWeight: 600 }}>
              —— Thank You! ——
            </div>
          </div>
        </div>

        {/* Scan to Pay */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, color: darkNavy, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
            <QrCode style={{ width: 14, height: 14, color: primaryBlue }} />
            <span>SCAN TO PAY</span>
          </div>
          <div style={{ display: "inline-block", background: "#ffffff", padding: 4, border: "1px solid #e2e8f0", borderRadius: 4 }}>
            <QRCodeSVG
              value={
                org?.upi_id
                  ? `upi://pay?pa=${org.upi_id}&pn=${encodeURIComponent(org.name || "")}&am=${grandTotal.toFixed(2)}&cu=INR`
                  : `https://billflow.pro/portal`
              }
              size={64}
              level="M"
            />
          </div>
        </div>

        {/* Authorized Signature */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, color: darkNavy }}>AUTHORIZED SIGNATURE</div>
          <div style={{ margin: "12px 0 4px" }}>
            {org?.signature_url ? (
              <img src={org.signature_url} alt="Signature" style={{ maxHeight: 36, margin: "0 auto" }} />
            ) : (
              <div style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 18, color: primaryBlue, opacity: 0.8 }}>
                Sanya
              </div>
            )}
          </div>
          <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 3, fontSize: 10, color: "#64748b" }}>
            For, {org?.name || "Company Name"}
          </div>
        </div>
      </div>

      {/* 6. Bottom Banner */}
      <div style={{ background: primaryBlue, color: "#ffffff", borderRadius: "0 0 4px 4px", marginTop: 14, padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontWeight: 600 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Mail style={{ width: 12, height: 12 }} />
          <span>{org?.email || "info@companyname.com"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Globe style={{ width: 12, height: 12 }} />
          <span>{org?.website || "www.companyname.com"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Phone style={{ width: 12, height: 12 }} />
          <span>{org?.phone || "+91 98765 43210"}</span>
        </div>
      </div>
    </div>
  );
}
