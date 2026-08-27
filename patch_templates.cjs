const fs = require('fs');

const files = [
  'src/components/invoice/ClassicTabularInvoiceTemplate.tsx',
  'src/components/invoice/ModernNavyInvoiceTemplate.tsx',
  'src/components/invoice/ModernTealInvoiceTemplate.tsx',
  'src/components/invoice/ModernCrimsonInvoiceTemplate.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix Item Name rendering
  content = content.replace(
    /<td className="py-2 px-2 border-r border-gray-200 font-semibold">\{line\.description\}<\/td>/g,
    `<td className="py-2 px-2 border-r border-gray-200">
                  {line.name ? (
                    <>
                      <div className="font-semibold text-[11px]">{line.name}</div>
                      {line.description && <div className="text-[9px] text-gray-500 mt-0.5 whitespace-pre-wrap opacity-75">{line.description}</div>}
                    </>
                  ) : (
                    <div className="font-semibold text-[11px] whitespace-pre-wrap">{line.description}</div>
                  )}
                </td>`
  );

  // Add configuration booleans parsing at the top
  content = content.replace(
    /const upiString = /g,
    `const showBankDetails = invoice?.metadata?.show_bank_details !== false;
  const showTerms = invoice?.metadata?.show_terms !== false;
  const showNotes = invoice?.metadata?.show_notes !== false;
  
  const upiString = `
  );

  // Conditionally render Bank Details
  content = content.replace(
    /\{\/\* BANK DETAILS \*\/\}\s*<div className="border mb-4/g,
    `{/* BANK DETAILS */}
           {showBankDetails && <div className="border mb-4`
  );
  content = content.replace(
    /<div className="font-semibold">Branch :<\/div><div>\{org\?\.bank_branch \|\| ""\}<\/div>\s*<\/div>\s*<\/div>/g,
    `<div className="font-semibold">Branch :</div><div>{org?.bank_branch || ""}</div>
             </div>
           </div>}`
  );

  // Conditionally render Terms
  content = content.replace(
    /\{\/\* TERMS \*\/\}\s*<div className="border mb-4/g,
    `{/* TERMS */}
           {showTerms && <div className="border mb-4`
  );
  content = content.replace(
    /2\. Interest @ 18% p\.a\. will be charged if payment is delayed\."\}\s*<\/div>\s*<\/div>/g,
    `2. Interest @ 18% p.a. will be charged if payment is delayed."}
             </div>
           </div>}`
  );

  // Conditionally render Notes
  content = content.replace(
    /\{\/\* NOTES \*\/\}\s*\{invoice\?\.notes && \(\s*<div className="border mb-4/g,
    `{/* NOTES */}
           {showNotes && invoice?.notes && (
             <div className="border mb-4`
  );

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Templates patched!');
