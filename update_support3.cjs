const fs = require('fs');

let c = fs.readFileSync('src/pages/SupportPage.tsx', 'utf8');

const startStr = "const handleSubmitForm = (e: React.FormEvent) => {";
const endStr = "setSubmitting(false);\n  };";

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newHandleSubmit = `const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a subject and details for your query.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const payload = {
        name: formData.name || 'N/A',
        email: formData.email || user?.email || 'N/A',
        phone: (formData as any).phone || 'N/A',
        business: org?.name || 'N/A',
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
      };

      const { error } = await supabase.from('feature_requests').insert({
        feature_name: 'Help & Support',
        request_type: 'support_request',
        user_email: payload.email,
        message: JSON.stringify(payload),
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: 'Request sent successfully',
        description: 'Our support team has received your query and will respond soon.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        subject: '',
        message: '',
      } as any);
    } catch (err: any) {
      toast({
        title: 'Error submitting request',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };`;
  
  c = c.slice(0, startIndex) + newHandleSubmit + c.slice(endIndex + endStr.length);
  fs.writeFileSync('src/pages/SupportPage.tsx', c);
  console.log('SupportPage.tsx updated successfully.');
} else {
  console.log('Could not find boundaries.');
}
