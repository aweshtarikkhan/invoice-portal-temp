
const fs = require("fs");
let code = fs.readFileSync("src/hooks/use-subscription.ts", "utf8");

code = code.replace(
  `    employeeLimit,
    employeeCount,`,
  `    employeeLimit,
    employeeCount,
    invoiceLimit,
    clientLimit,
    itemLimit,`
);

code = code.replace(
  `    employeeLimit,
    employeeCount,
    currentPeriodEnd,`,
  `    employeeLimit,
    employeeCount,
    invoiceLimit,
    clientLimit,
    itemLimit,
    currentPeriodEnd,`
);

fs.writeFileSync("src/hooks/use-subscription.ts", code);

