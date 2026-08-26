
const fs = require("fs");
let code = fs.readFileSync("src/components/layout/AppLayout.tsx", "utf8");

code = code.replace(
  `              employee_limit: subData.employee_limit,
              employee_count: subData.employee_count,
              current_period_end: subData.current_period_end,`,
  `              employee_limit: subData.employee_limit,
              employee_count: subData.employee_count,
              invoice_limit: subData.invoice_limit,
              client_limit: subData.client_limit,
              item_limit: subData.item_limit,
              current_period_end: subData.current_period_end,`
);

fs.writeFileSync("src/components/layout/AppLayout.tsx", code);

