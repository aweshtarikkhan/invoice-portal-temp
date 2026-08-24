import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { Loader2, DollarSign, CreditCard, Clock, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";

export default function PurchaseAccountingReportsPage() {
  const org = useAppStore((s) => s.organization);
  const [loading, setLoading] = useState(true);
  
  const [bills, setBills] = useState<any[]>([]);
  const [billPayments, setBillPayments] = useState<any[]>([]);
  const [businessExpenses, setBusinessExpenses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    if (!org?.id) return;

    (async () => {
      setLoading(true);
      const [
        { data: billsData },
        { data: paymentsData },
        { data: expensesData },
        { data: vendorsData }
      ] = await Promise.all([
        (supabase as any).from("bills").select("*").eq("org_id", org.id),
        (supabase as any).from("bill_payments").select("*").eq("org_id", org.id),
        (supabase as any).from("business_expenses").select("*").eq("org_id", org.id),
        (supabase as any).from("vendors").select("*").eq("org_id", org.id)
      ]);

      setBills(billsData || []);
      setBillPayments(paymentsData || []);
      setBusinessExpenses(expensesData || []);
      setVendors(vendorsData || []);
      setLoading(false);
    })();
  }, [org?.id]);

  const currency = (org as any)?.currency || "USD";

  // KPIs
  const totalPurchases = useMemo(() => bills.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0), [bills]);
  const totalPaid = useMemo(() => billPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0), [billPayments]);
  const outstandingPayables = totalPurchases - totalPaid;
  const totalExpenses = useMemo(() => businessExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0), [businessExpenses]);

  // Monthly Purchases vs Expenses
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; purchases: number; expenses: number }> = {};
    
    bills.forEach(b => {
      if (!b.bill_date) return;
      const m = format(parseISO(b.bill_date), "MMM yyyy");
      if (!months[m]) months[m] = { month: m, purchases: 0, expenses: 0 };
      months[m].purchases += Number(b.total_amount) || 0;
    });

    businessExpenses.forEach(e => {
      if (!e.date) return;
      const m = format(parseISO(e.date), "MMM yyyy");
      if (!months[m]) months[m] = { month: m, purchases: 0, expenses: 0 };
      months[m].expenses += Number(e.amount) || 0;
    });

    // Sort chronologically (assuming months are within the same year or recent, simple string sort for now, better to parse and sort)
    return Object.values(months).sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());
  }, [bills, businessExpenses]);

  // Expenses by Category
  const expensesByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    businessExpenses.forEach(e => {
      const cat = e.category || "Uncategorized";
      cats[cat] = (cats[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [businessExpenses]);

  // Top 5 Vendors
  const topVendors = useMemo(() => {
    const vendorMap: Record<string, { id: string; name: string; amount: number }> = {};
    vendors.forEach(v => {
      vendorMap[v.id] = { id: v.id, name: v.name, amount: 0 };
    });
    bills.forEach(b => {
      if (b.vendor_id && vendorMap[b.vendor_id]) {
        vendorMap[b.vendor_id].amount += Number(b.total_amount) || 0;
      }
    });
    return Object.values(vendorMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .filter(v => v.amount > 0);
  }, [bills, vendors]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Purchase & Accounting Reports</h1>
        <p className="text-muted-foreground">Overview of your purchases, payables, and business expenses.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchases, currency)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid, currency)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Payables</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(outstandingPayables, currency)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Purchases vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? value/1000 + 'k' : value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                  <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Vendors by Purchase Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVendors.length > 0 ? (
                topVendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(v.amount, currency)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                    No vendor purchase data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
