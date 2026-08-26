const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

if (!code.includes('shippingSameAsBilling')) {
  // 1. Add state
  code = code.replace(
    'const [invoiceNumber, setInvoiceNumber] = useState("");',
    'const [invoiceNumber, setInvoiceNumber] = useState("");\n  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);'
  );

  // 2. Load state on edit
  code = code.replace(
    'setInvoiceNumber(inv.invoice_number);',
    'setInvoiceNumber(inv.invoice_number);\n        if (inv.metadata && (inv.metadata as any).shipping_same_as_billing !== undefined) setShippingSameAsBilling((inv.metadata as any).shipping_same_as_billing);'
  );

  // 3. Save state
  code = code.replace(
    'has_gst: Boolean(org?.gst_number),',
    'has_gst: Boolean(org?.gst_number),\n          shipping_same_as_billing: shippingSameAsBilling,'
  );

  // 4. Add Checkbox UI below the client dropdown
  code = code.replace(
    '<button\n                        type="button"\n                        className="absolute right-0 top-0 h-9 w-8 flex items-center justify-center \\ntext-muted-foreground hover:text-foreground"',
    '<button\n                        type="button"\n                        className="absolute right-0 top-0 h-9 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"'
  );
  
  // Actually, let's just find the closing tag of the relative flex-1 div
  const searchUI = `                      {clientDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border \\nrounded-md shadow-md max-h-48 overflow-y-auto">`;
                        
  code = code.replace(
    `                        <ChevronDown className="h-4 w-4" />
                      </button>
                      {clientDropdownOpen && (`,
    `                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox id="same_as_billing" checked={shippingSameAsBilling} onCheckedChange={(c) => setShippingSameAsBilling(!!c)} />
                    <label htmlFor="same_as_billing" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Bill To and Ship To are same
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      {clientDropdownOpen && (`
  );
}

fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', code, 'utf8');
console.log('patched InvoiceBuilderPage');
