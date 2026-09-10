const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace('{syncResult ? \r\n      {syncResult && (', '{syncResult ? (');
c = c.replace('{syncResult ? \n      {syncResult && (', '{syncResult ? (');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed syntax error');
