const fs = require('fs');

// Patch TemplateCustomizationPage.tsx
const pagePath = 'src/pages/TemplateCustomizationPage.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');
if (!pageContent.includes('professional_navy')) {
  pageContent = pageContent.replace(
    /\{ id: "corporate_blue", name: "Corporate Blue GST", description: "Modern professional blue GST template with detailed tax breakdown, amount in words, bank details & QR code." \},/,
    `{ id: "corporate_blue", name: "Corporate Blue GST", description: "Modern professional blue GST template with detailed tax breakdown, amount in words, bank details & QR code." },\n    { id: "professional_navy", name: "Professional Navy GST", description: "Classic professional navy template matching standard business format with strict table borders." },`
  );
  fs.writeFileSync(pagePath, pageContent, 'utf8');
  console.log("TemplateCustomizationPage patched");
}

// Patch StyledInvoiceTemplate.tsx
const styledPath = 'src/components/invoice/StyledInvoiceTemplate.tsx';
let styledContent = fs.readFileSync(styledPath, 'utf8');
if (!styledContent.includes('ProfessionalNavyInvoiceTemplate')) {
  styledContent = styledContent.replace(
    'import { CorporateBlueInvoiceTemplate } from "./CorporateBlueInvoiceTemplate";',
    'import { CorporateBlueInvoiceTemplate } from "./CorporateBlueInvoiceTemplate";\nimport { ProfessionalNavyInvoiceTemplate } from "./ProfessionalNavyInvoiceTemplate";'
  );
  styledContent = styledContent.replace(
    /if \(org\?\.template_style === "corporate_blue"\) \{/,
    `if (org?.template_style === "professional_navy") {
    return (
      <ProfessionalNavyInvoiceTemplate
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

  if (org?.template_style === "corporate_blue") {`
  );
  fs.writeFileSync(styledPath, styledContent, 'utf8');
  console.log("StyledInvoiceTemplate patched");
}
