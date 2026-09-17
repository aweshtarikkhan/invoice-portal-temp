const fs = require('fs');
const path = require('path');

const dir = "c:\\Users\\awesh\\Desktop\\Satah Invoice - Copy\\billflow-pro-94-22f845cd\\src\\pages";

const files = [
  "InvoiceBuilderPage.tsx",
  "EstimateBuilderPage.tsx",
  "PurchaseOrderBuilderPage.tsx",
  "DeliveryChallanBuilderPage.tsx",
  "BillBuilderPage.tsx"
];

for (const file of files) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf8');

  // Regex to match the entire signature toggle block
  const toggleBlockRegex = /[ \t]*\{\/\* Signature Toggle \*\/\}[\s\S]*?<\/TooltipProvider>\n[ \t]*<\/div>\n?/g;
  
  if (toggleBlockRegex.test(content)) {
    // Extract one instance of it
    const match = content.match(/[ \t]*\{\/\* Signature Toggle \*\/\}[\s\S]*?<\/TooltipProvider>\n[ \t]*<\/div>\n?/);
    if (match) {
      const toggleCode = match[0];
      
      // Remove all instances of the toggle code
      content = content.replace(toggleBlockRegex, "");
      
      // Now re-insert it at the bottom.
      // 1. If we have a Fixed Bottom Action Bar, insert before it
      if (content.includes("{/* Fixed Bottom Action Bar */}")) {
        content = content.replace("{/* Fixed Bottom Action Bar */}", toggleCode + "\n      {/* Fixed Bottom Action Bar */}");
      } 
      // 2. Otherwise, for pages like EstimateBuilderPage, find the last closing div before the end
      else if (content.includes("</div>\n    </div>\n  );\n}")) {
        content = content.replace("</div>\n    </div>\n  );\n}", "  " + toggleCode + "\n      </div>\n    </div>\n  );\n}");
      }
      // Fallback for Delivery Challan which might have a different ending
      else {
         const lastReturn = content.lastIndexOf("</div>");
         if (lastReturn !== -1) {
            content = content.slice(0, lastReturn) + "\n" + toggleCode + "\n" + content.slice(lastReturn);
         }
      }
    }
  }

  fs.writeFileSync(p, content, 'utf8');
}
console.log("Moved signature checkboxes to the bottom.");
