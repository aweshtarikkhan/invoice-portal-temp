import React, { useState } from "react";
import logoImg from "@/assets/logo.png";
import {
  LayoutDashboard,
  Briefcase,
  UserCog,
  Users,
  Send,
  MessageCircle,
  MessageSquareQuote,
  BrainCircuit,
  Settings,
  Bell,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Check,
} from "lucide-react";
import { AassayBizBrand } from "@/components/shared/AassayBizBrand";

export type ParentModuleKey =
  | "dashboard"
  | "accounting"
  | "hr"
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
  isUpcoming?: boolean;
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
  featureList?: { title: string; desc: string }[];
  aiInsight: {
    title: string;
    desc: string;
    action: string;
  };
}

// Exactly the parent modules with Dashboard added at top
export const PARENT_MODULES = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "accounting", label: "Business Accounting", icon: Briefcase },
  { id: "hr", label: "Business HR", icon: UserCog },
  { id: "crm", label: "Business CRM", icon: Users },
  { id: "promotion", label: "Business Promotion", icon: Send },
  { id: "integration", label: "Business Integration", icon: MessageCircle },
  { id: "feedback", label: "Business Feedback", icon: MessageSquareQuote, isUpcoming: true },
  { id: "analysis", label: "Business Analysis", icon: BrainCircuit, isUpcoming: true },
  { id: "settings", label: "System & Settings", icon: Settings },
];

