const fs = require('fs');

let c = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

if (!c.includes('PublicHeader')) {
  c = c.replace('import logoImg from "@/assets/logo.png";', 'import logoImg from "@/assets/logo.png";\nimport { PublicHeader } from "@/components/public/PublicHeader";');
}

c = c.replace(
  '<div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">',
  '<div className="min-h-screen flex flex-col">\n        <PublicHeader />\n        <main className="flex-grow flex items-center justify-center bg-muted/30 px-4 py-12">'
);

// We need to close the main tag.
c = c.replace(
  '      </div>\n    </>',
  '        </main>\n      </div>\n    </>'
);
// Also account for CRLF
c = c.replace(
  '      </div>\r\n    </>',
  '        </main>\r\n      </div>\r\n    </>'
);

fs.writeFileSync('src/pages/LoginPage.tsx', c);
console.log('Fixed LoginPage.tsx layout');
