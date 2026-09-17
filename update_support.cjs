const fs = require('fs');

let c = fs.readFileSync('src/pages/SupportPage.tsx', 'utf8');

// 1. Add supabase import
if (!c.includes('import { supabase } from')) {
  c = c.replace(
    "import { useAppStore } from '@/store/app-store';",
    "import { useAppStore } from '@/store/app-store';\nimport { supabase } from '@/integrations/supabase/client';"
  );
}

// 2. Add regex validation to handleSubmitForm
const handleRegex = /const handleSubmitForm = async \(e: React.FormEvent\) => \{\s*e.preventDefault\(\);/;
const validationLogic = `const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.phone)) {
      toast({ title: "Invalid Mobile", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }
`;
c = c.replace(handleRegex, validationLogic);

// 3. Update Labels
c = c.replace('<Label htmlFor="email">Email Address *</Label>', '<Label htmlFor="email">Email ID *</Label>');
c = c.replace('<Label htmlFor="phone">Phone / WhatsApp (Optional)</Label>', '<Label htmlFor="phone">Mobile No. *</Label>');

// Update Input placeholders/required
c = c.replace('placeholder="+91 98765 43210"', 'placeholder="10-digit Mobile No." required');

// 4. Update the Buttons
const buttonsRegex = /<div className="pt-2 flex flex-col sm:flex-row items-center gap-3">.*?<\/form>/s;
const singleButtonCode = `<div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
                  >
                    <Send className="w-4 h-4 mr-2" /> {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>`;
c = c.replace(buttonsRegex, singleButtonCode);

fs.writeFileSync('src/pages/SupportPage.tsx', c);
console.log('Fixed SupportPage form, validation, imports, and buttons');
