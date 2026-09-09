const fs = require('fs');

const file = 'src/pages/LeadDetailPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /onChange=\{\(e\) => setActivityForm\(\{ \.\.\.activityForm, due_date: e\.target\.value \} min=\{new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]\}\}\}/g,
  'onChange={(e) => setActivityForm({ ...activityForm, due_date: e.target.value })} min={new Date().toISOString().split("T")[0]}'
);

fs.writeFileSync(file, content);
console.log('Fixed LeadDetailPage.tsx syntax error');
