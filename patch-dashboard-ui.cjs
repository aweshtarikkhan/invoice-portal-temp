const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// Header gradient
code = code.replace(/<h1 className="text-3xl font-bold tracking-tight text-slate-900">/, '<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">');

// Subcomponents:
// 1. QuickAction styling
code = code.replace(/className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"/g, 'className="group flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all cursor-pointer"');
code = code.replace(/<Icon className="w-5 h-5 text-slate-600 mb-2" \/>/g, '<div className="p-2.5 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors mb-3"><Icon className="w-5 h-5 text-slate-700" /></div>');

// 2. ActionAlert styling
code = code.replace(/className={`flex items-start justify-between p-3 rounded-xl \${bgColor} border border-transparent hover:border-black\/5 transition-colors`}/g, 'className={`flex items-start justify-between p-4 rounded-2xl ${bgColor} border border-transparent hover:shadow-sm transition-all`}');

// 3. Main Cards styling
code = code.replace(/className="shadow-sm border-slate-200"/g, 'className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl"');
code = code.replace(/className="lg:col-span-2 shadow-sm border-slate-200"/g, 'className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl"');

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('Dashboard UI improved');
