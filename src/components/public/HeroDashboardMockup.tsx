import React, { useState } from "react";
import logoImg from "@/assets/logo.png";
import {
  LayoutDashboard,
  FileText,
  Boxes,
  ShoppingCart,
  Landmark,
  UserCog,
  Users,
  Send,
  MessageCircle,
  MessageSquareQuote,
  BrainCircuit,
  Settings,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export type ModuleKey =
  | "dashboard"
  | "sales"
  | "inventory"
  | "purchases"
  | "banking"
  | "people"
  | "crm"
  | "promotion"
  | "integration"
  | "feedback"
  | "analysis"
  | "settings";

interface SubPageItem {
  name: string;
  count: string;
  status: string;
  badgeColor?: string;
}

interface MetricData {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface ModuleDetail {
  title: string;
  subtitle: string;
  subPages: SubPageItem[];
  metrics: MetricData[];
  chartTitle: string;
  chartBadge: string;
  chartPoints: { m: string; v: number; label: string; x: number; y: number }[];
  chartLinePath: string;
  chartAreaPath: string;
  donutTitle: string;
  donutCenter: string;
  donutCenterSub: string;
  donutSegments: {
    label: string;
    pct: number;
    color: string;
    stroke: string;
    dash: string;
    offset: string;
  }[];
  aiInsight: {
    title: string;
    desc: string;
    action: string;
  };
}

// 12 Exact Main Pages from App Sidebar
export const MODULE_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales", icon: FileText },
  { id: "inventory", label: "Inventory Management", icon: Boxes },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "banking", label: "Banking", icon: Landmark },
  { id: "people", label: "Business HR", icon: UserCog },
  { id: "crm", label: "Business CRM", icon: Users },
  { id: "promotion", label: "Business Promotion", icon: Send },
  { id: "integration", label: "Business Integration", icon: MessageCircle },
  { id: "feedback", label: "Business Feedback", icon: MessageSquareQuote },
  { id: "analysis", label: "Business Analysis", icon: BrainCircuit },
  { id: "settings", label: "Settings", icon: Settings },
];

