export const ROUTE_TITLE_MAP: Record<string, string> = {
  "/dashboard": "Overview & Business Insights",
  "/invoices": "Invoices & Sales",
  "/invoices/new": "Create Sales Invoice",
  "/quotations": "Quotations & Estimates",
  "/quotations/new": "Create Quotation",
  "/clients": "Clients & Parties Directory",
  "/payments": "Payments Received & Ledger",
  "/payments/new": "Record Payment",
  "/credit-notes": "Credit Notes & Returns",
  "/credit-notes/new": "Create Credit Note",
  "/recurring-invoices": "Recurring Invoices",
  "/delivery-challans": "Delivery Challans",
  "/delivery-challans/new": "Create Delivery Challan",
  "/tally-sync": "Tally Connector & Sync",
  "/items": "Products & Services Catalog",
  "/inventory": "Live Stock & Inventory",
  "/branches": "Branch Management & Stock Transfers",
  "/warehouses": "Warehouses & Storage",
  "/vendors": "Vendors & Suppliers",
  "/purchase-orders": "Purchase Orders",
  "/purchase-orders/new": "Create Purchase Order",
  "/grns": "Goods Receipt Notes (GRN)",
  "/grns/new": "Create Goods Receipt",
  "/bills": "Purchase Invoices & Bills",
  "/bills/new": "Record Purchase Bill",
  "/debit-notes": "Debit Notes & Vendor Returns",
  "/debit-notes/new": "Create Debit Note",
  "/expenses": "Business Expenses Ledger",
  "/accounts": "Chart of Accounts",
  "/journal": "General Journal & Entries",
  "/bank-accounts": "Bank & Cash Accounts",
  "/cash-flow": "Cash Flow & Bank Statements",
  "/reports": "Business Reports & Intelligence",
  "/sales-reports": "Sales Analytics & Performance",
  "/purchase-accounting-reports": "Purchase & Expense Reports",
  "/inventory-reports": "Inventory Valuation & Reports",
  "/inventory-valuation": "Stock Valuation (FIFO / Weighted)",
  "/aging-details": "Accounts Aging Analysis",
  "/profit-loss": "Profit & Loss Statement",
  "/gst-returns": "GST Compliance & GSTR Summary",
  "/hr-reports": "Staff HR & Attendance Analytics",
  "/crm-reports": "CRM & Sales Pipeline Reports",
  "/promotion-reports": "Marketing & Campaign Reach",
  "/business-report": "Executive Business Summary",
  "/statements": "Statements of Account",
  "/templates": "Invoice Templates Studio",
  "/templates/customize": "Template Designer",
  "/audit-logs": "System Audit Logs",
  "/custom-fields": "Custom Fields Manager",
  "/employees": "Employees & Workforce Directory",
  "/attendance": "Attendance & Regularization Log",
  "/shifts": "Shift Scheduling & Rosters",
  "/leaves": "Leave Applications & Balances",
  "/employee-documents": "Staff Document Vault",
  "/payroll": "Payroll Processing & Payslips",
  "/leads": "CRM Leads & Prospects",
  "/pipeline": "Sales Deals Pipeline",
  "/activities": "CRM Activities & Follow-ups",
  "/calendar": "Business Calendar & Meetings",
  "/crm/integrations": "CRM API Integrations & Webhooks",
  "/marketing/posters": "Brand & Festival Poster Studio",
  "/marketing/templates": "Marketing Creatives & Templates",
  "/campaigns": "Marketing Campaigns & Outreach",
  "/journeys": "Automated Customer Journeys",
  "/message-logs": "Outreach & WhatsApp Message Logs",
  "/emails": "Business Email Studio",
  "/chats": "Official WhatsApp Live Chat",
  "/settings": "Settings & Preferences",
  "/admin": "Admin Panel & Team Access",
  "/feedback": "Customer Feedback & Reviews",
  "/business-analysis": "AI Business Analytics & Forecasts",
  "/tickets": "Customer Support Tickets",
  "/platform-admin": "Platform Super Admin Console",
};

export function getAppPageTitle(pathname: string, orgName?: string | null): string {
  let pageTitle = ROUTE_TITLE_MAP[pathname];

  if (!pageTitle) {
    if (pathname.startsWith("/invoices/")) pageTitle = "Invoice Details";
    else if (pathname.startsWith("/quotations/")) pageTitle = "Quotation Details";
    else if (pathname.startsWith("/clients/")) pageTitle = "Client Details";
    else if (pathname.startsWith("/bills/")) pageTitle = "Purchase Bill Details";
    else if (pathname.startsWith("/vendors/")) pageTitle = "Vendor Details";
    else if (pathname.startsWith("/purchase-orders/")) pageTitle = "Purchase Order Details";
    else if (pathname.startsWith("/grns/")) pageTitle = "Goods Receipt Details";
    else if (pathname.startsWith("/credit-notes/")) pageTitle = "Credit Note Details";
    else if (pathname.startsWith("/debit-notes/")) pageTitle = "Debit Note Details";
    else if (pathname.startsWith("/leads/")) pageTitle = "Lead Details";
    else if (pathname.startsWith("/pipeline/")) pageTitle = "Deal Details";
    else if (pathname.startsWith("/campaigns/")) pageTitle = "Campaign Details";
    else if (pathname.startsWith("/payroll/")) pageTitle = "Payroll Run Details";
    else if (pathname.startsWith("/employees/")) pageTitle = "Employee Profile";
    else if (pathname.startsWith("/bank-accounts/")) pageTitle = "Bank Account Details";
    else {
      const slug = pathname.split("/").filter(Boolean)[0];
      if (slug) {
        pageTitle = slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      } else {
        pageTitle = "Enterprise Suite";
      }
    }
  }

  const cleanOrgName = orgName?.trim();
  if (cleanOrgName) {
    return `${pageTitle} • ${cleanOrgName} | AssayBiz`;
  }
  return `${pageTitle} • AssayBiz`;
}
