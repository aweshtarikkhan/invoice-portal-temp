const fs = require('fs');
let code = fs.readFileSync('src/components/invoice/ProfessionalNavyInvoiceTemplate.tsx', 'utf8');

// Add support for name and contact
code = code.replace(
  `      if (a?.street) res.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) res.push(cityLine);
      if (a?.country) res.push(a.country);
      return res;`,
  `      // Support for structured shipping fields
      if (a?.name) res.push("Name: " + a.name);
      if (a?.street) res.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) res.push(cityLine);
      if (a?.country) res.push(a.country);
      if (a?.contact) res.push("Contact: " + a.contact);
      return res;`
);

fs.writeFileSync('src/components/invoice/ProfessionalNavyInvoiceTemplate.tsx', code, 'utf8');
console.log('patched ProfessionalNavyInvoiceTemplate');
