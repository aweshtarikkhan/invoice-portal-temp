const fs = require('fs');

let c = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

// The main one is still untouched. I'll replace it too.
c = c.replace(
  '<div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">',
  '<div className="min-h-screen flex flex-col">\n        <PublicHeader />\n        <main className="flex-grow flex items-center justify-center bg-muted/30 px-4 py-12">'
);

fs.writeFileSync('src/pages/LoginPage.tsx', c);
console.log('Fixed second LoginPage return');
