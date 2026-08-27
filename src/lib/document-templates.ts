export const DOCUMENT_TEMPLATES = [
  {
    id: "standard_gst",
    name: "Standard GST",
    description: "Indian GST compliant invoice with HSN/SAC, explicit CGST/SGST/IGST breakdown, and E-Way Bill details.",
    preview: "bg-background border-border",
    features: ["Company logo", "CGST/SGST columns", "E-Way Bill support", "TDS/TCS support"],
    recommendedPaperSize: "a4",
  },
  {
    id: "professional_navy",
    name: "Professional Navy GST",
    description: "Classic professional navy template matching standard business format with strict table borders.",
    preview: "bg-blue-50 border-blue-900/20",
    features: ["Classic Navy header", "Strict tabular layout", "Amount in words", "Bank details & QR", "Separate Terms & Totals"],
    recommendedPaperSize: "a4",
  },
  {
    id: "corporate_blue",
    name: "Corporate Blue GST",
    description: "Modern professional blue GST template with detailed tax breakdown, amount in words, bank details & QR code.",
    preview: "bg-blue-50 border-blue-200",
    features: ["Corporate Blue header", "Detailed GST breakdown", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
  {
    id: "classic_tabular",
    name: "Classic Tabular (New)",
    description: "Detailed tabular format matching standard Indian tax invoice.",
    preview: "bg-slate-50 border-slate-900/20",
    features: ["Classic Tabular layout", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
  {
    id: "modern_navy",
    name: "Modern Navy Yellow (New)",
    description: "Sleek navy and yellow themed template.",
    preview: "bg-blue-50 border-blue-900/20",
    features: ["Modern Navy layout", "Yellow accents", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
  {
    id: "modern_teal",
    name: "Modern Teal (New)",
    description: "Professional teal themed modern invoice.",
    preview: "bg-teal-50 border-teal-900/20",
    features: ["Modern Teal layout", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
  {
    id: "modern_crimson",
    name: "Modern Crimson (New)",
    description: "Professional crimson/red themed modern invoice.",
    preview: "bg-rose-50 border-rose-900/20",
    features: ["Modern Crimson layout", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
] as const;

export const PAPER_SIZES = [
  { id: "a4", name: "A4", dimensions: "210 × 297 mm" },
  { id: "letter", name: "Letter", dimensions: "8.5 × 11 in" },
  { id: "legal", name: "Legal", dimensions: "8.5 × 14 in" },
  { id: "a5", name: "A5", dimensions: "148 × 210 mm" },
  { id: "a6", name: "A6", dimensions: "105 × 148 mm" },
  { id: "pos80", name: "POS 80mm", dimensions: "80 × auto mm" },
] as const;

export function getDocumentPreviewClass(templateStyle?: string, paperSize?: string) {
  const sizeClass = {
    a4: "max-w-[210mm]",
    letter: "max-w-[8.5in]",
    legal: "max-w-[8.5in] min-h-[14in]",
    a5: "max-w-[148mm]",
    a6: "max-w-[105mm]",
    pos80: "max-w-[80mm]",
  }[paperSize || "a4"];

  return `invoice-printable mx-auto w-full rounded-xl border border-border bg-card text-card-foreground shadow-sm ${sizeClass || "max-w-[210mm]"} print:max-w-none print:shadow-none print:border-0 print:rounded-none`;
}

export function getPaperSizeLabel(paperSize?: string) {
  return PAPER_SIZES.find((size) => size.id === paperSize)?.name || "A4";
}

/** Returns CSS class to add to <html> or a <style> tag for @page sizing */
export function getPrintPageCSS(paperSize?: string): string {
  const sizes: Record<string, string> = {
    a4: "210mm 297mm",
    letter: "8.5in 11in",
    legal: "8.5in 14in",
    a5: "148mm 210mm",
    a6: "105mm 148mm",
    pos80: "80mm auto",
  };
  const size = sizes[paperSize || "a4"] || sizes.a4;

  const fontScale: Record<string, string> = {
    a4: "11px",
    letter: "11px",
    legal: "11px",
    a5: "9px",
    a6: "7px",
    pos80: "11px",
  };
  const baseFontSize = fontScale[paperSize || "a4"] || "11px";
  const pageMargin = paperSize === "pos80" ? "2mm" : "8mm";
  const pagePadding = paperSize === "pos80" ? "0" : "12px";

  return `
@media print {
  @page { size: ${size}; margin: ${pageMargin}; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body * { visibility: hidden; }
  .invoice-printable, .invoice-printable * { visibility: visible; }
  .invoice-printable {
    position: absolute; left: 0; top: 0;
    width: 100% !important; max-width: none !important;
    margin: 0 !important; padding: ${pagePadding} !important;
    font-size: ${baseFontSize} !important;
    box-shadow: none !important; border: none !important; border-radius: 0 !important;
    color: #000 !important; background: #fff !important;
  }
  .invoice-printable table { font-size: inherit !important; border-collapse: collapse; width: 100%; }
  .invoice-printable th, .invoice-printable td { padding: 3px 6px !important; font-size: inherit !important; }
  .invoice-printable thead { display: table-header-group; }
  .invoice-printable tr, .invoice-printable td, .invoice-printable th { page-break-inside: avoid !important; break-inside: avoid !important; }
  .invoice-printable h1, .invoice-printable h2, .invoice-printable h3 { font-size: 1.1em !important; }
  .no-print, header, nav, aside, [data-sidebar], .sidebar-trigger { display: none !important; }
}`;
}