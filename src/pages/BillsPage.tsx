import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, Download, Lock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ImportDialog, ImportField } from "@/components/shared/ImportDialog";
import { useSubscription } from "@/hooks/use-subscription";
import { hasUnlimitedBills, normalizePlanKey } from "@/lib/subscription";
import { PlanSelectorModal } from "@/components/shared/PlanSelectorModal";
import { getCurrentFinancialYear, isDateInFinancialYear } from "@/lib/financial-year";
import { FinancialYearSelect } from "@/components/shared/FinancialYearSelect";

const billImportFields: ImportField[] = [
  { key: "bill_number", label: "Invoice Number", required: true },
  { key: "vendor_name", label: "Vendor Name", required: true },
  { key: "bill_date", label: "Invoice Date" },
  { key: "due_date", label: "Due Date" },
  { key: "total", label: "Total Amount" },
  { key: "tax_rate", label: "GST %" },
  { key: "unit", label: "Unit" },
  { key: "status", label: "Status" },
];


function normalizeBillStatus(st: any): "draft" | "received" | "partial" | "paid" | "cancelled" {
  if (!st) return "draft";
  const s = String(st).toLowerCase().trim();
  if (s === "unpaid" || s === "pending") return "received";
  if (["draft", "received", "partial", "paid", "cancelled"].includes(s)) {
    return s as any;
  }
  return "draft";
}

