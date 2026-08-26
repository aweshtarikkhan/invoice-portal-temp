const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceDetailPage.tsx', 'utf8');

// 1. Fetch custom fields for the invoice
if (!code.includes('custom_field_values')) {
  code = code.replace(
    `.select("*, clients(display_name, email, tax_number, phone)")`,
    `.select("*, clients(display_name, email, tax_number, phone, address, billing_address, shipping_address), custom_field_values(value, custom_field_definitions(field_name))")`
  );
}

// 2. Fix GST-ENABLED string and ensure custom_fields are passed to the template
code = code.replace(
  `gst_number: snapshot.has_gst !== undefined ? (snapshot.has_gst ? "GST-ENABLED" : "") : org?.gst_number,`,
  `gst_number: snapshot.has_gst !== undefined ? (snapshot.has_gst ? org?.gst_number : "") : org?.gst_number,\n    custom_fields: invoice.custom_field_values?.map((cf: any) => ({ name: cf.custom_field_definitions?.field_name, value: cf.value })) || [],`
);

fs.writeFileSync('src/pages/InvoiceDetailPage.tsx', code, 'utf8');
console.log('patched InvoiceDetailPage.tsx');
