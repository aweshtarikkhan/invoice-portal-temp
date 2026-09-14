import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Users,
  UserCheck,
  Megaphone,
  MessageSquare,
  Sparkles,
  Layers,
  Settings,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Zap,
} from "lucide-react";

export type ModuleKey =
  | "dashboard"
  | "invoicing"
  | "accounting"
  | "crm"
  | "hrms"
  | "promotion"
  | "feedback"
  | "ai_analysis"
  | "integrations";

interface MetricData {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface ModuleDetail {
  title: string;
  subtitle: string;
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

const MODULE_DATA: Record<ModuleKey, ModuleDetail> = {
  dashboard: {
    title: "Good Morning, Business Owner!",
    subtitle: "Real-time summary of your sales, cash flow, and team operations.",
    metrics: [
      { label: "Total Revenue", value: "₹12,48,000", change: "+14%", isPositive: true },
      { label: "Active Invoices", value: "156", change: "+8%", isPositive: true },
      { label: "Customer Accounts", value: "320", change: "+15%", isPositive: true },
      { label: "Staff Present", value: "22 / 24", change: "91.6%", isPositive: true },
    ],
    chartTitle: "Business Growth & Sales",
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
      { label: "Retail Sales", pct: 45, color: "bg-[#e77817]", stroke: "#e77817", dash: "113 251.2", offset: "0" },
      { label: "Wholesale", pct: 30, color: "bg-[#28166f]", stroke: "#28166f", dash: "75.4 251.2", offset: "-113" },
      { label: "Services", pct: 15, color: "bg-emerald-500", stroke: "#10b981", dash: "37.7 251.2", offset: "-188.4" },
      { label: "Online Direct", pct: 10, color: "bg-cyan-500", stroke: "#06b6d4", dash: "25.1 251.2", offset: "-226.1" },
    ],
    aiInsight: {
      title: "Revenue Pacing 14% Ahead",
      desc: "Sales are pacing 14% higher than last month with strong B2B repeat orders.",
      action: "View Growth Forecast →",
    },
  },
  invoicing: {
    title: "Invoicing & GST Overview",
    subtitle: "Real-time GST bill generation, payments, and e-way tracking.",
    metrics: [
      { label: "Total Invoiced", value: "₹18,90,000", change: "+18%", isPositive: true },
      { label: "Paid Received", value: "₹15,40,000", change: "+22%", isPositive: true },
      { label: "Overdue Bills", value: "₹2,50,000", change: "-12%", isPositive: false },
      { label: "E-Way & IRN", value: "48 / 48", change: "100%", isPositive: true },
    ],
    chartTitle: "Monthly Invoicing Volume",
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
    donutTitle: "Billing Collection Status",
    donutCenter: "81.5%",
    donutCenterSub: "Paid Rate",
    donutSegments: [
      { label: "Paid Invoices", pct: 65, color: "bg-emerald-500", stroke: "#10b981", dash: "163.3 251.2", offset: "0" },
      { label: "Partially Paid", pct: 18, color: "bg-[#e77817]", stroke: "#e77817", dash: "45.2 251.2", offset: "-163.3" },
      { label: "Overdue", pct: 10, color: "bg-rose-500", stroke: "#f43f5e", dash: "25.1 251.2", offset: "-208.5" },
      { label: "Draft Bills", pct: 7, color: "bg-slate-400", stroke: "#94a3b8", dash: "17.6 251.2", offset: "-233.6" },
    ],
    aiInsight: {
      title: "3 Invoices Overdue",
      desc: "₹2.50L overdue from 3 clients. Automated WhatsApp reminders prepared.",
      action: "Send WhatsApp Reminders Now →",
    },
  },
  accounting: {
    title: "Banking & Accounts",
    subtitle: "Multi-bank reconciliation, cash flow, and tax credit summaries.",
    metrics: [
      { label: "Bank Balance", value: "₹8,45,200", change: "+15%", isPositive: true },
      { label: "Net Cash Inflow", value: "₹12,10,000", change: "+9%", isPositive: true },
      { label: "Monthly Outflow", value: "₹3,12,000", change: "-6%", isPositive: false },
      { label: "GST Input Credit", value: "₹1,42,800", change: "+11%", isPositive: true },
    ],
    chartTitle: "Net Cash Flow Trend",
    chartBadge: "H1 Audit",
    chartPoints: [
      { m: "Jan", v: 38, label: "₹3.8L", x: 10, y: 58 },
      { m: "Feb", v: 52, label: "₹5.2L", x: 65, y: 48 },
      { m: "Mar", v: 49, label: "₹4.9L", x: 120, y: 54 },
      { m: "Apr", v: 68, label: "₹6.8L", x: 175, y: 38 },
      { m: "May", v: 76, label: "₹7.6L", x: 225, y: 26 },
      { m: "Jun", v: 92, label: "₹8.45L", x: 270, y: 14 },
    ],
    chartLinePath: "M 10 58 Q 40 52, 65 48 T 120 54 T 175 38 T 225 26 T 270 14",
    chartAreaPath: "M 10 58 Q 40 52, 65 48 T 120 54 T 175 38 T 225 26 T 270 14 L 270 75 L 10 75 Z",
    donutTitle: "Expense Allocation",
    donutCenter: "₹3.12L",
    donutCenterSub: "Outflow",
    donutSegments: [
      { label: "Operations", pct: 40, color: "bg-[#28166f]", stroke: "#28166f", dash: "100.5 251.2", offset: "0" },
      { label: "Salaries", pct: 25, color: "bg-emerald-500", stroke: "#10b981", dash: "62.8 251.2", offset: "-100.5" },
      { label: "Marketing", pct: 20, color: "bg-[#e77817]", stroke: "#e77817", dash: "50.2 251.2", offset: "-163.3" },
      { label: "Taxes & Misc", pct: 15, color: "bg-purple-500", stroke: "#8b5cf6", dash: "37.7 251.2", offset: "-213.5" },
    ],
    aiInsight: {
      title: "GST ITC Claim Ready",
      desc: "₹1,42,800 Input Tax Credit verified against GSTR-2B with 0 mismatch.",
      action: "Export GST Filing Report →",
    },
  },
  crm: {
    title: "CRM & Sales Pipeline",
    subtitle: "Lead conversions, client stages, and ongoing deal tracking.",
    metrics: [
      { label: "Active Leads", value: "184", change: "+24%", isPositive: true },
      { label: "Deals Won", value: "42", change: "+18%", isPositive: true },
      { label: "Pipeline Value", value: "₹28.5 Lakh", change: "+15%", isPositive: true },
      { label: "Win Rate", value: "36.8%", change: "+5.4%", isPositive: true },
    ],
    chartTitle: "Lead Conversion Velocity",
    chartBadge: "Q2 Performance",
    chartPoints: [
      { m: "Jan", v: 24, label: "12 Won", x: 10, y: 62 },
      { m: "Feb", v: 38, label: "19 Won", x: 65, y: 54 },
      { m: "Mar", v: 54, label: "27 Won", x: 120, y: 40 },
      { m: "Apr", v: 66, label: "33 Won", x: 175, y: 32 },
      { m: "May", v: 80, label: "38 Won", x: 225, y: 20 },
      { m: "Jun", v: 94, label: "42 Won", x: 270, y: 10 },
    ],
    chartLinePath: "M 10 62 Q 40 57, 65 54 T 120 40 T 175 32 T 225 20 T 270 10",
    chartAreaPath: "M 10 62 Q 40 57, 65 54 T 120 40 T 175 32 T 225 20 T 270 10 L 270 75 L 10 75 Z",
    donutTitle: "Deal Pipeline Stages",
    donutCenter: "₹28.5L",
    donutCenterSub: "Pipeline",
    donutSegments: [
      { label: "Negotiation", pct: 42, color: "bg-[#e77817]", stroke: "#e77817", dash: "105.5 251.2", offset: "0" },
      { label: "Proposal Sent", pct: 28, color: "bg-[#28166f]", stroke: "#28166f", dash: "70.3 251.2", offset: "-105.5" },
      { label: "Qualified", pct: 20, color: "bg-emerald-500", stroke: "#10b981", dash: "50.2 251.2", offset: "-175.8" },
      { label: "Contacted", pct: 10, color: "bg-cyan-500", stroke: "#06b6d4", dash: "25.1 251.2", offset: "-226.0" },
    ],
    aiInsight: {
      title: "5 High-Value Deals Closing",
      desc: "₹8.4 Lakh pipeline deals in final negotiation stage this week.",
      action: "Follow Up On WhatsApp →",
    },
  },
  hrms: {
    title: "HRMS & Staff Attendance",
    subtitle: "Live biometric punches, shift tracking, and leave approvals.",
    metrics: [
      { label: "Present Today", value: "22 / 24", change: "91.6%", isPositive: true },
      { label: "On Leave", value: "2 Members", change: "Approved", isPositive: true },
      { label: "Overtime Logged", value: "48.5 Hrs", change: "+12%", isPositive: true },
      { label: "Payroll Status", value: "Ready", change: "Auto-synced", isPositive: true },
    ],
    chartTitle: "Monthly Attendance Rate (%)",
    chartBadge: "98% Peak",
    chartPoints: [
      { m: "Jan", v: 48, label: "89%", x: 10, y: 50 },
      { m: "Feb", v: 58, label: "91%", x: 65, y: 42 },
      { m: "Mar", v: 68, label: "93%", x: 120, y: 35 },
      { m: "Apr", v: 76, label: "94%", x: 175, y: 28 },
      { m: "May", v: 84, label: "96%", x: 225, y: 22 },
      { m: "Jun", v: 96, label: "98%", x: 270, y: 12 },
    ],
    chartLinePath: "M 10 50 Q 40 46, 65 42 T 120 35 T 175 28 T 225 22 T 270 12",
    chartAreaPath: "M 10 50 Q 40 46, 65 42 T 120 35 T 175 28 T 225 22 T 270 12 L 270 75 L 10 75 Z",
    donutTitle: "Staff Presence Today",
    donutCenter: "91.6%",
    donutCenterSub: "Attended",
    donutSegments: [
      { label: "On Time", pct: 70, color: "bg-emerald-500", stroke: "#10b981", dash: "175.8 251.2", offset: "0" },
      { label: "Half Day/Late", pct: 15, color: "bg-[#e77817]", stroke: "#e77817", dash: "37.7 251.2", offset: "-175.8" },
      { label: "Approved Leave", pct: 10, color: "bg-cyan-500", stroke: "#06b6d4", dash: "25.1 251.2", offset: "-213.5" },
      { label: "Pending Leave", pct: 5, color: "bg-rose-500", stroke: "#f43f5e", dash: "12.6 251.2", offset: "-238.6" },
    ],
    aiInsight: {
      title: "Monthly Payroll Synced",
      desc: "Attendance deductions and overtime auto-computed with zero manual errors.",
      action: "Approve Salary Slips →",
    },
  },
  promotion: {
    title: "Promotion & Campaigns",
    subtitle: "Instant festival posters and bulk WhatsApp broadcasts.",
    metrics: [
      { label: "WhatsApp Sent", value: "4,850", change: "99.2%", isPositive: true },
      { label: "Message Open Rate", value: "78.4%", change: "+14%", isPositive: true },
      { label: "Click Rate", value: "32.1%", change: "+8%", isPositive: true },
      { label: "Campaign ROI", value: "4.8x", change: "+25%", isPositive: true },
    ],
    chartTitle: "Campaign Reach & Clicks",
    chartBadge: "Broadcast",
    chartPoints: [
      { m: "Jan", v: 24, label: "1.2k", x: 10, y: 66 },
      { m: "Feb", v: 42, label: "2.0k", x: 65, y: 56 },
      { m: "Mar", v: 58, label: "2.9k", x: 120, y: 44 },
      { m: "Apr", v: 74, label: "3.7k", x: 175, y: 30 },
      { m: "May", v: 86, label: "4.3k", x: 225, y: 18 },
      { m: "Jun", v: 98, label: "4.85k", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 66 Q 40 60, 65 56 T 120 44 T 175 30 T 225 18 T 270 8",
    chartAreaPath: "M 10 66 Q 40 60, 65 56 T 120 44 T 175 30 T 225 18 T 270 8 L 270 75 L 10 75 Z",
    donutTitle: "Broadcast Channels",
    donutCenter: "4,850",
    donutCenterSub: "Dispatched",
    donutSegments: [
      { label: "WhatsApp Chat", pct: 62, color: "bg-emerald-500", stroke: "#10b981", dash: "155.7 251.2", offset: "0" },
      { label: "Festival Posters", pct: 20, color: "bg-[#e77817]", stroke: "#e77817", dash: "50.2 251.2", offset: "-155.7" },
      { label: "SMS Alerts", pct: 12, color: "bg-[#28166f]", stroke: "#28166f", dash: "30.1 251.2", offset: "-205.9" },
      { label: "Email Updates", pct: 6, color: "bg-purple-500", stroke: "#8b5cf6", dash: "15.1 251.2", offset: "-236.0" },
    ],
    aiInsight: {
      title: "Festive Campaign Ready",
      desc: "Diwali & festival poster templates pre-personalized with customer names.",
      action: "Launch WhatsApp Broadcast →",
    },
  },
  feedback: {
    title: "Customer Feedback & NPS",
    subtitle: "Real-time client satisfaction ratings, reviews & survey alerts.",
    metrics: [
      { label: "Average Rating", value: "4.8 / 5.0", change: "96% Happy", isPositive: true },
      { label: "Net Promoter (NPS)", value: "+76", change: "World-Class", isPositive: true },
      { label: "Total Reviews", value: "428", change: "+34%", isPositive: true },
      { label: "Response Rate", value: "92.4%", change: "< 2 Hrs", isPositive: true },
    ],
    chartTitle: "Customer Satisfaction Trend",
    chartBadge: "Rating 4.8★",
    chartPoints: [
      { m: "Jan", v: 40, label: "4.2★", x: 10, y: 54 },
      { m: "Feb", v: 52, label: "4.4★", x: 65, y: 46 },
      { m: "Mar", v: 64, label: "4.5★", x: 120, y: 38 },
      { m: "Apr", v: 76, label: "4.7★", x: 175, y: 28 },
      { m: "May", v: 88, label: "4.75★", x: 225, y: 18 },
      { m: "Jun", v: 98, label: "4.85★", x: 270, y: 10 },
    ],
    chartLinePath: "M 10 54 Q 40 50, 65 46 T 120 38 T 175 28 T 225 18 T 270 10",
    chartAreaPath: "M 10 54 Q 40 50, 65 46 T 120 38 T 175 28 T 225 18 T 270 10 L 270 75 L 10 75 Z",
    donutTitle: "Review Sentiment",
    donutCenter: "4.8★",
    donutCenterSub: "Average CSAT",
    donutSegments: [
      { label: "5-Star Ratings", pct: 68, color: "bg-[#e77817]", stroke: "#e77817", dash: "170.8 251.2", offset: "0" },
      { label: "4-Star Ratings", pct: 22, color: "bg-emerald-500", stroke: "#10b981", dash: "55.3 251.2", offset: "-170.8" },
      { label: "3-Star Ratings", pct: 7, color: "bg-amber-500", stroke: "#f59e0b", dash: "17.6 251.2", offset: "-226.1" },
      { label: "Issues Resolved", pct: 3, color: "bg-[#28166f]", stroke: "#28166f", dash: "7.5 251.2", offset: "-243.7" },
    ],
    aiInsight: {
      title: "5-Star Rating Surge",
      desc: "Clients praised fast billing and WhatsApp bill receipts on mobile.",
      action: "Publish Reviews to Website →",
    },
  },
  ai_analysis: {
    title: "AI Business Intelligence & Insights",
    subtitle: "Automated revenue forecasting, cash flow anomalies & smart suggestions.",
    metrics: [
      { label: "Revenue Target Q3", value: "₹15.8L", change: "+16% Projected", isPositive: true },
      { label: "Stock Outage Risk", value: "0 Items", change: "Healthy", isPositive: true },
      { label: "Profit Margin Boost", value: "31.2%", change: "+3.8% AI Lift", isPositive: true },
      { label: "Smart Insights", value: "14 Live", change: "Actionable", isPositive: true },
    ],
    chartTitle: "AI Predictive Revenue Forecast",
    chartBadge: "Neural AI",
    chartPoints: [
      { m: "Jan", v: 34, label: "₹5.1L", x: 10, y: 62 },
      { m: "Feb", v: 48, label: "₹7.2L", x: 65, y: 50 },
      { m: "Mar", v: 62, label: "₹9.0L", x: 120, y: 42 },
      { m: "Apr", v: 78, label: "₹11.5L", x: 175, y: 28 },
      { m: "May", v: 90, label: "₹13.2L", x: 225, y: 16 },
      { m: "Jun", v: 100, label: "₹15.8L (AI)", x: 270, y: 6 },
    ],
    chartLinePath: "M 10 62 Q 40 55, 65 50 T 120 42 T 175 28 T 225 16 T 270 6",
    chartAreaPath: "M 10 62 Q 40 55, 65 50 T 120 42 T 175 28 T 225 16 T 270 6 L 270 75 L 10 75 Z",
    donutTitle: "AI Business Health",
    donutCenter: "96.4%",
    donutCenterSub: "Optimal",
    donutSegments: [
      { label: "Cash Flow Health", pct: 40, color: "bg-emerald-500", stroke: "#10b981", dash: "100.5 251.2", offset: "0" },
      { label: "Stock Velocity", pct: 30, color: "bg-[#e77817]", stroke: "#e77817", dash: "75.4 251.2", offset: "-100.5" },
      { label: "Margin Strength", pct: 20, color: "bg-[#28166f]", stroke: "#28166f", dash: "50.2 251.2", offset: "-175.9" },
      { label: "Client Retention", pct: 10, color: "bg-purple-500", stroke: "#8b5cf6", dash: "25.1 251.2", offset: "-226.1" },
    ],
    aiInsight: {
      title: "High-Margin Items Identified",
      desc: "Promoting your top 3 high-margin items can increase gross profit by 8.4%.",
      action: "Apply AI Pricing Strategy →",
    },
  },
  integrations: {
    title: "Connected Ecosystem & APIs",
    subtitle: "Seamless sync with Tally, GSTN Portal, WhatsApp API, and Payment Gateways.",
    metrics: [
      { label: "Active Connectors", value: "12 Live", change: "100% Synced", isPositive: true },
      { label: "API Requests / Day", value: "42,850", change: "+28%", isPositive: true },
      { label: "Tally Prime Sync", value: "Instant", change: "Auto-Queue", isPositive: true },
      { label: "Sync Latency", value: "< 95ms", change: "Ultra-Fast", isPositive: true },
    ],
    chartTitle: "API Throughput & Requests",
    chartBadge: "Live 99.99%",
    chartPoints: [
      { m: "Jan", v: 22, label: "8.4k", x: 10, y: 64 },
      { m: "Feb", v: 44, label: "16.2k", x: 65, y: 52 },
      { m: "Mar", v: 66, label: "25.0k", x: 120, y: 38 },
      { m: "Apr", v: 78, label: "32.5k", x: 175, y: 28 },
      { m: "May", v: 90, label: "39.1k", x: 225, y: 16 },
      { m: "Jun", v: 98, label: "42.8k", x: 270, y: 8 },
    ],
    chartLinePath: "M 10 64 Q 40 57, 65 52 T 120 38 T 175 28 T 225 16 T 270 8",
    chartAreaPath: "M 10 64 Q 40 57, 65 52 T 120 38 T 175 28 T 225 16 T 270 8 L 270 75 L 10 75 Z",
    donutTitle: "Ecosystem Traffic",
    donutCenter: "100%",
    donutCenterSub: "Sync Uptime",
    donutSegments: [
      { label: "WhatsApp Gateway", pct: 45, color: "bg-emerald-500", stroke: "#10b981", dash: "113.0 251.2", offset: "0" },
      { label: "GSTN e-Way/IRN", pct: 25, color: "bg-[#e77817]", stroke: "#e77817", dash: "62.8 251.2", offset: "-113.0" },
      { label: "Tally ERP Prime", pct: 18, color: "bg-[#28166f]", stroke: "#28166f", dash: "45.2 251.2", offset: "-175.8" },
      { label: "Bank Payment APIs", pct: 12, color: "bg-sky-500", stroke: "#0284c7", dash: "30.2 251.2", offset: "-221.0" },
    ],
    aiInsight: {
      title: "All 12 Integrations Healthy",
      desc: "Tally Prime & GSTN e-Invoice sync running with 0 errors and zero dropped requests.",
      action: "View Live API Logs →",
    },
  },
};

export function HeroDashboardMockup() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("invoicing");
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(5);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [showAiDetail, setShowAiDetail] = useState(false);
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);

