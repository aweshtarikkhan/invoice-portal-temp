const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const quickActionRegex = /const QuickAction = \(\{ icon: Icon, label, onClick \}: any\) => \([\s\S]*?<\/button>\s*\);/;
const quickActionReplacement = `const QuickAction = ({ icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center justify-start p-2 hover:bg-slate-200/20 rounded-2xl transition-all gap-2"
  >
    <div className="w-14 h-14 rounded-[1.25rem] bg-white shadow-sm border border-slate-100/80 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-all">
      <Icon className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" />
    </div>
    <span className="text-[11px] font-medium text-slate-600 text-center leading-tight mt-1">{label}</span>
  </button>
);`;
code = code.replace(quickActionRegex, quickActionReplacement);

const kpiCardRegex = /const KPICard = \(\{ title, value, icon: Icon, trend, isUp, color, bg \}: any\) => \([\s\S]*?<\/Card>\s*\);/;
const kpiCardReplacement = `const KPICard = ({ title, value, icon: Icon, trend, isUp, color, bg }: any) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 rounded-2xl overflow-hidden relative bg-white">
    <div className={\`absolute -right-6 -top-6 w-28 h-28 rounded-full \${bg} opacity-40 blur-3xl pointer-events-none\`}></div>
    <CardContent className="p-5 relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className={\`p-3 rounded-xl \${bg} border border-white/50 shadow-sm\`}>
          <Icon className={\`w-5 h-5 \${color}\`} />
        </div>
        <div className={\`flex items-center text-xs font-semibold px-2 py-1 rounded-full \${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}\`}>
          {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-[13px] font-medium text-slate-500 mb-1">{title}</div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      </div>
    </CardContent>
  </Card>
);`;
code = code.replace(kpiCardRegex, kpiCardReplacement);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('Shapes and designs improved');
