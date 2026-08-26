const fs = require('fs');

let content = fs.readFileSync('src/pages/InvoiceTemplatePage.tsx', 'utf8');

const startIndex = content.indexOf('{/* Realistic mini invoice preview */}');
const endIndex = content.indexOf('              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">');

if (startIndex !== -1 && endIndex !== -1) {
  const newPreview = `{/* Realistic mini invoice preview */}
              <div
                className={\`rounded-lg border overflow-hidden bg-white text-[7px] leading-[1.3] text-slate-800 aspect-[1/1.2] p-3 flex flex-col gap-2 shadow-inner\`}
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {/* Header */}
                <div
                  className={\`flex justify-between items-start \${
                    tpl.id === "corporate_blue" || tpl.id === "modern" ? "bg-blue-600 text-white -mx-3 -mt-3 px-3 py-2" :
                    tpl.id === "professional" ? "border-b-2 border-slate-700 pb-1" :
                    tpl.id === "minimal" ? "" :
                    "border-b border-slate-300 pb-1"
                  }\`}
                >
                  <div>
                    <div className={\`font-bold text-[9px] \${tpl.id === 'professional_navy' ? 'text-[#001a4d]' : ''}\`}>ACME Corp.</div>
                    <div className="opacity-70">123 Business St.</div>
                  </div>
                  <div className="text-right">
                    <div className={\`font-bold text-[10px] tracking-wide \${tpl.id === 'professional_navy' ? 'text-[#001a4d]' : ''}\`}>INVOICE</div>
                    <div className="opacity-70">#INV-001</div>
                  </div>
                </div>
                {/* Bill to */}
                {tpl.id === "professional_navy" ? (
                  <div className="border border-gray-400 rounded overflow-hidden mt-1">
                    <div className="bg-[#001a4d] text-white px-1 text-[6px] font-bold">BILL TO</div>
                    <div className="p-1">
                      <div className="font-semibold">John Doe</div>
                      <div className="opacity-70">Doe Industries</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between gap-2">
                    <div>
                      <div className="opacity-60 uppercase text-[6px]">Bill To</div>
                      <div className="font-semibold">John Doe</div>
                      <div className="opacity-70">Doe Industries</div>
                    </div>
                    <div className="text-right">
                      <div className="opacity-60 uppercase text-[6px]">Date</div>
                      <div>12 May 2026</div>
                    </div>
                  </div>
                )}
                {/* Items table */}
                <div className={\`flex-1 \${tpl.id === 'professional_navy' ? 'border border-gray-400 rounded overflow-hidden mt-1' : ''}\`}>
                  <div className={\`flex justify-between font-semibold py-1 px-1 \${
                    tpl.id === "modern" ? "bg-blue-100" : 
                    tpl.id === "professional_navy" ? "bg-[#001a4d] text-white border-b border-gray-400" :
                    "bg-slate-100"
                  }\`}>
                    <span>Item</span><span>Qty</span><span>Amt</span>
                  </div>
                  <div className={\`flex justify-between py-1 px-1 border-b \${tpl.id === 'professional_navy' ? 'border-gray-400' : 'border-slate-100'}\`}>
                    <span>Web Design</span><span>1</span><span>₹1500</span>
                  </div>
                  <div className={\`flex justify-between py-1 px-1 border-b \${tpl.id === 'professional_navy' ? 'border-gray-400' : 'border-slate-100'}\`}>
                    <span>Hosting</span><span>2</span><span>₹1200</span>
                  </div>
                </div>
                {/* Total */}
                <div className={\`flex justify-end \${tpl.id === 'professional_navy' ? 'mt-1' : ''}\`}>
                  <div className={\`px-2 py-1 \${
                    tpl.id === "modern" ? "bg-blue-600 text-white rounded" : 
                    tpl.id === "professional" ? "border-t-2 border-slate-700" : 
                    tpl.id === "professional_navy" ? "bg-[#001a4d] text-white rounded w-full flex justify-between" :
                    "border-t border-slate-300"
                  }\`}>
                    <span className={\`\${tpl.id === 'professional_navy' ? '' : 'opacity-80 mr-1'}\`}>{tpl.id === 'professional_navy' ? 'GRAND TOTAL' : 'Total:'}</span>
                    <span className="font-bold">₹2700.00</span>
                  </div>
                </div>
              </div>

`;

  const newContent = content.substring(0, startIndex) + newPreview + content.substring(endIndex);
  fs.writeFileSync('src/pages/InvoiceTemplatePage.tsx', newContent, 'utf8');
  console.log('patched');
} else {
  console.log('could not find markers');
}
