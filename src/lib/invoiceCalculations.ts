import { INDIAN_GST_SLABS } from "@/lib/constants";

const STANDARD_GST_SLABS = [0, 3, 5, 12, 18, 28];

/**
 * Resolves the accurate GST slab rate percentage (e.g. 18 for 18%) for any line item
 * across Invoices, Estimates / Quotations, Bills, and Purchase Orders.
 */
export function resolveLineTaxRate(line: any, discountRatio: number = 1): number {
  if (!line) return 0;

  // 1. Check joined relation tax_rate object { rate: 18 } or tax_rates { rate: 18 }
  const relRate = line.tax_rates?.rate ?? line.tax_rate?.rate ?? line.tax_rates_rate;
  if (relRate != null && !isNaN(Number(relRate))) {
    return Number(relRate);
  }

  // 2. Check line.tax_rate or line.tax_percent if it's already a numeric rate (e.g. 18 or "18")
  if (line.tax_rate != null && typeof line.tax_rate !== "object" && !isNaN(Number(line.tax_rate))) {
    const r = Number(line.tax_rate);
    if (r > 0 && r <= 100) return r;
  }
  if (line.tax_percent != null && !isNaN(Number(line.tax_percent))) {
    const r = Number(line.tax_percent);
    if (r > 0 && r <= 100) return r;
  }

  // 3. Check line.items?.tax_rate (from joined catalog item)
  if (line.items?.tax_rate != null && !isNaN(Number(line.items.tax_rate))) {
    const r = Number(line.items.tax_rate);
    if (r > 0 && r <= 100) return r;
  }
  if (line.item?.tax_rate != null && !isNaN(Number(line.item.tax_rate))) {
    const r = Number(line.item.tax_rate);
    if (r > 0 && r <= 100) return r;
  }

  // 4. Check tax_id against standard constants
  if (line.tax_id) {
    const slab = INDIAN_GST_SLABS.find((s) => s.id === line.tax_id);
    if (slab) return slab.rate;
  }

  // 5. Fallback: derive from tax_amount and taxable amount (accounting for item & global discounts)
  const q = Number(line.quantity || 0);
  const r = Number(line.rate || 0);
  const rawBase = q * r;
  const itemDisc = line.discount
    ? (line.discount_type === "percentage" ? (rawBase * Number(line.discount)) / 100 : Number(line.discount))
    : 0;
  const lineTaxable = Math.max(0, rawBase - itemDisc);
  const effectiveBase = lineTaxable * (discountRatio > 0 ? discountRatio : 1);

  if (Number(line.tax_amount) > 0 && effectiveBase > 0) {
    const rawRate = (Number(line.tax_amount) / effectiveBase) * 100;
    // Snap to standard Indian GST slabs if within 1.5% tolerance (e.g. 16.65% -> 18%)
    for (const slab of STANDARD_GST_SLABS) {
      if (Math.abs(rawRate - slab) <= 1.5) {
        return slab;
      }
    }
    return Math.round(rawRate);
  }

  return 0;
}

/**
 * Computes line-level financial amounts.
 */
export function computeLineFinancials(
  line: any,
  discountRatio: number = 1,
  tdsFactor: number = 1
) {
  const quantity = Number(line.quantity || 0);
  const rate = Number(line.rate || 0);
  const rawAmount = quantity * rate;

  const itemDiscount = line.discount
    ? (line.discount_type === "percentage" ? (rawAmount * Number(line.discount)) / 100 : Number(line.discount))
    : 0;

  const taxableAmount = Math.max(0, rawAmount - itemDiscount);
  // GST applies on the effective taxable share of the line, after document discount and TDS factor (if TDS is applicable)
  const effectiveTaxable = taxableAmount * (discountRatio > 0 ? discountRatio : 1) * (tdsFactor > 0 ? tdsFactor : 1);
  const taxRate = resolveLineTaxRate(line, discountRatio);

  const taxAmount = Number(line.tax_amount != null && !isNaN(Number(line.tax_amount)) && Number(line.tax_amount) > 0
    ? Number(line.tax_amount)
    : (effectiveTaxable * (taxRate / 100)));

  const subtotal = taxableAmount + taxAmount;

  return {
    quantity,
    qty: quantity,
    rate,
    rawAmount,
    itemDiscount,
    discount: itemDiscount,
    taxableAmount,
    taxableAmt: taxableAmount,
    taxable: taxableAmount,
    effectiveTaxable,
    taxRate,
    gstRate: taxRate,
    gstPct: taxRate,
    taxAmount,
    taxAmt: taxAmount,
    subtotal,
    lineTotal: subtotal,
    lineRowSubtotal: subtotal,
    totalAmount: subtotal,
  };
}

