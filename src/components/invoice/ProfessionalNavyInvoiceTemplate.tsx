import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { numberToWords } from "@/lib/number-to-words";
import { INDIAN_STATES } from "@/lib/constants";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ProfessionalNavyInvoiceTemplateProps {
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

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch (e) {
    return dateStr;
  }
}

export function ProfessionalNavyInvoiceTemplate({
  org,
  invoice,
  lines,
  fmt,
  type = "invoice",
  taxBreakdown = [],
  isInterstate = false,
}: ProfessionalNavyInvoiceTemplateProps) {
  const navy = "#001a4d";
  const darkBlue = "#0f2e6b";
  const blue = "#164e9a";
  const grayBorder = "#9ca3af";
  const hasGst = Boolean(org?.gst_number);

  const clientName = (invoice.clients as any)?.display_name || (invoice.vendors as any)?.name || (invoice.vendors as any)?.display_name || invoice.client_name || "Client Name";
  const clientGst = (invoice.clients as any)?.tax_number || (invoice.vendors as any)?.tax_number || invoice.client_gst;
  const number = type === "estimate" ? invoice.estimate_number : (type === "po" ? invoice.po_number : (type === "bill" ? invoice.bill_number : invoice.invoice_number));
  const date = type === "estimate" ? invoice.estimate_date : (type === "po" ? invoice.po_date : (type === "bill" ? invoice.bill_date : invoice.invoice_date));
  const dueDate = type === "estimate" ? invoice.expiry_date : invoice.due_date;
  const balanceDue = type === "estimate" ? Number(invoice.total) : Number(invoice.balance_due ?? invoice.total);

  // Address parsing
  const addressLines: string[] = useMemo(() => {
    if (!org?.address) return [];
    try {
      const a = typeof org.address === "string" ? JSON.parse(org.address) : org.address;
      const res: string[] = [];
      // Support for structured shipping fields
      if (a?.name) res.push("Name: " + a.name);
      if (a?.street) res.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) res.push(cityLine);
      if (a?.country) res.push(a.country);
      if (a?.contact) res.push("Contact: " + a.contact);
      return res;
    } catch {
      return [String(org.address)];
    }
  }, [org?.address]);

  const shipToAddressLines: string[] = useMemo(() => {
    if (org?.shipping_same_as_billing) return [];
    const addr = invoice?.shipping_address || (invoice.clients as any)?.shipping_address;
    if (!addr) return [];
    try {
      const a = typeof addr === "string" ? JSON.parse(addr) : addr;
      const res: string[] = [];
      if (a?.street) res.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) res.push(cityLine);
      if (a?.country) res.push(a.country);
      return res;
    } catch {
      return [String(addr)];
    }
  }, [invoice?.shipping_address, org?.shipping_same_as_billing]);

  const billToAddressLines: string[] = useMemo(() => {
    const addr = invoice?.billing_address || (invoice.clients as any)?.address || (invoice.clients as any)?.billing_address || (invoice.vendors as any)?.address;
    if (!addr) return [];
    try {
      const a = typeof addr === "string" ? JSON.parse(addr) : addr;
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

  const getTitleText = (t: string) => {
    if (t === "estimate") return "ESTIMATE";
    if (t === "po") return "PURCHASE ORDER";
    if (t === "bill") return "BILL";
    return "TAX INVOICE";
  };

  const getNumberLabel = (t: string) => {
    if (t === "estimate") return "Estimate No.";
    if (t === "po") return "PO No.";
    if (t === "bill") return "Bill No.";
    return "Invoice No.";
  };

  const getDateLabel = (t: string) => {
    if (t === "estimate") return "Estimate Date";
    if (t === "po") return "PO Date";
    if (t === "bill") return "Bill Date";
    return "Invoice Date";
  };

  const getDueDateLabel = (t: string) => {
    if (t === "estimate") return "Valid Till";
    return "Due Date";
  };

  const invoiceBank = invoice?.bank_details;
  const isBankDisabled = invoiceBank && invoiceBank.enabled === false;
  const bankAccName = invoiceBank?.bank_account_name || (!isBankDisabled ? (org?.bank_account_name || org?.name) : null);
  const bankName = invoiceBank?.bank_name || (!isBankDisabled ? org?.bank_name : null);
  const bankAccNum = invoiceBank?.bank_account_number || (!isBankDisabled ? org?.bank_account_number : null);
  const bankIfsc = invoiceBank?.bank_ifsc || (!isBankDisabled ? org?.bank_ifsc : null);
  const bankBranch = invoiceBank?.bank_branch || (!isBankDisabled ? org?.bank_branch : null);

  const thStyle = {
    padding: "6px",
    border: "1px solid " + grayBorder,
    borderRight: "1px solid white",
    color: "white",
    fontSize: 10,
    fontWeight: 600,
    textAlign: "center" as any,
    background: navy,
  };
  
  const tdStyle = {
    padding: "6px",
    border: "1px solid " + grayBorder,
    fontSize: 10,
    textAlign: "center" as any,
    color: "#111827"
  };

  const stateObj = INDIAN_STATES.find(s => s.code === invoice.place_of_supply);
  const posName = stateObj ? `${stateObj.name} (${stateObj.code})` : (invoice.place_of_supply || "-");

  return (
    <div style={{
      fontFamily: org?.template_font || "Inter, system-ui, sans-serif",
      color: "#111827",
      maxWidth: 800,
      margin: "0 auto",
      backgroundColor: "#fff",
      boxSizing: "border-box",
      padding: "20px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
        <div style={{ display: "flex", gap: 15 }}>
          {org?.template_show_logo !== false && org?.logo_url && (
            <img src={org.logo_url} alt="Logo" style={{ width: 65, height: 'auto', objectFit: "contain" }} />
          )}
          <div style={{ paddingTop: org?.template_show_logo !== false && org?.logo_url ? 0 : 5 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: navy, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 2 }}>
              {org?.name || "YOUR COMPANY NAME"}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: blue, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
              {org?.tagline || ""}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, color: "#374151" }}>
              {org?.gst_number && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: navy }}>
                  <span>GSTIN: {org.gst_number}</span>
                </div>
              )}
              {addressLines.length > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <MapPin style={{ width: 12, height: 12, color: navy, marginTop: 1 }} />
                  <span>{addressLines.join(", ")}</span>
                </div>
              )}
              {org?.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Phone style={{ width: 12, height: 12, color: navy }} />
                  <span>{org.phone}</span>
                </div>
              )}
              {org?.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail style={{ width: 12, height: 12, color: navy }} />
                  <span>{org.email}</span>
                </div>
              )}
              {org?.website && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe style={{ width: 12, height: 12, color: navy }} />
                  <span>{org.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", minWidth: 280 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: navy, marginBottom: 15 }}>{getTitleText(type)}</div>
          <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left", width: 110 }}>{getNumberLabel(type)}</td>
                <td style={{ padding: "3px 0", textAlign: "left", width: 10 }}>:</td>
                <td style={{ padding: "3px 0", textAlign: "left" }}>{number || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>{getDateLabel(type)}</td>
                <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                <td style={{ padding: "3px 0", textAlign: "left" }}>{formatDate(date)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>{getDueDateLabel(type)}</td>
                <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                <td style={{ padding: "3px 0", textAlign: "left" }}>{formatDate(dueDate)}</td>
              </tr>
              {hasGst && (
                <>
                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>Place of Supply</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>{posName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>Reverse Charge</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>{invoice.reverse_charge ? "Yes" : "No"}</td>
                  </tr>
                </>
              )}
              {org?.custom_fields && org.custom_fields.map((cf: any, idx: number) => (
                <tr key={"cf"+idx}>
                  <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>{cf.name}</td>
                  <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                  <td style={{ padding: "3px 0", textAlign: "left" }}>{cf.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ height: 2, backgroundColor: grayBorder, marginBottom: 15 }}></div>

      {/* Bill To & Ship To */}
      <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
        <div style={{ flex: 1, border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ backgroundColor: navy, color: "white", padding: "6px 12px", fontSize: 11, fontWeight: 700 }}>
            BILL TO
          </div>
          <div style={{ padding: "12px", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue, marginBottom: 4 }}>{clientName}</div>
              {billToAddressLines.map((line, i) => <div key={i}>{line}</div>)}
              {hasGst && clientGst && (
                <div style={{ display: "flex", marginTop: 4 }}>
                  <span style={{ fontWeight: 600, marginRight: 4 }}>GSTIN:</span>
                  <span>{clientGst}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {shipToAddressLines.length > 0 && (
          <div style={{ flex: 1, border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ backgroundColor: navy, color: "white", padding: "6px 12px", fontSize: 11, fontWeight: 700 }}>
              SHIP TO
            </div>
            <div style={{ padding: "12px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue, marginBottom: 4 }}>{clientName}</div>
                {shipToAddressLines.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ borderRadius: 6, overflow: "hidden", border: "1px solid " + grayBorder, marginBottom: 15 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "4%" }}>S. No.</th>
              <th style={{ ...thStyle, textAlign: "left", width: "25%" }}>Description of Goods / Services</th>
              {hasGst && <th style={{ ...thStyle, width: "8%" }}>HSN / SAC</th>}
              <th style={{ ...thStyle, width: "6%" }}>Qty.</th>
              <th style={{ ...thStyle, width: "6%" }}>Unit</th>
              <th style={{ ...thStyle, width: "10%" }}>Rate (₹)</th>
              <th style={{ ...thStyle, width: "11%" }}>Taxable<br/>Value (₹)</th>
              {hasGst && <th style={{ ...thStyle, width: "6%" }}>GST %</th>}
              {hasGst && <th style={{ ...thStyle, width: "10%" }}>GST<br/>Amount (₹)</th>}
              <th style={{ ...thStyle, borderRight: "none", width: "12%" }}>Total<br/>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              const qty = Number(line.quantity) || 0;
              const rate = Number(line.rate) || 0;
              const taxable = qty * rate;
              let taxRate = 0;
              if (hasGst) {
                if (line.tax_rate !== undefined && line.tax_rate !== null) taxRate = Number(line.tax_rate);
                else if (line.tax_rates && line.tax_rates.rate !== undefined && line.tax_rates.rate !== null) taxRate = Number(line.tax_rates.rate);
                else if (line.items?.tax_rate !== undefined && line.items?.tax_rate !== null) taxRate = Number(line.items.tax_rate);
                else if (line.tax_amount && taxable > 0) taxRate = Math.round((Number(line.tax_amount) / taxable) * 100);
              }
              const taxAmount = Number(line.tax_amount) || ((taxable * taxRate) / 100);
              const totalAmount = taxable + taxAmount;
              const itemName = line.items?.name || line.name;

              return (
                <tr key={idx}>
                  <td style={{ ...tdStyle, borderLeft: "none" }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, textAlign: "left" }}>
                    {itemName ? (
                      <>
                        <div style={{ fontWeight: 600, marginBottom: line.description ? 2 : 0 }}>{itemName}</div>
                        {line.description && <div style={{ fontSize: 9, color: "#4b5563", whiteSpace: "pre-wrap" }}>{line.description}</div>}
                      </>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>{line.description}</div>
                    )}
                  </td>
                  {hasGst && <td style={{ ...tdStyle }}>{line.hsn_sac || "-"}</td>}
                  <td style={{ ...tdStyle }}>{qty}</td>
                  <td style={{ ...tdStyle }}>{line.unit || "Pcs"}</td>
                  <td style={{ ...tdStyle }}>{fmt(rate)}</td>
                  <td style={{ ...tdStyle }}>{fmt(taxable)}</td>
                  {hasGst && <td style={{ ...tdStyle }}>{taxRate ? `${taxRate}%` : "-"}</td>}
                  {hasGst && <td style={{ ...tdStyle }}>{taxAmount ? fmt(taxAmount) : "-"}</td>}
                  <td style={{ ...tdStyle, borderRight: "none" }}>{fmt(totalAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals & Terms */}
      <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
        {/* Left: Totals */}
        <div style={{ flex: 1, border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>Total Taxable Value</td>
                <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(Number(invoice.subtotal ?? invoice.total) + Number(invoice.total_discount))}</td>
              </tr>
              {hasGst && taxBreakdown && taxBreakdown.length > 0 ? (
                taxBreakdown.map((t, i) => (
                  <tr key={i}>
                    <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>{t.name}</td>
                    <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(t.amount)}</td>
                  </tr>
                ))
              ) : hasGst ? (
                <tr>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>Total GST Amount</td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(Number(invoice.total_tax))}</td>
                </tr>
              ) : null}
              {Number(invoice.total_discount) > 0 && (
                <tr>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>Discount</td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(Number(invoice.total_discount))}</td>
                </tr>
              )}
              <tr style={{ backgroundColor: navy, color: "white", fontWeight: 700 }}>
                <td style={{ padding: "8px 12px" }}>GRAND TOTAL</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>₹ {fmt(Number(invoice.total))}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ padding: "6px 12px", fontSize: 10, borderTop: "1px solid " + grayBorder, backgroundColor: "#f9fafb" }}>
            <span style={{ color: darkBlue, fontWeight: 700 }}>Amount in Words: </span>
            {formatAmountInWords(Number(invoice.total))}
          </div>
        </div>

        {/* Right: Terms */}
        <div style={{ flex: 1, border: "1px solid " + grayBorder, borderRadius: 6, padding: "12px", fontSize: 10 }}>
          <div style={{ color: darkBlue, fontWeight: 700, marginBottom: 8, fontSize: 11 }}>TERMS & CONDITIONS</div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#374151", paddingLeft: 12 }}>
            {(invoice.terms_conditions || invoice.terms || invoice.default_terms || org?.default_terms || "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Payment to be made within 15 days from the date of invoice.").split('\n').map((line, i) => (
              <div style={{ position: "relative" }} key={i}>
                <span style={{ position: "absolute", left: -12 }}>{i + 1}.</span> {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bank & UPI Details */}
      {(bankName || bankAccNum || org?.upi_id) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 15 }}>
          {/* Bank */}
          {(bankName || bankAccNum) && (
            <div style={{ border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ backgroundColor: navy, color: "white", padding: "4px 12px", fontSize: 10, fontWeight: 700, width: 140, display: "inline-block" }}>
                BANK DETAILS
              </div>
              <div style={{ padding: "10px 12px", display: "flex", gap: 20, fontSize: 10 }}>
                <table style={{ width: "50%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 100, padding: "2px 0", color: "#374151" }}>Bank Name</td>
                      <td style={{ width: 10 }}>:</td>
                      <td style={{ padding: "2px 0", fontWeight: 600 }}>{bankName || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 0", color: "#374151" }}>Account Name</td>
                      <td style={{ width: 10 }}>:</td>
                      <td style={{ padding: "2px 0", fontWeight: 600 }}>{bankAccName || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 0", color: "#374151" }}>Account Number</td>
                      <td style={{ width: 10 }}>:</td>
                      <td style={{ padding: "2px 0", fontWeight: 600 }}>{bankAccNum || "-"}</td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ width: "50%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 80, padding: "2px 0", color: "#374151" }}>IFSC Code</td>
                      <td style={{ width: 10 }}>:</td>
                      <td style={{ padding: "2px 0", fontWeight: 600 }}>{bankIfsc || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 0", color: "#374151" }}>Branch</td>
                      <td style={{ width: 10 }}>:</td>
                      <td style={{ padding: "2px 0", fontWeight: 600 }}>{bankBranch || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* UPI */}
          {org?.upi_id && (
            <div style={{ border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ display: "flex" }}>
                <div style={{ backgroundColor: navy, color: "white", padding: "4px 12px", fontSize: 10, fontWeight: 700, width: 140, flexShrink: 0 }}>
                  UPI DETAILS
                </div>
                <div style={{ padding: "4px 12px", display: "flex", flex: 1, fontSize: 10 }}>
                  <div style={{ width: 80, color: "#374151" }}>UPI ID</div>
                  <div style={{ width: 10 }}>:</div>
                  <div style={{ fontWeight: 600, flex: 1 }}>{org.upi_id}</div>
                </div>
                <div style={{ borderLeft: "1px solid " + grayBorder, padding: "4px 12px", display: "flex", width: 250, fontSize: 10, flexShrink: 0 }}>
                  <div style={{ width: 80, color: "#374151" }}>Payment Mode</div>
                  <div style={{ width: 10 }}>:</div>
                  <div style={{ fontWeight: 600 }}>NEFT / RTGS / UPI / Cheque</div>
                </div>
              </div>
              <div style={{ display: "flex", borderTop: "1px solid " + grayBorder }}>
                <div style={{ width: 140, flexShrink: 0 }}></div>
                <div style={{ padding: "4px 12px", display: "flex", flex: 1, fontSize: 10 }}></div>
                <div style={{ borderLeft: "1px solid " + grayBorder, padding: "4px 12px", display: "flex", width: 250, fontSize: 10, flexShrink: 0, backgroundColor: "#f9fafb" }}>
                  <div style={{ width: 80, color: "#374151" }}>Payment Due</div>
                  <div style={{ width: 10 }}>:</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(dueDate)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
        {org?.qr_code_enabled && org?.upi_id ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <QRCodeSVG
              value={`upi://pay?pa=${org.upi_id}&pn=${encodeURIComponent(org.name || "")}&am=${balanceDue.toFixed(2)}&cu=${invoice.currency_code || "INR"}&tn=${encodeURIComponent(`Payment for ${number}`)}`}
              size={64}
              level="M"
            />
            <div style={{ fontSize: 9 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Scan & Pay</div>
              <div style={{ color: "#374151" }}>UPI ID: {org.upi_id}</div>
            </div>
          </div>
        ) : (
          <div></div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue }}>
          Thank you for your business!
        </div>

        <div style={{ textAlign: "center", width: 220 }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 40 }}>For {org?.name?.toUpperCase()}</div>
          <div style={{ height: 1, backgroundColor: grayBorder, width: "100%", marginBottom: 4 }}></div>
          <div style={{ fontSize: 10, fontWeight: 600 }}>Authorized Signatory</div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 8, color: "#9ca3af", marginTop: 20 }}>
        This is a computer generated invoice and does not require a physical signature.
      </div>
    </div>
  );
}
