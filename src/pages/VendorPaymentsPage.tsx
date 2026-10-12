import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Search, Plus, Trash2, Download, Building2, Eye } from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";
import { SummaryRibbon } from "@/components/shared/SummaryRibbon";
import { toast } from "@/hooks/use-toast";
import { deleteSingleVendorPayment } from "@/lib/invoice-actions";
import { getCurrentFinancialYear, isDateInFinancialYear } from "@/lib/financial-year";
import { FinancialYearSelect } from "@/components/shared/FinancialYearSelect";
import { formatCurrency } from "@/lib/currency";

export default function VendorPaymentsPage() {
  const org = useAppStore((s) => s.organization);
  const navigate = useNavigate();
  const currency = (org as any)?.currency || "INR";

  const [payments, setPayments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const currentFY = useMemo(() => getCurrentFinancialYear(), []);
  const [search, setSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [selectedFy, setSelectedFy] = useState<string>(() => currentFY.key);
  const [loading, setLoading] = useState(true);

  // Deletion state
  const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fmt = (n: number) => formatCurrency(n || 0, currency);

  const loadData = async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const [pmtRes, billsRes, vRes] = await Promise.all([
        (supabase as any)
          .from("bill_payments")
          .select("*, vendors:vendor_id(id, name, display_name), bills:bill_id(id, bill_number, vendor_bill_number)")
          .eq("org_id", org.id)
          .order("payment_date", { ascending: false }),
        (supabase as any)
          .from("bills")
          .select("id, total, balance_due, status")
          .eq("org_id", org.id)
          .not("status", "in", '("draft","cancelled")'),
        (supabase as any)
          .from("vendors")
          .select("id, name, display_name, balance_due")
          .eq("org_id", org.id),
      ]);

      setPayments(pmtRes.data || []);
      setBills(billsRes.data || []);
      setVendors(vRes.data || []);
    } catch (err: any) {
      console.error("Failed to load vendor payments:", err);
      toast({ title: "Failed to load vendor payments", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [org?.id]);

  // Filter payments by financial year, search term, and payment method
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // FY Filter
      if (selectedFy !== "all" && p.payment_date) {
        if (!isDateInFinancialYear(p.payment_date, selectedFy)) return false;
      }

      // Method Filter
      if (paymentMethodFilter !== "all") {
        if ((p.payment_method || "bank_transfer") !== paymentMethodFilter) return false;
      }

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const vObj = Array.isArray(p.vendors) ? p.vendors[0] : p.vendors;
        const bObj = Array.isArray(p.bills) ? p.bills[0] : p.bills;
        const vName = (vObj?.display_name || vObj?.name || "").toLowerCase();
        const ref = (p.reference || "").toLowerCase();
        const billNum = (bObj?.vendor_bill_number || bObj?.bill_number || "").toLowerCase();
        const notes = (p.notes || "").toLowerCase();
        return vName.includes(q) || ref.includes(q) || billNum.includes(q) || notes.includes(q);
      }

      return true;
    });
  }, [payments, selectedFy, paymentMethodFilter, search]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalPaymentsMade = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalOutstandingPayables = bills.reduce((sum, b) => sum + Number(b.balance_due || 0), 0);

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const paidThisMonth = payments
      .filter((p) => (p.payment_date || "").startsWith(currentMonthStr))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return [
      {
        label: "Total Payments Made",
        value: fmt(totalPaymentsMade),
        description: `Across ${filteredPayments.length} recorded payments`,
      },
      {
        label: "Outstanding Payables",
        value: fmt(totalOutstandingPayables),
        description: "Pending purchase bill dues",
      },
      {
        label: "Paid This Month",
        value: fmt(paidThisMonth),
        description: "Cash & bank vendor settlements",
      },
      {
        label: "Vendors Registered",
        value: String(vendors.length),
        description: "Active business suppliers",
      },
    ];
  }, [filteredPayments, bills, payments, vendors]);

  // Handle single payment delete
  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteSingleVendorPayment(paymentToDelete.id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete payment");
      }
      toast({ title: "Payment deleted & accounts reverted" });
      setDeleteOpen(false);
      setPaymentToDelete(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Deletion failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    downloadCSV(
      "vendor-payments.csv",
      filteredPayments.map((p) => {
        const vObj = Array.isArray(p.vendors) ? p.vendors[0] : p.vendors;
        const bObj = Array.isArray(p.bills) ? p.bills[0] : p.bills;
        return {
          "Payment Date": p.payment_date || "",
          "Vendor": vObj?.display_name || vObj?.name || "Unknown",
          "Bill #": bObj?.vendor_bill_number || bObj?.bill_number || "On Account",
          "Payment Method": (p.payment_method || "bank_transfer").replace(/_/g, " "),
          "Reference #": p.reference || "",
          "Amount": p.amount || 0,
          "Notes": p.notes || "",
        };
      })
    );
  };

  const getMethodBadge = (m: string) => {
    const clean = (m || "bank_transfer").toLowerCase();
    if (clean.includes("cash")) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 text-xs">Cash</Badge>;
    }
    if (clean.includes("upi")) {
      return <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/20 text-xs">UPI</Badge>;
    }
    if (clean.includes("check")) {
      return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 text-xs">Cheque</Badge>;
    }
    return <Badge variant="outline" className="border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-xs">Bank Transfer</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Payments</h1>
          <p className="text-muted-foreground text-sm">
            Record payments to vendors, settle purchase bills, and track supplier payables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredPayments.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => navigate("/vendor-payments/new")}>
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Ribbon */}
      <SummaryRibbon label="Vendor Payments Summary" items={summaryMetrics} />

      {/* Search & Filter Toolbar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor, reference #, or bill #..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <FinancialYearSelect
                value={selectedFy}
                onValueChange={setSelectedFy}
                includeAll={true}
              />

              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="check">Check / Cheque</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading vendor payments...
            </div>
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No Vendor Payments Found"
              description={
                search || paymentMethodFilter !== "all" || selectedFy !== "all"
                  ? "No payments matched your search filters."
                  : "Start recording payments made to your vendors and suppliers."
              }
              actionLabel="Record Vendor Payment"
              onAction={() => navigate("/vendor-payments/new")}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Reference #</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => {
                  const vObj = Array.isArray(p.vendors) ? p.vendors[0] : p.vendors;
                  const bObj = Array.isArray(p.bills) ? p.bills[0] : p.bills;
                  const vendorName = vObj?.display_name || vObj?.name || "Unknown Vendor";
                  const billLabel = bObj?.vendor_bill_number || bObj?.bill_number;
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">
                        {p.payment_date || "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline text-left"
                          onClick={() => navigate(`/vendors/${p.vendor_id}`)}
                        >
                          {vendorName}
                        </button>
                      </TableCell>
                      <TableCell>
                        {p.bill_id && billLabel ? (
                          <button
                            type="button"
                            className="font-mono text-xs text-primary hover:underline"
                            onClick={() => navigate(`/purchase-invoices/${p.bill_id}`)}
                          >
                            {billLabel}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">On Account</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(p.payment_method)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.reference || "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground font-mono">
                        {fmt(p.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setPaymentToDelete(p);
                            setDeleteOpen(true);
                          }}
                          title="Delete Payment & Revert Balances"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment of{" "}
              <strong className="text-foreground">
                {paymentToDelete ? fmt(paymentToDelete.amount) : ""}
              </strong>
              {(() => {
                const v = Array.isArray(paymentToDelete?.vendors) ? paymentToDelete?.vendors[0] : paymentToDelete?.vendors;
                return v?.display_name || v?.name ? ` to ${v.display_name || v.name}` : "";
              })()}.
              <br /><br />
              Any linked purchase bill balance and status will be restored, and the bank/cash account balance will be refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleting ? "Deleting..." : "Delete & Revert"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
