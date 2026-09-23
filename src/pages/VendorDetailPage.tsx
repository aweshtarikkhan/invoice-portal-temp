import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, IndianRupee, FileText, CreditCard, Clock, AlertTriangle, CheckCircle2,
  Search, ArrowUp, ArrowDown, ShoppingCart, PackageCheck, Building2, Phone, Mail,
  Pencil, Plus, Eye, MapPin, ReceiptText
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();

  const [vendor, setVendor] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", display_name: "", email: "", phone: "", gstin: "", pan: "",
    payment_terms: "30", opening_balance: "0", notes: "",
  });

  // Bill search & sort
  const [billSearch, setBillSearch] = useState("");
  type BillSortKey = "bill_date" | "due_date" | "total" | "balance_due" | "bill_number" | "amount_paid" | "status";
  const [billSortKey, setBillSortKey] = useState<BillSortKey>("bill_date");
  const [billSortDir, setBillSortDir] = useState<"asc" | "desc">("desc");

  // Payment search & sort
  const [paymentSearch, setPaymentSearch] = useState("");
  type PaymentSortKey = "payment_date" | "amount" | "payment_method";
  const [paymentSortKey, setPaymentSortKey] = useState<PaymentSortKey>("payment_date");
  const [paymentSortDir, setPaymentSortDir] = useState<"asc" | "desc">("desc");

  const currency = (org as any)?.currency || "INR";
  const fmt = (n: number) => formatCurrency(n || 0, currency);

  const loadData = async () => {
    if (!id || !org?.id) return;
    setLoading(true);
    try {
      const [vRes, bRes, pRes, poRes, grnRes] = await Promise.all([
        (supabase as any).from("vendors").select("*").eq("id", id).single(),
        (supabase as any).from("bills").select("*").eq("vendor_id", id).eq("org_id", org.id).order("bill_date", { ascending: false }),
        (supabase as any).from("bill_payments").select("*, bills(bill_number)").eq("vendor_id", id).eq("org_id", org.id).order("payment_date", { ascending: false }),
        (supabase as any).from("purchase_orders").select("*").eq("vendor_id", id).eq("org_id", org.id).order("po_date", { ascending: false }),
        (supabase as any).from("grns").select("*").eq("vendor_id", id).eq("org_id", org.id).order("created_at", { ascending: false }),
      ]);

      setVendor(vRes.data || null);
      setBills(bRes.data || []);
      setPayments(pRes.data || []);
      setPurchaseOrders(poRes.data || []);
      setGrns(grnRes.data || []);
    } catch (err: any) {
      console.error("Failed to load vendor detail:", err);
      toast({ title: "Failed to load vendor data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, org?.id]);

  const openEdit = () => {
    if (!vendor) return;
    setEditForm({
      name: vendor.name || "",
      display_name: vendor.display_name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      gstin: vendor.gstin || "",
      pan: vendor.pan || "",
      payment_terms: String(vendor.payment_terms || 30),
      opening_balance: String(vendor.opening_balance || 0),
      notes: vendor.notes || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!vendor?.id || !editForm.name.trim()) {
      toast({ title: "Vendor name is required", variant: "destructive" });
      return;
    }
    const cleanEmail = editForm.email?.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    const cleanPhone = editForm.phone?.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      toast({ title: "Invalid Mobile No.", description: "Mobile number must be 10 digits.", variant: "destructive" });
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      display_name: editForm.display_name?.trim() || null,
      email: cleanEmail || null,
      phone: cleanPhone || null,
      gstin: editForm.gstin?.trim() || null,
      pan: editForm.pan?.trim() || null,
      payment_terms: Number(editForm.payment_terms) || 30,
      opening_balance: Number(editForm.opening_balance) || 0,
      notes: editForm.notes?.trim() || null,
    };

    const { error } = await (supabase as any).from("vendors").update(payload).eq("id", vendor.id);
    if (error) {
      toast({ title: "Failed to update vendor", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Vendor updated successfully" });
    setEditOpen(false);
    loadData();
  };

  // Metrics calculation
  const totalBilled = useMemo(() => {
    return bills.filter(b => b.status !== "cancelled" && b.status !== "draft").reduce((sum, b) => sum + Number(b.total || 0), 0);
  }, [bills]);

  const totalPaid = useMemo(() => {
    const fromPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    if (fromPayments > 0) return fromPayments;
    return bills.reduce((sum, b) => sum + Number(b.amount_paid || 0), 0);
  }, [payments, bills]);

  const totalDue = useMemo(() => {
    return bills.filter(b => b.status !== "cancelled" && b.status !== "draft").reduce((sum, b) => sum + Number(b.balance_due || 0), 0);
  }, [bills]);

  const overdueAmount = useMemo(() => {
    const today = new Date();
    return bills
      .filter(b => b.status !== "cancelled" && b.status !== "draft" && b.status !== "paid" && b.due_date && new Date(b.due_date) < today)
      .reduce((sum, b) => sum + Number(b.balance_due || 0), 0);
  }, [bills]);

  // Monthly trend
  const monthlyData = useMemo(() => {
    const map: Record<string, { billed: number; paid: number }> = {};
    bills.filter(b => b.status !== "cancelled" && b.status !== "draft").forEach((b) => {
      const m = (b.bill_date || "").slice(0, 7);
      if (m) {
        if (!map[m]) map[m] = { billed: 0, paid: 0 };
        map[m].billed += Number(b.total || 0);
      }
    });
    payments.forEach((p) => {
      const m = (p.payment_date || "").slice(0, 7);
      if (m) {
        if (!map[m]) map[m] = { billed: 0, paid: 0 };
        map[m].paid += Number(p.amount || 0);
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, vals]) => ({
        month: new Date(month + "-01").toLocaleString("default", { month: "short", year: "2-digit" }),
        ...vals,
      }));
  }, [bills, payments]);

  // Status breakdown
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    bills.forEach((b) => {
      const s = b.status || "draft";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [bills]);

  // Payment mode breakdown
  const modeData = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => {
      const m = (p.payment_method || "bank_transfer").replace(/_/g, " ");
      map[m] = (map[m] || 0) + Number(p.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [payments]);

  const PIE_COLORS = [
    "hsl(201, 96%, 32%)", "hsl(142, 71%, 45%)", "hsl(32, 95%, 44%)",
    "hsl(0, 72%, 51%)", "hsl(262, 83%, 58%)", "hsl(215, 16%, 47%)",
  ];

  // Processed bills
  const processedBills = useMemo(() => {
    let arr = [...bills];
    if (billSearch) {
      const q = billSearch.toLowerCase();
      arr = arr.filter((b) =>
        [b.bill_number, b.vendor_bill_number, b.status]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q))
      );
    }
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (billSortKey) {
        case "bill_date":
        case "due_date":
          av = a[billSortKey] ? new Date(a[billSortKey]).getTime() : 0;
          bv = b[billSortKey] ? new Date(b[billSortKey]).getTime() : 0;
          break;
        case "total":
        case "balance_due":
        case "amount_paid":
          av = Number(a[billSortKey] || 0);
          bv = Number(b[billSortKey] || 0);
          break;
        case "bill_number":
          av = a.bill_number || "";
          bv = b.bill_number || "";
          break;
        case "status":
          av = a.status || "";
          bv = b.status || "";
          break;
      }
      if (av < bv) return billSortDir === "asc" ? -1 : 1;
      if (av > bv) return billSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [bills, billSearch, billSortKey, billSortDir]);

  // Processed payments
  const processedPayments = useMemo(() => {
    let arr = [...payments];
    if (paymentSearch) {
      const q = paymentSearch.toLowerCase();
      arr = arr.filter((p) =>
        [p.reference, p.payment_method, p.notes, p.bills?.bill_number]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q))
      );
    }
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (paymentSortKey) {
        case "payment_date":
          av = a.payment_date ? new Date(a.payment_date).getTime() : 0;
          bv = b.payment_date ? new Date(b.payment_date).getTime() : 0;
          break;
        case "amount":
          av = Number(a.amount || 0);
          bv = Number(b.amount || 0);
          break;
        case "payment_method":
          av = a.payment_method || "";
          bv = b.payment_method || "";
          break;
      }
      if (av < bv) return paymentSortDir === "asc" ? -1 : 1;
      if (av > bv) return paymentSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [payments, paymentSearch, paymentSortKey, paymentSortDir]);

  const toggleBillSort = (k: BillSortKey) => {
    if (billSortKey === k) setBillSortDir(billSortDir === "asc" ? "desc" : "asc");
    else { setBillSortKey(k); setBillSortDir("asc"); }
  };
  const BillSortArrow = ({ k }: { k: BillSortKey }) =>
    billSortKey === k ? (
      billSortDir === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />
    ) : null;

  const togglePaymentSort = (k: PaymentSortKey) => {
    if (paymentSortKey === k) setPaymentSortDir(paymentSortDir === "asc" ? "desc" : "asc");
    else { setPaymentSortKey(k); setPaymentSortDir("asc"); }
  };
  const PaymentSortArrow = ({ k }: { k: PaymentSortKey }) =>
    paymentSortKey === k ? (
      paymentSortDir === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />
    ) : null;

  const renderStatusBadge = (st: string) => {
    const s = String(st || "").toLowerCase();
    if (s === "paid") {
      return <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200">Paid</Badge>;
    }
    if (s === "partial") {
      return <Badge className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200">Partially Paid</Badge>;
    }
    if (s === "received") {
      return <Badge className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200">Received (Unpaid)</Badge>;
    }
    if (s === "draft") {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (s === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    return <Badge variant="outline" className="capitalize">{s}</Badge>;
  };

  if (loading || !vendor) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p>Loading vendor transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={vendor.name}
        description={
          <div className="flex items-center gap-3 flex-wrap mt-1 text-sm text-muted-foreground">
            {vendor.display_name && vendor.display_name !== vendor.name && (
              <span>({vendor.display_name})</span>
            )}
            {vendor.gstin && (
              <Badge variant="outline" className="font-mono text-xs">
                GSTIN: {vendor.gstin}
              </Badge>
            )}
            {vendor.pan && (
              <Badge variant="outline" className="font-mono text-xs">
                PAN: {vendor.pan}
              </Badge>
            )}
            {vendor.phone && (
              <span className="flex items-center gap-1 text-xs">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {vendor.phone}
              </span>
            )}
            {vendor.email && (
              <span className="flex items-center gap-1 text-xs">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {vendor.email}
              </span>
            )}
          </div>
        }
      >
        <Button variant="outline" size="sm" onClick={() => navigate("/vendors")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> All Vendors
        </Button>
        <Button variant="outline" size="sm" onClick={openEdit}>
          <Pencil className="mr-1.5 h-4 w-4" /> Edit Vendor
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/purchase-orders/new?vendor_id=${id}`)}>
          <ShoppingCart className="mr-1.5 h-4 w-4" /> + Purchase Order
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm" onClick={() => navigate(`/bills/new?vendor_id=${id}`)}>
          <Plus className="mr-1.5 h-4 w-4" /> + New Purchase Bill
        </Button>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(totalBilled)}</div>
            <p className="text-xs text-muted-foreground mt-1">{bills.length} purchase bills</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">{payments.length} payment records</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{fmt(totalDue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bills.filter((b) => Number(b.balance_due) > 0 && b.status !== "cancelled").length} unpaid bills
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(overdueAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Due date passed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {(monthlyData.length > 0 || statusData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {monthlyData.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Purchases vs Payments Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "var(--radius)",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                      formatter={(v: number) => fmt(v)}
                    />
                    <Legend />
                    <Bar dataKey="billed" name="Purchases" fill="hsl(201, 96%, 32%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" name="Paid" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {statusData.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Bill Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "var(--radius)",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Transactions Tabs */}
      <Tabs defaultValue="bills" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="bills" className="text-xs font-semibold py-2 px-3.5">
            <ReceiptText className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            Purchase Bills ({bills.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs font-semibold py-2 px-3.5">
            <CreditCard className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            Payments Made ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs font-semibold py-2 px-3.5">
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            Purchase Orders ({purchaseOrders.length})
          </TabsTrigger>
          <TabsTrigger value="grns" className="text-xs font-semibold py-2 px-3.5">
            <PackageCheck className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
            Goods Receipts ({grns.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs font-semibold py-2 px-3.5">
            <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Vendor Profile
          </TabsTrigger>
        </TabsList>

        {/* Purchase Bills Tab */}
        <TabsContent value="bills">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b flex justify-between items-center bg-muted/20 gap-3">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bills by number or status..."
                    className="pl-9 h-9 rounded-lg"
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={() => navigate(`/bills/new?vendor_id=${id}`)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Bill
                </Button>
              </div>

              {processedBills.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <ReceiptText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">No purchase bills found for this vendor.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/bills/new?vendor_id=${id}`)}
                  >
                    + Create First Purchase Bill
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead onClick={() => toggleBillSort("bill_number")} className="cursor-pointer select-none hover:text-foreground">
                        Bill # <BillSortArrow k="bill_number" />
                      </TableHead>
                      <TableHead>Vendor Bill #</TableHead>
                      <TableHead onClick={() => toggleBillSort("bill_date")} className="cursor-pointer select-none hover:text-foreground">
                        Date <BillSortArrow k="bill_date" />
                      </TableHead>
                      <TableHead onClick={() => toggleBillSort("due_date")} className="cursor-pointer select-none hover:text-foreground">
                        Due Date <BillSortArrow k="due_date" />
                      </TableHead>
                      <TableHead onClick={() => toggleBillSort("status")} className="cursor-pointer select-none hover:text-foreground">
                        Status <BillSortArrow k="status" />
                      </TableHead>
                      <TableHead onClick={() => toggleBillSort("total")} className="cursor-pointer select-none hover:text-foreground text-right">
                        Total <BillSortArrow k="total" />
                      </TableHead>
                      <TableHead onClick={() => toggleBillSort("amount_paid")} className="cursor-pointer select-none hover:text-foreground text-right">
                        Paid <BillSortArrow k="amount_paid" />
                      </TableHead>
                      <TableHead onClick={() => toggleBillSort("balance_due")} className="cursor-pointer select-none hover:text-foreground text-right">
                        Balance Due <BillSortArrow k="balance_due" />
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedBills.map((b) => {
                      const isOverdue =
                        b.status !== "paid" &&
                        b.status !== "cancelled" &&
                        b.due_date &&
                        new Date(b.due_date) < new Date();
                      return (
                        <TableRow
                          key={b.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/bills/${b.id}`)}
                        >
                          <TableCell className="font-semibold text-primary">{b.bill_number}</TableCell>
                          <TableCell className="text-muted-foreground">{b.vendor_bill_number || "—"}</TableCell>
                          <TableCell>{b.bill_date}</TableCell>
                          <TableCell className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                            {b.due_date || "—"}
                          </TableCell>
                          <TableCell>{renderStatusBadge(b.status)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(Number(b.total))}</TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                            {fmt(Number(b.amount_paid))}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              Number(b.balance_due) > 0
                                ? isOverdue
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-orange-600 dark:text-orange-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {fmt(Number(b.balance_due))}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => navigate(`/bills/${b.id}`)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Made Tab */}
        <TabsContent value="payments">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments by reference, mode, notes..."
                    className="pl-9 h-9 rounded-lg"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                  />
                </div>
              </div>

              {processedPayments.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">No payments recorded for this vendor yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead onClick={() => togglePaymentSort("payment_date")} className="cursor-pointer select-none hover:text-foreground">
                        Date <PaymentSortArrow k="payment_date" />
                      </TableHead>
                      <TableHead>Bill Ref</TableHead>
                      <TableHead onClick={() => togglePaymentSort("payment_method")} className="cursor-pointer select-none hover:text-foreground">
                        Method <PaymentSortArrow k="payment_method" />
                      </TableHead>
                      <TableHead>Reference / Transaction ID</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead onClick={() => togglePaymentSort("amount")} className="cursor-pointer select-none hover:text-foreground text-right">
                        Amount Paid <PaymentSortArrow k="amount" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.payment_date}</TableCell>
                        <TableCell className="font-mono text-xs text-primary">
                          {p.bills?.bill_number || "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge variant="outline" className="text-xs">
                            {(p.payment_method || "bank_transfer").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.reference || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {fmt(Number(p.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {purchaseOrders.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">No purchase orders found for this vendor.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/purchase-orders/new?vendor_id=${id}`)}
                  >
                    + Create Purchase Order
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>PO #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow
                        key={po.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      >
                        <TableCell className="font-semibold text-primary">{po.po_number}</TableCell>
                        <TableCell>{po.po_date}</TableCell>
                        <TableCell>{po.expected_date || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{po.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(po.total))}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => navigate(`/purchase-orders/${po.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goods Receipts Tab */}
        <TabsContent value="grns">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {grns.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <PackageCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">No goods receipts (GRNs) found for this vendor.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>GRN #</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grns.map((grn) => (
                      <TableRow
                        key={grn.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/grns/${grn.id}`)}
                      >
                        <TableCell className="font-semibold text-primary">{grn.grn_number}</TableCell>
                        <TableCell>{grn.created_at ? format(new Date(grn.created_at), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{grn.status || "completed"}</Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => navigate(`/grns/${grn.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Profile Tab */}
        <TabsContent value="profile">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Vendor Master Details</CardTitle>
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Information
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Full Business Name</span>
                  <p className="font-medium text-base mt-1">{vendor.name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Display Name</span>
                  <p className="font-medium text-base mt-1">{vendor.display_name || vendor.name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">GSTIN</span>
                  <p className="font-mono text-base mt-1">{vendor.gstin || "Not Provided"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">PAN</span>
                  <p className="font-mono text-base mt-1">{vendor.pan || "Not Provided"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Mobile / Phone</span>
                  <p className="font-medium text-base mt-1">{vendor.phone || "Not Provided"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Email</span>
                  <p className="font-medium text-base mt-1">{vendor.email || "Not Provided"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Payment Terms</span>
                  <p className="font-medium text-base mt-1">Net {vendor.payment_terms || 30} Days</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Opening Balance</span>
                  <p className="font-medium text-base mt-1">{fmt(Number(vendor.opening_balance || 0))}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Notes</span>
                  <p className="text-muted-foreground mt-1">{vendor.notes || "No notes entered."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Vendor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Vendor Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile Number (10 digits)</Label>
              <Input
                maxLength={10}
                placeholder="10-digit mobile number"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, "") })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>GSTIN</Label>
              <Input
                value={editForm.gstin}
                onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>PAN</Label>
              <Input
                value={editForm.pan}
                onChange={(e) => setEditForm({ ...editForm, pan: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms (Days)</Label>
              <Input
                type="number"
                value={editForm.payment_terms}
                onChange={(e) => setEditForm({ ...editForm, payment_terms: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Opening Balance</Label>
              <Input
                type="number"
                value={editForm.opening_balance}
                onChange={(e) => setEditForm({ ...editForm, opening_balance: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Any special notes for this vendor..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
