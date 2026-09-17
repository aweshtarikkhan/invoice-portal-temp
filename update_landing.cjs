const fs = require('fs');

const file = 'src/pages/LandingPage.tsx';
let c = fs.readFileSync(file, 'utf8');

// Add imports
if (!c.includes('PublicHeader')) {
  c = c.replace('import logoImg from "@/assets/logo.png";', 'import logoImg from "@/assets/logo.png";\nimport { PublicHeader } from "@/components/public/PublicHeader";\nimport { PublicFooter } from "@/components/public/PublicFooter";');
}

// Remove header
const headerRegex = /<header.*?<\/header>/s;
c = c.replace(headerRegex, '<PublicHeader />');

// Remove footer and WhatsApp aside
const footerRegex = /<footer.*?<\/footer>\s*\{\/\* Floating WhatsApp Action Button \*\/\}\s*<aside.*?<\/aside>/s;
c = c.replace(footerRegex, '<PublicFooter />');

fs.writeFileSync(file, c);
console.log('Updated LandingPage.tsx');
