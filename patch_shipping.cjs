const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

if (!code.includes('shippingAddress, setShippingAddress')) {
  // 1. Add state
  code = code.replace(
    'const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);',
    'const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);\n  const [shippingAddress, setShippingAddress] = useState("");'
  );

  // 2. Load state on edit
  code = code.replace(
    'setDueDate(inv.due_date);',
    `setDueDate(inv.due_date);\n        }\n        if (inv.shipping_address) {\n          try {\n             const parsed = typeof inv.shipping_address === "string" ? JSON.parse(inv.shipping_address) : inv.shipping_address;\n             setShippingAddress(parsed?.street || String(inv.shipping_address));\n          } catch {\n             setShippingAddress(String(inv.shipping_address));\n          }\n        }`
  );

  // 3. Save state (add shipping_address to invoicePayload)
  code = code.replace(
    'shipping_charge: Number(shippingCharge) || 0,',
    'shipping_address: shippingSameAsBilling ? null : { street: shippingAddress },\n        shipping_charge: Number(shippingCharge) || 0,'
  );

  // 4. Add Textarea UI
  code = code.replace(
    `<div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="same_as_billing" checked={shippingSameAsBilling} onCheckedChange={(c) => setShippingSameAsBilling(!!c)} />
                  <label htmlFor="same_as_billing" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Bill To and Ship To are same
                  </label>
                </div>`,
    `<div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="same_as_billing" checked={shippingSameAsBilling} onCheckedChange={(c) => setShippingSameAsBilling(!!c)} />
                  <label htmlFor="same_as_billing" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Bill To and Ship To are same
                  </label>
                </div>
                {!shippingSameAsBilling && (
                  <div className="mt-2">
                     <Textarea 
                       placeholder="Enter Shipping Address..." 
                       value={shippingAddress} 
                       onChange={(e) => setShippingAddress(e.target.value)} 
                       className="h-20 resize-none text-sm"
                     />
                  </div>
                )}`
  );

  fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', code, 'utf8');
  console.log('patched InvoiceBuilderPage with Shipping Address UI');
} else {
  console.log('already patched');
}
