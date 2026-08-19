const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// 1. Update chart data map initialization
code = code.replace(/chartDataMap\[dateStr\] = \{ date: dateStr, revenue: 0, expense: 0 \};/g, 'chartDataMap[dateStr] = { date: dateStr, revenue: 0, expense: 0, collections: 0, profit: 0 };');

// 2. Add collections and profit logic
const expenseLoopStr = `    filteredExpenses.forEach(exp => {
      const dStr = format(new Date(exp.expense_date || exp.created_at), "MMM dd");
      if (chartDataMap[dStr]) chartDataMap[dStr].expense += Number(exp.amount || 0);
    });`;

const newLoops = `    filteredExpenses.forEach(exp => {
      const dStr = format(new Date(exp.expense_date || exp.created_at), "MMM dd");
      if (chartDataMap[dStr]) chartDataMap[dStr].expense += Number(exp.amount || 0);
    });
    filteredPayments.forEach(pay => {
      const dStr = format(new Date(pay.payment_date || pay.created_at), "MMM dd");
      if (chartDataMap[dStr]) chartDataMap[dStr].collections += Number(pay.amount || 0);
    });
    Object.values(chartDataMap).forEach(d => {
      d.profit = d.revenue - d.expense;
    });`;
code = code.replace(expenseLoopStr, newLoops);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log('Chart logic updated');