export default function BillsPage() {
  const org = useAppStore((s) => s.organization);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const { subscriptionPlan } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeOrgPlans, setActiveOrgPlans] = useState<string[]>([]);

  useEffect(() => {
    if (!org?.id) return;
    const fetchOrgSub = async () => {
      try {
        const { data: subData } = await supabase.rpc("get_my_org_subscription", { p_org_id: org.id });
        if (subData?.all_plans && Array.isArray(subData.all_plans)) {
          setActiveOrgPlans(subData.all_plans);
        }
      } catch (e) {
        console.error("Error fetching sub in bills:", e);
      }
    };
    fetchOrgSub();
  }, [org?.id]);

  const currentFY = useMemo(() => getCurrentFinancialYear(), []);
  const [selectedFY, setSelectedFY] = useState<string>("all");

  const plan = normalizePlanKey(subscriptionPlan || org?.subscription_plan || 'free');
  const isUnlimited = hasUnlimitedBills(plan, activeOrgPlans);

  // Count purchase invoices in current Financial Year (01 Apr to 31 Mar)
  const billsThisFY = useMemo(() => {
    return bills.filter(b => isDateInFinancialYear(b.bill_date || b.created_at, currentFY.key));
  }, [bills, currentFY]);

  const billLimitReached = !isUnlimited && billsThisFY.length >= 100;
  const remainingBills = isUnlimited ? Infinity : Math.max(0, 100 - billsThisFY.length);

  // Filter bills by selected Financial Year
  const fyBills = useMemo(() => {
    if (selectedFY === "all") return bills;
    return bills.filter(b => isDateInFinancialYear(b.bill_date || b.created_at, selectedFY));
  }, [bills, selectedFY]);

  const totalDue = fyBills.reduce((s, b) => s + (Number(b.balance_due) || 0), 0);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("bills")
      .select("*, vendors(name, display_name)")
      .eq("org_id", org.id)
      .order("bill_date", { ascending: false });
    setBills(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [org?.id]);

  const remove = async (id: string) => {
    if (!confirm("Delete this purchase invoice?")) return;
    await (supabase as any).from("bill_lines").delete().eq("bill_id", id);
    await (supabase as any).from("bill_payments").delete().eq("bill_id", id);
    const { error } = await (supabase as any).from("bills").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground", received: "bg-blue-100 text-blue-700",
    partial: "bg-amber-100 text-amber-700", paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Purchase Invoices</h1>
        <div className="flex flex-wrap items-center gap-2">
          <FinancialYearSelect
            value={selectedFY}
            onValueChange={setSelectedFY}
            includeAll={true}
            allLabel="All Financial Years"
            className="w-48"
          />
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button 
            onClick={() => {
              if (billLimitReached) {
                setShowUpgradeModal(true);
              } else {
                navigate("/purchase-invoices/new");
              }
            }}
            className={billLimitReached ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
          >
            {billLimitReached ? <Lock className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            New Purchase Invoice
          </Button>
        </div>
      </div>

      {/* Quota Badge & Limit Alert */}
      <div className="flex items-center gap-2 flex-wrap">
        {isUnlimited ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
            Unlimited Purchase Invoices
          </Badge>
        ) : (
          <Badge 
            variant="outline" 
            className={billLimitReached 
              ? "bg-rose-50 text-rose-700 border-rose-300 font-semibold cursor-pointer" 
              : "bg-blue-50 text-blue-700 border-blue-300 font-semibold"
            }
            onClick={() => billLimitReached && setShowUpgradeModal(true)}
          >
            {billsThisFY.length} / 100 Purchase Invoices Used ({remainingBills} Remaining)
            {billLimitReached && " - Click to Upgrade"}
          </Badge>
        )}
      </div>

      {billLimitReached && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg p-3.5 flex items-center justify-between gap-3 text-sm text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span><strong>Purchase Invoice Limit Reached ({billsThisFY.length}/100 Used):</strong> You have reached your limit of 100 purchase invoices on the Free Plan. Upgrade to Business Accounting or Business Suite for unlimited purchase invoices.</span>
          </div>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shrink-0" onClick={() => setShowUpgradeModal(true)}>
            Upgrade Plan
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Total Purchase Invoices</div><div className="text-2xl font-semibold">{fyBills.length}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Outstanding</div><div className="text-2xl font-semibold text-amber-600">{formatCurrency(totalDue, (org as any)?.currency || "INR")}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Unpaid Invoices</div><div className="text-2xl font-semibold">{fyBills.filter(b => b.balance_due > 0).length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Purchase Invoices</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Loading…</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fyBills.map(b => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/purchase-invoices/${b.id}`)}>
                    <TableCell className="font-medium">{b.bill_number}</TableCell>
                    <TableCell>{b.vendors?.display_name || b.vendors?.name || "—"}</TableCell>
                    <TableCell>
                      {(() => {
                        if (!b.bill_date) return "—";
                        const d = new Date(b.bill_date);
                        return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        if (!b.due_date) return "—";
                        const d = new Date(b.due_date);
                        return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
                      })()}
                    </TableCell>
                    <TableCell><Badge className={statusColor[b.status] || ""}>{b.status}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(b.total), (org as any)?.currency || "INR")}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(b.balance_due), (org as any)?.currency || "INR")}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/purchase-invoices/${b.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!fyBills.length && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No purchase invoices for this period</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityName="Purchase Invoices"
        fields={billImportFields}
        onImport={async (rows) => {
            let s = 0, e = 0; const failedRows: any[] = [];
            const { data: existingVendors } = await supabase.from("vendors").select("id, display_name").eq("org_id", org!.id);
            const vendorMap = new Map<string, string>();
            existingVendors?.forEach(v => vendorMap.set(String(v.display_name).toLowerCase(), v.id));

            for (const row of rows) {
              const vName = row.vendor_name;
              if (!vName) { e++; failedRows.push({ row, reason: "Missing Vendor Name" }); continue; }
              
              let vendorId = vendorMap.get(String(vName).toLowerCase());
              if (!vendorId) {
                const { data: newV, error: vErr } = await supabase.from("vendors").insert({ org_id: org!.id, name: vName, display_name: vName }).select("id").single();
                if (vErr || !newV) { e++; failedRows.push({ row, reason: "Failed to create vendor" }); continue; }
                vendorId = newV.id;
                vendorMap.set(String(vName).toLowerCase(), vendorId);
              }

              const { error } = await supabase.from("bills").insert({
                org_id: org?.id,
                vendor_id: vendorId,
                bill_number: row.bill_number,
                total: Number(row.total) || 0,
                status: normalizeBillStatus(row.status),
                bill_date: row.bill_date || new Date().toISOString(),
                due_date: row.due_date || new Date().toISOString()
              });
              if (error) { e++; failedRows.push({ row, reason: error.message || "Failed to insert" }); } else { s++; }
            }
            load();
            return { success: s, errors: e, failedRows };
          }}
      />

      <PlanSelectorModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        orgId={org?.id}
      />
    </div>
  );
}
