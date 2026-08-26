const fs = require('fs');

const tsPath = 'src/lib/document-templates.ts';
let tsContent = fs.readFileSync(tsPath, 'utf8');

if (!tsContent.includes('professional_navy')) {
  tsContent = tsContent.replace(
    /\{\n    id: "corporate_blue",/,
    `{
    id: "professional_navy",
    name: "Professional Navy GST",
    description: "Classic professional navy template matching standard business format with strict table borders.",
    preview: "bg-blue-50 border-blue-900/20",
    features: ["Classic Navy header", "Strict tabular layout", "Amount in words", "Bank details & QR", "Separate Terms & Totals"],
    recommendedPaperSize: "a4",
  },
  {
    id: "corporate_blue",`
  );
  fs.writeFileSync(tsPath, tsContent, 'utf8');
  console.log("document-templates.ts patched");
}
