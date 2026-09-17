const fs = require('fs');
const content = fs.readFileSync('src/pages/InventoryReportsPage.tsx', 'utf8');

const regex = /<([A-Z][a-zA-Z0-9]+)/g;
const matches = [...content.matchAll(regex)].map(m => m[1]);
const uniqueTags = [...new Set(matches)];
console.log('Used tags:', uniqueTags.join(', '));

const importRegex = /import\s+{([^}]+)}\s+from/g;
let imports = [];
let match;
while ((match = importRegex.exec(content)) !== null) {
  imports.push(...match[1].split(',').map(s => s.trim()));
}
console.log('Imported tags:', imports.filter(i => /^[A-Z]/.test(i)).join(', '));

const missing = uniqueTags.filter(t => !imports.includes(t) && t !== 'Fragment');
console.log('Missing imports (maybe native/global or missing):', missing.join(', '));
