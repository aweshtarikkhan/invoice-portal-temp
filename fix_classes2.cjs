const fs = require('fs');
const files = [
    'src/components/invoice/ClassicTabularInvoiceTemplate.tsx',
    'src/components/invoice/ModernNavyInvoiceTemplate.tsx',
    'src/components/invoice/ModernTealInvoiceTemplate.tsx',
    'src/components/invoice/ModernCrimsonInvoiceTemplate.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const isTabular = file.includes('Tabular');

    const searchStr1 = "className={`border ${headerStyle === 'tabular' ? 'border-gray-400' : 'border-gray-200 rounded-xl overflow-hidden'}`}";
    const searchStr2 = "className={`border mb-4 ${headerStyle === 'tabular' ? 'border-gray-400' : 'border-gray-200 rounded-xl overflow-hidden'}`}";
    const searchStr3 = "className={`w-full mb-4 ${headerStyle === 'tabular' ? 'border border-gray-400' : 'rounded-xl overflow-hidden border border-gray-200'}`}";
    
    // There are some newlines in the console output? No, the console wrapped them.

    content = content.replaceAll(
      searchStr1,
      isTabular ? 'className="border border-gray-400"' : 'className="border border-gray-200 rounded-xl overflow-hidden"'
    );
    
    content = content.replaceAll(
      searchStr2,
      isTabular ? 'className="border mb-4 border-gray-400"' : 'className="border mb-4 border-gray-200 rounded-xl overflow-hidden"'
    );
    
    content = content.replaceAll(
      searchStr3,
      isTabular ? 'className="w-full mb-4 border border-gray-400"' : 'className="w-full mb-4 rounded-xl overflow-hidden border border-gray-200"'
    );
    
    // Fallback regex to clear anything else with headerStyle
    content = content.replace(/className=\{\`([^`\$]+)\$\\{headerStyle === 'tabular' \? '([^']+)' : '([^']+)'\\}\`\}/g, (match, prefix, tabCls, modCls) => {
        return `className="${prefix}${isTabular ? tabCls : modCls}"`;
    });

    fs.writeFileSync(file, content, 'utf8');
});
console.log("Replaced using string literals.");
