const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// 1. QuickAction icon color and border
code = code.replace(/group-hover:text-blue-600/g, 'group-hover:text-[#f97316]'); // Tailwind orange-500 hex or class
code = code.replace(/border border-slate-100\/80 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-all/g, 'border border-slate-100/80 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md group-hover:border-orange-200 transition-all');

// 2. ActionAlert button hover color
code = code.replace(/hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3/g, 'hover:text-orange-600 hover:bg-orange-50 rounded-lg px-3');

// 3. Any other blue hovers?
// Let's also add hover text color to ActionAlert text
code = code.replace(/<div className="text-sm font-semibold text-slate-900 transition-colors">\{text\}<\/div>/g, '<div className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{text}</div>');


fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('Hover colors changed to orange');
