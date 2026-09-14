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
  TrendingUp,
  ArrowUpRight,
  ChevronDown,
  CheckCircle2,
  Send,
  Zap,
} from "lucide-react";

type ModuleKey = "dashboard" | "invoicing" | "accounting" | "crm" | "hrms" | "promotion";

interface MetricData {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  hint?: string;
}

const MODULE_DATA: Record<ModuleKey, { title: string; subtitle: string; metrics: MetricData[] }> = {
  dashboard: {
    title: "Good Morning!",
    subtitle: "Here's what's happening with your business today.",
    metrics: [
      { label: "Total Revenue", value: "₹12,48,000", change: "+12%", isPositive: true },
      { label: "Invoices", value: "156", change: "+8%", isPositive: true },
      { label: "Customers", value: "320", change: "+15%", isPositive: true },
      { label: "Team Members", value: "24", change: "+4%", isPositive: true },
    ],
  },
  invoicing: {
    title: "Invoicing & GST Overview",
    subtitle: "Real-time GST bill generation, payments, and e-way tracking.",
    metrics: [
      { label: "Total Invoiced", value: "₹18,90,000", change: "+14%", isPositive: true },
      { label: "Paid Received", value: "₹15,40,000", change: "+18%", isPositive: true },
      { label: "Overdue Bills", value: "₹2,50,000", change: "-12%", isPositive: false },
      { label: "E-Way Bills", value: "48 / 48", change: "100%", isPositive: true },
    ],
  },
  accounting: {
    title: "Banking & Accounts",
    subtitle: "Multi-bank reconciliation, cash flow, and tax summaries.",
    metrics: [
      { label: "Bank Balance", value: "₹8,45,200", change: "+9%", isPositive: true },
      { label: "Monthly Outflow", value: "₹3,12,000", change: "-4%", isPositive: false },
      { label: "GST Input Credit", value: "₹1,42,800", change: "+11%", isPositive: true },
      { label: "Net Margin", value: "28.4%", change: "+3.2%", isPositive: true },
    ],
  },
  crm: {
    title: "CRM & Sales Pipeline",
    subtitle: "Lead conversions, client stages, and ongoing deal tracking.",
    metrics: [
      { label: "Active Leads", value: "184", change: "+22%", isPositive: true },
      { label: "Deals Closed", value: "42", change: "+18%", isPositive: true },
      { label: "Pipeline Value", value: "₹28.5 Lakh", change: "+15%", isPositive: true },
      { label: "Conversion Rate", value: "36.8%", change: "+5.4%", isPositive: true },
    ],
  },
  hrms: {
    title: "HRMS & Attendance",
    subtitle: "Live biometric punches, shift tracking, and leave approvals.",
    metrics: [
      { label: "Present Today", value: "22 / 24", change: "91.6%", isPositive: true },
      { label: "On Leave", value: "2 Members", change: "Approved", isPositive: true },
      { label: "Pending Requests", value: "3", change: "Action req.", isPositive: false },
      { label: "Payroll Status", value: "Ready", change: "Auto-synced", isPositive: true },
    ],
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
  },
};

const CHART_MONTHS = [
  { m: "Jan", v: 28, label: "₹4.8L" },
  { m: "Feb", v: 42, label: "₹6.5L" },
  { m: "Mar", v: 55, label: "₹8.2L" },
  { m: "Apr", v: 68, label: "₹9.8L" },
  { m: "May", v: 82, label: "₹11.4L" },
  { m: "Jun", v: 96, label: "₹12.48L" },
];

