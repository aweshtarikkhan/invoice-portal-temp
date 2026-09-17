const fs = require('fs');

let c = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

c = c.replace(
  /<\/Card>\s*<\/div>\s*\);\s*}\s*return \(/g,
  '</Card>\n</main>\n</div>\n);\n}\n\nreturn ('
);

fs.writeFileSync('src/pages/LoginPage.tsx', c);
console.log('Fixed JSX in LoginPage');
