const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const regex = /const ActivityRow = \(\{ icon: Icon, color, bg, title, amount, time \}: any\) => \([\s\S]*?<\/div>\s*<\/div>\s*\);/;
const replacement = `const ActivityRow = ({ icon: Icon, color, bg, title, amount, time }: any) => (
  <div className="group flex items-center justify-between p-2.5 -mx-2 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100/50 last:border-0 last:pb-2.5">
    <div className="flex items-center gap-3.5">
      <div className={\`p-2.5 rounded-full \${bg} group-hover:scale-105 transition-transform\`}>
        <Icon className={\`w-4 h-4 \${color}\`} />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{time}</div>
      </div>
    </div>
    {amount && <div className="text-sm font-bold text-slate-900">{amount}</div>}
  </div>
);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('ActivityRow styling improved');
