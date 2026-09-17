const fs = require('fs');
let c = fs.readFileSync('src/pages/PartnerWithUsPage.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*function CheckIcon/;
c = c.replace(regex, '</div>\n</div>\n</div>\n</main>\n<PublicFooter />\n</div>\n);\n}\n\nfunction CheckIcon');

c = c.replace(/className="min-h-screen bg-slate-50([^"]*)"/g, 'className="bg-slate-50$1"');

fs.writeFileSync('src/pages/PartnerWithUsPage.tsx', c);
