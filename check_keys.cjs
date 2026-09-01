const fs = require('fs');
const content = fs.readFileSync('src/store/feature-store.ts', 'utf8');

// evaluate ADMIN_FEATURE_GROUPS manually to check its length
// Wait, we can just run ts-node or grep. Let's just output it.
let match;
const regex = /key:\s*"([^"]+)"/g;
const keys = [];
while ((match = regex.exec(content)) !== null) {
  keys.push(match[1]);
}
console.log(keys);