export function HeroDashboardMockup() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(5);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  const [showAiDetail, setShowAiDetail] = useState(false);
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);

  const currentData = MODULE_DATA[activeModule] || MODULE_DATA.dashboard;

  const expenses = [
    { label: "Operations", pct: 40, color: "bg-indigo-500", text: "text-indigo-500", stroke: "#6366f1", dash: "125.6 314" },
    { label: "Salaries", pct: 25, color: "bg-emerald-500", text: "text-emerald-500", stroke: "#10b981", dash: "78.5 314" },
    { label: "Marketing", pct: 20, color: "bg-amber-500", text: "text-amber-500", stroke: "#f59e0b", dash: "62.8 314" },
    { label: "Others", pct: 15, color: "bg-violet-400", text: "text-violet-400", stroke: "#a78bfa", dash: "47.1 314" },
  ];

  return (
    <div className="relative w-full max-w-[680px] mx-auto select-none">
      {/* Decorative background glow matching screenshot */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main SaaS Window Frame */}
      <div className="relative rounded-2xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.18)] border border-slate-200/90 bg-white overflow-hidden transition-all duration-500 hover:shadow-[0_25px_70px_-12px_rgba(79,70,229,0.25)]">
        
        {/* Flex layout: Left Sidebar + Right Main App View */}
        <div className="flex h-[430px] sm:h-[460px] text-xs">
          
          {/* 1. LEFT SIDEBAR (Dark Navy as shown in screenshot) */}
          <div className="w-36 sm:w-44 bg-[#0f172a] text-slate-400 flex flex-col justify-between py-3.5 px-2 sm:px-3 shrink-0 border-r border-slate-800">
            <div>
              {/* Brand Logo inside mockup */}
              <div className="flex items-center gap-2 px-2 mb-4">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                  A
                </div>
                <span className="font-bold text-white text-sm tracking-tight">Assaybiz</span>
              </div>

              {/* Sidebar Menu items */}
              <nav className="space-y-0.5 font-medium">
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
                      onClick={() => setActiveModule(item.id as ModuleKey)}
                      onMouseEnter={() => setActiveModule(item.id as ModuleKey)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30 translate-x-0.5"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="text-[11px] sm:text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}

                <div className="pt-2 mt-2 border-t border-slate-800/60 space-y-0.5">
                  <div className="flex items-center gap-2 px-2.5 py-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-[11px] sm:text-xs">Feedback</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[11px] sm:text-xs">AI Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-[11px] sm:text-xs">Integrations</span>
                  </div>
                </div>
              </nav>
            </div>

            {/* Bottom settings */}
            <div className="px-2 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer">
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
                  className="w-full h-7 pl-8 pr-3 text-[11px] bg-slate-50 border border-slate-200 rounded-md text-slate-600 focus:outline-none placeholder:text-slate-400 cursor-pointer hover:border-indigo-300 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  title="1 unread notification"
                  className="relative p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors group"
                >
                  <Bell className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
                </button>
                <button
                  type="button"
                  title="Help & Support"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors hidden sm:inline-flex"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-indigo-500/20 shadow-sm cursor-pointer hover:scale-105 transition-transform">
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
                          ? "bg-white border-indigo-400 shadow-md -translate-y-0.5 scale-[1.02]"
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
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {m.change}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Cards: Growth Chart (Left) + Expense Breakdown (Right) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                
                {/* Left: Business Growth Line Chart */}
                <div className="sm:col-span-7 p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-[11px]">Business Growth</span>
                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-slate-100">
                      This Year <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {/* SVG Chart with Interactive Points */}
                  <div className="relative h-24 sm:h-28 w-full pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 280 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Background horizontal grid lines */}
                      <line x1="0" y1="20" x2="280" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="280" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="280" y2="75" stroke="#e2e8f0" strokeWidth="1" />

                      {/* Area Fill */}
                      <path
                        d="M 10 65 Q 40 55, 65 50 T 120 40 T 175 32 T 225 22 T 270 8 L 270 75 L 10 75 Z"
                        fill="url(#growthGrad)"
                      />

                      {/* Primary Line curve */}
                      <path
                        d="M 10 65 Q 40 55, 65 50 T 120 40 T 175 32 T 225 22 T 270 8"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Month Circles on Line */}
                      {[
                        { x: 10, y: 65, idx: 0 },
                        { x: 65, y: 50, idx: 1 },
                        { x: 120, y: 40, idx: 2 },
                        { x: 175, y: 32, idx: 3 },
                        { x: 225, y: 22, idx: 4 },
                        { x: 270, y: 8, idx: 5 },
                      ].map((pt) => {
                        const isSelected = hoveredMonth === pt.idx;
                        return (
                          <g
                            key={pt.idx}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredMonth(pt.idx)}
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isSelected ? 5 : 3}
                              fill={isSelected ? "#4f46e5" : "#ffffff"}
                              stroke="#6366f1"
                              strokeWidth={isSelected ? 2.5 : 1.5}
                              className="transition-all duration-200"
                            />
                            {isSelected && (
                              <circle cx={pt.x} cy={pt.y} r={9} fill="#6366f1" opacity="0.2" />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Month Axis Labels */}
                    <div className="flex justify-between text-[9px] text-slate-400 font-medium px-1 mt-1">
                      {CHART_MONTHS.map((item, i) => (
                        <span
                          key={i}
                          onMouseEnter={() => setHoveredMonth(i)}
                          className={`cursor-pointer transition-colors ${
                            hoveredMonth === i ? "text-indigo-600 font-bold" : "hover:text-slate-600"
                          }`}
                        >
                          {item.m}
                        </span>
                      ))}
                    </div>

                    {/* Tooltip Pill */}
                    {hoveredMonth !== null && (
                      <div className="absolute top-0 right-2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        {CHART_MONTHS[hoveredMonth].m}: {CHART_MONTHS[hoveredMonth].label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Expense Breakdown Donut Chart */}
                <div className="sm:col-span-5 p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col justify-between">
                  <div className="font-bold text-slate-800 text-[11px] mb-1">Expense Breakdown</div>

                  <div className="flex items-center justify-center gap-3 my-auto">
                    {/* SVG Donut */}
                    <div className="relative w-16 h-16 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#6366f1" strokeWidth="14"
                          strokeDasharray="100 251.2"
                          strokeDashoffset="0"
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                          onMouseEnter={() => setActiveExpenseIndex(0)}
                          onMouseLeave={() => setActiveExpenseIndex(null)}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#10b981" strokeWidth="14"
                          strokeDasharray="62.8 251.2"
                          strokeDashoffset="-100"
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                          onMouseEnter={() => setActiveExpenseIndex(1)}
                          onMouseLeave={() => setActiveExpenseIndex(null)}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#f59e0b" strokeWidth="14"
                          strokeDasharray="50.2 251.2"
                          strokeDashoffset="-162.8"
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                          onMouseEnter={() => setActiveExpenseIndex(2)}
                          onMouseLeave={() => setActiveExpenseIndex(null)}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#a78bfa" strokeWidth="14"
                          strokeDasharray="38.2 251.2"
                          strokeDashoffset="-213"
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                          onMouseEnter={() => setActiveExpenseIndex(3)}
                          onMouseLeave={() => setActiveExpenseIndex(null)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-extrabold text-[10px] text-slate-800">
                        {activeExpenseIndex !== null ? `${expenses[activeExpenseIndex].pct}%` : "100%"}
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-1 text-[9px]">
                      {expenses.map((exp, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setActiveExpenseIndex(i)}
                          onMouseLeave={() => setActiveExpenseIndex(null)}
                          className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                            activeExpenseIndex === i ? "font-bold text-slate-900" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${exp.color}`} />
                          <span className="truncate">{exp.label}</span>
                          <span className="font-semibold text-slate-700">{exp.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* 3. FLOATING "GET AI INSIGHTS" CARD (Overlapping bottom right as in screenshot) */}
        <div
          onMouseEnter={() => setShowAiDetail(true)}
          onMouseLeave={() => setShowAiDetail(false)}
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-white/95 backdrop-blur-md border border-indigo-100 shadow-xl rounded-xl p-2.5 sm:p-3 max-w-[210px] sm:max-w-[230px] transition-all duration-300 hover:scale-105 hover:border-indigo-400 cursor-pointer z-30"
        >
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                Get AI Insights
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[9.5px] text-slate-500 leading-tight mt-0.5">
                Let AI analyze your business and give smart suggestions.
              </p>
            </div>
          </div>

          {/* Interactive expansion on hover */}
          {showAiDetail && (
            <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-600 space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> 3 invoices ready to auto-remind on WhatsApp
              </div>
              <div className="bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded text-center">
                Send WhatsApp Reminders Now →
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Decorative Interactive Hint Badge */}
      <div className="mt-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-slate-500 bg-white/80 border border-slate-200/60 backdrop-blur-xs shadow-2xs">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Hover on sidebar modules & charts to interact with live software
        </span>
      </div>
    </div>
  );
}
