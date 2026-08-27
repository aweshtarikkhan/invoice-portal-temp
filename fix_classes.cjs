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

    // Replace border class
    content = content.replace(/className=\{\`border \$\{headerStyle === 'tabular' \? '([^']+)' : '([^']+)'\}\`\}/g, (match, tabularCls, modernCls) => {
        return `className="${isTabular ? 'border ' + tabularCls : 'border ' + modernCls}"`;
    });

    // Replace w-full class
    content = content.replace(/className=\{\`w-full mb-4 \$\{headerStyle === 'tabular' \? '([^']+)' : '([^']+)'\}\`\}/g, (match, tabularCls, modernCls) => {
        return `className="${isTabular ? 'w-full mb-4 ' + tabularCls : 'w-full mb-4 ' + modernCls}"`;
    });

    fs.writeFileSync(file, content, 'utf8');
});

console.log("Fixed headerStyle in all files");
