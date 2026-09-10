const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'src/components/shared/AddClientDialog.tsx',
  'src/components/shared/AddVendorDialog.tsx',
  'src/pages/CampaignsPage.tsx',
  'src/pages/ClientsPage.tsx',
  'src/pages/EmployeesPage.tsx',
  'src/pages/LeadsPage.tsx',
  'src/pages/SettingsPage.tsx',
  '../attendance-portal/src/components/shared/AddClientDialog.tsx',
  '../attendance-portal/src/components/shared/AddVendorDialog.tsx'
];

filesToPatch.forEach(f => {
  const fullPath = path.resolve(f);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // AddClientDialog / AddVendorDialog
  if (content.includes('const handleSave = async () => {')) {
    const valCode = `
    if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (phone && phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 10 digits.", variant: "destructive" });
      return;
    }`;
    if (!content.includes('Invalid Email')) {
      content = content.replace('const handleSave = async () => {', 'const handleSave = async () => {' + valCode);
      changed = true;
    }
  }

  // EmployeesPage
  if (f.includes('EmployeesPage') && content.includes('const save = async () => {')) {
    const valCode = `
    if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (phone && phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 10 digits.", variant: "destructive" });
      return;
    }`;
    if (!content.includes('Invalid Email')) {
      content = content.replace('const save = async () => {', 'const save = async () => {' + valCode);
      changed = true;
    }
  }

  // LeadsPage
  if (f.includes('LeadsPage') && content.includes('const save = async () => {')) {
    const valCode = `
    if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (phone && phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 10 digits.", variant: "destructive" });
      return;
    }`;
    if (!content.includes('Invalid Email')) {
      content = content.replace('const save = async () => {', 'const save = async () => {' + valCode);
      changed = true;
    }
  }

  // SettingsPage
  if (f.includes('SettingsPage') && content.includes('const saveProfile = async () => {')) {
    const valCode = `
    if (profile.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(profile.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (profile.phone && profile.phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 10 digits.", variant: "destructive" });
      return;
    }`;
    if (!content.includes('Invalid Email')) {
      content = content.replace('const saveProfile = async () => {', 'const saveProfile = async () => {' + valCode);
      changed = true;
    }
  }

  // CampaignsPage (for prospects)
  if (f.includes('CampaignsPage') && content.includes('const handleAddProspect = () => {')) {
    const valCode = `
    if (newProspect.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(newProspect.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (newProspect.phone && newProspect.phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 10 digits.", variant: "destructive" });
      return;
    }`;
    if (!content.includes('Invalid Email')) {
      content = content.replace('const handleAddProspect = () => {', 'const handleAddProspect = () => {' + valCode);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log('Patched:', f);
  }
});
