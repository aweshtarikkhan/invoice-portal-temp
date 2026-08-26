const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

// 1. Add states
code = code.replace(
  'const [shippingAddress, setShippingAddress] = useState("");',
  `const [shippingName, setShippingName] = useState("");
  const [shippingAddressText, setShippingAddressText] = useState("");
  const [shippingContact, setShippingContact] = useState("");`
);

// 2. Load state on edit
code = code.replace(
  `            try {
               const parsed = typeof inv.shipping_address === "string" ? JSON.parse(inv.shipping_address) : inv.shipping_address;
               setShippingAddress(parsed?.street || String(inv.shipping_address));
            } catch {
               setShippingAddress(String(inv.shipping_address));
            }`,
  `            try {
               const parsed = typeof inv.shipping_address === "string" ? JSON.parse(inv.shipping_address) : inv.shipping_address;
               setShippingName(parsed?.name || "");
               setShippingAddressText(parsed?.street || "");
               setShippingContact(parsed?.contact || "");
            } catch {
               setShippingAddressText(String(inv.shipping_address));
            }`
);

// 3. Save state (add shipping_address to invoicePayload)
code = code.replace(
  'shipping_address: shippingSameAsBilling ? null : { street: shippingAddress },',
  'shipping_address: shippingSameAsBilling ? null : { name: shippingName, street: shippingAddressText, contact: shippingContact },'
);

// 4. Modify UI
const oldUI = `<div className="mt-2">
                       <Textarea 
                         placeholder="Enter Shipping Address..." 
                         value={shippingAddress} 
                         onChange={(e) => setShippingAddress(e.target.value)} 
                         className="h-20 resize-none text-sm"
                       />
                    </div>`;

const newUI = `<div className="mt-2 space-y-2 p-3 border rounded-md bg-slate-50/50">
                       <div>
                         <label className="text-[10px] font-semibold text-muted-foreground uppercase">Shipping Name</label>
                         <Input 
                           placeholder="Receiver Name" 
                           value={shippingName} 
                           onChange={(e) => setShippingName(e.target.value)} 
                           className="h-8 text-sm mt-1"
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-semibold text-muted-foreground uppercase">Shipping Address</label>
                         <Textarea 
                           placeholder="Full Shipping Address..." 
                           value={shippingAddressText} 
                           onChange={(e) => setShippingAddressText(e.target.value)} 
                           className="h-16 resize-none text-sm mt-1"
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-semibold text-muted-foreground uppercase">Contact Details</label>
                         <Input 
                           placeholder="Phone / Email" 
                           value={shippingContact} 
                           onChange={(e) => setShippingContact(e.target.value)} 
                           className="h-8 text-sm mt-1"
                         />
                       </div>
                    </div>`;

code = code.replace(oldUI, newUI);

fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', code, 'utf8');
console.log('patched InvoiceBuilderPage with new Shipping Details UI');
