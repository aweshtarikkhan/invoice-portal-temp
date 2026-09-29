import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, startOfMonth, addMonths, isWithinInterval } from "date-fns";

export default function CashFlowPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const cur = (org as any)?.currency || "INR";
  const [txns, setTxns] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [bizExpenses, setBizExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [t, a, exp, pays, billPays] = await Promise.all([
          (supabase as any).from("bank_transactions").select("*, bank_accounts(name, bank_name, account_number, account_type)").eq("org_id", org.id).order("txn_date", { ascending: false }),
          (supabase as any).from("bank_accounts").select("*").eq("org_id", org.id).order("name"),
          supabase.from("business_expenses").select("amount, expense_date, category, description").eq("org_id", org.id),
          supabase.from("payments").select("id, amount, payment_date, payment_mode, reference_number, notes, bank_account_id, clients(display_name)").eq("org_id", org.id),
          (supabase as any).from("bill_payments").select("id, amount, payment_date, payment_mode, reference_number, notes, bank_account_id, vendors(name)").eq("org_id", org.id),
        ]);

        const rawTxns = t.data || [];
        const rawAccounts = a.data || [];
        const rawExpenses = exp.data || [];
        const rawPayments = pays.data || [];
        const rawBillPayments = billPays.data || [];

        // Build a set of matched payment IDs already in bank_transactions to avoid duplicate count
        const matchedPaymentIds = new Set(rawTxns.map((x: any) => x.matched_id).filter(Boolean));

        const synthesizedTxns = [...rawTxns];

        // Synthesize any legacy or direct payments not yet in bank_transactions
        rawPayments.forEach((p: any) => {
          if (!matchedPaymentIds.has(p.id)) {
            const linkedAccount = rawAccounts.find((acc: any) => acc.id === p.bank_account_id);
            synthesizedTxns.push({
              id: `syn-pay-${p.id}`,
              org_id: org.id,
              bank_account_id: p.bank_account_id || null,
              txn_date: p.payment_date || new Date().toISOString().slice(0, 10),
              amount: Number(p.amount),
              direction: "credit",
              description: `Payment received from ${(p.clients as any)?.display_name || "Client"}`,
              reference: p.reference_number || null,
              counterparty: (p.clients as any)?.display_name || null,
              bank_accounts: linkedAccount || (p.payment_mode === "cash" ? { name: "Cash in Hand", account_type: "cash" } : null),
              source: "payment",
            });
          }
        });

        // Synthesize any legacy bill payments not yet in bank_transactions
        rawBillPayments.forEach((bp: any) => {
          if (!matchedPaymentIds.has(bp.id)) {
            const linkedAccount = rawAccounts.find((acc: any) => acc.id === bp.bank_account_id);
            synthesizedTxns.push({
              id: `syn-bp-${bp.id}`,
              org_id: org.id,
              bank_account_id: bp.bank_account_id || null,
              txn_date: bp.payment_date || new Date().toISOString().slice(0, 10),
              amount: Number(bp.amount),
              direction: "debit",
              description: `Payment to ${(bp.vendors as any)?.name || "Vendor"}`,
              reference: bp.reference_number || null,
              counterparty: (bp.vendors as any)?.name || null,
              bank_accounts: linkedAccount || null,
              source: "bill_payment",
            });
          }
        });

        // Sort by txn_date descending
        synthesizedTxns.sort((x, y) => new Date(y.txn_date).getTime() - new Date(x.txn_date).getTime());

        setTxns(synthesizedTxns);
        setAccounts(rawAccounts);
        setBizExpenses(rawExpenses);
      } catch (err) {
        console.error("Error loading cash flow data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [org?.id]);

  // Monthly buckets for last 6 months
  const monthly = useMemo(() => {
    const buckets: { label: string; start: Date; end: Date; inflow: number; outflow: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(addMonths(new Date(), -i));
      const end = addMonths(start, 1);
      buckets.push({ label: format(start, "MMM yyyy"), start, end, inflow: 0, outflow: 0 });
    }

    txns.forEach((t) => {
      const d = new Date(t.txn_date);
      const b = buckets.find((bucket) => isWithinInterval(d, { start: bucket.start, end: bucket.end }));
      if (!b) return;
      if (t.direction === "credit") b.inflow += Number(t.amount);
      else b.outflow += Number(t.amount);
    });

    // Add standalone business expenses as outflows
    bizExpenses.forEach((e) => {
      const d = new Date(e.expense_date);
      const b = buckets.find((bucket) => isWithinInterval(d, { start: bucket.start, end: bucket.end }));
      if (b) b.outflow += Number(e.amount);
    });

    return buckets;
  }, [txns, bizExpenses]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance || 0), 0);
  const totalInflow6m = monthly.reduce((s, m) => s + m.inflow, 0);
  const totalOutflow6m = monthly.reduce((s, m) => s + m.outflow, 0);
  const net6m = totalInflow6m - totalOutflow6m;
  const maxBar = Math.max(1, ...monthly.flatMap((m) => [m.inflow, m.outflow]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cash Flow & Banking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time track of all cash and bank inflows, outflows, and account statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/banking")}>
            <Building2 className="mr-1 h-4 w-4" /> Bank Accounts
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Reports
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Total Cash & Bank Balance</div>
            <div className="text-2xl font-semibold mt-1">{formatCurrency(totalBalance, cur)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{accounts.length} Accounts Active</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Inflow (Last 6 Months)
            </div>
            <div className="text-2xl font-semibold text-emerald-600 mt-1">{formatCurrency(totalInflow6m, cur)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-600" /> Outflow (Last 6 Months)
            </div>
            <div className="text-2xl font-semibold text-red-600 mt-1">{formatCurrency(totalOutflow6m, cur)}</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${net6m >= 0 ? "border-l-emerald-600" : "border-l-red-600"}`}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Net Cash Flow (6m)</div>
            <div className={`text-2xl font-semibold mt-1 ${net6m >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(net6m, cur)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Cash Flow Movement (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthly.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{m.label}</span>
                  <span className="text-xs text-muted-foreground">
                    Net:{" "}
                    <span className={`font-semibold ${m.inflow - m.outflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(m.inflow - m.outflow, cur)}
                    </span>
                  </span>
                </div>
                <div className="flex gap-2 h-7">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800/40 relative flex-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded transition-all duration-300" style={{ width: `${(m.inflow / maxBar) * 100}%` }} />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-emerald-900 dark:text-emerald-200">
                      In: {formatCurrency(m.inflow, cur)}
                    </span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800/40 relative flex-1 overflow-hidden">
                    <div className="bg-red-500 h-full rounded transition-all duration-300" style={{ width: `${(m.outflow / maxBar) * 100}%` }} />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-red-900 dark:text-red-200">
                      Out: {formatCurrency(m.outflow, cur)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Transactions ({txns.length})</TabsTrigger>
          <TabsTrigger value="accounts">By Account ({accounts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="recent">
          <Card>
            <CardContent className="pt-4 p-0">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Loading transactions...</div>
              ) : txns.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Wallet className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm">No cash flow transactions recorded yet.</p>
                  <p className="text-xs">When you receive payments or record expenses, transactions will appear here automatically.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Ref #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txns.slice(0, 50).map((t) => {
                      const acc = t.bank_accounts;
                      const accLabel = acc?.bank_name
                        ? `${acc.bank_name} ${acc.account_number ? `(..${acc.account_number.slice(-4)})` : ""}`
                        : acc?.name || (t.account_type === "cash" ? "Cash in Hand" : "Bank Account");

                      return (
                        <TableRow key={t.id} className="hover:bg-muted/50">
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(t.txn_date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{accLabel}</span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1 uppercase">
                                {acc?.account_type || (t.direction === "credit" ? "Bank/Cash" : "Expense")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-md truncate">
                            <span className="font-medium text-foreground">{t.description || "—"}</span>
                            {t.counterparty && (
                              <div className="text-xs text-muted-foreground">{t.counterparty}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {t.reference || "—"}
                          </TableCell>
                          <TableCell className={`text-right font-semibold text-sm whitespace-nowrap ${t.direction === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {t.direction === "credit" ? "+" : "−"} {formatCurrency(Number(t.amount), cur)}
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
        <TabsContent value="accounts">
          <Card>
            <CardContent className="pt-4 p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank / Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{a.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.bank_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {a.account_type || "Bank"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {a.account_number ? `****${a.account_number.slice(-4)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(Number(a.current_balance || 0), cur)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/banking/${a.id}`)}>
                          Statement →
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No bank or cash accounts configured yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
