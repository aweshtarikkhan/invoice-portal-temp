import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { SEO } from "@/components/shared/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { FileText, Wallet, Users, AlertCircle, TrendingUp, TrendingDown, CalendarClock, Package, BarChart3 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = { paid: "#22c55e", unpaid: "#3b82f6", overdue: "#ef4444", draft: "#6b7280", partial: "#f59e0b" };
const AGING_COLORS = ["#22c55e", "#facc15", "#fb923c", "#f87171", "#dc2626"];
const ITEM_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];
const EXPENSE_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#16a34a", "#dc2626", "#2563eb", "#f97316"];

export default function BusinessReportPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (!org?.id) return;
    const fetchData = async () => {
      const [invRes, payRes, recentRes, clientRes, expRes] = await Promise.all([
        supabase.from("invoices").select("id, balance_due, status, due_date, total, issue_date, created_at, amount_paid, client_id").eq("org_id", org.id).neq("status", "void").neq("status", "draft"),
        supabase.from("payments").select("amount, payment_date, payment_mode, client_id").eq("org_id", org.id),
        supabase.from("invoices").select("*, clients(display_name)").eq("org_id", org.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("clients").select("id, display_name, created_at").eq("org_id", org.id),
        supabase.from("business_expenses").select("amount, expense_date, category").eq("org_id", org.id),
      ]);
      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
      setRecentInvoices(recentRes.data || []);
      setClients(clientRes.data || []);
      setExpenses(expRes.data || []);

      const { data: orgInvoices } = await supabase.from("invoices").select("id").eq("org_id", org.id).neq("status", "void").neq("status", "draft");
      const orgInvoiceIds = (orgInvoices || []).map((i: any) => i.id);
      let lines: any[] = [];
      if (orgInvoiceIds.length > 0) {
        // Chunk IDs to avoid URI Too Long error
        const chunkSize = 100;
        for (let i = 0; i < orgInvoiceIds.length; i += chunkSize) {
          const chunk = orgInvoiceIds.slice(i, i + chunkSize);
          const { data: chunkData } = await supabase
            .from("invoice_lines")
            .select("name, quantity, amount, invoice_id")
            .in("invoice_id", chunk);
          if (chunkData) lines = [...lines, ...chunkData];
        }
      }
      setInvoiceLines(lines);
    };
    fetchData();
  }, [org?.id]);

  const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const totalReceivable = useMemo(() => invoices.reduce((s, i) => s + Number(i.balance_due), 0), [invoices]);
  const totalSales = useMemo(() => invoices.reduce((s, i) => s + Number(i.total), 0), [invoices]);
  const totalReceipts = useMemo(() => payments.reduce((s, p) => s + Number(p.amount), 0), [payments]);
  const collectionRate = totalSales > 0 ? ((totalReceipts / totalSales) * 100).toFixed(1) : "0";

  const agingData = useMemo(() => {
    const today = new Date();
    const buckets = [
      { label: "Current", min: -Infinity, max: 0, amount: 0 },
      { label: "1-15 Days", min: 1, max: 15, amount: 0 },
      { label: "16-30 Days", min: 16, max: 30, amount: 0 },
      { label: "31-45 Days", min: 31, max: 45, amount: 0 },
      { label: "Above 45 Days", min: 46, max: Infinity, amount: 0 },
    ];
    invoices.forEach((inv) => {
      const bal = Number(inv.balance_due);
      if (bal <= 0) return;
      const due = new Date(inv.due_date);
      const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000);
      if (daysOverdue <= 0) buckets[0].amount += bal;
      else if (daysOverdue <= 15) buckets[1].amount += bal;
      else if (daysOverdue <= 30) buckets[2].amount += bal;
      else if (daysOverdue <= 45) buckets[3].amount += bal;
      else buckets[4].amount += bal;
    });
    return buckets;
  }, [invoices]);

  const salesReceiptsDues = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const periods = [
      { label: "Today", start: startOfDay },
      { label: "This Week", start: startOfWeek },
      { label: "This Month", start: startOfMonth },
      { label: "This Quarter", start: startOfQuarter },
      { label: "This Year", start: startOfYear },
    ];

    return periods.map(({ label, start }) => {
      const sales = invoices
        .filter((i) => new Date(i.issue_date) >= start)
        .reduce((s, i) => s + Number(i.total), 0);
      const receipts = payments
        .filter((p) => new Date(p.payment_date) >= start)
        .reduce((s, p) => s + Number(p.amount), 0);
      return { label, sales, receipts, due: sales - receipts };
    });
  }, [invoices, payments]);

  const monthlyData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    const paymentMonthMap: Record<string, number> = {};
    invoices.forEach((i) => {
      const m = (i.issue_date || "").slice(0, 7);
      if (m) monthMap[m] = (monthMap[m] || 0) + Number(i.total);
    });
    payments.forEach((p) => {
      const m = (p.payment_date || "").slice(0, 7);
      if (m) paymentMonthMap[m] = (paymentMonthMap[m] || 0) + Number(p.amount);
    });
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("default", { month: "short" });
      months.push({ month: label, invoiced: monthMap[key] || 0, collected: paymentMonthMap[key] || 0 });
    }
    return months;
  }, [invoices, payments]);

  const statusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    invoices.forEach((i) => { statusMap[i.status] = (statusMap[i.status] || 0) + 1; });
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: STATUS_COLORS[name] || "#6b7280",
    }));
  }, [invoices]);

  const topCustomersByRevenue = useMemo(() => {
    const clientMap: Record<string, { name: string; revenue: number }> = {};
    invoices.forEach((i) => {
      const clientId = i.client_id || "unknown";
      const client = clients.find((c) => c.id === clientId);
      const name = client?.display_name || "Unknown";
      if (!clientMap[clientId]) clientMap[clientId] = { name, revenue: 0 };
      clientMap[clientId].revenue += Number(i.total);
    });
    return Object.values(clientMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [invoices, clients]);

  const cashFlowData = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    invoices.forEach((i) => {
      const m = (i.issue_date || "").slice(0, 7);
      if (m) revenueMap[m] = (revenueMap[m] || 0) + Number(i.total);
    });
    expenses.forEach((e) => {
      const m = (e.expense_date || "").slice(0, 7);
      if (m) expenseMap[m] = (expenseMap[m] || 0) + Number(e.amount);
    });
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const revenue = revenueMap[key] || 0;
      const expense = expenseMap[key] || 0;
      months.push({ month: label, revenue, expenses: expense, profit: revenue - expense });
    }
    return months;
  }, [invoices, expenses]);

  const mostSellingItems = useMemo(() => {
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    invoiceLines.forEach((line) => {
      const name = line.name || "Unnamed";
      if (!itemMap[name]) itemMap[name] = { name, quantity: 0, revenue: 0 };
      itemMap[name].quantity += Number(line.quantity || 0);
      itemMap[name].revenue += Number(line.amount || 0);
    });
    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [invoiceLines]);

  const overdueClients = useMemo(() => {
    const today = new Date();
    const clientMap: Record<string, { name: string; totalDue: number; maxOverdueDays: number; invoiceCount: number }> = {};
    invoices.forEach((i) => {
      const bal = Number(i.balance_due);
      if (bal <= 0) return;
      const due = new Date(i.due_date);
      const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000);
      if (daysOverdue <= 0) return;
      const clientId = i.client_id || "unknown";
      const client = clients.find((c) => c.id === clientId);
      const name = client?.display_name || "Unknown";
      if (!clientMap[clientId]) clientMap[clientId] = { name, totalDue: 0, maxOverdueDays: 0, invoiceCount: 0 };
      clientMap[clientId].totalDue += bal;
      clientMap[clientId].invoiceCount += 1;
      if (daysOverdue > clientMap[clientId].maxOverdueDays) clientMap[clientId].maxOverdueDays = daysOverdue;
    });
    return Object.values(clientMap).sort((a, b) => b.maxOverdueDays - a.maxOverdueDays);
  }, [invoices, clients]);

  const expenseByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + Number(e.amount);
    });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expenses]);

  const monthlyInvoiceCount = useMemo(() => {
    const countMap: Record<string, number> = {};
    invoices.forEach((i) => {
      const m = (i.issue_date || "").slice(0, 7);
      if (m) countMap[m] = (countMap[m] || 0) + 1;
    });
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      months.push({ month: label, count: countMap[key] || 0 });
    }
    return months;
  }, [invoices]);

  return (
    <div className="space-y-8 p-6">
      <SEO title="Business Report" description="Business analytics and charts" path="/business-report" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Report</h1>
        <p className="text-muted-foreground">Comprehensive overview of your business analytics and charts.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">{fmt(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Receivables</p>
                <p className="text-xl font-bold">{fmt(totalReceivable)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <p className="text-xl font-bold">{fmt(totalReceipts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-xl font-bold">{collectionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receivables Aging */}
        <Card>
          <CardHeader><CardTitle>Receivables Aging</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={fmt} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" name="Amount">
                  {agingData.map((_, index) => (
                    <Cell key={index} fill={AGING_COLORS[index % AGING_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales vs Collections */}
        <Card>
          <CardHeader><CardTitle>Sales vs Collections</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={fmt} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Receipts Dues Table */}
      <Card>
        <CardHeader><CardTitle>Sales, Receipts & Dues</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Receipts</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesReceiptsDues.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right text-success">{fmt(row.sales)}</TableCell>
                  <TableCell className="text-right text-primary">{fmt(row.receipts)}</TableCell>
                  <TableCell className="text-right text-destructive font-bold">{fmt(row.due)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash Flow Revenue vs Expenses */}
        <Card>
          <CardHeader><CardTitle>Cash Flow: Revenue vs Expenses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={fmt} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers by Revenue */}
        <Card>
          <CardHeader><CardTitle>Top Customers by Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomersByRevenue} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" className="text-xs" tickFormatter={fmt} />
                <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Most Selling Items */}
        <Card>
          <CardHeader><CardTitle>Most Selling Items</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={mostSellingItems} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                  {mostSellingItems.map((_, i) => <Cell key={i} fill={ITEM_COLORS[i % ITEM_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader><CardTitle>Invoice Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Expense Breakdown by Category */}
        <Card>
          <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseByCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={fmt} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" name="Amount">
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Invoice Volume */}
        <Card>
          <CardHeader><CardTitle>Monthly Invoice Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyInvoiceCount}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Invoices" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overdue Invoices / Clients */}
        <Card>
          <CardHeader><CardTitle>Top Overdue Clients</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-center">Max Days</TableHead>
                  <TableHead className="text-right">Total Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueClients.slice(0, 5).map((client) => (
                  <TableRow key={client.name}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-center text-destructive">{client.maxOverdueDays} days</TableCell>
                    <TableCell className="text-right font-bold">{fmt(client.totalDue)}</TableCell>
                  </TableRow>
                ))}
                {overdueClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No overdue clients</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices table */}
      <Card>
        <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.clients?.display_name || "Unknown"}</TableCell>
                  <TableCell className="capitalize">{inv.status}</TableCell>
                  <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{fmt(inv.total)}</TableCell>
                </TableRow>
              ))}
              {recentInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No recent invoices</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
