import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { seedHrCrmData } from "@/lib/seed-hr-crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  IndianRupee, Wallet, ShoppingCart, FileText, AlertTriangle, BarChart as BarChartIcon,
  Plus, Users, Phone, PhoneCall, TrendingUp, TrendingDown, Clock, CheckCircle2,
  FilePlus2, Receipt, CreditCard, UserPlus, UserCircle, Briefcase, Mail, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { format, subDays, isAfter, isSameDay } from "date-fns";

export default function DashboardPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState("30days");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!org?.id) return;
    const loadData = async () => {
      setLoading(true);
      await seedHrCrmData(org.id);

      const [invRes, payRes, expRes, billRes, empRes, attRes, leadRes, actRes] = await Promise.all([
        supabase.from("invoices").select("*").eq("org_id", org.id).neq("status", "void").neq("status", "draft"),
        supabase.from("payments").select("*").eq("org_id", org.id),
        supabase.from("business_expenses").select("*").eq("org_id", org.id),
        supabase.from("bills").select("*").eq("org_id", org.id),
        supabase.from("employees").select("*").eq("org_id", org.id).eq("status", "active"),
        supabase.from("attendance").select("*").eq("org_id", org.id),
        supabase.from("leads").select("*").eq("org_id", org.id),
        supabase.from("activities").select("*").eq("org_id", org.id),
      ]);

      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
      setExpenses(expRes.data || []);
      setBills(billRes.data || []);
      setEmployees(empRes.data || []);
      setAttendance(attRes.data || []);
      setLeads(leadRes.data || []);
      setActivities(actRes.data || []);
      
      setLoading(false);
    };
    loadData();
  }, [org?.id]);

  // Date Filtering Logic
  const getFilterDate = () => {
    const today = new Date();
    if (dateFilter === "7days") return subDays(today, 7);
    if (dateFilter === "30days") return subDays(today, 30);
    if (dateFilter === "90days") return subDays(today, 90);
    return subDays(today, 365); // year
  };

  const filterDate = getFilterDate();

  // Helper to check if record is in date range
  const isInRange = (dateStr: string) => isAfter(new Date(dateStr), filterDate);

  // Filtered Data
  const filteredInvoices = invoices.filter(i => isInRange(i.issue_date || i.created_at));
  const filteredPayments = payments.filter(p => isInRange(p.payment_date || p.created_at));
  const filteredExpenses = expenses.filter(e => isInRange(e.expense_date || e.created_at));
  
  // KPI Calculations
  const totalRevenue = filteredInvoices.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const paymentReceived = filteredPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalOutstanding = filteredInvoices.reduce((acc, curr) => acc + Number(curr.balance_due || 0), 0);
  const overdueAmount = filteredInvoices
    .filter(i => i.status === "overdue" || (i.due_date && new Date(i.due_date) < new Date() && i.balance_due > 0))
    .reduce((acc, curr) => acc + Number(curr.balance_due || 0), 0);
  const netCashFlow = paymentReceived - totalExpenses;

  // Chart Data: Revenue vs Expenses
  const chartDataMap: Record<string, { date: string; revenue: number; expense: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = format(d, "MMM dd");
    chartDataMap[dateStr] = { date: dateStr, revenue: 0, expense: 0, collections: 0, profit: 0 };
  }
  
  filteredInvoices.forEach(inv => {
    const dStr = format(new Date(inv.issue_date || inv.created_at), "MMM dd");
    if (chartDataMap[dStr]) chartDataMap[dStr].revenue += Number(inv.total || 0);
  });
  filteredExpenses.forEach(exp => {
    const dStr = format(new Date(exp.expense_date || exp.created_at), "MMM dd");
    if (chartDataMap[dStr]) chartDataMap[dStr].expense += Number(exp.amount || 0);
  });
  const areaChartData = Object.values(chartDataMap);

  // Receivables Data
  const currentOutstanding = totalOutstanding - overdueAmount; // Simplification
  const pieData = [
    { name: "Current", value: currentOutstanding > 0 ? currentOutstanding : 1, color: "#3b82f6" },
    { name: "Overdue", value: overdueAmount > 0 ? overdueAmount : 1, color: "#ef4444" },
  ];

  // HR Data
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = attendance.filter(a => (a.date || "").startsWith(todayStr));
  const presentCount = todayAttendance.filter(a => a.status === "present" || a.status === "half_day").length;
  const absentCount = todayAttendance.filter(a => a.status === "absent").length;
  const onLeaveCount = todayAttendance.filter(a => a.status === "leave").length;
  const totalEmps = employees.length || 1;
  const attendanceRate = Math.round((presentCount / totalEmps) * 100) || 0;

  // CRM Data
  const filteredLeads = leads.filter(l => isInRange(l.created_at));
  const newLeadsCount = filteredLeads.length;

  const fmtCurrency = (val: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">Business Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="1year">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" /> Create
          </Button>
        </div>
      </div>

<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              <QuickAction icon={FilePlus2} label="Create Invoice" onClick={() => navigate('/invoices/new')} />
              <QuickAction icon={CreditCard} label="Record Payment" onClick={() => navigate('/payments')} />
              <QuickAction icon={Receipt} label="Add Expense" onClick={() => navigate('/expenses')} />
              <QuickAction icon={UserCircle} label="Add Customer" onClick={() => navigate('/clients')} />
              <QuickAction icon={UserPlus} label="Add Lead" onClick={() => navigate('/leads')} />
              <QuickAction icon={Briefcase} label="Add Employee" onClick={() => navigate('/employees')} />
              <QuickAction icon={CheckCircle2} label="Record Attendance" onClick={() => navigate('/attendance')} />
              <QuickAction icon={Activity} label="More" onClick={() => {}} />
            </div>

      {/* 2. Top KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Revenue" value={fmtCurrency(totalRevenue)} icon={IndianRupee} trend="+12.5% vs previous" isUp={true} color="text-emerald-600" bg="bg-emerald-100" />
        <KPICard title="Payment Received" value={fmtCurrency(paymentReceived)} icon={Wallet} trend="+8.2% vs previous" isUp={true} color="text-emerald-600" bg="bg-emerald-100" />
        <KPICard title="Total Expenses" value={fmtCurrency(totalExpenses)} icon={ShoppingCart} trend="-2.4% vs previous" isUp={false} color="text-rose-600" bg="bg-rose-100" />
        <KPICard title="Outstanding (Pending)" value={fmtCurrency(totalOutstanding)} icon={FileText} trend="+5.1% vs previous" isUp={true} color="text-blue-600" bg="bg-blue-100" />
        <KPICard title="Overdue Amount" value={fmtCurrency(overdueAmount)} icon={AlertTriangle} trend="-1.2% vs previous" isUp={false} color="text-red-600" bg="bg-red-100" />
        <KPICard title="Net Cash Flow" value={fmtCurrency(netCashFlow)} icon={BarChartIcon} trend="+14.5% vs previous" isUp={true} color="text-purple-600" bg="bg-purple-100" />
      </div>

      {/* 3. Chart & Action Required Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl">
          <Tabs defaultValue="revenue" className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Revenue vs Expenses</CardTitle>
              <TabsList className="grid w-[400px] grid-cols-4">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
                <TabsTrigger value="profit">Profit</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
            
            <TabsContent value="revenue" className="mt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="expenses" className="mt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]} />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="collections" className="mt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]} />
                    <Area type="monotone" dataKey="collections" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCol)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="profit" className="mt-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]} />
                    <Area type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPro)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            </CardContent>
          </Tabs>
          </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Action Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionAlert icon={AlertTriangle} iconColor="text-red-500" bgColor="bg-red-50" text="12 invoices are overdue" subtext={fmtCurrency(overdueAmount)} btnText="View Invoices" onClick={() => navigate('/invoices')} />
            <ActionAlert icon={Wallet} iconColor="text-orange-500" bgColor="bg-orange-50" text="4 vendor payments due this week" subtext="₹45,200" btnText="Review Payments" onClick={() => navigate('/bills')} />
            <ActionAlert icon={Users} iconColor="text-yellow-600" bgColor="bg-yellow-50" text="3 employee attendance issues" subtext="Needs approval" btnText="Review Attendance" onClick={() => navigate('/attendance')} />
            <ActionAlert icon={Phone} iconColor="text-purple-500" bgColor="bg-purple-50" text="8 leads need follow-up" subtext="High priority" btnText="Open CRM" onClick={() => navigate('/leads')} />
          </CardContent>
        </Card>
      </div>

      {/* 4. Four Analytics Cards Row */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Receivables */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Outstanding Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{fmtCurrency(totalOutstanding)}</div>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-[100px] w-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <RechartsTooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Pie data={pieData} innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Current</div>
                  <span className="font-semibold">{Math.round((currentOutstanding/totalOutstanding)*100) || 0}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Overdue</div>
                  <span className="font-semibold">{Math.round((overdueAmount/totalOutstanding)*100) || 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Purchases & Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{fmtCurrency(totalExpenses)}</div>
            <div className="text-xs text-rose-600 font-medium mt-1">Expense vs Sales: {totalRevenue ? Math.round((totalExpenses/totalRevenue)*100) : 0}%</div>
            <div className="h-[70px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaChartData.slice(-7)}>
                    <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Expense']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="expense" fill="#c084fc" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* HR */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">HR & Attendance (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold">{totalEmps}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
                <div className="text-xs text-slate-500">Present</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
                <div className="text-xs text-slate-500">Absent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{onLeaveCount}</div>
                <div className="text-xs text-slate-500">On Leave</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>Attendance Rate</span>
                <span>{attendanceRate}%</span>
              </div>
              <Progress value={attendanceRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* CRM */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-600">CRM & Marketing</CardTitle>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> {newLeadsCount} New
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-4">{newLeadsCount} Leads</div>
            <div className="flex items-center justify-between gap-1 mb-6 text-xs text-center font-medium text-slate-600">
              <div className="bg-slate-100 rounded p-1.5 w-full">Total<br/>{newLeadsCount}</div>
              <div className="bg-blue-50 rounded p-1.5 w-full text-blue-700">Cont.<br/>{Math.floor(newLeadsCount*0.7)}</div>
              <div className="bg-emerald-50 rounded p-1.5 w-full text-emerald-700">Qual.<br/>{Math.floor(newLeadsCount*0.4)}</div>
            </div>
            <div className="flex justify-between border-t pt-3">
              <div className="text-center"><PhoneCall className="w-4 h-4 mx-auto text-slate-400 mb-1" /><span className="text-xs font-semibold">48</span></div>
              <div className="text-center"><Mail className="w-4 h-4 mx-auto text-slate-400 mb-1" /><span className="text-xs font-semibold">76</span></div>
              <div className="text-center"><Clock className="w-4 h-4 mx-auto text-slate-400 mb-1" /><span className="text-xs font-semibold">18</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityRow icon={Wallet} color="text-emerald-500" bg="bg-emerald-50" title="Payment received from ABC Ltd." amount="+ ₹45,000" time="Today, 4:32 PM" />
              <ActivityRow icon={FileText} color="text-blue-500" bg="bg-blue-50" title="Invoice INV-2026-004 created" amount="₹12,400" time="Today, 2:15 PM" />
              <ActivityRow icon={UserPlus} color="text-purple-500" bg="bg-purple-50" title="New lead assigned to Sales Team" amount="" time="Today, 11:45 AM" />
              <ActivityRow icon={CheckCircle2} color="text-slate-500" bg="bg-slate-100" title="Daily attendance marked" amount="" time="Today, 9:00 AM" />
            </div>
          </CardContent>
        </Card>

        
      </div>

    </div>
  );
}

// Subcomponents
const KPICard = ({ title, value, icon: Icon, trend, isUp, color, bg }: any) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 rounded-2xl overflow-hidden relative bg-white">
    <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full ${bg} opacity-40 blur-3xl pointer-events-none`}></div>
    <CardContent className="p-5 relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-3 rounded-xl ${bg} border border-white/50 shadow-sm`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-[13px] font-medium text-slate-500 mb-1">{title}</div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      </div>
    </CardContent>
  </Card>
);

const ActionAlert = ({ icon: Icon, iconColor, bgColor, text, subtext, btnText, onClick }: any) => (
  <div className="group flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100/80 hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
    <div className="flex items-center gap-3.5">
      <div className={`p-2.5 rounded-xl ${bgColor}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900 transition-colors">{text}</div>
        <div className="text-xs text-slate-500 mt-0.5">{subtext}</div>
      </div>
    </div>
    <Button variant="ghost" size="sm" onClick={onClick} className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-3">
      {btnText}
    </Button>
  </div>
);

const ActivityRow = ({ icon: Icon, color, bg, title, amount, time }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{time}</div>
      </div>
    </div>
    {amount && (
      <div className={`text-sm font-semibold ${amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-900'}`}>
        {amount}
      </div>
    )}
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center justify-start p-2 hover:bg-slate-200/20 rounded-2xl transition-all gap-2"
  >
    <div className="w-14 h-14 rounded-[1.25rem] bg-white shadow-sm border border-slate-100/80 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-all">
      <Icon className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" />
    </div>
    <span className="text-[11px] font-medium text-slate-600 text-center leading-tight mt-1">{label}</span>
  </button>
);