const MODULE_DATA: Record<ModuleKey, ModuleDetail> = {
  dashboard: {
    title: "Executive Business Dashboard",
    subtitle: "Consolidated real-time overview of revenue, operations, receivables & staff.",
    subPages: [
      { name: "Overview", count: "All Units", status: "Live Sync", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Live Sales", count: "₹12.48L", status: "+14% MoM", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Receivables", count: "₹2.50L", status: "Due in 7d", badgeColor: "bg-amber-50 text-amber-600 border-amber-200" },
      { name: "Cash Balance", count: "₹8.45L", status: "3 Accounts", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Attendance", count: "22 / 24", status: "91.6% Present", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    ],
    metrics: [
      { label: "Total Revenue", value: "₹12,48,000", change: "+14%", isPositive: true },
      { label: "Active Invoices", value: "156 Bills", change: "+8%", isPositive: true },
      { label: "Customer Accounts", value: "320 Clients", change: "+15%", isPositive: true },
      { label: "Staff Present", value: "22 / 24", change: "91.6%", isPositive: true },
    ],
    chartTitle: "Business Growth & Sales Curve",
    chartBadge: "This Year",
    chartPoints: [
      { m: "Jan", v: 28, label: "₹4.8L", x: 10, y: 65 },
      { m: "Feb", v: 42, label: "₹6.5L", x: 65, y: 52 },
      { m: "Mar", v: 55, label: "₹8.2L", x: 120, y: 42 },
      { m: "Apr", v: 68, label: "₹9.8L", x: 175, y: 30 },
      { m: "May", v: 82, label: "₹11.4L", x: 225, y: 20 },
      { m: "Jun", v: 96, label: "₹12.48L", x: 270, y: 10 },
    ],
    chartLinePath: "M 10 65 Q 40 58, 65 52 T 120 42 T 175 30 T 225 20 T 270 10",
    chartAreaPath: "M 10 65 Q 40 58, 65 52 T 120 42 T 175 30 T 225 20 T 270 10 L 270 75 L 10 75 Z",
    donutTitle: "Revenue Channels",
    donutCenter: "₹12.48L",
    donutCenterSub: "Gross",
    donutSegments: [
      { label: "Direct Invoices", pct: 50, color: "bg-[#e77817]", stroke: "#e77817", dash: "125.6 251.2", offset: "0" },
      { label: "Repeat Clients", pct: 28, color: "bg-[#28166f]", stroke: "#28166f", dash: "70.3 251.2", offset: "-125.6" },
      { label: "Online Orders", pct: 14, color: "bg-emerald-500", stroke: "#10b981", dash: "35.2 251.2", offset: "-195.9" },
      { label: "Other Services", pct: 8, color: "bg-cyan-500", stroke: "#06b6d4", dash: "20.1 251.2", offset: "-231.1" },
    ],
    aiInsight: {
      title: "Revenue Pacing 14% Higher",
      desc: "B2B client repeat orders are 14% higher than last month with strong cash collection.",
      action: "View Growth Forecast →",
    },
  },

  sales: {
    title: "Sales & Invoicing Command Center",
    subtitle: "Create GST invoices, quotations, manage clients, credit notes & challans.",
    subPages: [
      { name: "Invoices", count: "156 Issued", status: "₹18.90L Billed", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Quotations", count: "48 Quotes", status: "82% Won", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Client", count: "320 Active", status: "+14 New", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Credit Notes", count: "4 Issued", status: "₹24,500", badgeColor: "bg-amber-50 text-amber-600 border-amber-200" },
      { name: "Payments Received", count: "142 Paid", status: "₹15.40L", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Delivery Challan", count: "38 Dispatched", status: "Tracked", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
      { name: "Recurring", count: "12 Auto", status: "Active", badgeColor: "bg-slate-50 text-slate-600 border-slate-200" },
    ],
    metrics: [
      { label: "Total Invoiced", value: "₹18,90,000", change: "+18%", isPositive: true },
      { label: "Payments Received", value: "₹15,40,000", change: "+22%", isPositive: true },
      { label: "Quotations Sent", value: "48 Quotes", change: "82% Converted", isPositive: true },
      { label: "Overdue Bills", value: "₹2,50,000", change: "-12%", isPositive: false },
    ],
    chartTitle: "Monthly Sales Volume & Billing",
    chartBadge: "Jan - Jun",
    chartPoints: [
      { m: "Jan", v: 32, label: "₹5.2L", x: 10, y: 68 },
      { m: "Feb", v: 48, label: "₹7.6L", x: 65, y: 55 },
      { m: "Mar", v: 62, label: "₹10.4L", x: 120, y: 46 },
      { m: "Apr", v: 75, label: "₹13.8L", x: 175, y: 32 },
      { m: "May", v: 88, label: "₹16.5L", x: 225, y: 22 },
      { m: "Jun", v: 99, label: "₹18.9L", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 68 Q 40 60, 65 55 T 120 46 T 175 32 T 225 22 T 270 8",
    chartAreaPath: "M 10 68 Q 40 60, 65 55 T 120 46 T 175 32 T 225 22 T 270 8 L 270 75 L 10 75 Z",
    donutTitle: "Sales Documents Split",
    donutCenter: "81.5%",
    donutCenterSub: "Paid Rate",
    donutSegments: [
      { label: "Paid Invoices", pct: 65, color: "bg-emerald-500", stroke: "#10b981", dash: "163.3 251.2", offset: "0" },
      { label: "Quotations", pct: 18, color: "bg-[#e77817]", stroke: "#e77817", dash: "45.2 251.2", offset: "-163.3" },
      { label: "Challans", pct: 10, color: "bg-[#28166f]", stroke: "#28166f", dash: "25.1 251.2", offset: "-208.5" },
      { label: "Credit Notes", pct: 7, color: "bg-rose-500", stroke: "#f43f5e", dash: "17.6 251.2", offset: "-233.6" },
    ],
    aiInsight: {
      title: "3 Invoices Overdue",
      desc: "₹2.50L pending collection. Automated WhatsApp reminders prepared for 1-click dispatch.",
      action: "Send WhatsApp Reminders Now →",
    },
  },

  inventory: {
    title: "Inventory & Warehouse Management",
    subtitle: "Real-time product stock, multi-warehouse transfers, low-stock re-order alerts.",
    subPages: [
      { name: "Items", count: "1,420 SKUs", status: "Categorized", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Inventory", count: "₹24.8L Value", status: "Live Synced", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Warehouses", count: "4 Locations", status: "92% Capacity", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Branches", count: "3 Retail Hubs", status: "Connected", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    ],
    metrics: [
      { label: "Total Stock Value", value: "₹24,80,000", change: "+6%", isPositive: true },
      { label: "Catalog SKUs", value: "1,420 Items", change: "98% In-Stock", isPositive: true },
      { label: "Active Hubs", value: "4 Warehouses", change: "Multi-Location", isPositive: true },
      { label: "Low Stock Items", value: "3 Items", change: "Restock Soon", isPositive: false },
    ],
    chartTitle: "Stock Movement & Inventory Velocity",
    chartBadge: "Live Units",
    chartPoints: [
      { m: "Jan", v: 20, label: "940 units", x: 10, y: 64 },
      { m: "Feb", v: 35, label: "1,120 units", x: 65, y: 54 },
      { m: "Mar", v: 50, label: "1,380 units", x: 120, y: 44 },
      { m: "Apr", v: 65, label: "1,650 units", x: 175, y: 32 },
      { m: "May", v: 80, label: "1,890 units", x: 225, y: 22 },
      { m: "Jun", v: 95, label: "2,140 units", x: 270, y: 12 },
    ],
    chartLinePath: "M 10 64 Q 40 56, 65 54 T 120 44 T 175 32 T 225 22 T 270 12",
    chartAreaPath: "M 10 64 Q 40 56, 65 54 T 120 44 T 175 32 T 225 22 T 270 12 L 270 75 L 10 75 Z",
    donutTitle: "Category Valuation",
    donutCenter: "₹24.8L",
    donutCenterSub: "Stock Value",
    donutSegments: [
      { label: "Electronics", pct: 45, color: "bg-[#e77817]", stroke: "#e77817", dash: "113 251.2", offset: "0" },
      { label: "Spare Parts", pct: 30, color: "bg-[#28166f]", stroke: "#28166f", dash: "75.4 251.2", offset: "-113" },
      { label: "Raw Materials", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "37.7 251.2", offset: "-188.4" },
      { label: "Packaged Goods", pct: 10, color: "bg-cyan-500", stroke: "#06b6d4", dash: "25.1 251.2", offset: "-226.1" },
    ],
    aiInsight: {
      title: "Zero Outage Risk",
      desc: "Fastest-moving items have 34 days of buffer stock across all 4 warehouse hubs.",
      action: "Review Re-Order Limits →",
    },
  },

  purchases: {
    title: "Purchases & Procurement Operations",
    subtitle: "Vendor management, purchase orders, goods receipts (GRN) & expenses.",
    subPages: [
      { name: "Vendor", count: "48 Suppliers", status: "GST Verified", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Purchase Orders", count: "28 POs", status: "96% On-Time", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Goods Receipt (GRN)", count: "26 Matched", status: "3-Way Match", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Purchase Invoice", count: "34 Bills", status: "₹9.40L Total", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
      { name: "Expenses", count: "₹1.25L", status: "Categorized", badgeColor: "bg-amber-50 text-amber-600 border-amber-200" },
    ],
    metrics: [
      { label: "Purchase Volume", value: "₹9,40,000", change: "+8%", isPositive: true },
      { label: "Active Suppliers", value: "48 Vendors", change: "+4 New", isPositive: true },
      { label: "PO On-Time Delivery", value: "96.2%", change: "High Trust", isPositive: true },
      { label: "Business Expenses", value: "₹1,25,000", change: "-4% Savings", isPositive: true },
    ],
    chartTitle: "Monthly Procurement Cost vs Expenses",
    chartBadge: "Spend Trend",
    chartPoints: [
      { m: "Jan", v: 30, label: "₹3.8L", x: 10, y: 62 },
      { m: "Feb", v: 45, label: "₹5.1L", x: 65, y: 50 },
      { m: "Mar", v: 58, label: "₹6.8L", x: 120, y: 40 },
      { m: "Apr", v: 70, label: "₹8.0L", x: 175, y: 28 },
      { m: "May", v: 82, label: "₹8.9L", x: 225, y: 18 },
      { m: "Jun", v: 92, label: "₹9.4L", x: 270, y: 12 },
    ],
    chartLinePath: "M 10 62 Q 40 54, 65 50 T 120 40 T 175 28 T 225 18 T 270 12",
    chartAreaPath: "M 10 62 Q 40 54, 65 50 T 120 40 T 175 28 T 225 18 T 270 12 L 270 75 L 10 75 Z",
    donutTitle: "Procurement Expense Split",
    donutCenter: "₹9.40L",
    donutCenterSub: "Procured",
    donutSegments: [
      { label: "Inventory Stock", pct: 60, color: "bg-[#28166f]", stroke: "#28166f", dash: "150.7 251.2", offset: "0" },
      { label: "Freight & Logistics", pct: 20, color: "bg-[#e77817]", stroke: "#e77817", dash: "50.2 251.2", offset: "-150.7" },
      { label: "Utility & Office", pct: 12, color: "bg-emerald-500", stroke: "#10b981", dash: "30.1 251.2", offset: "-200.9" },
      { label: "Software & Tools", pct: 8, color: "bg-cyan-500", stroke: "#06b6d4", dash: "20.1 251.2", offset: "-231.1" },
    ],
    aiInsight: {
      title: "Vendor ITC Matched",
      desc: "₹1.42L Input Tax Credit matched against vendor GSTR-2B with zero tax mismatch.",
      action: "Export Vendor Summary →",
    },
  },

  banking: {
    title: "Banking & Double-Entry Accounting",
    subtitle: "Multi-bank reconciliation, journal entries, ledger charts & cash flow.",
    subPages: [
      { name: "Chart of Accounts", count: "42 Ledgers", status: "Double-Entry", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Journal Entries", count: "128 Posted", status: "Balanced", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Bank", count: "3 Accounts", status: "Live Synced", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Cash Flow", count: "₹8.45L", status: "+15% Surplus", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    ],
    metrics: [
      { label: "Total Bank Balance", value: "₹8,45,200", change: "+15%", isPositive: true },
      { label: "Net Cash Inflow", value: "₹12,10,000", change: "+9%", isPositive: true },
      { label: "Auto Reconciliation", value: "98.4%", change: "Zero Errors", isPositive: true },
      { label: "GST Input Credit (ITC)", value: "₹1,42,800", change: "GSTR-2B Synced", isPositive: true },
    ],
    chartTitle: "Net Cash Flow Pacing",
    chartBadge: "H1 Audit",
    chartPoints: [
      { m: "Jan", v: 25, label: "₹3.2L", x: 10, y: 66 },
      { m: "Feb", v: 38, label: "₹4.8L", x: 65, y: 55 },
      { m: "Mar", v: 52, label: "₹6.1L", x: 120, y: 44 },
      { m: "Apr", v: 66, label: "₹7.2L", x: 175, y: 34 },
      { m: "May", v: 79, label: "₹7.9L", x: 225, y: 22 },
      { m: "Jun", v: 92, label: "₹8.45L", x: 270, y: 12 },
    ],
    chartLinePath: "M 10 66 Q 40 58, 65 55 T 120 44 T 175 34 T 225 22 T 270 12",
    chartAreaPath: "M 10 66 Q 40 58, 65 55 T 120 44 T 175 34 T 225 22 T 270 12 L 270 75 L 10 75 Z",
    donutTitle: "Fund Allocation",
    donutCenter: "₹8.45L",
    donutCenterSub: "Total Cash",
    donutSegments: [
      { label: "HDFC Primary", pct: 50, color: "bg-[#28166f]", stroke: "#28166f", dash: "125.6 251.2", offset: "0" },
      { label: "ICICI Ops", pct: 30, color: "bg-[#e77817]", stroke: "#e77817", dash: "75.4 251.2", offset: "-125.6" },
      { label: "SBI Tax Reserve", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "37.7 251.2", offset: "-200.9" },
      { label: "Petty Cash", pct: 5, color: "bg-cyan-500", stroke: "#06b6d4", dash: "12.6 251.2", offset: "-238.6" },
    ],
    aiInsight: {
      title: "Working Capital Health",
      desc: "Healthy 68 days of operational cash runway with consistent monthly collections.",
      action: "Download Audit Report →",
    },
  },

  people: {
    title: "Business HR & Attendance Management",
    subtitle: "Biometric & web attendance, leave tracking, shift rosters, KYC & payroll.",
    subPages: [
      { name: "Employees", count: "24 Staff", status: "All Onboarded", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Attendance", count: "22 Present", status: "91.6% Turnout", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Leaves", count: "2 Pending", status: "4 Categories", badgeColor: "bg-amber-50 text-amber-600 border-amber-200" },
      { name: "Shifts", count: "3 Rosters", status: "Assigned", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Documents", count: "96 Files", status: "KYC Verified", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
      { name: "Payroll", count: "₹4.80L", status: "1-Click Ready", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    ],
    metrics: [
      { label: "Total Staff", value: "24 Employees", change: "100% Onboarded", isPositive: true },
      { label: "Today Attendance", value: "22 Present", change: "91.6% Turnout", isPositive: true },
      { label: "Pending Leaves", value: "2 Requests", change: "1-Hour SLA", isPositive: true },
      { label: "Monthly Payroll", value: "₹4,80,000", change: "Auto-Calculated", isPositive: true },
    ],
    chartTitle: "Monthly Attendance & Productivity Rate",
    chartBadge: "96.4% Avg",
    chartPoints: [
      { m: "Jan", v: 85, label: "92%", x: 10, y: 55 },
      { m: "Feb", v: 88, label: "93%", x: 65, y: 48 },
      { m: "Mar", v: 91, label: "94.5%", x: 120, y: 38 },
      { m: "Apr", v: 93, label: "95%", x: 175, y: 28 },
      { m: "May", v: 95, label: "96.2%", x: 225, y: 18 },
      { m: "Jun", v: 98, label: "97.4%", x: 270, y: 10 },
    ],
    chartLinePath: "M 10 55 Q 40 50, 65 48 T 120 38 T 175 28 T 225 18 T 270 10",
    chartAreaPath: "M 10 55 Q 40 50, 65 48 T 120 38 T 175 28 T 225 18 T 270 10 L 270 75 L 10 75 Z",
    donutTitle: "Team By Department",
    donutCenter: "24",
    donutCenterSub: "Employees",
    donutSegments: [
      { label: "Sales & CRM", pct: 40, color: "bg-[#e77817]", stroke: "#e77817", dash: "100.5 251.2", offset: "0" },
      { label: "Operations", pct: 30, color: "bg-[#28166f]", stroke: "#28166f", dash: "75.4 251.2", offset: "-100.5" },
      { label: "Accounts", pct: 20, color: "bg-emerald-500", stroke: "#10b981", dash: "50.2 251.2", offset: "-175.9" },
      { label: "Tech Support", pct: 10, color: "bg-cyan-500", stroke: "#06b6d4", dash: "25.1 251.2", offset: "-226.1" },
    ],
    aiInsight: {
      title: "Payroll Ready for 1st",
      desc: "All shift adjustments and leave balance deductions calculated automatically for 24 staff.",
      action: "Approve 1-Click Payslips →",
    },
  },

  crm: {
    title: "Business CRM & Sales Pipeline",
    subtitle: "Lead capture, drag-and-drop pipeline stages, deal activities & calendar.",
    subPages: [
      { name: "CRM Dashboard", count: "Stage Metrics", status: "Real-Time", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Leads", count: "142 Active", status: "+28 This Wk", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Pipeline", count: "₹34.5L Deals", status: "4 Stages", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Activities", count: "18 Completed", status: "Today", badgeColor: "bg-amber-50 text-amber-600 border-amber-200" },
      { name: "Calendar", count: "6 Meetings", status: "Scheduled", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
      { name: "Tickets", count: "0 Overdue", status: "100% Resolved", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    ],
    metrics: [
      { label: "Active Deals Value", value: "₹34,50,000", change: "+24%", isPositive: true },
      { label: "Qualified Leads", value: "142 Leads", change: "+28 New", isPositive: true },
      { label: "Pipeline Win Rate", value: "24.8%", change: "+3.2% Lift", isPositive: true },
      { label: "Sales Activities", value: "18 Done Today", change: "100% Target", isPositive: true },
    ],
    chartTitle: "Lead Capture & Deal Conversions",
    chartBadge: "H1 Growth",
    chartPoints: [
      { m: "Jan", v: 22, label: "28 deals", x: 10, y: 68 },
      { m: "Feb", v: 38, label: "45 deals", x: 65, y: 55 },
      { m: "Mar", v: 54, label: "68 deals", x: 120, y: 44 },
      { m: "Apr", v: 69, label: "92 deals", x: 175, y: 32 },
      { m: "May", v: 84, label: "118 deals", x: 225, y: 20 },
      { m: "Jun", v: 98, label: "142 deals", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 68 Q 40 58, 65 55 T 120 44 T 175 32 T 225 20 T 270 8",
    chartAreaPath: "M 10 68 Q 40 58, 65 55 T 120 44 T 175 32 T 225 20 T 270 8 L 270 75 L 10 75 Z",
    donutTitle: "Pipeline by Stage",
    donutCenter: "₹34.5L",
    donutCenterSub: "Active Deals",
    donutSegments: [
      { label: "New Leads", pct: 35, color: "bg-[#28166f]", stroke: "#28166f", dash: "87.9 251.2", offset: "0" },
      { label: "Demo Given", pct: 30, color: "bg-[#e77817]", stroke: "#e77817", dash: "75.4 251.2", offset: "-87.9" },
      { label: "Proposal Sent", pct: 20, color: "bg-emerald-500", stroke: "#10b981", dash: "50.2 251.2", offset: "-163.3" },
      { label: "Closed Won", pct: 15, color: "bg-cyan-500", stroke: "#06b6d4", dash: "37.7 251.2", offset: "-213.5" },
    ],
    aiInsight: {
      title: "High Deal Probability",
      desc: "5 high-value leads are actively viewing quotations with 88% predicted close probability.",
      action: "Schedule Follow-up Calls →",
    },
  },

  promotion: {
    title: "Business Promotion & Marketing",
    subtitle: "Festival posters, WhatsApp bulk broadcasts, approved templates & drip journeys.",
    subPages: [
      { name: "Promotion Reports", count: "18.4K Sent", status: "Detailed Analytics", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Festival Posters", count: "85 Creatives", status: "Auto-Branded", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Campaigns", count: "12 Broadcasts", status: "99.2% Delivered", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Templates", count: "24 Approved", status: "WhatsApp & SMS", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
      { name: "Journeys", count: "4 Automated", status: "Drip Running", badgeColor: "bg-amber-50 text-amber-600 border-amber-200" },
      { name: "Message Logs", count: "18,400 Logs", status: "Live Feed", badgeColor: "bg-slate-50 text-slate-600 border-slate-200" },
    ],
    metrics: [
      { label: "Total Audience Reach", value: "18,400 Customers", change: "+35%", isPositive: true },
      { label: "WhatsApp Delivery Rate", value: "99.2%", change: "Meta Verified", isPositive: true },
      { label: "Ready Posters", value: "85 Creatives", change: "Festival Ready", isPositive: true },
      { label: "Campaign CTR", value: "16.4%", change: "High Orders", isPositive: true },
    ],
    chartTitle: "Broadcast Engagement & Conversion Rate",
    chartBadge: "Campaigns",
    chartPoints: [
      { m: "Jan", v: 20, label: "2.4K opens", x: 10, y: 65 },
      { m: "Feb", v: 36, label: "4.8K opens", x: 65, y: 52 },
      { m: "Mar", v: 52, label: "8.1K opens", x: 120, y: 40 },
      { m: "Apr", v: 68, label: "11.6K opens", x: 175, y: 28 },
      { m: "May", v: 84, label: "15.2K opens", x: 225, y: 18 },
      { m: "Jun", v: 96, label: "18.4K opens", x: 270, y: 10 },
    ],
    chartLinePath: "M 10 65 Q 40 56, 65 52 T 120 40 T 175 28 T 225 18 T 270 10",
    chartAreaPath: "M 10 65 Q 40 56, 65 52 T 120 40 T 175 28 T 225 18 T 270 10 L 270 75 L 10 75 Z",
    donutTitle: "Channel Engagement",
    donutCenter: "99.2%",
    donutCenterSub: "Delivered",
    donutSegments: [
      { label: "WhatsApp Broadcast", pct: 60, color: "bg-[#e77817]", stroke: "#e77817", dash: "150.7 251.2", offset: "0" },
      { label: "SMS Campaigns", pct: 25, color: "bg-[#28166f]", stroke: "#28166f", dash: "62.8 251.2", offset: "-150.7" },
      { label: "Email Dispatch", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "37.7 251.2", offset: "-213.5" },
    ],
    aiInsight: {
      title: "Festive Campaign Ready",
      desc: "Diwali poster campaign ready with your custom logo and phone number for 1-click WhatsApp blast.",
      action: "Launch Festive Blast →",
    },
  },

  integration: {
    title: "Business Integration & Outreach",
    subtitle: "Official WhatsApp messaging, automated emails, external APIs & webhooks.",
    subPages: [
      { name: "Emails", count: "340 Sent", status: "Zero Bounce", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "WhatsApp Chats", count: "48 Active", status: "Meta Official", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Webhooks & APIs", count: "8 Endpoints", status: "99.9% Uptime", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Automations", count: "1,420 Triggers", status: "Real-Time", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    ],
    metrics: [
      { label: "Connected Apps", value: "8 Live APIs", change: "All Connected", isPositive: true },
      { label: "Webhook Sync Rate", value: "99.9%", change: "Zero Errors", isPositive: true },
      { label: "Live WhatsApp Chats", value: "48 Chats", change: "<3m SLA", isPositive: true },
      { label: "Automated Triggers", value: "1,420 Events", change: "+18%", isPositive: true },
    ],
    chartTitle: "API Calls & Integration Sync Volume",
    chartBadge: "Real-Time",
    chartPoints: [
      { m: "Jan", v: 28, label: "4.2K calls", x: 10, y: 64 },
      { m: "Feb", v: 42, label: "7.1K calls", x: 65, y: 52 },
      { m: "Mar", v: 56, label: "10.4K calls", x: 120, y: 40 },
      { m: "Apr", v: 72, label: "14.2K calls", x: 175, y: 28 },
      { m: "May", v: 86, label: "18.6K calls", x: 225, y: 16 },
      { m: "Jun", v: 98, label: "24.1K calls", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 64 Q 40 56, 65 52 T 120 40 T 175 28 T 225 16 T 270 8",
    chartAreaPath: "M 10 64 Q 40 56, 65 52 T 120 40 T 175 28 T 225 16 T 270 8 L 270 75 L 10 75 Z",
    donutTitle: "Traffic by Integration",
    donutCenter: "24.1K",
    donutCenterSub: "API Events",
    donutSegments: [
      { label: "WhatsApp Cloud API", pct: 55, color: "bg-[#e77817]", stroke: "#e77817", dash: "138.2 251.2", offset: "0" },
      { label: "Payment Gateways", pct: 25, color: "bg-[#28166f]", stroke: "#28166f", dash: "62.8 251.2", offset: "-138.2" },
      { label: "Bank Statement Feeds", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "37.7 251.2", offset: "-201" },
      { label: "Webhooks", pct: 5, color: "bg-cyan-500", stroke: "#06b6d4", dash: "12.6 251.2", offset: "-238.7" },
    ],
    aiInsight: {
      title: "All Endpoints Healthy",
      desc: "Razorpay, Cashfree, and WhatsApp API connected with 100% real-time transaction webhook delivery.",
      action: "Test Live Webhooks →",
    },
  },

  feedback: {
    title: "Business Feedback & Reputation",
    subtitle: "Post-invoice review links, star ratings, NPS surveys & Google review sync.",
    subPages: [
      { name: "Client Reviews", count: "248 Verified", status: "4.8 / 5.0 Rating", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Star Ratings", count: "78% 5-Star", status: "High Trust", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "NPS Surveys", count: "+68 Score", status: "World-Class", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Google Review Sync", count: "+34 Synced", status: "Auto-Pushed", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    ],
    metrics: [
      { label: "Overall Rating", value: "4.8 / 5.0", change: "248 Reviews", isPositive: true },
      { label: "Google 5-Star Sync", value: "+34 Reviews", change: "Auto-Pushed", isPositive: true },
      { label: "Response Rate", value: "94.2%", change: "<2hr Average", isPositive: true },
      { label: "Net Promoter (NPS)", value: "+68 Score", change: "Top 5% Tier", isPositive: true },
    ],
    chartTitle: "Client Satisfaction (CSAT) Trend",
    chartBadge: "4.8 ★",
    chartPoints: [
      { m: "Jan", v: 80, label: "4.5 ★", x: 10, y: 55 },
      { m: "Feb", v: 84, label: "4.6 ★", x: 65, y: 48 },
      { m: "Mar", v: 88, label: "4.7 ★", x: 120, y: 40 },
      { m: "Apr", v: 92, label: "4.75 ★", x: 175, y: 30 },
      { m: "May", v: 95, label: "4.8 ★", x: 225, y: 20 },
      { m: "Jun", v: 98, label: "4.85 ★", x: 270, y: 10 },
    ],
    chartLinePath: "M 10 55 Q 40 50, 65 48 T 120 40 T 175 30 T 225 20 T 270 10",
    chartAreaPath: "M 10 55 Q 40 50, 65 48 T 120 40 T 175 30 T 225 20 T 270 10 L 270 75 L 10 75 Z",
    donutTitle: "Rating Distribution",
    donutCenter: "4.8 ★",
    donutCenterSub: "Avg CSAT",
    donutSegments: [
      { label: "5-Star Rating", pct: 78, color: "bg-emerald-500", stroke: "#10b981", dash: "196 251.2", offset: "0" },
      { label: "4-Star Rating", pct: 16, color: "bg-[#e77817]", stroke: "#e77817", dash: "40.2 251.2", offset: "-196" },
      { label: "3-Star Rating", pct: 4, color: "bg-amber-500", stroke: "#f59e0b", dash: "10 251.2", offset: "-236.2" },
      { label: "Under 3 Stars", pct: 2, color: "bg-rose-500", stroke: "#f43f5e", dash: "5 251.2", offset: "-246.2" },
    ],
    aiInsight: {
      title: "High Google Review Conversion",
      desc: "34 satisfied clients converted their post-payment feedback into Google My Business 5-star ratings.",
      action: "View Review Feed →",
    },
  },

  analysis: {
    title: "Business Analysis & AI Intelligence",
    subtitle: "Automated revenue forecasting, cash flow anomalies & smart suggestions.",
    subPages: [
      { name: "Predictive Revenue", count: "₹15.8L Q3", status: "+16% Projected", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Stock Outage Risk", count: "0 Items", status: "Healthy Stock", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Margin Boost", count: "31.2%", status: "+3.8% AI Lift", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Smart Insights", count: "14 Live", status: "Actionable", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    ],
    metrics: [
      { label: "Revenue Target Q3", value: "₹15.8L", change: "+16% Projected", isPositive: true },
      { label: "Stock Outage Risk", value: "0 Items", change: "Healthy", isPositive: true },
      { label: "Profit Margin Boost", value: "31.2%", change: "+3.8% AI Lift", isPositive: true },
      { label: "Smart Insights", value: "14 Live", change: "Actionable", isPositive: true },
    ],
    chartTitle: "AI Predictive Revenue Forecast",
    chartBadge: "Neural AI",
    chartPoints: [
      { m: "Jan", v: 30, label: "₹5.1L", x: 10, y: 70 },
      { m: "Feb", v: 45, label: "₹7.4L", x: 65, y: 58 },
      { m: "Mar", v: 60, label: "₹9.8L", x: 120, y: 46 },
      { m: "Apr", v: 75, label: "₹12.2L", x: 175, y: 34 },
      { m: "May", v: 88, label: "₹14.1L", x: 225, y: 22 },
      { m: "Jun", v: 98, label: "₹15.8L", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 70 Q 40 62, 65 58 T 120 46 T 175 34 T 225 22 T 270 8",
    chartAreaPath: "M 10 70 Q 40 62, 65 58 T 120 46 T 175 34 T 225 22 T 270 8 L 270 75 L 10 75 Z",
    donutTitle: "AI Business Health",
    donutCenter: "96.4%",
    donutCenterSub: "Optimal",
    donutSegments: [
      { label: "Cash Flow Run", pct: 40, color: "bg-emerald-500", stroke: "#10b981", dash: "100.5 251.2", offset: "0" },
      { label: "Stock Velocity", pct: 30, color: "bg-[#e77817]", stroke: "#e77817", dash: "75.4 251.2", offset: "-100.5" },
      { label: "Margin Strength", pct: 20, color: "bg-[#28166f]", stroke: "#28166f", dash: "50.2 251.2", offset: "-175.9" },
      { label: "Client Retention", pct: 10, color: "bg-purple-500", stroke: "#a855f7", dash: "25.1 251.2", offset: "-226.1" },
    ],
    aiInsight: {
      title: "High-Margin Bundling",
      desc: "Bundling Item #104 with Item #208 can boost net profit margins by 3.8% across 40 regular clients.",
      action: "Apply Smart Pricing →",
    },
  },

  settings: {
    title: "System Settings & Customization",
    subtitle: "Invoice templates, custom data fields, tamper-proof audit trails & team roles.",
    subPages: [
      { name: "Templates", count: "7 Styles", status: "Custom Brand", badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      { name: "Custom Fields", count: "12 Fields", status: "Active", badgeColor: "bg-blue-50 text-blue-600 border-blue-200" },
      { name: "Audit Logs", count: "100% Logged", status: "Tamper-Proof", badgeColor: "bg-purple-50 text-purple-600 border-purple-200" },
      { name: "Business Settings", count: "GST & Bank", status: "Configured", badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200" },
      { name: "Team Roles", count: "4 Access Levels", status: "Role-Based", badgeColor: "bg-amber-50 text-amber-600 border-amber-200" },
    ],
    metrics: [
      { label: "Invoice Templates", value: "7 Formats", change: "Standard to Modern", isPositive: true },
      { label: "Custom Fields", value: "12 Fields", change: "PAN, PO, Vehicle", isPositive: true },
      { label: "Audit Trail", value: "100% Logged", change: "Full Activity History", isPositive: true },
      { label: "User Access Roles", value: "4 Roles", change: "Admin & Staff", isPositive: true },
    ],
    chartTitle: "System Operations & Audit Trail Pacing",
    chartBadge: "Secure Logs",
    chartPoints: [
      { m: "Jan", v: 40, label: "120 logs", x: 10, y: 60 },
      { m: "Feb", v: 55, label: "210 logs", x: 65, y: 48 },
      { m: "Mar", v: 68, label: "340 logs", x: 120, y: 38 },
      { m: "Apr", v: 80, label: "480 logs", x: 175, y: 28 },
      { m: "May", v: 90, label: "620 logs", x: 225, y: 18 },
      { m: "Jun", v: 98, label: "780 logs", x: 270, y: 10 },
    ],
    chartLinePath: "M 10 60 Q 40 52, 65 48 T 120 38 T 175 28 T 225 18 T 270 10",
    chartAreaPath: "M 10 60 Q 40 52, 65 48 T 120 38 T 175 28 T 225 18 T 270 10 L 270 75 L 10 75 Z",
    donutTitle: "Team Role Permissions",
    donutCenter: "24",
    donutCenterSub: "Active Users",
    donutSegments: [
      { label: "Staff Members", pct: 60, color: "bg-[#28166f]", stroke: "#28166f", dash: "150.7 251.2", offset: "0" },
      { label: "Accountants", pct: 20, color: "bg-[#e77817]", stroke: "#e77817", dash: "50.2 251.2", offset: "-150.7" },
      { label: "Administrators", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "37.7 251.2", offset: "-200.9" },
      { label: "Viewers / Audit", pct: 5, color: "bg-cyan-500", stroke: "#06b6d4", dash: "12.6 251.2", offset: "-238.6" },
    ],
    aiInsight: {
      title: "Security & Role Guard",
      desc: "All critical modules secured with strict role-based access control and live audit history.",
      action: "Manage Permissions →",
    },
  },
};

export function HeroDashboardMockup() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("sales");
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(5);
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);
  const [showAiDetail, setShowAiDetail] = useState(false);
  const [selectedSubPage, setSelectedSubPage] = useState<number>(0);

  const currentData = MODULE_DATA[activeModule] || MODULE_DATA.sales;

  const handleModuleSelect = (key: ModuleKey) => {
    setActiveModule(key);
    setHoveredMonth(5);
    setActiveExpenseIndex(null);
    setSelectedSubPage(0);
  };

  return (
    <div className="relative w-full max-w-[700px] mx-auto select-none">
      {/* Decorative background glow matching logo colors */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-[#28166f]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-[#e77817]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main SaaS Window Frame */}
      <div className="relative rounded-2xl shadow-[0_20px_60px_-15px_rgba(40,22,111,0.18)] border border-slate-200/90 bg-white overflow-hidden transition-all duration-500 hover:shadow-[0_25px_70px_-12px_rgba(231,120,23,0.22)]">
        
        {/* Flex layout: Left Sidebar + Right Main App View */}
        <div className="flex h-[490px] sm:h-[520px] text-xs">
          
          {/* 1. LEFT SIDEBAR (Dark Navy matching logo) */}
          <div className="w-40 sm:w-48 bg-[#0b1022] text-slate-400 flex flex-col justify-between py-3 px-2 shrink-0 border-r border-slate-800">
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Real AssayBiz Logo */}
              <div className="mb-2 px-1 shrink-0">
                <div className="bg-white/95 px-3 py-1.5 rounded-lg shadow-sm w-full flex items-center justify-center border border-white/20">
                  <img src={logoImg} alt="Assay Biz" className="h-6 w-auto object-contain" />
                </div>
              </div>

              {/* Exact Main Menu Options - Scrollable without showing raw scrollbars */}
              <div className="text-[9.5px] font-bold tracking-wider text-slate-500 uppercase px-2 mb-1 shrink-0">
                Main Pages
              </div>

              <nav className="space-y-0.5 font-medium overflow-y-auto pr-1 flex-1 scrollbar-none">
                {MODULE_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleModuleSelect(item.id as ModuleKey)}
                      onMouseEnter={() => handleModuleSelect(item.id as ModuleKey)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-[#e77817] to-[#ea580c] text-white font-bold shadow-md shadow-orange-500/35 translate-x-1"
                          : "text-slate-400 hover:text-white hover:bg-[#e77817]/20 hover:translate-x-0.5"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="text-[11px] sm:text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Bottom Quick Indicator */}
              <div className="pt-2 mt-1 border-t border-slate-800/80 shrink-0 px-2 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AssayBiz v2.4
                </span>
                <span className="text-orange-400 font-semibold">100% GST</span>
              </div>
            </div>
          </div>

          {/* 2. RIGHT MAIN CONTENT AREA (Light Clean Real Software View) */}
          <div className="flex-1 bg-[#f8fafc] flex flex-col overflow-hidden">
            
            {/* Header Bar */}
            <div className="h-10 px-4 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
              <div className="relative w-44 sm:w-56">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  placeholder={`Search ${currentData.title.split(" ")[0]}...`}
                  className="w-full h-6.5 pl-8 pr-3 text-[10.5px] bg-slate-50 border border-slate-200 rounded-md text-slate-600 focus:outline-none placeholder:text-slate-400 cursor-pointer hover:border-orange-300 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="1 unread alert"
                  className="relative p-1 text-slate-500 hover:text-[#e77817] hover:bg-slate-100 rounded-md transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#e77817] rounded-full ring-2 ring-white" />
                </button>
                <button
                  type="button"
                  title="Help & Support"
                  className="p-1 text-slate-500 hover:text-[#e77817] hover:bg-slate-100 rounded-md transition-colors hidden sm:inline-flex"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#28166f] to-[#e77817] text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-[#e77817]/30 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                  A
                </div>
              </div>
            </div>

            {/* Scrollable / Interactive Dashboard View */}
            <div className="p-3 sm:p-3.5 space-y-2.5 overflow-y-auto flex-1">
              
              {/* Greetings & Active Module Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight transition-all">
                    {currentData.title}
                  </h3>
                  <span className="text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
                  </span>
                </div>
                <p className="text-[10px] sm:text-[10.5px] text-slate-500 mt-0.5 truncate">
                  {currentData.subtitle}
                </p>
              </div>

              {/* INSIDE PAGES PILLS (Directly showing data & pages of selected main module) */}
              <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-[#e77817]" /> Inside Pages of {MODULE_NAV.find(m => m.id === activeModule)?.label}:
                  </span>
                  <span className="text-[9px] text-[#e77817] font-semibold">
                    {currentData.subPages.length} Active Modules
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {currentData.subPages.map((sub, i) => {
                    const isSelected = selectedSubPage === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSubPage(i)}
                        onMouseEnter={() => setSelectedSubPage(i)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-[#28166f] text-white shadow-xs"
                            : "bg-slate-50 hover:bg-orange-50/80 text-slate-700 border border-slate-200/80 hover:border-[#e77817]"
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span
                          className={`text-[8.5px] px-1 py-0.2 rounded font-bold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-white text-[#e77817] border border-orange-200/60"
                          }`}
                        >
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 KPI Metric Cards (Corresponding to Inside Pages Data) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentData.metrics.map((m, idx) => {
                  const isHovered = hoveredKpi === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredKpi(idx)}
                      onMouseLeave={() => setHoveredKpi(null)}
                      className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? "bg-white border-[#e77817] shadow-md -translate-y-0.5 scale-[1.02]"
                          : "bg-white/90 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      <div className="text-[9.5px] text-slate-500 font-medium truncate">{m.label}</div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 tracking-tight truncate">
                        {m.value}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${
                            m.isPositive
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-600 border border-rose-200/60"
                          }`}
                        >
                          {m.change}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Cards: Chart (Left) + Donut Breakdown (Right) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                
                {/* Left: Dynamic Line Chart */}
                <div className="sm:col-span-7 p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 text-[10.5px] truncate">{currentData.chartTitle}</span>
                    <span className="text-[8.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-slate-100">
                      {currentData.chartBadge} <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {/* SVG Chart with Interactive Points */}
                  <div className="relative h-20 sm:h-24 w-full pt-1">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 280 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`growthGrad-${activeModule}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e77817" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#28166f" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Background horizontal grid lines */}
                      <line x1="0" y1="20" x2="280" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="280" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="280" y2="75" stroke="#e2e8f0" strokeWidth="1" />

                      {/* Area Fill */}
                      <path
                        d={currentData.chartAreaPath}
                        fill={`url(#growthGrad-${activeModule})`}
                        className="transition-all duration-300"
                      />

                      {/* Primary Line curve */}
                      <path
                        d={currentData.chartLinePath}
                        fill="none"
                        stroke="#28166f"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />

                      {/* Month Circles on Line */}
                      {currentData.chartPoints.map((pt, idx) => {
                        const isSelected = hoveredMonth === idx;
                        return (
                          <g
                            key={idx}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredMonth(idx)}
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isSelected ? 5 : 3}
                              fill={isSelected ? "#e77817" : "#ffffff"}
                              stroke={isSelected ? "#e77817" : "#28166f"}
                              strokeWidth={isSelected ? 2.5 : 1.5}
                              className="transition-all duration-200"
                            />
                            {isSelected && (
                              <circle cx={pt.x} cy={pt.y} r={9} fill="#e77817" opacity="0.25" />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Month Axis Labels */}
                    <div className="flex justify-between text-[8.5px] text-slate-400 font-medium px-1 mt-0.5">
                      {currentData.chartPoints.map((item, i) => (
                        <span
                          key={i}
                          onMouseEnter={() => setHoveredMonth(i)}
                          className={`cursor-pointer transition-colors ${
                            hoveredMonth === i ? "text-[#e77817] font-bold" : "hover:text-slate-600"
                          }`}
                        >
                          {item.m}
                        </span>
                      ))}
                    </div>

                    {/* Tooltip Pill */}
                    {hoveredMonth !== null && currentData.chartPoints[hoveredMonth] && (
                      <div className="absolute top-0 right-2 bg-[#28166f] border border-[#e77817]/40 text-white text-[8.5px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        {currentData.chartPoints[hoveredMonth].m}: {currentData.chartPoints[hoveredMonth].label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Dynamic Donut Chart */}
                <div className="sm:col-span-5 p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col justify-between">
                  <div className="font-bold text-slate-800 text-[10.5px] mb-1 truncate">{currentData.donutTitle}</div>

                  <div className="flex items-center justify-center gap-2.5 my-auto">
                    {/* SVG Donut */}
                    <div className="relative w-15 h-15 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                        {currentData.donutSegments.map((seg, i) => (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={seg.stroke}
                            strokeWidth={activeExpenseIndex === i ? 17 : 14}
                            strokeDasharray={seg.dash}
                            strokeDashoffset={seg.offset}
                            className="hover:opacity-80 transition-all cursor-pointer"
                            onMouseEnter={() => setActiveExpenseIndex(i)}
                            onMouseLeave={() => setActiveExpenseIndex(null)}
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-black text-[9.5px] text-slate-900 leading-none">
                          {activeExpenseIndex !== null
                            ? `${currentData.donutSegments[activeExpenseIndex]?.pct}%`
                            : currentData.donutCenter}
                        </span>
                        <span className="text-[7px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-[42px]">
                          {activeExpenseIndex !== null
                            ? currentData.donutSegments[activeExpenseIndex]?.label
                            : currentData.donutCenterSub}
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-0.5 text-[8.5px] flex-1 min-w-0">
                      {currentData.donutSegments.map((exp, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setActiveExpenseIndex(i)}
                          onMouseLeave={() => setActiveExpenseIndex(null)}
                          className={`flex items-center justify-between gap-1 cursor-pointer transition-colors ${
                            activeExpenseIndex === i ? "font-bold text-slate-900" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${exp.color}`} />
                            <span className="truncate">{exp.label}</span>
                          </div>
                          <span className="font-semibold text-slate-700 shrink-0">{exp.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* 3. FLOATING "GET AI INSIGHTS" CARD */}
        <div
          onMouseEnter={() => setShowAiDetail(true)}
          onMouseLeave={() => setShowAiDetail(false)}
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-white/95 backdrop-blur-md border border-[#28166f]/15 shadow-xl rounded-xl p-2 sm:p-2.5 max-w-[210px] sm:max-w-[230px] transition-all duration-300 hover:scale-105 hover:border-[#e77817] cursor-pointer z-30"
        >
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#28166f] to-[#e77817] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-[10.5px] flex items-center gap-1">
                AI Insight
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[9px] text-slate-600 font-medium leading-tight mt-0.5">
                {currentData.aiInsight.title}
              </p>
            </div>
          </div>

          {/* Interactive expansion on hover */}
          {showAiDetail && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[8.5px] text-slate-600 space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-start gap-1 text-slate-600 leading-tight">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                <span>{currentData.aiInsight.desc}</span>
              </div>
              <div className="bg-orange-50 text-[#e77817] hover:bg-[#e77817] hover:text-white border border-orange-200/60 font-bold px-2 py-0.5 rounded text-center transition-colors">
                {currentData.aiInsight.action}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Decorative Interactive Hint Badge */}
      <div className="mt-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-medium text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs shadow-2xs">
          <Zap className="w-3 h-3 text-[#e77817] fill-[#e77817]" /> Click or hover on any main page (Sales, Inventory, Banking, HR, CRM...) to explore inside pages & live data
        </span>
      </div>
    </div>
  );
}
