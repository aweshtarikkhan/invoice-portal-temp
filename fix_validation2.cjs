const fs = require('fs');

const filesToFix = [
  'src/pages/ClientsPage.tsx',
  'src/pages/EmployeesPage.tsx',
  'src/components/shared/AddClientDialog.tsx',
  'src/components/shared/AddVendorDialog.tsx'
];

filesToFix.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    if (content.includes('if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))')) {
      content = content.replace('if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))', 'if (form.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email))');
      changed = true;
    }

    if (content.includes('if (phone && phone.length < 10)')) {
      content = content.replace('if (phone && phone.length < 10)', 'if (form.phone && form.phone.length < 10)');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(f, content);
      console.log('Fixed:', f);
    }
  }
});
