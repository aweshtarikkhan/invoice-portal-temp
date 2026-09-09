const fs = require('fs');

function fixSyntax(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /\} min=\{new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]\}\}/g,
    '})} min={new Date().toISOString().split("T")[0]}'
  );
  fs.writeFileSync(file, content);
}

fixSyntax('src/pages/PipelinePage.tsx');
fixSyntax('src/pages/DealDetailPage.tsx');
fixSyntax('src/pages/LeadDetailPage.tsx');
