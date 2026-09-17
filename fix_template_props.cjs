const fs = require('fs');
const path = require('path');

const dir = "c:\\Users\\awesh\\Desktop\\Satah Invoice - Copy\\billflow-pro-94-22f845cd\\src\\components\\invoice";
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');

  // Multi-line replacement for destructured props accounting for `= false,`
  if (!content.includes("showSignature = true")) {
    content = content.replace(
      /isInterstate\s*=\s*false,?\s*\}:/g,
      "isInterstate = false,\n  showSignature = true,\n}:"
    );
    
    // Some templates might not have = false
    content = content.replace(
      /isInterstate,?\s*\}:/g,
      "isInterstate,\n  showSignature = true,\n}:"
    );

    // StyledInvoiceTemplate.tsx has slightly different props
    if (file === 'StyledInvoiceTemplate.tsx') {
      content = content.replace(
        /isInterstate\s*\}: StyledInvoiceTemplateProps\)/,
        "isInterstate, showSignature = true }: StyledInvoiceTemplateProps)"
      );
    }
  }

  fs.writeFileSync(p, content, 'utf8');
}
console.log("Templates props fixed.");
