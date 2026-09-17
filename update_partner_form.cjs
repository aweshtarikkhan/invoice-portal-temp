const fs = require('fs');

let c = fs.readFileSync('src/pages/PartnerWithUsPage.tsx', 'utf8');

c = c.replace('Email Address', 'Email ID');
c = c.replace('Mobile Number', 'Mobile No.');

const handleSubmitRegex = /const handleSubmit = async \(e: React.FormEvent\) => \{\s*e.preventDefault\(\);\s*setLoading\(true\);/;
const validationLogic = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add regex validation (Testers)
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast({ title: "Invalid Mobile", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }

    setLoading(true);`;

c = c.replace(handleSubmitRegex, validationLogic);

fs.writeFileSync('src/pages/PartnerWithUsPage.tsx', c);
console.log('Fixed labels and added validation to PartnerWithUsPage');
