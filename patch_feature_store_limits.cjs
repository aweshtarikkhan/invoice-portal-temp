
const fs = require("fs");
let code = fs.readFileSync("src/store/feature-store.ts", "utf8");

code = code.replace(
  `  employeeLimit: number | null;
  employeeCount: number;`,
  `  employeeLimit: number | null;
  employeeCount: number;
  invoiceLimit: number | null;
  clientLimit: number | null;
  itemLimit: number | null;`
);

code = code.replace(
  `    employee_limit: number | null;
    employee_count: number;`,
  `    employee_limit: number | null;
    employee_count: number;
    invoice_limit?: number | null;
    client_limit?: number | null;
    item_limit?: number | null;`
);

code = code.replace(
  `  employeeLimit: null,
  employeeCount: 0,`,
  `  employeeLimit: null,
  employeeCount: 0,
  invoiceLimit: null,
  clientLimit: null,
  itemLimit: null,`
);

code = code.replace(
  `      employeeLimit: meta.employee_limit,
      employeeCount: meta.employee_count,`,
  `      employeeLimit: meta.employee_limit,
      employeeCount: meta.employee_count,
      invoiceLimit: meta.invoice_limit || null,
      clientLimit: meta.client_limit || null,
      itemLimit: meta.item_limit || null,`
);

fs.writeFileSync("src/store/feature-store.ts", code);

