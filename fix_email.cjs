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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Add type="email" to email inputs
  const regexEmailInput = /<Input([^>]*)value=\{email\}([^>]*)>/g;
  content = content.replace(regexEmailInput, (match, p1, p2) => {
    if (!match.includes('type="email"')) {
      changed = true;
      return `<Input type="email"${p1}value={email}${p2}>`;
    }
    return match;
  });
  
  const regexEmailInput2 = /<Input([^>]*)onChange=\{\(e\) => setEmail\(e.target.value\)\}([^>]*)>/g;
  content = content.replace(regexEmailInput2, (match, p1, p2) => {
    if (!match.includes('type="email"')) {
      changed = true;
      return `<Input type="email"${p1}onChange={(e) => setEmail(e.target.value)}${p2}>`;
    }
    return match;
  });

  // We will manually inject the validation logic into the submit functions via another script or manually.
  
  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Added type=email:', f);
  }
});
