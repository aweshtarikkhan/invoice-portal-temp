const fs = require('fs');

function fix(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes('errors++') && !c.includes('failedRows.push')) {
    // try to fix ItemsPage specifically
    c = c.replace('if (error) {\n              errors++;', 'if (error) {\n              errors++; failedRows.push({ row, reason: error.message || "Failed to insert item" });');
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
  }
}

fix('src/pages/ItemsPage.tsx');
