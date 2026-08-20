const fs = require('fs');

let code = fs.readFileSync('src/pages/BankAccountDetailPage.tsx', 'utf8');

if (!code.includes('createExpenseJournalEntry')) {
  // Add import
  code = code.replace(
    'import { formatCurrency } from "@/lib/currency";',
    'import { formatCurrency } from "@/lib/currency";\nimport { createExpenseJournalEntry } from "@/lib/expense-journal-sync";'
  );
  
  // Add call
  code = code.replace(
    'await linkMatch(matchOpen, "expense", data.id);',
    'await linkMatch(matchOpen, "expense", data.id);\n        createExpenseJournalEntry(org!.id, data.id, createMatchForm.category, Math.abs(Number(matchOpen.amount)), matchOpen.txn_date, createMatchForm.description || matchOpen.description);'
  );
  
  fs.writeFileSync('src/pages/BankAccountDetailPage.tsx', code);
  console.log("Patched journal entry sync");
}
