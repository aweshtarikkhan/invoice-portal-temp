const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('src'), ...walk('../attendance-portal/src')];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Pattern for object state: onChange={(e) => setFormData({...formData, phone: e.target.value})}
  const regex1 = /onChange=\{\(e\)\s*=>\s*([a-zA-Z0-9_]+)\(\s*\{\s*\.\.\.[a-zA-Z0-9_]+,\s*(phone|pin|pincode|zip|mobile|contact_number):\s*e\.target\.value\s*\}\s*\)\}/gi;
  content = content.replace(regex1, (match) => {
    changed = true;
    return match.replace('e.target.value', "e.target.value.replace(/\\D/g, '')");
  });

  // Pattern for object state without parens: onChange={e => setFormData({...formData, phone: e.target.value})}
  const regex1b = /onChange=\{e\s*=>\s*([a-zA-Z0-9_]+)\(\s*\{\s*\.\.\.[a-zA-Z0-9_]+,\s*(phone|pin|pincode|zip|mobile|contact_number):\s*e\.target\.value\s*\}\s*\)\}/gi;
  content = content.replace(regex1b, (match) => {
    changed = true;
    return match.replace('e.target.value', "e.target.value.replace(/\\D/g, '')");
  });

  // Pattern for simple state: onChange={(e) => setPhone(e.target.value)}
  const regex2 = /onChange=\{\(e\)\s*=>\s*set(Phone|Pin|Pincode|Zip|Mobile|ContactNumber|Contact|BillingZip|ShippingZip)\(e\.target\.value\)\}/gi;
  content = content.replace(regex2, (match) => {
    changed = true;
    return match.replace('e.target.value', "e.target.value.replace(/\\D/g, '')");
  });

  // Pattern for simple state without parens: onChange={e => setPhone(e.target.value)}
  const regex2b = /onChange=\{e\s*=>\s*set(Phone|Pin|Pincode|Zip|Mobile|ContactNumber|Contact|BillingZip|ShippingZip)\(e\.target\.value\)\}/gi;
  content = content.replace(regex2b, (match) => {
    changed = true;
    return match.replace('e.target.value', "e.target.value.replace(/\\D/g, '')");
  });

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed Phone/Pin:', f);
  }
});