const MODULE_DATA: Record<ParentModuleKey, ModuleDetail> = {
  dashboard: {
    title: "Executive Business Dashboard",
    subtitle: "Real-time summary of sales, cash flow, stock health & team operations.",
    subPages: [
      { name: "Live Sales", count: "₹18.90L", status: "156 Invoices" },
      { name: "Receivables", count: "₹2.50L", status: "Due in 7d" },
      { name: "Cash Reserve", count: "₹8.45L", status: "3 Bank Accounts" },
      { name: "Staff Check-in", count: "22 / 24", status: "91.6% Present" },
    ],
    metrics: [
      { label: "Total Revenue", value: "₹18,90,000", change: "+18% MoM", isPositive: true },
      { label: "Active Invoices", value: "156 Bills", change: "94% Collected", isPositive: true },
      { label: "Liquid Cash", value: "₹8,45,200", change: "Surplus Runway", isPositive: true },
      { label: "Staff Present", value: "22 / 24", change: "91.6% Attendance", isPositive: true },
    ],
    chartTitle: "Business Growth & Sales Curve",
    chartBadge: "FY 2025",
    chartPoints: [
      { m: "Jan", v: 28, label: "₹5.2L", x: 10, y: 40 },
      { m: "Feb", v: 42, label: "₹7.6L", x: 65, y: 32 },
      { m: "Mar", v: 56, label: "₹10.4L", x: 120, y: 24 },
      { m: "Apr", v: 70, label: "₹13.8L", x: 175, y: 18 },
      { m: "May", v: 84, label: "₹16.5L", x: 225, y: 12 },
      { m: "Jun", v: 96, label: "₹18.9L", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 40 Q 40 36, 65 32 T 120 24 T 175 18 T 225 12 T 270 6",
    chartAreaPath: "M 10 40 Q 40 36, 65 32 T 120 24 T 175 18 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Revenue Channels",
    donutCenter: "₹18.9L",
    donutCenterSub: "Total Billed",
    donutSegments: [
      { label: "Direct GST Bills", pct: 50, color: "bg-[#e77817]", stroke: "#e77817", dash: "100 200", offset: "0" },
      { label: "Repeat B2B", pct: 28, color: "bg-[#28166f]", stroke: "#28166f", dash: "56 200", offset: "-100" },
      { label: "Online Orders", pct: 14, color: "bg-emerald-500", stroke: "#10b981", dash: "28 200", offset: "-156" },
      { label: "Services", pct: 8, color: "bg-cyan-500", stroke: "#06b6d4", dash: "16 200", offset: "-184" },
    ],
    featureList: [
      { title: "Consolidated Revenue", desc: "Live tracking of sales, quotes, credit notes & payments received across businesses." },
      { title: "Cash Flow Health", desc: "Real-time bank balances, daily collections, and upcoming 30-day payout projections." },
      { title: "Inventory Status", desc: "Monitor multi-warehouse stock levels, re-order alerts, and high-velocity SKUs." },
      { title: "Daily Team Attendance", desc: "Instant visibility into who is clocked in, half-day, or on approved leave today." },
    ],
    aiInsight: {
      title: "Revenue Pacing 18% Ahead",
      desc: "Healthy cash collections and zero overdue supply orders reported across all hubs.",
      action: "View Executive Summary →",
    },
  },

  accounting: {
    title: "Business Accounting Suite",
    subtitle: "Complete unified control of Sales, Purchases, Inventory & Bank Accounts.",
    subPages: [
      { name: "Sales (Invoices & Quotes)", count: "₹18.90L", status: "156 Invoices" },
      { name: "Purchases & Bills", count: "₹9.40L", status: "48 Vendors" },
      { name: "Inventory (Stock & Hubs)", count: "₹24.8L", status: "1,420 Items" },
      { name: "Banking & Cash Flow", count: "₹8.45L", status: "98.4% Matched" },
    ],
    metrics: [
      { label: "Sales & Invoicing", value: "₹18,90,000", change: "+18% MoM", isPositive: true },
      { label: "Purchases & Bills", value: "₹9,40,000", change: "48 Vendors", isPositive: true },
      { label: "Inventory Stock", value: "₹24,80,000", change: "4 Hubs", isPositive: true },
      { label: "Liquid Bank Cash", value: "₹8,45,200", change: "+15% Surplus", isPositive: true },
    ],
    chartTitle: "Monthly Sales vs Procurement Pacing",
    chartBadge: "FY 2025",
    chartPoints: [
      { m: "Jan", v: 28, label: "₹5.2L", x: 10, y: 40 },
      { m: "Feb", v: 42, label: "₹7.6L", x: 65, y: 32 },
      { m: "Mar", v: 56, label: "₹10.4L", x: 120, y: 24 },
      { m: "Apr", v: 70, label: "₹13.8L", x: 175, y: 18 },
      { m: "May", v: 84, label: "₹16.5L", x: 225, y: 12 },
      { m: "Jun", v: 96, label: "₹18.9L", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 40 Q 40 36, 65 32 T 120 24 T 175 18 T 225 12 T 270 6",
    chartAreaPath: "M 10 40 Q 40 36, 65 32 T 120 24 T 175 18 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Accounting Operations Split",
    donutCenter: "₹61.5L",
    donutCenterSub: "Gross Flow",
    donutSegments: [
      { label: "Sales & Bills", pct: 45, color: "bg-[#e77817]", stroke: "#e77817", dash: "90 200", offset: "0" },
      { label: "Live Inventory", pct: 30, color: "bg-[#28166f]", stroke: "#28166f", dash: "60 200", offset: "-90" },
      { label: "Purchases", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "30 200", offset: "-150" },
      { label: "Bank Reserve", pct: 10, color: "bg-cyan-500", stroke: "#06b6d4", dash: "20 200", offset: "-180" },
    ],
    featureList: [
      { title: "Sales & Invoicing", desc: "GST invoices, quotations, credit notes, client ledger & delivery challans." },
      { title: "Purchases & Expenses", desc: "Vendor orders, 3-way GRN match, supplier purchase bills & expense tracking." },
      { title: "Inventory & Warehouses", desc: "Real-time stock quantities across multi-warehouses with auto re-order alerts." },
      { title: "Double-Entry Banking", desc: "Live bank account feed, automated reconciliation, and GSTR-1/3B export." },
    ],
    aiInsight: {
      title: "Strong Financial Health",
      desc: "Working capital runway is 68 days with 94% on-time client payments.",
      action: "View Cash Flow Audit →",
    },
  },

  hr: {
    title: "Business HR & Staff Management",
    subtitle: "Biometric & web attendance, leave tracking, shift rosters, employee KYC & 1-click payroll.",
    subPages: [
      { name: "Employees Roster", count: "24 Staff", status: "100% Onboarded" },
      { name: "Today Attendance", count: "22 Present", status: "91.6% Turnout" },
      { name: "Leave Balances", count: "2 Pending", status: "4 Leave Types" },
      { name: "Monthly Payroll", count: "₹4.80L", status: "1-Click Payslips" },
    ],
    metrics: [
      { label: "Total Staff", value: "24 Employees", change: "100% Active", isPositive: true },
      { label: "Today Attendance", value: "22 Present", change: "91.6% Turnout", isPositive: true },
      { label: "Pending Leaves", value: "2 Requests", change: "1-Hour SLA", isPositive: true },
      { label: "Monthly Payroll", value: "₹4,80,000", change: "Auto-Calculated", isPositive: true },
    ],
    chartTitle: "Monthly Attendance & Productivity Rate",
    chartBadge: "96.4% Avg",
    chartPoints: [
      { m: "Jan", v: 85, label: "92%", x: 10, y: 38 },
      { m: "Feb", v: 88, label: "93%", x: 65, y: 32 },
      { m: "Mar", v: 91, label: "94.5%", x: 120, y: 26 },
      { m: "Apr", v: 93, label: "95%", x: 175, y: 20 },
      { m: "May", v: 95, label: "96.2%", x: 225, y: 12 },
      { m: "Jun", v: 98, label: "97.4%", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 38 Q 40 34, 65 32 T 120 26 T 175 20 T 225 12 T 270 6",
    chartAreaPath: "M 10 38 Q 40 34, 65 32 T 120 26 T 175 20 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Team by Department",
    donutCenter: "24",
    donutCenterSub: "Employees",
    donutSegments: [
      { label: "Sales & CRM", pct: 40, color: "bg-[#e77817]", stroke: "#e77817", dash: "80 200", offset: "0" },
      { label: "Operations", pct: 30, color: "bg-[#28166f]", stroke: "#28166f", dash: "60 200", offset: "-80" },
      { label: "Accounts", pct: 20, color: "bg-emerald-500", stroke: "#10b981", dash: "40 200", offset: "-140" },
      { label: "Tech & Support", pct: 10, color: "bg-cyan-500", stroke: "#06b6d4", dash: "20 200", offset: "-180" },
    ],
    featureList: [
      { title: "Attendance & Shifts", desc: "Biometric integration & web punch with GPS geo-fencing for shop & field staff." },
      { title: "Leave Management", desc: "Casual, Sick, Earned & Comp-off leaves with automated balance calculations." },
      { title: "1-Click Payroll", desc: "Instant calculation of basic, HRA, PF/ESI deductions, and digital salary slips." },
      { title: "Employee KYC Desk", desc: "Store Aadhaar, PAN, bank account details, and employment contracts securely." },
    ],
    aiInsight: {
      title: "Payroll Ready for 1st",
      desc: "All shift adjustments and leave balance deductions calculated automatically for 24 staff.",
      action: "Approve 1-Click Payslips →",
    },
  },

  crm: {
    title: "Business CRM & Deal Pipeline",
    subtitle: "Multi-channel lead capture, visual deal pipelines, task activities & client calendar.",
    subPages: [
      { name: "Lead Capture", count: "142 Active", status: "+28 This Week" },
      { name: "Pipeline Stages", count: "₹34.5L", status: "4 Visual Stages" },
      { name: "Daily Activities", count: "18 Calls Done", status: "100% Target" },
      { name: "Support Tickets", count: "0 Overdue", status: "Resolved" },
    ],
    metrics: [
      { label: "Active Deals Value", value: "₹34,50,000", change: "+24% Pipeline", isPositive: true },
      { label: "Qualified Leads", value: "142 Leads", change: "+28 New", isPositive: true },
      { label: "Pipeline Win Rate", value: "24.8%", change: "+3.2% Lift", isPositive: true },
      { label: "Sales Activities", value: "18 Done Today", change: "100% Target", isPositive: true },
    ],
    chartTitle: "Lead Inflow & Deal Conversions",
    chartBadge: "H1 Pacing",
    chartPoints: [
      { m: "Jan", v: 22, label: "28 deals", x: 10, y: 42 },
      { m: "Feb", v: 38, label: "45 deals", x: 65, y: 34 },
      { m: "Mar", v: 54, label: "68 deals", x: 120, y: 26 },
      { m: "Apr", v: 69, label: "92 deals", x: 175, y: 20 },
      { m: "May", v: 84, label: "118 deals", x: 225, y: 12 },
      { m: "Jun", v: 98, label: "142 deals", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 42 Q 40 36, 65 34 T 120 26 T 175 20 T 225 12 T 270 6",
    chartAreaPath: "M 10 42 Q 40 36, 65 34 T 120 26 T 175 20 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Deals by Pipeline Stage",
    donutCenter: "₹34.5L",
    donutCenterSub: "Active Deals",
    donutSegments: [
      { label: "New Leads", pct: 35, color: "bg-[#28166f]", stroke: "#28166f", dash: "70 200", offset: "0" },
      { label: "Demo Given", pct: 30, color: "bg-[#e77817]", stroke: "#e77817", dash: "60 200", offset: "-70" },
      { label: "Proposal Sent", pct: 20, color: "bg-emerald-500", stroke: "#10b981", dash: "40 200", offset: "-130" },
      { label: "Closed Won", pct: 15, color: "bg-cyan-500", stroke: "#06b6d4", dash: "30 200", offset: "-170" },
    ],
    featureList: [
      { title: "Multi-Source Lead Capture", desc: "Capture inquiries automatically from WhatsApp, website forms, calls & walk-ins." },
      { title: "Kanban Pipeline Board", desc: "Drag-and-drop deals across customized stages: Inquiry, Demo, Negotiation, Won." },
      { title: "Activity & Task Scheduler", desc: "Never miss follow-ups with automated call reminders and calendar view." },
      { title: "Client Helpdesk Tickets", desc: "Track customer issues and resolve service requests with clear accountability." },
    ],
    aiInsight: {
      title: "5 Hot Leads Ready to Close",
      desc: "Prospects have reviewed your quotations multiple times; high closing probability today.",
      action: "Call High-Value Leads →",
    },
  },

  promotion: {
    title: "Business Promotion & Marketing Studio",
    subtitle: "Pre-designed festival posters, automated WhatsApp broadcasts, templates & customer journeys.",
    subPages: [
      { name: "Festival Posters", count: "85 Creatives", status: "Auto-Branded" },
      { name: "WhatsApp Campaigns", count: "12 Broadcasts", status: "99.2% Delivery" },
      { name: "Approved Templates", count: "24 Ready", status: "Meta Verified" },
      { name: "Message Logs", count: "18,400 Sent", status: "Live Delivery" },
    ],
    metrics: [
      { label: "Total Audience Reach", value: "18,400 Customers", change: "+35% Reach", isPositive: true },
      { label: "WhatsApp Delivery Rate", value: "99.2%", change: "Official API", isPositive: true },
      { label: "Ready Posters", value: "85 Templates", change: "Festival Ready", isPositive: true },
      { label: "Campaign CTR", value: "16.4%", change: "Direct Orders", isPositive: true },
    ],
    chartTitle: "Broadcast Delivery & Open Velocity",
    chartBadge: "Campaigns",
    chartPoints: [
      { m: "Jan", v: 20, label: "2.4K opens", x: 10, y: 40 },
      { m: "Feb", v: 36, label: "4.8K opens", x: 65, y: 32 },
      { m: "Mar", v: 52, label: "8.1K opens", x: 120, y: 24 },
      { m: "Apr", v: 68, label: "11.6K opens", x: 175, y: 18 },
      { m: "May", v: 84, label: "15.2K opens", x: 225, y: 12 },
      { m: "Jun", v: 96, label: "18.4K opens", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 40 Q 40 34, 65 32 T 120 24 T 175 18 T 225 12 T 270 6",
    chartAreaPath: "M 10 40 Q 40 34, 65 32 T 120 24 T 175 18 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Channel Engagement",
    donutCenter: "99.2%",
    donutCenterSub: "Delivered",
    donutSegments: [
      { label: "WhatsApp Blast", pct: 60, color: "bg-[#e77817]", stroke: "#e77817", dash: "120 200", offset: "0" },
      { label: "App Notifications", pct: 25, color: "bg-[#28166f]", stroke: "#28166f", dash: "50 200", offset: "-120" },
      { label: "Email Dispatch", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "30 200", offset: "-170" },
    ],
    featureList: [
      { title: "Auto-Branded Posters", desc: "85+ high-converting festival & offer creatives automatically stamped with your logo." },
      { title: "Bulk WhatsApp Broadcasts", desc: "Send personalized offers and product launches to your entire customer base." },
      { title: "Drip Automation Journeys", desc: "Auto-send welcome discounts, payment receipts, and birthday greetings." },
      { title: "Real-time Delivery Analytics", desc: "Track delivered, opened, and clicked stats for every broadcast message." },
    ],
    aiInsight: {
      title: "Festive Campaign Ready",
      desc: "Diwali poster campaign ready with your custom logo and phone number for 1-click WhatsApp blast.",
      action: "Launch Festive Blast →",
    },
  },

  integration: {
    title: "Business Integration & Connectors",
    subtitle: "Integrate your official WhatsApp, business email & payments for 100% automated ops.",
    subPages: [
      { name: "Official WhatsApp API", count: "Active", status: "Meta Verified" },
      { name: "Business Email (SES)", count: "Active", status: "Zero Bounce" },
      { name: "Payment Gateways (UPI/Card)", count: "Live", status: "Razorpay & QR" },
      { name: "Webhooks & Sync", count: "8 APIs", status: "99.9% Uptime" },
    ],
    metrics: [
      { label: "WhatsApp Integration", value: "Connected", change: "Meta Cloud API", isPositive: true },
      { label: "Email Dispatch", value: "Live (SES)", change: "Instant PDF Delivery", isPositive: true },
      { label: "Payment Gateways", value: "Active", change: "Dynamic UPI QR", isPositive: true },
      { label: "API Sync Success", value: "99.9%", change: "Zero Errors", isPositive: true },
    ],
    chartTitle: "Real-time Messaging & Event Sync Volume",
    chartBadge: "Live Stream",
    chartPoints: [
      { m: "Jan", v: 28, label: "4.2K calls", x: 10, y: 40 },
      { m: "Feb", v: 42, label: "7.1K calls", x: 65, y: 32 },
      { m: "Mar", v: 56, label: "10.4K calls", x: 120, y: 24 },
      { m: "Apr", v: 72, label: "14.2K calls", x: 175, y: 18 },
      { m: "May", v: 86, label: "18.6K calls", x: 225, y: 12 },
      { m: "Jun", v: 98, label: "24.1K calls", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 40 Q 40 34, 65 32 T 120 24 T 175 18 T 225 12 T 270 6",
    chartAreaPath: "M 10 40 Q 40 34, 65 32 T 120 24 T 175 18 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Traffic by Connector",
    donutCenter: "24.1K",
    donutCenterSub: "Sync Events",
    donutSegments: [
      { label: "WhatsApp Cloud API", pct: 55, color: "bg-[#e77817]", stroke: "#e77817", dash: "110 200", offset: "0" },
      { label: "Payment Webhooks", pct: 25, color: "bg-[#28166f]", stroke: "#28166f", dash: "50 200", offset: "-110" },
      { label: "Amazon SES Email", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "30 200", offset: "-160" },
      { label: "External REST APIs", pct: 5, color: "bg-cyan-500", stroke: "#06b6d4", dash: "10 200", offset: "-190" },
    ],
    featureList: [
      { title: "Integrate WhatsApp", desc: "Send invoices, receipts, payment reminders & festival posters directly to customer WhatsApp." },
      { title: "Integrate Email (SES)", desc: "Dispatch GST invoices and quotations directly from your business domain with zero spam." },
      { title: "UPI QR & Payment Links", desc: "Dynamic UPI QR codes printed on invoices; client scans to pay and bill auto-marks paid." },
      { title: "External Webhooks", desc: "Connect with WooCommerce, Shopify, Zoho, or your custom inventory software in seconds." },
    ],
    aiInsight: {
      title: "All Connectors Live & Healthy",
      desc: "WhatsApp Meta Cloud and Amazon SES operating with 100% real-time transaction delivery.",
      action: "Test Live Webhooks →",
    },
  },

  feedback: {
    title: "Business Feedback & Reputation",
    subtitle: "Automated post-invoice client reviews, CSAT ratings & Google review sync.",
    isUpcoming: true,
    subPages: [
      { name: "Client Feedback Link", count: "Upcoming", status: "Post-Payment Link" },
      { name: "5-Star Rating Push", count: "Upcoming", status: "Google My Business" },
      { name: "NPS Survey Engine", count: "Upcoming", status: "Loyalty Metric" },
      { name: "Private Resolution Desk", count: "Upcoming", status: "Negative Alerts" },
    ],
    metrics: [
      { label: "Target CSAT Score", value: "4.8 / 5.0", change: "Upcoming Feature", isPositive: true },
      { label: "Google 5-Star Push", value: "+34 Reviews", change: "Auto-Synced", isPositive: true },
      { label: "Response Rate", value: "94.2%", change: "WhatsApp Quick Link", isPositive: true },
      { label: "Net Promoter (NPS)", value: "+68 Score", change: "World-Class", isPositive: true },
    ],
    chartTitle: "Client Satisfaction & Review Growth",
    chartBadge: "Preview",
    chartPoints: [
      { m: "Jan", v: 80, label: "4.5 ★", x: 10, y: 38 },
      { m: "Feb", v: 84, label: "4.6 ★", x: 65, y: 32 },
      { m: "Mar", v: 88, label: "4.7 ★", x: 120, y: 26 },
      { m: "Apr", v: 92, label: "4.75 ★", x: 175, y: 20 },
      { m: "May", v: 95, label: "4.8 ★", x: 225, y: 12 },
      { m: "Jun", v: 98, label: "4.85 ★", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 38 Q 40 34, 65 32 T 120 26 T 175 20 T 225 12 T 270 6",
    chartAreaPath: "M 10 38 Q 40 34, 65 32 T 120 26 T 175 20 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Rating Distribution",
    donutCenter: "4.8 ★",
    donutCenterSub: "Target CSAT",
    donutSegments: [
      { label: "5-Star Rating", pct: 78, color: "bg-emerald-500", stroke: "#10b981", dash: "156 200", offset: "0" },
      { label: "4-Star Rating", pct: 16, color: "bg-[#e77817]", stroke: "#e77817", dash: "32 200", offset: "-156" },
      { label: "3-Star Rating", pct: 4, color: "bg-amber-500", stroke: "#f59e0b", dash: "8 200", offset: "-188" },
      { label: "Under 3 Stars", pct: 2, color: "bg-rose-500", stroke: "#f43f5e", dash: "4 200", offset: "-196" },
    ],
    featureList: [
      { title: "Post-Payment Review Links", desc: "Automatically send a quick 1-click rating link to customers as soon as they pay." },
      { title: "Push to Google My Business", desc: "Direct satisfied 5-star reviewers straight to your Google page to skyrocket local rankings." },
      { title: "Private Feedback Filter", desc: "Any rating under 4 stars gets routed privately to you so you can resolve issues immediately." },
      { title: "NPS Customer Loyalty", desc: "Track repeat client sentiment and know exactly who your happiest brand advocates are." },
    ],
    aiInsight: {
      title: "Reputation Booster (Coming Soon)",
      desc: "Designed to triple your Google 5-star reviews automatically after every invoice settlement.",
      action: "Notify Me When Ready →",
    },
  },

  analysis: {
    title: "Business Analysis & AI Intelligence",
    subtitle: "AI-powered revenue forecasts, stock outage warnings & profit margin optimization.",
    isUpcoming: true,
    subPages: [
      { name: "Predictive Revenue AI", count: "Upcoming", status: "+16% Projected" },
      { name: "Stock Outage Risk", count: "Upcoming", status: "Zero Downtime" },
      { name: "Profit Margin Boost", count: "Upcoming", status: "Smart Bundling" },
      { name: "Cash Runway Model", count: "Upcoming", status: "30-Day Ahead" },
    ],
    metrics: [
      { label: "Revenue Target Q3", value: "₹15.8L", change: "+16% Projected", isPositive: true },
      { label: "Stock Outage Risk", value: "0 Items", change: "Healthy Buffer", isPositive: true },
      { label: "Profit Margin Boost", value: "31.2%", change: "+3.8% AI Lift", isPositive: true },
      { label: "Smart Action Alerts", value: "14 Live", change: "Upcoming AI", isPositive: true },
    ],
    chartTitle: "AI Predictive Revenue Forecast vs Actuals",
    chartBadge: "Neural AI",
    chartPoints: [
      { m: "Jan", v: 30, label: "₹5.1L", x: 10, y: 42 },
      { m: "Feb", v: 45, label: "₹7.4L", x: 65, y: 34 },
      { m: "Mar", v: 60, label: "₹9.8L", x: 120, y: 26 },
      { m: "Apr", v: 75, label: "₹12.2L", x: 175, y: 20 },
      { m: "May", v: 88, label: "₹14.1L", x: 225, y: 12 },
      { m: "Jun", v: 98, label: "₹15.8L", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 42 Q 40 36, 65 34 T 120 26 T 175 20 T 225 12 T 270 6",
    chartAreaPath: "M 10 42 Q 40 36, 65 34 T 120 26 T 175 20 T 225 12 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "AI Business Health Index",
    donutCenter: "96.4%",
    donutCenterSub: "Optimal",
    donutSegments: [
      { label: "Cash Flow Run", pct: 40, color: "bg-emerald-500", stroke: "#10b981", dash: "80 200", offset: "0" },
      { label: "Stock Velocity", pct: 30, color: "bg-[#e77817]", stroke: "#e77817", dash: "60 200", offset: "-80" },
      { label: "Margin Strength", pct: 20, color: "bg-[#28166f]", stroke: "#28166f", dash: "40 200", offset: "-140" },
      { label: "Client Retention", pct: 10, color: "bg-purple-500", stroke: "#a855f7", dash: "20 200", offset: "-180" },
    ],
    featureList: [
      { title: "Predictive Revenue Model", desc: "Machine-learning models forecast next month's sales based on past seasonal trends." },
      { title: "Stock Outage Warning", desc: "Detects fast-moving items running low and suggests exact purchase order quantities." },
      { title: "Profit Margin Optimizer", desc: "Discovers your most profitable item combinations to cross-sell to regular clients." },
      { title: "Cash Crunch Early Alert", desc: "Forecasts pending payables vs receivables 30 days ahead to prevent cash crunches." },
    ],
    aiInsight: {
      title: "Neural Engine (Coming Soon)",
      desc: "Trained on Indian MSME billing patterns to unlock an estimated 16% revenue growth.",
      action: "Notify Me When Ready →",
    },
  },

  settings: {
    title: "System & Settings Configuration",
    subtitle: "Custom invoice designs, business tax setup, team role security & audit trails.",
    subPages: [
      { name: "Invoice Templates", count: "7 Formats", status: "Custom Brand" },
      { name: "Custom Fields", count: "12 Fields", status: "Active in Forms" },
      { name: "Audit Trail History", count: "100% Logged", status: "Tamper-Proof" },
      { name: "Role Access Control", count: "4 Roles", status: "Secure Permissions" },
    ],
    metrics: [
      { label: "Invoice Templates", value: "7 Styles", change: "Standard to Modern", isPositive: true },
      { label: "Custom Fields", value: "12 Fields", change: "PAN, PO, Vehicle", isPositive: true },
      { label: "Audit Trail Logs", value: "100% Logged", change: "Full Activity History", isPositive: true },
      { label: "User Access Roles", value: "4 Roles", change: "Role-Based Security", isPositive: true },
    ],
    chartTitle: "System Security & Audit Activity Pacing",
    chartBadge: "Secure Logs",
    chartPoints: [
      { m: "Jan", v: 40, label: "120 logs", x: 10, y: 38 },
      { m: "Feb", v: 55, label: "210 logs", x: 65, y: 30 },
      { m: "Mar", v: 68, label: "340 logs", x: 120, y: 22 },
      { m: "Apr", v: 80, label: "480 logs", x: 175, y: 16 },
      { m: "May", v: 90, label: "620 logs", x: 225, y: 10 },
      { m: "Jun", v: 98, label: "780 logs", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 38 Q 40 32, 65 30 T 120 22 T 175 16 T 225 10 T 270 6",
    chartAreaPath: "M 10 38 Q 40 32, 65 30 T 120 22 T 175 16 T 225 10 T 270 6 L 270 46 L 10 46 Z",
    donutTitle: "Team Role Permissions",
    donutCenter: "24",
    donutCenterSub: "Active Users",
    donutSegments: [
      { label: "Staff Members", pct: 60, color: "bg-[#28166f]", stroke: "#28166f", dash: "120 200", offset: "0" },
      { label: "Accountants", pct: 20, color: "bg-[#e77817]", stroke: "#e77817", dash: "40 200", offset: "-120" },
      { label: "Administrators", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "30 200", offset: "-160" },
      { label: "Auditors / Viewers", pct: 5, color: "bg-cyan-500", stroke: "#06b6d4", dash: "10 200", offset: "-190" },
    ],
    featureList: [
      { title: "Invoice Template Studio", desc: "Select between Standard GST, Modern, Classic & Corporate with custom accent colors." },
      { title: "Custom Data Fields", desc: "Add PAN, Vehicle Number, E-Way Bill Number, or custom attributes to any form." },
      { title: "Audit Trail & Activity History", desc: "Tamper-proof logs record every invoice created, edited, printed, or deleted with timestamps." },
      { title: "Role-Based Access Control", desc: "Restrict employees to specific modules so they only access what their role requires." },
    ],
    aiInsight: {
      title: "Enterprise Role Guard",
      desc: "All critical modules secured with strict role-based access control and live audit history.",
      action: "Manage Permissions →",
    },
  },
};

export function HeroDashboardMockup() {
  const [activeModule, setActiveModule] = useState<ParentModuleKey>("dashboard");
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(5);
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);
  const [selectedSubPage, setSelectedSubPage] = useState<number>(0);

  const currentData = MODULE_DATA[activeModule] || MODULE_DATA.dashboard;

  const handleModuleSelect = (key: ParentModuleKey) => {
    setActiveModule(key);
    setHoveredMonth(5);
    setActiveExpenseIndex(null);
    setSelectedSubPage(0);
  };

  return (
    <div className="relative w-full max-w-[580px] mx-auto select-none">
      {/* Decorative background glow matching logo colors */}
      <div className="absolute -top-8 -right-8 w-64 h-64 bg-[#28166f]/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-56 h-56 bg-[#e77817]/12 rounded-full blur-3xl pointer-events-none" />

      {/* Main SaaS Window Frame */}
      <div className="relative rounded-2xl shadow-[0_16px_45px_-12px_rgba(40,22,111,0.20)] border border-[#28166f]/20 bg-white overflow-hidden transition-all duration-500 hover:shadow-[0_20px_55px_-10px_rgba(231,120,23,0.22)]">
        
        {/* Flex layout: Left Sidebar + Right Main App View */}
        <div className="flex h-[415px] sm:h-[435px] text-xs">
          
          {/* 1. LEFT SIDEBAR - Logo Blue (#28166f) Panel */}
          <div className="w-11 sm:w-44 bg-[#28166f] text-white/80 flex flex-col justify-between py-2.5 px-1 sm:px-1.5 shrink-0 border-r border-[#1e1058]">
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Real AssayBiz Logo on crisp container */}
              <div className="mb-2 px-0 sm:px-0.5 shrink-0">
                <div className="bg-white px-1 sm:px-2 py-1 rounded-md shadow-xs w-full flex items-center justify-center border border-white/20">
                  <img src={logoImg} alt="Aassay Biz" className="h-3.5 sm:h-5 w-auto object-contain" />
                </div>
              </div>

              {/* Exact Parent Menu Options */}
              <div className="hidden sm:block text-[8px] font-bold tracking-wider text-white/60 uppercase px-1.5 mb-1 shrink-0">
                Modules
              </div>

              <nav className="space-y-0.5 font-medium overflow-y-auto pr-0.5 flex-1 scrollbar-none">
                {PARENT_MODULES.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleModuleSelect(item.id as ParentModuleKey)}
                      onMouseEnter={() => handleModuleSelect(item.id as ParentModuleKey)}
                      className={`w-full flex items-center justify-center sm:justify-between p-1 sm:px-2 sm:py-1 rounded-md text-left transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-[#e77817] to-[#ea580c] text-white font-bold shadow-sm shadow-orange-500/40 sm:translate-x-0.5"
                          : "text-white/80 hover:text-white hover:bg-white/15 hover:translate-x-0 sm:hover:translate-x-0.5"
                      }`}
                    >
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 min-w-0 w-full sm:w-auto">
                        <Icon className={`w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0 mx-auto sm:mx-0 ${isActive ? "text-white" : "text-white/80"}`} />
                        <span className="hidden sm:inline text-[10.5px] truncate">{item.label}</span>
                      </div>
                      {item.isUpcoming && (
                        <span
                          className={`hidden sm:inline text-[7.5px] font-semibold px-1 py-0.2 rounded-full border whitespace-nowrap ml-1 shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : "bg-amber-400/20 text-amber-200 border-amber-400/40"
                          }`}
                        >
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Bottom Quick Indicator */}
              <div className="pt-1.5 mt-1 border-t border-white/15 shrink-0 px-0.5 sm:px-1 flex items-center justify-center sm:justify-between text-[8.5px] text-white/70">
                <span className="hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> <AassayBizBrand theme="dark" className="text-[8.5px]" suffix="v2.4" />
                </span>
                <span className="text-orange-300 font-bold hidden sm:inline">100% GST</span>
              </div>
            </div>
          </div>

          {/* 2. RIGHT MAIN CONTENT AREA (Search Bar Removed, Clean Brand Breadcrumb) */}
          <div className="flex-1 bg-[#f8fafc] flex flex-col overflow-hidden">
            
            {/* Header Bar - Without Search Bar */}
            <div className="h-8 px-2.5 sm:px-3 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <AassayBizBrand className="text-xs sm:text-[12.5px]" />
                <span className="text-slate-300 text-xs">/</span>
                <span className="text-slate-700 font-semibold text-xs truncate">
                  {currentData.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="1 unread alert"
                  className="relative p-1 text-slate-500 hover:text-[#e77817] hover:bg-slate-100 rounded-md transition-colors"
                >
                  <Bell className="w-3 h-3" />
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#e77817] rounded-full ring-2 ring-white" />
                </button>
                <button
                  type="button"
                  title="Help & Support"
                  className="p-1 text-slate-500 hover:text-[#e77817] hover:bg-slate-100 rounded-md transition-colors hidden sm:inline-flex"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#28166f] to-[#e77817] text-white font-bold flex items-center justify-center text-[9px] ring-2 ring-[#e77817]/30 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                  A
                </div>
              </div>
            </div>

            {/* Scrollable Dashboard View */}
            <div className="p-2 sm:p-2.5 space-y-1.5 overflow-y-auto flex-1 scrollbar-none">
              
              {/* Greetings & Active Module Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm tracking-tight transition-all truncate">
                    {currentData.title}
                  </h3>
                  {currentData.isUpcoming ? (
                    <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5 text-amber-500" /> Upcoming Feature
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
                    </span>
                  )}
                </div>
                <p className="text-[9.5px] text-slate-500 mt-0.5 truncate">
                  {currentData.subtitle}
                </p>
              </div>

              {/* INSIDE PAGES PILLS BAR */}
              <div className="bg-white p-1 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-0.5 px-0.5">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-2.5 h-2.5 text-[#e77817]" /> Inside Modules:
                  </span>
                  <span className="text-[8px] text-[#e77817] font-semibold">
                    {currentData.subPages.length} Areas
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  {currentData.subPages.map((sub, i) => {
                    const isSelected = selectedSubPage === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSubPage(i)}
                        onMouseEnter={() => setSelectedSubPage(i)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-[#28166f] text-white shadow-xs"
                            : "bg-slate-50 hover:bg-orange-50/80 text-slate-700 border border-slate-200 hover:border-[#e77817]"
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span
                          className={`text-[7.5px] px-1 py-0.2 rounded font-bold ${
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

              {/* 4 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                {currentData.metrics.map((m, idx) => {
                  const isHovered = hoveredKpi === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredKpi(idx)}
                      onMouseLeave={() => setHoveredKpi(null)}
                      className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? "bg-white border-[#e77817] shadow-xs -translate-y-0.5"
                          : "bg-white/90 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div className="text-[8.5px] text-slate-500 font-medium truncate">{m.label}</div>
                      <div className="text-[11px] sm:text-xs font-black text-slate-900 mt-0.5 tracking-tight truncate">
                        {m.value}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[7.5px] font-bold px-1 py-0.2 rounded ${
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

              {/* Middle Feature Highlights List */}
              {currentData.featureList && currentData.featureList.length > 0 && (
                <div className="bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Key Highlights & Functionality:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {currentData.featureList.map((f, fi) => (
                      <div key={fi} className="flex items-start gap-1 p-1 rounded-md bg-slate-50/70 border border-slate-100">
                        <Check className="w-2.5 h-2.5 text-[#e77817] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-bold text-[9.5px] text-slate-800 block truncate">{f.title}</span>
                          <span className="text-[8px] text-slate-500 leading-tight block line-clamp-1">{f.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Cards: COMPACT Line Chart (Left) + COMPACT Donut Breakdown (Right) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                
                {/* Left: Compact Dynamic Line Chart */}
                <div className="sm:col-span-7 p-1.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-800 text-[9px] truncate">{currentData.chartTitle}</span>
                    <span className="text-[7.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1 py-0.2 rounded flex items-center gap-0.5">
                      {currentData.chartBadge} <ChevronDown className="w-2 h-2" />
                    </span>
                  </div>

                  {/* Compact SVG Chart */}
                  <div className="relative h-11 sm:h-12 w-full">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 280 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`growthGrad-${activeModule}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e77817" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#28166f" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>

                      <line x1="0" y1="12" x2="280" y2="12" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="28" x2="280" y2="28" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="44" x2="280" y2="44" stroke="#e2e8f0" strokeWidth="1" />

                      <path
                        d={currentData.chartAreaPath}
                        fill={`url(#growthGrad-${activeModule})`}
                        className="transition-all duration-300"
                      />

                      <path
                        d={currentData.chartLinePath}
                        fill="none"
                        stroke="#28166f"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />

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
                              r={isSelected ? 3.5 : 2}
                              fill={isSelected ? "#e77817" : "#ffffff"}
                              stroke={isSelected ? "#e77817" : "#28166f"}
                              strokeWidth={1.5}
                              className="transition-all duration-200"
                            />
                            {isSelected && (
                              <circle cx={pt.x} cy={pt.y} r={6.5} fill="#e77817" opacity="0.2" />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    <div className="flex justify-between text-[7.5px] text-slate-400 font-medium px-1 mt-0.5">
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

                    {hoveredMonth !== null && currentData.chartPoints[hoveredMonth] && (
                      <div className="absolute top-0 right-1 bg-[#28166f] border border-[#e77817]/40 text-white text-[8px] font-bold px-1.5 py-0.2 rounded shadow-lg pointer-events-none">
                        {currentData.chartPoints[hoveredMonth].m}: {currentData.chartPoints[hoveredMonth].label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Compact Small Donut Chart */}
                <div className="sm:col-span-5 p-1.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs flex flex-col justify-between overflow-hidden">
                  <div className="font-bold text-slate-800 text-[9px] mb-0.5 truncate">{currentData.donutTitle}</div>

                  <div className="flex items-center justify-between gap-1.5 my-auto">
                    {/* Small SVG Donut (fixed 40px) */}
                    <div className="relative w-10 h-10 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="34" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        {currentData.donutSegments.map((seg, i) => (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="34"
                            fill="none"
                            stroke={seg.stroke}
                            strokeWidth={activeExpenseIndex === i ? 14 : 12}
                            strokeDasharray={seg.dash}
                            strokeDashoffset={seg.offset}
                            className="hover:opacity-80 transition-all cursor-pointer"
                            onMouseEnter={() => setActiveExpenseIndex(i)}
                            onMouseLeave={() => setActiveExpenseIndex(null)}
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="font-black text-[8px] text-slate-900 leading-none">
                          {activeExpenseIndex !== null
                            ? `${currentData.donutSegments[activeExpenseIndex]?.pct}%`
                            : currentData.donutCenter}
                        </span>
                        <span className="text-[5.5px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-[28px]">
                          {activeExpenseIndex !== null
                            ? currentData.donutSegments[activeExpenseIndex]?.label
                            : currentData.donutCenterSub}
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-0.5 text-[7.5px] flex-1 min-w-0">
                      {currentData.donutSegments.map((exp, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setActiveExpenseIndex(i)}
                          onMouseLeave={() => setActiveExpenseIndex(null)}
                          className={`flex items-center justify-between gap-1 cursor-pointer transition-colors ${
                            activeExpenseIndex === i ? "font-bold text-slate-900" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
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


      </div>

      {/* Decorative Interactive Hint Badge */}
      <div className="mt-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs shadow-2xs">
          <Zap className="w-3 h-3 text-[#e77817] fill-[#e77817]" /> Click or hover any module on the left to view its inside pages, active live status & features
        </span>
      </div>
    </div>
  );
}
