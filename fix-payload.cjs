const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*BuilderPage.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/quantity: l\.quantity,/g, 'quantity: Number(l.quantity) || 1,');
  content = content.replace(/rate: l\.rate,/g, 'rate: Number(l.rate) || 0,');
  content = content.replace(/discount: l\.discount,/g, 'discount: Number(l.discount) || 0,');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
});
