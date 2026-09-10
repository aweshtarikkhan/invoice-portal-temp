const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace('      )}\r\n   : !parsedData ? (', '      )\r\n   : !parsedData ? (');
c = c.replace('      )}\n   : !parsedData ? (', '      )\n   : !parsedData ? (');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed syntax error');
