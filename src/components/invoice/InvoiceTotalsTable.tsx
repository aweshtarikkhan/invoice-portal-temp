import React from "react";
import { computeDocumentTotals, formatRoundOffText } from "@/lib/invoiceCalculations";
import { numberToWords } from "@/lib/number-to-words";

export interface InvoiceTotalsTableProps {
  invoice: any;
  lines: any[];
  taxBreakdown?: { name: string; amount: number; rate?: number }[];
  hasGst?: boolean;
  fmt: (n: number) => string;
  primaryColor?: string;
  accentColor?: string;
  variant?: "table" | "corporate" | "minimal";
  className?: string;
  type?: "invoice" | "estimate" | "bill" | "po";
  showItemCount?: boolean;
  totalQty?: number;
  showAmountInWords?: boolean;
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

export function InvoiceTotalsTable({
  invoice,
  lines,
  taxBreakdown,
  hasGst = true,
  fmt,
  primaryColor = "#1e293b",
  accentColor = "#0f172a",
  variant = "table",
  className = "",
  type,
  showItemCount = false,
  totalQty,
  showAmountInWords = true,
  isInterstate = false,
}: InvoiceTotalsTableProps) {
  const {
    subtotalVal,
    discountAmt,
    expensesAmt,
    shippingAmt,
    taxableAmount,
    tdsTcsApplicable,
    tdsTcsRate,
    tdsAmount,
    tcsAmount,
    gstBreakdown,
    totalTaxAmt,
    effectiveAdjustment,
    effectiveAdjustmentName,
    grandTotal,
  } = computeDocumentTotals(invoice, lines, taxBreakdown, hasGst, isInterstate);

  const calculatedTotalQty = totalQty !== undefined 
    ? totalQty 
    : lines.reduce((s: number, l: any) => s + Number(l.quantity || 0), 0);

  if (variant === "corporate" || variant === "minimal") {
    return (
      <div className={`text-[11px] ${className}`} style={{ minWidth: 280 }}>
        {/* Total Items count if requested */}
        {showItemCount && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px dashed #cbd5e1", marginBottom: 6, paddingBottom: 4 }}>
            <span style={{ color: "#475569" }}>Total Items</span>
            <span style={{ fontWeight: 600 }}>{lines.length} ({calculatedTotalQty} Qty)</span>
          </div>
        )}

        {/* Subtotal */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
          <span style={{ color: "#475569" }}>Subtotal</span>
          <span style={{ fontWeight: 600 }}>{fmt(subtotalVal)}</span>
        </div>

        {/* Discount */}
        {discountAmt > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#dc2626" }}>
            <span>
              Discount {invoice?.discount_type === "percentage" && Number(invoice?.discount) > 0 ? `(${invoice.discount}%)` : ""}
            </span>
            <span style={{ fontWeight: 600 }}>- {fmt(discountAmt)}</span>
          </div>
        )}

        {/* Fixed Cost / Expenses */}
        {expensesAmt > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ color: "#475569" }}>Fixed Cost / Expenses</span>
            <span style={{ fontWeight: 600 }}>+ {fmt(expensesAmt)}</span>
          </div>
        )}

        {/* Shipping Charge */}
        {shippingAmt > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ color: "#475569" }}>Shipping Charge</span>
            <span style={{ fontWeight: 600 }}>+ {fmt(shippingAmt)}</span>
          </div>
        )}

        {/* TDS (Deducted before GST on base amount) */}
        {tdsAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#dc2626" }}>
            <span>TDS Deducted {tdsTcsRate > 0 ? `(${tdsTcsRate}%)` : ""}</span>
            <span style={{ fontWeight: 600 }}>- {fmt(tdsAmount)}</span>
          </div>
        )}

        {/* Taxable Amount */}
        {(discountAmt > 0 || expensesAmt > 0 || shippingAmt > 0 || tdsAmount > 0 || hasGst) && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "#f1f5f9", borderRadius: 4, margin: "4px 0", fontWeight: 700 }}>
            <span>Taxable Amount</span>
            <span>{fmt(taxableAmount)}</span>
          </div>
        )}

        {/* GST Breakdown */}
        {hasGst && (
          gstBreakdown.length > 0 ? (
            gstBreakdown.map((tb, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ color: "#475569" }}>{tb.name}</span>
                <span style={{ fontWeight: 700 }}>+ {fmt(tb.amount)}</span>
              </div>
            ))
          ) : totalTaxAmt > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ color: "#475569" }}>Total GST</span>
              <span style={{ fontWeight: 700 }}>+ {fmt(totalTaxAmt)}</span>
            </div>
          ) : null
        )}

        {/* TCS */}
        {tcsAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#059669" }}>
            <span>TCS Collected {tdsTcsRate > 0 ? `(${tdsTcsRate}%)` : ""}</span>
            <span style={{ fontWeight: 600 }}>+ {fmt(tcsAmount)}</span>
          </div>
        )}

        {/* Round Off / Adjustment Row (right above Grand Total) */}
        {effectiveAdjustment !== 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: "1px dashed #cbd5e1", marginTop: 4, paddingTop: 4 }}>
            <span style={{ color: "#475569", fontWeight: 500 }}>{effectiveAdjustmentName}</span>
            <span style={{ fontWeight: 600, color: effectiveAdjustment > 0 ? "#16a34a" : "#dc2626" }}>
              {formatRoundOffText(effectiveAdjustment, fmt)}
            </span>
          </div>
        )}

        {/* Grand Total Box */}
        <div style={{ background: "#f8fafc", border: `1.5px solid ${primaryColor}22`, borderRadius: 6, padding: "8px 12px", marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 13, color: primaryColor, letterSpacing: 0.5 }}>GRAND TOTAL</span>
              {effectiveAdjustment !== 0 && (
                <span style={{ display: "block", fontSize: 9, fontWeight: 500, color: "#64748b" }}>
                  ({formatRoundOffText(effectiveAdjustment, fmt)} round off)
                </span>
              )}
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: accentColor || primaryColor }}>{fmt(grandTotal)}</span>
          </div>
          {showAmountInWords && (
            <div style={{ fontSize: 9.5, color: "#475569", marginTop: 4, fontStyle: "italic", borderTop: "1px dotted #e2e8f0", paddingTop: 4 }}>
              ( Amount in Words: {formatAmountInWords(grandTotal)} )
            </div>
          )}
        </div>

        {/* Amount Paid & Balance Due */}
        {type === "invoice" && Number(invoice?.amount_paid) > 0 && (
          <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: 8, paddingTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ color: "#475569" }}>Amount Paid</span>
              <span style={{ fontWeight: 600 }}>{fmt(Number(invoice.amount_paid))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontWeight: 700, color: "#dc2626" }}>
              <span>Balance Due</span>
              <span>{fmt(Math.max(0, grandTotal - Number(invoice.amount_paid)))}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard bordered table layout
  return (
    <div className={className}>
      <div className="border mb-3 border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-[11px]">
          <tbody>
            {/* Subtotal */}
            <tr className="border-b border-gray-200">
              <td className="p-2 font-bold w-1/2">Subtotal</td>
              <td className="p-2 text-right border-l border-gray-200">{fmt(subtotalVal)}</td>
            </tr>

            {/* Discount */}
            {discountAmt > 0 && (
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold w-1/2">
                  Discount {invoice?.discount_type === "percentage" && Number(invoice?.discount) > 0 ? `(${invoice.discount}%)` : ""}
                </td>
                <td className="p-2 text-right border-l border-gray-200 text-red-600 font-semibold">- {fmt(discountAmt)}</td>
              </tr>
            )}

            {/* Fixed Cost / Expenses */}
            {expensesAmt > 0 && (
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold w-1/2">Fixed Cost / Expenses</td>
                <td className="p-2 text-right border-l border-gray-200 font-semibold">+ {fmt(expensesAmt)}</td>
              </tr>
            )}

            {/* Shipping Charge */}
            {shippingAmt > 0 && (
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold w-1/2">Shipping Charge</td>
                <td className="p-2 text-right border-l border-gray-200 font-semibold">+ {fmt(shippingAmt)}</td>
              </tr>
            )}

            {/* TDS (Deducted before GST on base amount) */}
            {tdsAmount > 0 && (
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold w-1/2 text-red-600">
                  TDS Deducted {tdsTcsRate > 0 ? `(${tdsTcsRate}%)` : ""}
                </td>
                <td className="p-2 text-right border-l border-gray-200 text-red-600 font-semibold">- {fmt(tdsAmount)}</td>
              </tr>
            )}

            {/* Taxable Amount */}
            {(discountAmt > 0 || expensesAmt > 0 || shippingAmt > 0 || tdsAmount > 0 || hasGst) && (
              <tr className="border-b border-gray-200 bg-gray-50/80 font-bold">
                <td className="p-2 w-1/2">Taxable Amount</td>
                <td className="p-2 text-right border-l border-gray-200">{fmt(taxableAmount)}</td>
              </tr>
            )}

            {/* GST Breakdown */}
            {hasGst && (
              gstBreakdown.length > 0 ? (
                gstBreakdown.map((tax, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-2 font-bold w-1/2">{tax.name}</td>
                    <td className="p-2 text-right border-l border-gray-200 font-semibold">+ {fmt(tax.amount)}</td>
                  </tr>
                ))
              ) : totalTaxAmt > 0 ? (
                isInterstate ? (
                  <tr className="border-b border-gray-200">
                    <td className="p-2 font-bold w-1/2">IGST</td>
                    <td className="p-2 text-right border-l border-gray-200 font-semibold">+ {fmt(totalTaxAmt)}</td>
                  </tr>
                ) : (
                  <>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold w-1/2">CGST</td>
                      <td className="p-2 text-right border-l border-gray-200 font-semibold">+ {fmt(totalTaxAmt / 2)}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2 font-bold w-1/2">SGST</td>
                      <td className="p-2 text-right border-l border-gray-200 font-semibold">+ {fmt(totalTaxAmt / 2)}</td>
                    </tr>
                  </>
                )
              ) : null
            )}

            {/* TCS */}
            {tcsAmount > 0 && (
              <tr className="border-b border-gray-200">
                <td className="p-2 font-bold w-1/2 text-emerald-600">
                  TCS Collected {tdsTcsRate > 0 ? `(${tdsTcsRate}%)` : ""}
                </td>
                <td className="p-2 text-right border-l border-gray-200 text-emerald-600 font-semibold">+ {fmt(tcsAmount)}</td>
              </tr>
            )}

            {/* Round Off / Adjustment Row (right above Grand Total) */}
            {effectiveAdjustment !== 0 && (
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <td className="p-2 font-bold w-1/2 text-gray-700">{effectiveAdjustmentName}</td>
                <td className="p-2 text-right border-l border-gray-200 font-semibold text-gray-800">
                  {formatRoundOffText(effectiveAdjustment, fmt)}
                </td>
              </tr>
            )}

            {/* Grand Total Row */}
            <tr className="text-white text-sm" style={{ backgroundColor: primaryColor }}>
              <td className="p-3 font-bold uppercase tracking-wider">
                GRAND TOTAL
                {effectiveAdjustment !== 0 && (
                  <span className="block text-[9px] font-normal opacity-90 tracking-normal normal-case mt-0.5">
                    ({formatRoundOffText(effectiveAdjustment, fmt)} round off)
                  </span>
                )}
              </td>
              <td className="p-3 text-right font-bold text-lg" style={{ backgroundColor: accentColor || primaryColor }}>
                {fmt(grandTotal)}
              </td>
            </tr>

            {/* Amount Paid & Balance Due */}
            {type === "invoice" && Number(invoice?.amount_paid) > 0 && (
              <>
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-bold w-1/2 text-gray-700">Amount Paid</td>
                  <td className="p-2 text-right border-l border-gray-200 font-semibold">{fmt(Number(invoice.amount_paid))}</td>
                </tr>
                <tr className="border-b border-gray-200 bg-red-50/50">
                  <td className="p-2 font-bold w-1/2 text-red-700">Balance Due</td>
                  <td className="p-2 text-right border-l border-gray-200 font-bold text-red-700">
                    {fmt(Math.max(0, grandTotal - Number(invoice.amount_paid)))}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {showAmountInWords && (
        <div className="mb-4">
          <div className="font-semibold text-gray-500 mb-0.5 text-[10px]">Total In Words:</div>
          <div className="font-bold italic text-[10px] text-gray-800">{formatAmountInWords(grandTotal)}</div>
        </div>
      )}
    </div>
  );
}
