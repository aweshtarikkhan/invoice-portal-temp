const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceDetailPage.tsx', 'utf8');

code = code.replace(
  `      const { data: inv } = await supabase
        .from("invoices")
        .select("*, clients(display_name, email, tax_number, phone, address, billing_address, shipping_address), custom_field_values(value, custom_field_definitions(field_name))")
        .eq("id", id)
        .single();
      setInvoice(inv);
      if (inv) {`,
  `      const { data: inv } = await supabase
        .from("invoices")
        .select("*, clients(display_name, email, tax_number, phone, address, billing_address, shipping_address)")
        .eq("id", id)
        .single();
      
      if (inv) {
        const { data: cfData } = await supabase
          .from("custom_field_values")
          .select("value, custom_field_definitions(field_name)")
          .eq("entity_id", id);
        (inv as any).custom_field_values = cfData || [];
      }
      setInvoice(inv);
      
      if (inv) {`
);

fs.writeFileSync('src/pages/InvoiceDetailPage.tsx', code, 'utf8');
console.log('patched InvoiceDetailPage to fetch custom fields separately');
