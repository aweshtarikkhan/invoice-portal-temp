const fs = require('fs');
const content = fs.readFileSync('src/pages/PlatformAdminPage.tsx', 'utf8');

const regex = /<([A-Z][a-zA-Z0-9]+)/g;
const matches = [...content.matchAll(regex)].map(m => m[1]);
const uniqueTags = [...new Set(matches)];
console.log('Used tags:', uniqueTags.join(', '));

const importRegex = /import\s+({[^}]+})\s+from/g;
let imports = [];
let match;
while ((match = importRegex.exec(content)) !== null) {
  const clean = match[1].replace(/[\{\}\n\r]/g, '');
  imports.push(...clean.split(',').map(s => s.trim()).filter(s => s));
}
console.log('Imported tags:', imports.filter(i => /^[A-Z]/.test(i)).join(', '));

const missing = uniqueTags.filter(t => !imports.includes(t) && t !== 'Fragment');
console.log('Missing imports:', missing.join(', '));
