import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { Loader2, DollarSign, CreditCard, Clock, Receipt, ArrowLeft, FileText, ShoppingCart, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

export default function PurchaseAccountingReportsPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const [loading, setLoading] = useState(true);
  
  const [bills, setBills] = useState<any[]>([]);
  const [billPayments, setBillPayments] = useState<any[]>([]);
  const [businessExpenses, setBusinessExpenses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!org?.id) return;

    (async () => {
      setLoading(true);
      const [
        { data: billsData },
        { data: paymentsData },
        { data: expensesData },
        { data: vendorsData },
        { data: poData }
      ] = await Promise.all([
        (supabase as any).from("bills").select("*, vendors(name)").eq("org_id", org.id).order("bill_date", { ascending: false }),
        (supabase as any).from("bill_payments").select("*").eq("org_id", org.id),
        (supabase as any).from("business_expenses").select("*").eq("org_id", org.id),
        (supabase as any).from("vendors").select("*").eq("org_id", org.id),
        (supabase as any).from("purchase_orders").select("*, vendors(name)").eq("org_id", org.id).order("po_date", { ascending: false })
      ]);

      setBills(billsData || []);
      setBillPayments(paymentsData || []);
      setBusinessExpenses(expensesData || []);
      setVendors(vendorsData || []);
      setPurchaseOrders(poData || []);
      setLoading(false);
    })();
  }, [org?.id]);

  const currency = (org as any)?.currency || (org as any)?.currency_code || "INR";

  // KPIs - correctly read `total` from bills table (with fallback to total_amount)
  const totalPurchases = useMemo(() => {
    return bills.reduce((acc, b) => acc + (Number(b.total ?? b.total_amount) || 0), 0);
  }, [bills]);

  const totalPaid = useMemo(() => {
    const fromBills = bills.reduce((acc, b) => acc + (Number(b.amount_paid) || 0), 0);
    const fromPayments = billPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    return Math.max(fromBills, fromPayments);
  }, [bills, billPayments]);

  const outstandingPayables = useMemo(() => {
    return bills.reduce((acc, b) => {
      if (b.balance_due !== undefined && b.balance_due !== null) {
        return acc + (Number(b.balance_due) || 0);
      }
      const bTotal = Number(b.total ?? b.total_amount) || 0;
      const bPaid = Number(b.amount_paid) || 0;
      return acc + Math.max(0, bTotal - bPaid);
    }, 0);
  }, [bills]);

  const totalExpenses = useMemo(() => {
    return businessExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [businessExpenses]);

  // Monthly Purchases vs Expenses
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; purchases: number; expenses: number; sortKey: number }> = {};
    
    bills.forEach(b => {
      if (!b.bill_date) return;
      const d = new Date(b.bill_date);
      if (isNaN(d.getTime())) return;
      const m = format(d, "MMM yyyy");
      const sortKey = d.getFullYear() * 100 + (d.getMonth() + 1);
      if (!months[m]) months[m] = { month: m, purchases: 0, expenses: 0, sortKey };
      months[m].purchases += Number(b.total ?? b.total_amount) || 0;
    });

    businessExpenses.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return;
      const m = format(d, "MMM yyyy");
      const sortKey = d.getFullYear() * 100 + (d.getMonth() + 1);
      if (!months[m]) months[m] = { month: m, purchases: 0, expenses: 0, sortKey };
      months[m].expenses += Number(e.amount) || 0;
    });

    return Object.values(months).sort((a, b) => a.sortKey - b.sortKey);
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
    const vendorMap: Record<string, { id: string; name: string; amount: number; count: number }> = {};
    vendors.forEach(v => {
      vendorMap[v.id] = { id: v.id, name: v.name || v.display_name || "Vendor", amount: 0, count: 0 };
    });
    bills.forEach(b => {
      const vId = b.vendor_id || "unknown";
      if (!vendorMap[vId]) {
        vendorMap[vId] = {
          id: vId,
          name: b.vendors?.name || (b as any).vendor_name || "Vendor",
          amount: 0,
          count: 0
        };
      }
      vendorMap[vId].amount += Number(b.total ?? b.total_amount) || 0;
      vendorMap[vId].count += 1;
    });
    return Object.values(vendorMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .filter(v => v.amount > 0);
  }, [bills, vendors]);

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#64748b", "#84cc16"];

  const billStatusBadge = (st: string) => {
    switch (st?.toLowerCase()) {
      case "paid":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Paid</Badge>;
      case "partial":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Partial</Badge>;
      case "received":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Received</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{st || "Received"}</Badge>;
    }
  };

  const poStatusBadge = (st: string) => {
    switch (st?.toLowerCase()) {
      case "received":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Received</Badge>;
      case "partial":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Partial</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Sent</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
      case "closed":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200">Closed</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{st || "Sent"}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase & Accounting Reports</h1>
          <p className="text-muted-foreground">Overview of your purchases, payables, and business expenses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/purchase-invoices/new")}>
            + New Purchase Invoice
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchases, currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{bills.length} Purchase Invoices recorded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid, currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Paid to vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Payables</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outstandingPayables > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {formatCurrency(outstandingPayables, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{businessExpenses.length} Expenses logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
                    formatter={(val: any) => formatCurrency(Number(val) || 0, currency)}
                  />
                  <Legend />
                  <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No purchase or expense data available</div>
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
                    formatter={(val: any) => formatCurrency(Number(val) || 0, currency)}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No expense categories available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Vendors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Vendors by Purchase Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-center">Invoices Count</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVendors.length > 0 ? (
                topVendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-center">{v.count}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(v.amount, currency)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No vendor purchase data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Purchases & Orders Document Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchase Documents Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="invoices" className="space-y-4">
            <TabsList>
              <TabsTrigger value="invoices" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Purchase Invoices ({bills.length})</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4" />
                <span>Purchase Orders ({purchaseOrders.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invoices">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.length > 0 ? (
                    bills.slice(0, 10).map((b) => {
                      const vendorName = b.vendors?.name || (b as any).vendor_name || "Vendor";
                      const totalVal = Number(b.total ?? b.total_amount) || 0;
                      const dueVal = b.balance_due !== undefined && b.balance_due !== null
                        ? Number(b.balance_due)
                        : Math.max(0, totalVal - (Number(b.amount_paid) || 0));

                      return (
                        <TableRow key={b.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-blue-600">
                            {b.vendor_bill_number || b.bill_number}
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{vendorName}</TableCell>
                          <TableCell className="text-slate-500">
                            {b.bill_date ? format(new Date(b.bill_date), "dd MMM yyyy") : "-"}
                          </TableCell>
                          <TableCell>{billStatusBadge(b.status)}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">
                            {formatCurrency(totalVal, currency)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${dueVal > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {formatCurrency(dueVal, currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-blue-600 hover:text-blue-800"
                              onClick={() => navigate(`/purchase-invoices/${b.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No purchase invoices recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="orders">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.length > 0 ? (
                    purchaseOrders.slice(0, 10).map((po) => {
                      const vendorName = po.vendors?.name || (po as any).vendor_name || "Vendor";
                      const totalVal = Number(po.total) || 0;

                      return (
                        <TableRow key={po.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-blue-600">{po.po_number}</TableCell>
                          <TableCell className="font-medium text-slate-800">{vendorName}</TableCell>
                          <TableCell className="text-slate-500">
                            {po.po_date ? format(new Date(po.po_date), "dd MMM yyyy") : "-"}
                          </TableCell>
                          <TableCell>{poStatusBadge(po.status)}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">
                            {formatCurrency(totalVal, currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-blue-600 hover:text-blue-800"
                              onClick={() => navigate(`/purchase-orders/${po.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No purchase orders recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
