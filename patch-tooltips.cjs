const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// 1. Fix YAxis tickFormatter (corrupted strings)
code = code.replace(/tickFormatter=\{\(val\) => `,1\$\{val\/1000\}k`\}/g, 'tickFormatter={(val) => `₹${val/1000}k`}');

// 2. Add formatter to RechartsTooltip in AreaCharts
const areaTooltipRegex = /<RechartsTooltip contentStyle=\{\{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb\(0 0 0 \/ 0\.1\)' \}\}\s*\/>/g;
const areaTooltipReplacement = `<RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [\`₹\${Number(value).toLocaleString('en-IN')}\`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]} />`;
code = code.replace(areaTooltipRegex, areaTooltipReplacement);

// 3. Add RechartsTooltip to PieChart
const pieChartRegex = /<PieChart>\s*<Pie data=\{pieData\}/g;
const pieChartReplacement = `<PieChart>\n                      <RechartsTooltip formatter={(value) => [\`₹\${Number(value).toLocaleString('en-IN')}\`, 'Amount']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />\n                      <Pie data={pieData}`;
code = code.replace(pieChartRegex, pieChartReplacement);

// 4. Add RechartsTooltip to BarChart
const barChartRegex = /<BarChart data=\{areaChartData\.slice\(-7\)\}>\s*<Bar dataKey="expense"/g;
const barChartReplacement = `<BarChart data={areaChartData.slice(-7)}>\n                    <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => [\`₹\${Number(value).toLocaleString('en-IN')}\`, 'Expense']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />\n                    <Bar dataKey="expense"`;
code = code.replace(barChartRegex, barChartReplacement);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('Tooltips updated successfully');
