const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceDetailPage.tsx', 'utf8');

code = code.replace(
  `      const { data: inv } = await supabase
        .from("invoices")
        .select("*, clients(display_name, email, tax_number, phone, address, billing_address, shipping_address)")
        .eq("id", id)
        .single();
      
      if (inv) {`,
  `      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("*, clients(display_name, email, tax_number, phone, address, billing_address, shipping_address)")
        .eq("id", id)
        .single();
      
      if (invErr) {
        console.error("Fetch invoice error:", invErr);
        toast({ title: "Error loading invoice", description: invErr.message, variant: "destructive" });
      }
      
      if (inv) {`
);

fs.writeFileSync('src/pages/InvoiceDetailPage.tsx', code, 'utf8');
console.log('Added error logging for invoice fetch');
