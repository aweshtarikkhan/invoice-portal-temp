const fs = require('fs');

const files = [
  'src/components/invoice/ClassicTabularInvoiceTemplate.tsx',
  'src/components/invoice/ModernNavyInvoiceTemplate.tsx',
  'src/components/invoice/ModernTealInvoiceTemplate.tsx',
  'src/components/invoice/ModernCrimsonInvoiceTemplate.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix Taxable calculation (column 5)
  // Usually rendered as: {fmt(line.quantity * line.rate).replace('₹', '')}
  // Replace all `fmt(line.quantity * line.rate)` with `fmt((line.amount || 0) - (line.tax_amount || 0))`
  content = content.replace(
    /\{fmt\(line\.quantity \* line\.rate\)\.replace\(/g,
    `{fmt((line.amount || 0) - (line.tax_amount || 0)).replace(`
  );

  // Fix GST % calculation (column 6)
  // Usually rendered as: {line.tax_rate ? `${line.tax_rate.rate}%` : "0%"}
  content = content.replace(
    /\{line\.tax_rate \? \`\$\{line\.tax_rate\.rate\}%\` \: "0%"\}/g,
    `{line.tax_rate ? \`\${line.tax_rate.rate}%\` : \`\${(line.amount && line.tax_amount) ? Math.round((line.tax_amount / ((line.amount || 0) - line.tax_amount)) * 100) : 0}%\`}`
  );

  // Fix Total calculation (column 8)
  // Usually rendered as: {fmt((line.quantity * line.rate) + (line.tax_amount || 0)).replace('₹', '')}
  content = content.replace(
    /\{fmt\(\(line\.quantity \* line\.rate\) \+ \(line\.tax_amount \|\| 0\)\)\.replace\(/g,
    `{fmt(line.amount || 0).replace(`
  );

  // Fix Bottom Totals (IGST / CGST / SGST breakdown)
  const totalsSearch = /\{hasIGST \? \(\s*<tr className="border-b border-gray-200">\s*<td className="p-2 font-bold w-1\/2">IGST Total<\/td>\s*<td className="p-2 text-right border-l border-gray-200">\{fmt\(totalTax\)\}<\/td>\s*<\/tr>\s*\) : \(\s*<>\s*<tr className="border-b border-gray-200">\s*<td className="p-2 font-bold pl-4">CGST<\/td>\s*<td className="p-2 text-right border-l border-gray-200">\{fmt\(totalTax \/ 2\)\}<\/td>\s*<\/tr>\s*<tr className="border-b border-gray-200">\s*<td className="p-2 font-bold pl-4">SGST<\/td>\s*<td className="p-2 text-right border-l border-gray-200">\{fmt\(totalTax \/ 2\)\}<\/td>\s*<\/tr>\s*<\/>\s*\)\}/;

  const totalsReplace = `{taxBreakdown && taxBreakdown.length > 0 ? (
                     taxBreakdown.map((tax, i) => (
                       <tr key={i} className="border-b border-gray-200">
                         <td className="p-2 font-bold w-1/2">{tax.name}</td>
                         <td className="p-2 text-right border-l border-gray-200">{fmt(tax.amount)}</td>
                       </tr>
                     ))
                   ) : (
                     <tr className="border-b border-gray-200">
                       <td className="p-2 font-bold w-1/2">Total Tax</td>
                       <td className="p-2 text-right border-l border-gray-200">{fmt(totalTax)}</td>
                     </tr>
                   )}`;
                   
  // Replace the tax breakdown in the template
  content = content.replace(totalsSearch, totalsReplace);
  
  // What if it's the other string? Let's use a simpler regex if it fails.
  if (!content.includes('taxBreakdown.map((tax, i) =>')) {
     const fallbackSearch = /\{hasIGST \? \([\s\S]*?<\/>\s*\)\}/;
     content = content.replace(fallbackSearch, totalsReplace);
  }

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Fixed 4 templates for Tax, GST%, and Totals');
