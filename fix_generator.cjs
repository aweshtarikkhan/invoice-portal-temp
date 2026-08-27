const fs = require('fs');
let code = fs.readFileSync('src/components/invoice/generator.cjs', 'utf8');

// The problematic lines were: className={\`border \${headerStyle === 'tabular' ? 'border-gray-400' : 'border-gray-200 rounded-xl overflow-hidden'}\`}
// It literally outputs `${headerStyle === ...}` into the React component where `headerStyle` is undefined.

code = code.replace(/className=\{\\\`border \\\$\\{headerStyle === 'tabular' \? '([^']+)' : '([^']+)'\\}\\`\}/g, (match, p1, p2) => {
    return `className={\`border \${headerStyle === 'tabular' ? '${p1}' : '${p2}'}\`}`;
});

code = code.replace(/className=\{\\\`w-full mb-4 \\\$\\{headerStyle === 'tabular' \? '([^']+)' : '([^']+)'\\}\\`\}/g, (match, p1, p2) => {
    return `className={\`w-full mb-4 \${headerStyle === 'tabular' ? '${p1}' : '${p2}'}\`}`;
});


fs.writeFileSync('src/components/invoice/generator.cjs', code, 'utf8');
console.log('Fixed generator.cjs');
