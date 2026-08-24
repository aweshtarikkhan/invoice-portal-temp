import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, FileText, IndianRupee, PieChart as PieChartIcon } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#94a3b8"];

export default function SalesReportsPage() {
  const org = useAppStore((s) => s.organization);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [period, setPeriod] = useState("12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org?.id) return;
    const fetch = async () => {
      setLoading(true);
      const [inv, pay, est, cl] = await Promise.all([
        supabase.from("invoices").select("*").eq("org_id", org.id),
        supabase.from("payments").select("*").eq("org_id", org.id),
        supabase.from("estimates").select("*").eq("org_id", org.id),
        supabase.from("clients").select("*").eq("org_id", org.id),
      ]);
      setInvoices(inv.data || []);
      setPayments(pay.data || []);
      setEstimates(est.data || []);
      setClients(cl.data || []);
      setLoading(false);
    };
    fetch();
  }, [org?.id]);

  const currency = org?.currency_code || "INR";
  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);

  const months = useMemo(() => {
    const count = parseInt(period);
    return Array.from({ length: count }, (_, i) => {
      const d = subMonths(new Date(), count - 1 - i);
      return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMM yy") };
    });
  }, [period]);

  const totalSales = useMemo(() => invoices.reduce((acc, inv) => acc + Number(inv.total), 0), [invoices]);
  const totalReceived = useMemo(() => payments.reduce((acc, pay) => acc + Number(pay.amount), 0), [payments]);
  const outstanding = totalSales - totalReceived;
  
  const estimateConversion = useMemo(() => {
    if (!estimates.length) return 0;
    const won = estimates.filter(e => e.status === "accepted" || e.status === "approved" || e.status === "won").length;
    return (won / estimates.length) * 100;
  }, [estimates]);

  const revenueData = useMemo(() => {
    return months.map((m) => {
      const monthPayments = payments.filter((p) =>
        isWithinInterval(new Date(p.payment_date), { start: m.start, end: m.end })
      );
      const revenue = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
      const monthInvoices = invoices.filter((inv) =>
        isWithinInterval(new Date(inv.issue_date), { start: m.start, end: m.end })
      );
      const invoiced = monthInvoices.reduce((s, inv) => s + Number(inv.total), 0);
      return { name: m.label, revenue, invoiced };
    });
  }, [months, payments, invoices]);

  const statusData = useMemo(() => {
    let paid = 0, unpaid = 0, overdue = 0;
    const now = new Date();
    invoices.forEach(inv => {
      if (inv.status === "paid") paid++;
      else if (new Date(inv.due_date) < now) overdue++;
      else if (inv.status !== "draft" && inv.status !== "void") unpaid++;
    });
    return [
      { name: "Paid", value: paid },
      { name: "Unpaid", value: unpaid },
      { name: "Overdue", value: overdue },
    ].filter(s => s.value > 0);
  }, [invoices]);

  const topClients = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    invoices.forEach((inv) => {
      const cl = clients.find((c) => c.id === inv.client_id);
      const name = cl?.display_name || "Unknown";
      if (!map[inv.client_id]) map[inv.client_id] = { name, total: 0 };
      map[inv.client_id].total += Number(inv.total);
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [invoices, clients]);

  if (loading) return <div className="p-6">Loading sales reports...</div>;

  return (
    <div className="space-y-6">
      <SEO title="Sales Reports" description="Analyze your sales, revenue, and client metrics." path="/sales-reports" />
      <PageHeader title="Sales Reports" description="Key performance indicators and sales analytics" />

      <div className="flex items-center gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-xl font-bold">{fmt(totalSales)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div><p className="text-sm text-muted-foreground">Total Received</p><p className="text-xl font-bold">{fmt(totalReceived)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div><p className="text-sm text-muted-foreground">Outstanding</p><p className="text-xl font-bold">{fmt(outstanding)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <PieChartIcon className="h-5 w-5 text-info" />
              </div>
              <div><p className="text-sm text-muted-foreground">Est. Conversion</p><p className="text-xl font-bold">{estimateConversion.toFixed(1)}%</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue vs Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="invoiced" name="Invoiced" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Received" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={130}
                    dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No invoices found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Clients by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClients.map((cl, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>{cl.name}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(cl.total)}</TableCell>
                </TableRow>
              ))}
              {topClients.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No data available</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
