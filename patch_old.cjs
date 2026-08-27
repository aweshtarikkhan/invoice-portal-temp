const fs = require('fs');

const files = [
  'src/components/invoice/CorporateBlueInvoiceTemplate.tsx',
  'src/components/invoice/ProfessionalNavyInvoiceTemplate.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if we need to add the booleans
    if (!content.includes('const showBankDetails')) {
       // Insert booleans at the top of the function
       content = content.replace(
         /export function [a-zA-Z]+\(\{ org, invoice, lines, fmt, type = "invoice", taxBreakdown \}: any\) \{/g,
         (match) => `${match}\n  const showBankDetails = invoice?.metadata?.show_bank_details !== false;\n  const showTerms = invoice?.metadata?.show_terms !== false;\n  const showNotes = invoice?.metadata?.show_notes !== false;\n`
       );
       
       // Same for the other signature
       content = content.replace(
         /export function [a-zA-Z]+\(\{ org, invoice, lines, fmt, type, taxBreakdown \}: any\) \{/g,
         (match) => `${match}\n  const showBankDetails = invoice?.metadata?.show_bank_details !== false;\n  const showTerms = invoice?.metadata?.show_terms !== false;\n  const showNotes = invoice?.metadata?.show_notes !== false;\n`
       );

       // Conditionally hide bank details, terms, notes for CorporateBlue
       if (file.includes('CorporateBlue')) {
          content = content.replace(
            /\{org\?\.bank_name && \(\s*<div/g,
            `{showBankDetails && org?.bank_name && (\n        <div`
          );
          content = content.replace(
            /\{invoice\?\.terms_conditions && \(\s*<div style=\{\{ flex: 1 \}\}>\s*<div style=\{\{ fontWeight: 700, color: "#1e293b", fontSize: 11, marginBottom: 4 \}\}>Terms & Conditions<\/div>/g,
            `{showTerms && invoice?.terms_conditions && (\n            <div style={{ flex: 1 }}>\n              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 11, marginBottom: 4 }}>Terms & Conditions</div>`
          );
          content = content.replace(
            /\{invoice\?\.notes && \(\s*<div style=\{\{ flex: 1 \}\}>\s*<div style=\{\{ fontWeight: 700, color: "#1e293b", fontSize: 11, marginBottom: 4 \}\}>Notes<\/div>/g,
            `{showNotes && invoice?.notes && (\n            <div style={{ flex: 1 }}>\n              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 11, marginBottom: 4 }}>Notes</div>`
          );
       }
       
       // Conditionally hide bank details, terms, notes for ProfessionalNavy
       if (file.includes('ProfessionalNavy')) {
           content = content.replace(
             /\{org\?\.bank_name && \(\s*<div style=\{\{ border: "1px solid #94a3b8", borderRadius: 4, padding: "8px 12px", fontSize: 10 \}\}>/g,
             `{showBankDetails && org?.bank_name && (\n                  <div style={{ border: "1px solid #94a3b8", borderRadius: 4, padding: "8px 12px", fontSize: 10 }}>`
           );
           content = content.replace(
             /<div style=\{\{ flex: 1 \}\}>\s*\{invoice\?\.terms_conditions && \(\s*<div style=\{\{ marginBottom: 12 \}\}>/g,
             `<div style={{ flex: 1 }}>\n                    {showTerms && invoice?.terms_conditions && (\n                      <div style={{ marginBottom: 12 }}>`
           );
           content = content.replace(
             /\{invoice\?\.notes && \(\s*<div>/g,
             `{showNotes && invoice?.notes && (\n                      <div>`
           );
       }

       fs.writeFileSync(file, content, 'utf8');
    }
  }
});
console.log('Old templates patched for toggles');