export interface DocumentTotals {
  subtotalVal: number;
  discountAmt: number;
  discountedSubtotal: number;
  expensesAmt: number;
  shippingAmt: number;
  baseAmountBeforeTds: number;
  taxableAmount: number;
  tdsTcsApplicable: boolean;
  tdsTcsType: "tds" | "tcs";
  tdsTcsRate: number;
  tdsAmount: number;
  tcsAmount: number;
  gstBreakdown: { name: string; amount: number; rate?: number }[];
  totalTaxAmt: number;
  totalWithGst: number;
  unroundedTotal: number;
  effectiveAdjustment: number;
  effectiveAdjustmentName: string;
  isRoundOff: boolean;
  grandTotal: number;
}

/**
 * Single source of truth calculation function for Invoices, Estimates, Bills, and Purchase Orders.
 * Used by all existing and future invoice templates and detail pages.
 */
export function computeDocumentTotals(
  invoice: any,
  lines: any[] = [],
  taxBreakdown?: { name: string; amount: number; rate?: number }[],
  hasGst: boolean = true,
  isInterstate: boolean = false
): DocumentTotals {
  // 1. Subtotal: sum of lines' (quantity * rate - item_discount)
  const computedSubtotal = (lines || []).reduce((sum: number, l: any) => {
    const q = Number(l.quantity || 0);
    const r = Number(l.rate || 0);
    const raw = q * r;
    const itemDisc = l.discount
      ? (l.discount_type === "percentage" ? (raw * Number(l.discount)) / 100 : Number(l.discount))
      : 0;
    return sum + Math.max(0, raw - itemDisc);
  }, 0);

  const subtotalVal = Number(invoice?.subtotal) > 0 ? Number(invoice.subtotal) : computedSubtotal;

  // 2. Invoice-level discount
  const discountAmt = Math.max(
    0,
    Number(
      invoice?.total_discount != null
        ? invoice.total_discount
        : invoice?.discount_type === "percentage"
        ? (subtotalVal * Number(invoice?.discount || 0)) / 100
        : Number(invoice?.discount || 0)
    )
  );

  const discountedSubtotal = Math.max(0, subtotalVal - discountAmt);
  const expensesAmt = Math.max(0, Number(invoice?.expenses || 0));
  const shippingAmt = Math.max(0, Number(invoice?.shipping_charge || 0));
  const baseAmountBeforeTds = discountedSubtotal + expensesAmt + shippingAmt;

  // 3. TDS / TCS Determination
  const tdsTcsApplicable = Boolean(
    invoice?.tds_tcs_applicable ||
    invoice?.metadata?.tds_tcs_applicable ||
    Number(invoice?.tds_tcs_rate || 0) > 0 ||
    Number(invoice?.tds_tcs_amount || 0) > 0
  );
  const tdsTcsType = (invoice?.tds_tcs_type === "tcs" || invoice?.metadata?.tds_tcs_type === "tcs") ? "tcs" : "tds";
  const tdsTcsRate = Math.max(
    0,
    Number(invoice?.tds_tcs_rate != null ? invoice.tds_tcs_rate : (invoice?.metadata?.tds_tcs_rate || 0))
  );

  // TDS is deducted BEFORE GST on base amount, directly reducing Taxable Amount
  let tdsAmount = 0;
  let taxableAmount = baseAmountBeforeTds;

  if (tdsTcsApplicable && tdsTcsType === "tds") {
    tdsAmount = Number(
      invoice?.tds_tcs_amount != null && Number(invoice.tds_tcs_amount) > 0
        ? invoice.tds_tcs_amount
        : ((baseAmountBeforeTds * tdsTcsRate) / 100)
    );
    // Taxable Amount is reduced by TDS so GST is charged on the lower value
    taxableAmount = Math.max(0, baseAmountBeforeTds - tdsAmount);
  }

  // 4. GST Total & Breakdown
  let gstBreakdown: { name: string; amount: number; rate?: number }[] = [];
  if (taxBreakdown && taxBreakdown.length > 0) {
    gstBreakdown = taxBreakdown;
  }

  const rawTaxTotal = Number(
    invoice?.total_tax != null
      ? invoice.total_tax
      : (invoice?.tax_total != null
          ? invoice.tax_total
          : gstBreakdown.reduce((s: number, t: any) => s + Number(t.amount || 0), 0))
  );

  const totalTaxAmt = hasGst ? rawTaxTotal : 0;

  // If taxBreakdown wasn't provided or was empty, synthesize CGST/SGST or IGST from totalTaxAmt
  if (hasGst && totalTaxAmt > 0 && gstBreakdown.length === 0) {
    if (isInterstate) {
      gstBreakdown = [{ name: "IGST", amount: totalTaxAmt }];
    } else {
      const half = Number((totalTaxAmt / 2).toFixed(2));
      gstBreakdown = [
        { name: "CGST", amount: half },
        { name: "SGST", amount: Number((totalTaxAmt - half).toFixed(2)) },
      ];
    }
  }

  const totalWithGst = taxableAmount + totalTaxAmt;

  // 5. TCS: Calculated AFTER GST on Total Value with GST (taxableAmount + GST) and ADDED (+)
  const tcsAmount = (tdsTcsApplicable && tdsTcsType === "tcs")
    ? Number(
        invoice?.tds_tcs_amount != null && Number(invoice.tds_tcs_amount) > 0
          ? invoice.tds_tcs_amount
          : ((totalWithGst * tdsTcsRate) / 100)
      )
    : 0;

  // 6. Unrounded Base Total (Before Adjustment / Round Off)
  // Notice: Since TDS was already deducted from base to get taxableAmount, totalWithGst already reflects TDS deduction.
  const unroundedTotal = totalWithGst + tcsAmount;

  // 7. Round Off & Adjustment Determination
  const rawAdjustment = Number(invoice?.adjustment || 0);
  const rawAdjustmentName = invoice?.adjustment_name || "";
  const metaRoundOff = (invoice?.metadata as any)?.round_off != null ? Number((invoice.metadata as any).round_off) : null;

  let effectiveAdjustment = 0;
  let effectiveAdjustmentName = "Round Off";

  if (rawAdjustment !== 0) {
    effectiveAdjustment = rawAdjustment;
    effectiveAdjustmentName = rawAdjustmentName || "Adjustment";
  } else if (metaRoundOff != null && metaRoundOff !== 0) {
    effectiveAdjustment = metaRoundOff;
    effectiveAdjustmentName = "Round Off";
  } else if (invoice?.total != null && !isNaN(Number(invoice.total)) && invoice?.metadata?.auto_round_off !== false) {
    // If invoice.total was stored as a rounded integer or differs slightly from unroundedTotal (<= 2.00 INR)
    const diff = Number((Number(invoice.total) - unroundedTotal).toFixed(2));
    if (Math.abs(diff) > 0.0001 && Math.abs(diff) < 2.0) {
      effectiveAdjustment = diff;
      effectiveAdjustmentName = "Round Off";
    }
  }

  const isRoundOff =
    effectiveAdjustmentName.toLowerCase().includes("round") ||
    (Math.abs(effectiveAdjustment) > 0 && Math.abs(effectiveAdjustment) < 1.0);

  const grandTotal = Number(
    invoice?.total != null && !isNaN(Number(invoice.total))
      ? invoice.total
      : Number((unroundedTotal + effectiveAdjustment).toFixed(2))
  );

  return {
    subtotalVal,
    discountAmt,
    discountedSubtotal,
    expensesAmt,
    shippingAmt,
    baseAmountBeforeTds,
    taxableAmount,
    tdsTcsApplicable,
    tdsTcsType,
    tdsTcsRate,
    tdsAmount,
    tcsAmount,
    gstBreakdown,
    totalTaxAmt,
    totalWithGst,
    unroundedTotal,
    effectiveAdjustment,
    effectiveAdjustmentName,
    isRoundOff,
    grandTotal,
  };
}

/**
 * Formats a round-off value with explicit sign, e.g. "+₹0.42" or "-₹0.38".
 */
export function formatRoundOffText(adjustment: number, fmt: (n: number) => string): string {
  if (adjustment === 0) return fmt(0);
  const formatted = fmt(Math.abs(adjustment));
  return adjustment > 0 ? `+${formatted}` : `-${formatted}`;
}
