const fs = require('fs');
let code = fs.readFileSync('src/components/invoice/StyledInvoiceTemplate.tsx', 'utf8');

const importsToAdd = `
import { ClassicTabularInvoiceTemplate } from "./ClassicTabularInvoiceTemplate";
import { ModernNavyInvoiceTemplate } from "./ModernNavyInvoiceTemplate";
import { ModernTealInvoiceTemplate } from "./ModernTealInvoiceTemplate";
import { ModernCrimsonInvoiceTemplate } from "./ModernCrimsonInvoiceTemplate";
`;

code = code.replace(
  `import { ProfessionalNavyInvoiceTemplate } from "./ProfessionalNavyInvoiceTemplate";`,
  `import { ProfessionalNavyInvoiceTemplate } from "./ProfessionalNavyInvoiceTemplate";\n` + importsToAdd
);

const renderingCode = `
  if (org?.template_style === "classic_tabular") {
    return <ClassicTabularInvoiceTemplate org={org} invoice={invoice} lines={lines} fmt={fmt} type={type} taxBreakdown={taxBreakdown} isInterstate={isInterstate} />;
  }
  if (org?.template_style === "modern_navy") {
    return <ModernNavyInvoiceTemplate org={org} invoice={invoice} lines={lines} fmt={fmt} type={type} taxBreakdown={taxBreakdown} isInterstate={isInterstate} />;
  }
  if (org?.template_style === "modern_teal") {
    return <ModernTealInvoiceTemplate org={org} invoice={invoice} lines={lines} fmt={fmt} type={type} taxBreakdown={taxBreakdown} isInterstate={isInterstate} />;
  }
  if (org?.template_style === "modern_crimson") {
    return <ModernCrimsonInvoiceTemplate org={org} invoice={invoice} lines={lines} fmt={fmt} type={type} taxBreakdown={taxBreakdown} isInterstate={isInterstate} />;
  }
`;

code = code.replace(
  `export function StyledInvoiceTemplate({ org, invoice, lines, fmt, type = "invoice", taxBreakdown, isInterstate }: StyledInvoiceTemplateProps) {`,
  `export function StyledInvoiceTemplate({ org, invoice, lines, fmt, type = "invoice", taxBreakdown, isInterstate }: StyledInvoiceTemplateProps) {` + renderingCode
);

fs.writeFileSync('src/components/invoice/StyledInvoiceTemplate.tsx', code, 'utf8');
console.log('patched StyledInvoiceTemplate');
