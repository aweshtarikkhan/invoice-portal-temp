const fs = require('fs');

let content = fs.readFileSync('src/pages/PipelinePage.tsx', 'utf8');
content = content.replace(
  'onChange={(e) => setForm({ ...form, expected_close_date: e.target.value } min={new Date().toISOString().split("T")[0]})}',
  'onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} min={new Date().toISOString().split("T")[0]}'
);
fs.writeFileSync('src/pages/PipelinePage.tsx', content);

let content2 = fs.readFileSync('src/pages/DealDetailPage.tsx', 'utf8');
content2 = content2.replace(
  'onChange={e => setEditForm({ ...editForm, expected_close_date: e.target.value } min={new Date().toISOString().split("T")[0]})}',
  'onChange={e => setEditForm({ ...editForm, expected_close_date: e.target.value })} min={new Date().toISOString().split("T")[0]}'
);
fs.writeFileSync('src/pages/DealDetailPage.tsx', content2);

let content3 = fs.readFileSync('src/pages/LeadDetailPage.tsx', 'utf8');
content3 = content3.replace(
  'onChange={(e) => setOppForm({ ...oppForm, expected_close_date: e.target.value } min={new Date().toISOString().split("T")[0]})}',
  'onChange={(e) => setOppForm({ ...oppForm, expected_close_date: e.target.value })} min={new Date().toISOString().split("T")[0]}'
);
fs.writeFileSync('src/pages/LeadDetailPage.tsx', content3);
