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

  // Add maxLength={15} to phone/mobile inputs
  const regexPhoneInput = /<Input([^>]*)value=\{phone\}([^>]*)>/g;
  content = content.replace(regexPhoneInput, (match, p1, p2) => {
    if (!match.includes('maxLength=')) {
      changed = true;
      return `<Input maxLength={15}${p1}value={phone}${p2}>`;
    }
    return match;
  });

  const regexPhoneInput2 = /<Input([^>]*)value=\{profile\.phone\}([^>]*)>/g;
  content = content.replace(regexPhoneInput2, (match, p1, p2) => {
    if (!match.includes('maxLength=')) {
      changed = true;
      return `<Input maxLength={15}${p1}value={profile.phone}${p2}>`;
    }
    return match;
  });
  
  const regexPhoneInput3 = /<Input([^>]*)value=\{prospectForm\.phone\}([^>]*)>/g;
  content = content.replace(regexPhoneInput3, (match, p1, p2) => {
    if (!match.includes('maxLength=')) {
      changed = true;
      return `<Input maxLength={15}${p1}value={prospectForm.phone}${p2}>`;
    }
    return match;
  });

  // Add maxLength={6} to pin/zip inputs
  const regexPinInput = /<Input([^>]*)value=\{billingZip\}([^>]*)>/g;
  content = content.replace(regexPinInput, (match, p1, p2) => {
    if (!match.includes('maxLength=')) {
      changed = true;
      return `<Input maxLength={6}${p1}value={billingZip}${p2}>`;
    }
    return match;
  });
  
  const regexPinInput2 = /<Input([^>]*)value=\{shippingZip\}([^>]*)>/g;
  content = content.replace(regexPinInput2, (match, p1, p2) => {
    if (!match.includes('maxLength=')) {
      changed = true;
      return `<Input maxLength={6}${p1}value={shippingZip}${p2}>`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Added maxLength:', f);
  }
});
