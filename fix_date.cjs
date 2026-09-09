const fs = require('fs');

function addMinDateToExpectedClose(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /type="date"(\s+)value=\{([^}]+)\}(\s+)onChange=\{([^}]+)\}/g,
    'type="date"$1value={$2}$3onChange={$4} min={new Date().toISOString().split("T")[0]}'
  );
  fs.writeFileSync(file, content);
  console.log('Fixed min date in ' + file);
}

addMinDateToExpectedClose('src/pages/PipelinePage.tsx');
addMinDateToExpectedClose('src/pages/DealDetailPage.tsx');
addMinDateToExpectedClose('src/pages/LeadDetailPage.tsx');
