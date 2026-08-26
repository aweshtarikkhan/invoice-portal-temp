const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

code = code.replace(
  `            return {
              invoice_id: invoiceId!,
              item_id: l.item_id,
              name: l.name,
              description: l.description,
              unit: l.unit || "pcs",
              quantity: l.quantity,
              rate: l.rate,
              discount: l.discount,
              discount_type: l.discount_type,
              tax_id: resolvedTaxId,
              tax_amount: l.tax_amount || 0,
              amount: l.amount,
              sort_order: i,
              hsn_code: l.hsn_code?.trim() || null,
              sub_unit: l.sub_unit,
              sub_unit_conversion_rate: l.sub_unit_conversion_rate
            };`,
  `            return {
              invoice_id: invoiceId!,
              item_id: l.item_id,
              name: l.name,
              description: l.description,
              unit: l.unit || "pcs",
              quantity: Number(l.quantity) || 0,
              rate: Number(l.rate) || 0,
              discount: Number(l.discount) || 0,
              discount_type: l.discount_type,
              tax_id: resolvedTaxId,
              tax_amount: Number(l.tax_amount) || 0,
              amount: Number(l.amount) || 0,
              sort_order: i,
              hsn_code: l.hsn_code?.trim() || null,
              sub_unit: l.sub_unit,
              sub_unit_conversion_rate: Number(l.sub_unit_conversion_rate) || 1
            };`
);

// Also let's fix shippingCharge, expenses, adjustment just in case
code = code.replace(
  `        discount,
        discount_type: discountType,
        shipping_charge: shippingCharge,
        expenses,
        adjustment,`,
  `        discount: Number(discount) || 0,
        discount_type: discountType,
        shipping_charge: Number(shippingCharge) || 0,
        expenses: Number(expenses) || 0,
        adjustment: Number(adjustment) || 0,`
);

fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', code, 'utf8');
console.log('patched InvoiceBuilderPage with Number casts');
