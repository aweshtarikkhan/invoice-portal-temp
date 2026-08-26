const fs = require('fs');

const tsPath = 'src/lib/document-templates.ts';
let tsContent = fs.readFileSync(tsPath, 'utf8');

const replacement = `export const DOCUMENT_TEMPLATES = [
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
] as const;`;

tsContent = tsContent.replace(/export const DOCUMENT_TEMPLATES = \[[\s\S]*?\] as const;/, replacement);

fs.writeFileSync(tsPath, tsContent, 'utf8');
console.log("document-templates.ts patched properly");
