const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const regex = /const ActionAlert = \(\{ icon: Icon, iconColor, bgColor, text, subtext, btnText, onClick \}: any\) => \([\s\S]*?<\/Button>\s*<\/div>\s*\);/;
const replacement = `const ActionAlert = ({ icon: Icon, iconColor, bgColor, text, subtext, btnText, onClick }: any) => (
  <div className="group flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100/80 hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
    <div className="flex items-center gap-3.5">
      <div className={\`p-2.5 rounded-xl \${bgColor}\`}>
        <Icon className={\`w-4 h-4 \${iconColor}\`} />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900 transition-colors">{text}</div>
        <div className="text-xs text-slate-500 mt-0.5">{subtext}</div>
      </div>
    </div>
    <Button variant="ghost" size="sm" onClick={onClick} className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3">
      {btnText}
    </Button>
  </div>
);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('ActionAlert styling improved');
