const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

code = code.replace(/<Clock className="h-3\.5 w-3\.5 text-indigo-400" \/>/, '<Sparkles className="h-3.5 w-3.5 text-indigo-400" />');

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log('Swapped Clock to Sparkles');