  const currentData = MODULE_DATA[activeModule] || MODULE_DATA.invoicing;

  const handleModuleSelect = (key: ModuleKey) => {
    setActiveModule(key);
    setHoveredMonth(5);
    setActiveExpenseIndex(null);
  };

  return (
    <div className="relative w-full max-w-[680px] mx-auto select-none">
      {/* Decorative background glow matching logo colors */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-[#28166f]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-[#e77817]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main SaaS Window Frame */}
      <div className="relative rounded-2xl shadow-[0_20px_60px_-15px_rgba(40,22,111,0.18)] border border-slate-200/90 bg-white overflow-hidden transition-all duration-500 hover:shadow-[0_25px_70px_-12px_rgba(231,120,23,0.22)]">
        
        {/* Flex layout: Left Sidebar + Right Main App View */}
        <div className="flex h-[450px] sm:h-[480px] text-xs">
          
          {/* 1. LEFT SIDEBAR (Dark Navy matching logo) */}
          <div className="w-36 sm:w-44 bg-[#0d1226] text-slate-400 flex flex-col justify-between py-3 px-2 sm:px-3 shrink-0 border-r border-slate-800">
            <div>
              {/* Brand Logo inside mockup */}
              <div className="flex items-center gap-2 px-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#28166f] to-[#e77817] flex items-center justify-center text-white font-black text-xs shadow-sm">
                  A
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-white text-sm tracking-tight">Assay</span>
                  <span className="font-bold text-[#e77817] text-sm tracking-tight">biz</span>
                </div>
              </div>

              {/* Sidebar Menu items */}
              <nav className="space-y-1 font-medium">
                {[
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "invoicing", label: "Invoicing", icon: FileText },
                  { id: "accounting", label: "Accounting", icon: Landmark },
                  { id: "crm", label: "CRM", icon: Users },
                  { id: "hrms", label: "HRMS", icon: UserCheck },
                  { id: "promotion", label: "Promotion", icon: Megaphone },
                ].map((item) => {
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
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="text-[11px] sm:text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}

                {/* Secondary modules (Feedback, AI Analysis, Integrations) */}
                <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
                  {[
                    { id: "feedback", label: "Feedback", icon: MessageSquare },
                    { id: "ai_analysis", label: "AI Analysis", icon: Sparkles },
                    { id: "integrations", label: "Integrations", icon: Layers },
                  ].map((item) => {
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
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className="text-[11px] sm:text-xs truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Bottom settings */}
            <div className="px-2 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50 py-1.5 rounded-lg transition-colors cursor-pointer">
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[11px]">Settings</span>
            </div>
          </div>

          {/* 2. RIGHT MAIN CONTENT AREA (Light Clean View) */}
          <div className="flex-1 bg-[#f8fafc] flex flex-col overflow-hidden">
            
            {/* Header Bar */}
            <div className="h-11 px-4 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search anything..."
                  className="w-full h-7 pl-8 pr-3 text-[11px] bg-slate-50 border border-slate-200 rounded-md text-slate-600 focus:outline-none placeholder:text-slate-400 cursor-pointer hover:border-orange-300 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  title="1 unread notification"
                  className="relative p-1.5 text-slate-500 hover:text-[#e77817] hover:bg-slate-100 rounded-md transition-colors group"
                >
                  <Bell className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#e77817] rounded-full ring-2 ring-white" />
                </button>
                <button
                  type="button"
                  title="Help & Support"
                  className="p-1.5 text-slate-500 hover:text-[#e77817] hover:bg-slate-100 rounded-md transition-colors hidden sm:inline-flex"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#28166f] to-[#e77817] text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-[#e77817]/30 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                  A
                </div>
              </div>
            </div>

            {/* Scrollable / Interactive Dashboard View */}
            <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto flex-1">
              
              {/* Greetings Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight transition-all">
                    {currentData.title}
                  </h3>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                  {currentData.subtitle}
                </p>
              </div>

              {/* 4 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {currentData.metrics.map((m, idx) => {
                  const isHovered = hoveredKpi === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredKpi(idx)}
                      onMouseLeave={() => setHoveredKpi(null)}
                      className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? "bg-white border-[#e77817] shadow-md -translate-y-0.5 scale-[1.02]"
                          : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 font-medium truncate">{m.label}</div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 tracking-tight">
                        {m.value}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
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
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                
                {/* Left: Dynamic Line Chart */}
                <div className="sm:col-span-7 p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-[11px] truncate">{currentData.chartTitle}</span>
                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-slate-100">
                      {currentData.chartBadge} <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {/* SVG Chart with Interactive Points */}
                  <div className="relative h-24 sm:h-28 w-full pt-2">
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
                    <div className="flex justify-between text-[9px] text-slate-400 font-medium px-1 mt-1">
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
                      <div className="absolute top-0 right-2 bg-[#28166f] border border-[#e77817]/40 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        {currentData.chartPoints[hoveredMonth].m}: {currentData.chartPoints[hoveredMonth].label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Dynamic Donut Chart */}
                <div className="sm:col-span-5 p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col justify-between">
                  <div className="font-bold text-slate-800 text-[11px] mb-1 truncate">{currentData.donutTitle}</div>

                  <div className="flex items-center justify-center gap-3 my-auto">
                    {/* SVG Donut */}
                    <div className="relative w-16 h-16 shrink-0">
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
                        <span className="font-black text-[10px] text-slate-900 leading-none">
                          {activeExpenseIndex !== null
                            ? `${currentData.donutSegments[activeExpenseIndex]?.pct}%`
                            : currentData.donutCenter}
                        </span>
                        <span className="text-[7.5px] text-slate-400 font-medium leading-tight mt-0.5">
                          {activeExpenseIndex !== null
                            ? currentData.donutSegments[activeExpenseIndex]?.label
                            : currentData.donutCenterSub}
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-1 text-[9px] flex-1 min-w-0">
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
                            <span className={`w-2 h-2 rounded-full shrink-0 ${exp.color}`} />
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
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-white/95 backdrop-blur-md border border-[#28166f]/15 shadow-xl rounded-xl p-2.5 sm:p-3 max-w-[210px] sm:max-w-[240px] transition-all duration-300 hover:scale-105 hover:border-[#e77817] cursor-pointer z-30"
        >
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#28166f] to-[#e77817] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                AI Business Insight
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[9.5px] text-slate-600 font-medium leading-tight mt-0.5">
                {currentData.aiInsight.title}
              </p>
            </div>
          </div>

          {/* Interactive expansion on hover */}
          {showAiDetail && (
            <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-600 space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-start gap-1 text-slate-600 leading-tight">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                <span>{currentData.aiInsight.desc}</span>
              </div>
              <div className="bg-orange-50 text-[#e77817] hover:bg-[#e77817] hover:text-white border border-orange-200/60 font-bold px-2 py-1 rounded text-center transition-colors">
                {currentData.aiInsight.action}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Decorative Interactive Hint Badge */}
      <div className="mt-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs shadow-2xs">
          <Zap className="w-3 h-3 text-[#e77817] fill-[#e77817]" /> Hover on any sidebar module (Invoicing, CRM, Feedback, AI Analysis...) to see live software charts
        </span>
      </div>
    </div>
  );
}
