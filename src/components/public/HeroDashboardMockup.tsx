import React, { useState } from "react";
import logoImg from "@/assets/logo.png";
import {
  Briefcase,
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
  Clock,
  ShieldCheck,
  Check,
} from "lucide-react";

export type ParentModuleKey =
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

// Exactly the 8 parent modules from software sidebar
export const PARENT_MODULES = [
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
      { m: "Jan", v: 28, label: "₹5.2L", x: 10, y: 56 },
      { m: "Feb", v: 42, label: "₹7.6L", x: 65, y: 46 },
      { m: "Mar", v: 56, label: "₹10.4L", x: 120, y: 36 },
      { m: "Apr", v: 70, label: "₹13.8L", x: 175, y: 26 },
      { m: "May", v: 84, label: "₹16.5L", x: 225, y: 18 },
      { m: "Jun", v: 96, label: "₹18.9L", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 56 Q 40 50, 65 46 T 120 36 T 175 26 T 225 18 T 270 8",
    chartAreaPath: "M 10 56 Q 40 50, 65 46 T 120 36 T 175 26 T 225 18 T 270 8 L 270 65 L 10 65 Z",
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
      { title: "Sales & Invoicing", desc: "GST invoices, estimates, credit notes, client ledger & delivery challans." },
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
      { m: "Jan", v: 85, label: "92%", x: 10, y: 48 },
      { m: "Feb", v: 88, label: "93%", x: 65, y: 42 },
      { m: "Mar", v: 91, label: "94.5%", x: 120, y: 34 },
      { m: "Apr", v: 93, label: "95%", x: 175, y: 26 },
      { m: "May", v: 95, label: "96.2%", x: 225, y: 16 },
      { m: "Jun", v: 98, label: "97.4%", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 48 Q 40 44, 65 42 T 120 34 T 175 26 T 225 16 T 270 8",
    chartAreaPath: "M 10 48 Q 40 44, 65 42 T 120 34 T 175 26 T 225 16 T 270 8 L 270 65 L 10 65 Z",
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
      { m: "Jan", v: 22, label: "28 deals", x: 10, y: 58 },
      { m: "Feb", v: 38, label: "45 deals", x: 65, y: 48 },
      { m: "Mar", v: 54, label: "68 deals", x: 120, y: 38 },
      { m: "Apr", v: 69, label: "92 deals", x: 175, y: 28 },
      { m: "May", v: 84, label: "118 deals", x: 225, y: 18 },
      { m: "Jun", v: 98, label: "142 deals", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 58 Q 40 50, 65 48 T 120 38 T 175 28 T 225 18 T 270 8",
    chartAreaPath: "M 10 58 Q 40 50, 65 48 T 120 38 T 175 28 T 225 18 T 270 8 L 270 65 L 10 65 Z",
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
      { m: "Jan", v: 20, label: "2.4K opens", x: 10, y: 56 },
      { m: "Feb", v: 36, label: "4.8K opens", x: 65, y: 46 },
      { m: "Mar", v: 52, label: "8.1K opens", x: 120, y: 36 },
      { m: "Apr", v: 68, label: "11.6K opens", x: 175, y: 26 },
      { m: "May", v: 84, label: "15.2K opens", x: 225, y: 16 },
      { m: "Jun", v: 96, label: "18.4K opens", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 56 Q 40 48, 65 46 T 120 36 T 175 26 T 225 16 T 270 8",
    chartAreaPath: "M 10 56 Q 40 48, 65 46 T 120 36 T 175 26 T 225 16 T 270 8 L 270 65 L 10 65 Z",
    donutTitle: "Channel Engagement",
    donutCenter: "99.2%",
    donutCenterSub: "Delivered",
    donutSegments: [
      { label: "WhatsApp Blast", pct: 60, color: "bg-[#e77817]", stroke: "#e77817", dash: "120 200", offset: "0" },
      { label: "SMS Broadcast", pct: 25, color: "bg-[#28166f]", stroke: "#28166f", dash: "50 200", offset: "-120" },
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
      { m: "Jan", v: 28, label: "4.2K calls", x: 10, y: 56 },
      { m: "Feb", v: 42, label: "7.1K calls", x: 65, y: 46 },
      { m: "Mar", v: 56, label: "10.4K calls", x: 120, y: 36 },
      { m: "Apr", v: 72, label: "14.2K calls", x: 175, y: 26 },
      { m: "May", v: 86, label: "18.6K calls", x: 225, y: 16 },
      { m: "Jun", v: 98, label: "24.1K calls", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 56 Q 40 48, 65 46 T 120 36 T 175 26 T 225 16 T 270 8",
    chartAreaPath: "M 10 56 Q 40 48, 65 46 T 120 36 T 175 26 T 225 16 T 270 8 L 270 65 L 10 65 Z",
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
      { title: "Integrate Email (SES)", desc: "Dispatch GST invoices and estimates directly from your business domain with zero spam." },
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
      { m: "Jan", v: 80, label: "4.5 ★", x: 10, y: 48 },
      { m: "Feb", v: 84, label: "4.6 ★", x: 65, y: 42 },
      { m: "Mar", v: 88, label: "4.7 ★", x: 120, y: 34 },
      { m: "Apr", v: 92, label: "4.75 ★", x: 175, y: 26 },
      { m: "May", v: 95, label: "4.8 ★", x: 225, y: 16 },
      { m: "Jun", v: 98, label: "4.85 ★", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 48 Q 40 44, 65 42 T 120 34 T 175 26 T 225 16 T 270 8",
    chartAreaPath: "M 10 48 Q 40 44, 65 42 T 120 34 T 175 26 T 225 16 T 270 8 L 270 65 L 10 65 Z",
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
      { m: "Jan", v: 30, label: "₹5.1L", x: 10, y: 58 },
      { m: "Feb", v: 45, label: "₹7.4L", x: 65, y: 48 },
      { m: "Mar", v: 60, label: "₹9.8L", x: 120, y: 38 },
      { m: "Apr", v: 75, label: "₹12.2L", x: 175, y: 28 },
      { m: "May", v: 88, label: "₹14.1L", x: 225, y: 18 },
      { m: "Jun", v: 98, label: "₹15.8L", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 58 Q 40 50, 65 48 T 120 38 T 175 28 T 225 18 T 270 8",
    chartAreaPath: "M 10 58 Q 40 50, 65 48 T 120 38 T 175 28 T 225 18 T 270 8 L 270 65 L 10 65 Z",
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
      { m: "Jan", v: 40, label: "120 logs", x: 10, y: 52 },
      { m: "Feb", v: 55, label: "210 logs", x: 65, y: 42 },
      { m: "Mar", v: 68, label: "340 logs", x: 120, y: 32 },
      { m: "Apr", v: 80, label: "480 logs", x: 175, y: 24 },
      { m: "May", v: 90, label: "620 logs", x: 225, y: 16 },
      { m: "Jun", v: 98, label: "780 logs", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 52 Q 40 46, 65 42 T 120 32 T 175 24 T 225 16 T 270 8",
    chartAreaPath: "M 10 52 Q 40 46, 65 42 T 120 32 T 175 24 T 225 16 T 270 8 L 270 65 L 10 65 Z",
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
  const [activeModule, setActiveModule] = useState<ParentModuleKey>("accounting");
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(5);
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);
  const [showAiDetail, setShowAiDetail] = useState(false);
  const [selectedSubPage, setSelectedSubPage] = useState<number>(0);

  const currentData = MODULE_DATA[activeModule] || MODULE_DATA.accounting;

  const handleModuleSelect = (key: ParentModuleKey) => {
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
        <div className="flex h-[475px] sm:h-[500px] text-xs">
          
          {/* 1. LEFT SIDEBAR (Dark Navy matching logo) */}
          <div className="w-44 sm:w-52 bg-[#0b1022] text-slate-400 flex flex-col justify-between py-3 px-2 shrink-0 border-r border-slate-800">
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Real AssayBiz Logo Header */}
              <div className="mb-3 px-1 shrink-0">
                <div className="bg-white/95 px-3 py-1.5 rounded-lg shadow-sm w-full flex items-center justify-center border border-white/20">
                  <img src={logoImg} alt="Assay Biz" className="h-6.5 w-auto object-contain" />
                </div>
              </div>

              {/* Exact 8 Parent Menu Options */}
              <div className="text-[9px] font-bold tracking-wider text-slate-500 uppercase px-2 mb-1 shrink-0">
                Modules
              </div>

              <nav className="space-y-1 font-medium overflow-y-auto pr-0.5 flex-1 scrollbar-none">
                {PARENT_MODULES.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleModuleSelect(item.id as ParentModuleKey)}
                      onMouseEnter={() => handleModuleSelect(item.id as ParentModuleKey)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-[#e77817] to-[#ea580c] text-white font-bold shadow-md shadow-orange-500/35 translate-x-1"
                          : "text-slate-400 hover:text-white hover:bg-[#e77817]/20 hover:translate-x-0.5"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className="text-[11px] sm:text-xs truncate">{item.label}</span>
                      </div>
                      {item.isUpcoming && (
                        <span
                          className={`text-[8px] font-semibold px-1 py-0.2 rounded-full border whitespace-nowrap ml-1 shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
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
              <div className="pt-2 mt-1 border-t border-slate-800/80 shrink-0 px-2 flex items-center justify-between text-[9.5px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AssayBiz v2.4
                </span>
                <span className="text-orange-400 font-bold">100% GST</span>
              </div>
            </div>
          </div>

          {/* 2. RIGHT MAIN CONTENT AREA (Clean Real Software View) */}
          <div className="flex-1 bg-[#f8fafc] flex flex-col overflow-hidden">
            
            {/* Header Bar */}
            <div className="h-9.5 px-3 sm:px-4 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
              <div className="relative w-40 sm:w-52">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  placeholder={`Search ${currentData.title.split(" ")[0]}...`}
                  className="w-full h-6 pl-7.5 pr-2.5 text-[10px] bg-slate-50 border border-slate-200 rounded-md text-slate-600 focus:outline-none placeholder:text-slate-400 cursor-pointer hover:border-orange-300 transition-colors"
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
                <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-[#28166f] to-[#e77817] text-white font-bold flex items-center justify-center text-[9.5px] ring-2 ring-[#e77817]/30 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                  A
                </div>
              </div>
            </div>

            {/* Scrollable Dashboard View */}
            <div className="p-3 space-y-2 overflow-y-auto flex-1 scrollbar-none">
              
              {/* Greetings & Active Module Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight transition-all truncate">
                    {currentData.title}
                  </h3>
                  {currentData.isUpcoming ? (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-amber-500" /> Upcoming Feature
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {currentData.subtitle}
                </p>
              </div>

              {/* INSIDE PAGES PILLS BAR */}
              <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-[#e77817]" /> Inside Modules:
                  </span>
                  <span className="text-[8.5px] text-[#e77817] font-semibold">
                    {currentData.subPages.length} Areas
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
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-[#28166f] text-white shadow-xs"
                            : "bg-slate-50 hover:bg-orange-50/80 text-slate-700 border border-slate-200 hover:border-[#e77817]"
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded font-bold ${
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {currentData.metrics.map((m, idx) => {
                  const isHovered = hoveredKpi === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredKpi(idx)}
                      onMouseLeave={() => setHoveredKpi(null)}
                      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? "bg-white border-[#e77817] shadow-sm -translate-y-0.5"
                          : "bg-white/90 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div className="text-[9px] text-slate-500 font-medium truncate">{m.label}</div>
                      <div className="text-xs sm:text-[13px] font-black text-slate-900 mt-0.5 tracking-tight truncate">
                        {m.value}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[8px] font-bold px-1 py-0.2 rounded ${
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

              {/* Middle Feature Highlights List (Especially for Integration, Accounting, HR, etc.) */}
              {currentData.featureList && currentData.featureList.length > 0 && (
                <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Key Functionality Highlights:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {currentData.featureList.map((f, fi) => (
                      <div key={fi} className="flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50/70 border border-slate-100">
                        <Check className="w-3 h-3 text-[#e77817] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-bold text-[10px] text-slate-800 block truncate">{f.title}</span>
                          <span className="text-[8.5px] text-slate-500 leading-tight block line-clamp-1">{f.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Cards: Line Chart (Left) + Donut Breakdown (Right) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5">
                
                {/* Left: Dynamic Line Chart */}
                <div className="sm:col-span-7 p-2 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-[10px] truncate">{currentData.chartTitle}</span>
                    <span className="text-[8px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1 py-0.2 rounded flex items-center gap-1">
                      {currentData.chartBadge} <ChevronDown className="w-2 h-2" />
                    </span>
                  </div>

                  {/* SVG Chart with Interactive Points */}
                  <div className="relative h-18 sm:h-20 w-full pt-1">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 280 70" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`growthGrad-${activeModule}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e77817" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#28166f" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Background horizontal grid lines */}
                      <line x1="0" y1="18" x2="280" y2="18" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="42" x2="280" y2="42" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="65" x2="280" y2="65" stroke="#e2e8f0" strokeWidth="1" />

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
                              r={isSelected ? 4.5 : 2.5}
                              fill={isSelected ? "#e77817" : "#ffffff"}
                              stroke={isSelected ? "#e77817" : "#28166f"}
                              strokeWidth={isSelected ? 2 : 1.5}
                              className="transition-all duration-200"
                            />
                            {isSelected && (
                              <circle cx={pt.x} cy={pt.y} r={8} fill="#e77817" opacity="0.2" />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Month Axis Labels */}
                    <div className="flex justify-between text-[8px] text-slate-400 font-medium px-1 mt-0.5">
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
                      <div className="absolute top-0 right-1 bg-[#28166f] border border-[#e77817]/40 text-white text-[8px] font-bold px-1.5 py-0.2 rounded shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        {currentData.chartPoints[hoveredMonth].m}: {currentData.chartPoints[hoveredMonth].label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Fitted Donut Chart */}
                <div className="sm:col-span-5 p-2 bg-white border border-slate-200/80 rounded-xl shadow-2xs flex flex-col justify-between overflow-hidden">
                  <div className="font-bold text-slate-800 text-[10px] mb-0.5 truncate">{currentData.donutTitle}</div>

                  <div className="flex items-center justify-center gap-2 my-auto">
                    {/* SVG Donut */}
                    <div className="relative w-13 h-13 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="32" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        {currentData.donutSegments.map((seg, i) => (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="32"
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
                        <span className="font-black text-[9px] text-slate-900 leading-none">
                          {activeExpenseIndex !== null
                            ? `${currentData.donutSegments[activeExpenseIndex]?.pct}%`
                            : currentData.donutCenter}
                        </span>
                        <span className="text-[6.5px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-[36px]">
                          {activeExpenseIndex !== null
                            ? currentData.donutSegments[activeExpenseIndex]?.label
                            : currentData.donutCenterSub}
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-0.5 text-[8px] flex-1 min-w-0">
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

        {/* 3. FLOATING "GET AI INSIGHTS" CARD */}
        <div
          onMouseEnter={() => setShowAiDetail(true)}
          onMouseLeave={() => setShowAiDetail(false)}
          className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 bg-white/95 backdrop-blur-md border border-[#28166f]/15 shadow-xl rounded-xl p-2 max-w-[200px] sm:max-w-[220px] transition-all duration-300 hover:scale-105 hover:border-[#e77817] cursor-pointer z-30"
        >
          <div className="flex items-start gap-1.5">
            <div className="h-5.5 w-5.5 rounded-md bg-gradient-to-tr from-[#28166f] to-[#e77817] text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Sparkles className="w-3 h-3" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-[10px] flex items-center gap-1">
                AI Insight
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[8.5px] text-slate-600 font-medium leading-tight mt-0.5 line-clamp-2">
                {currentData.aiInsight.title}
              </p>
            </div>
          </div>

          {/* Interactive expansion on hover */}
          {showAiDetail && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[8px] text-slate-600 space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-start gap-1 text-slate-600 leading-tight">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{currentData.aiInsight.desc}</span>
              </div>
              <div className="bg-orange-50 text-[#e77817] hover:bg-[#e77817] hover:text-white border border-orange-200/60 font-bold px-1.5 py-0.5 rounded text-center transition-colors">
                {currentData.aiInsight.action}
              </div>
            </div>
          )}
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
