const fs = require('fs'); 
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8'); 
const quickActionsRegex = /<Card className="shadow-sm border-slate-200">\s*<CardHeader>\s*<CardTitle className="text-base font-semibold">Quick Actions<\/CardTitle>\s*<\/CardHeader>\s*<CardContent>\s*<div className="grid grid-cols-2 gap-3">([\s\S]*?)<\/div>\s*<\/CardContent>\s*<\/Card>/m; 
const match = code.match(quickActionsRegex); 
if (match) { 
  code = code.replace(match[0], ''); 
  const newGrid = `<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">${match[1]}</div>`; 
  const headerRegex = /<Button className="bg-slate-900 hover:bg-slate-800">\s*<Plus className="h-4 w-4 mr-2" \/> Create\s*<\/Button>\s*<\/div>\s*<\/div>/m; 
  code = code.replace(headerRegex, (m) => m + '\n\n' + newGrid); 
  fs.writeFileSync('src/pages/DashboardPage.tsx', code); 
  console.log('Successfully moved Quick Actions'); 
} else { 
  console.log('Regex did not match'); 
}
