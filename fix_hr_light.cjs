const fs = require('fs');
let code = fs.readFileSync('src/pages/HRReportsPage.tsx', 'utf8');

// Replace dark background colors with light
code = code.replace(/bg-slate-900/g, 'bg-white');
code = code.replace(/bg-slate-800/g, 'bg-gray-50');
code = code.replace(/bg-slate-700/g, 'bg-gray-100');
code = code.replace(/bg-slate-950/g, 'bg-gray-50');
code = code.replace(/bg-\[#0[a-fA-F0-9]{5}\]/g, 'bg-white');

// Replace dark border colors
code = code.replace(/border-slate-800/g, 'border-gray-200');
code = code.replace(/border-slate-700/g, 'border-gray-200');
code = code.replace(/border-slate-600/g, 'border-gray-300');

// Replace dark text colors
code = code.replace(/text-slate-50/g, 'text-gray-900');
code = code.replace(/text-slate-100/g, 'text-gray-800');
code = code.replace(/text-slate-200/g, 'text-gray-700');
code = code.replace(/text-slate-300/g, 'text-gray-600');
code = code.replace(/text-slate-400/g, 'text-gray-500');

fs.writeFileSync('src/pages/HRReportsPage.tsx', code, 'utf8');
console.log('Fixed HRReportsPage to light mode');
