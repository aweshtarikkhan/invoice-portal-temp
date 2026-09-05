const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'LandingPage.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = \<Link to="/" className="flex items-center gap-2">
            <img src={\\\\\\?v=\\\\\\} alt="Assay Biz" className="h-9 w-auto brightness-0 invert" />
          </Link>\;

const replacement = \<Link to="/" className="flex items-center gap-2">
            <div className="bg-white/95 px-3 py-1.5 rounded-lg shadow-sm border border-white/20">
              <img src={\\\\\\?v=\\\\\\} alt="Assay Biz" className="h-7 w-auto object-contain" />
            </div>
          </Link>\;

content = content.replace(target, replacement);

// Fallback if formatting was slightly different
if (content.includes('brightness-0 invert')) {
    content = content.replace(/<img src=\{.*?logoImg.*?\} alt="Assay Biz" className=".*?brightness-0 invert" \/>/, \<div className="bg-white/95 px-3 py-1.5 rounded-lg shadow-sm border border-white/20">
              <img src={\\\\\\?v=\\\\\\} alt="Assay Biz" className="h-7 w-auto object-contain" />
            </div>\);
}

fs.writeFileSync(file, content);
