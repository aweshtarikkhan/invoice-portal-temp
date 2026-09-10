import { useState, useRef } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Users, Truck, CheckCircle2, AlertCircle } from "lucide-react";
import { parseTallyOutstandingReport, ParsedTallyParty, TallySyncType } from "@/lib/tally-sync-parser";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useNavigate } from "react-router-dom";

export default function TallySyncPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [syncType, setSyncType] = useState<TallySyncType | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTallyParty[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ parties: number, invoices: number, payments: number, errors: { reason: string, data: any }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: TallySyncType) => {
    try {
      setSyncType(type);
      const data = await parseTallyOutstandingReport(file, type);
      if (data.length === 0) {
        toast({ title: "No data found", description: "Could not parse any valid records from this file.", variant: "destructive" });
        setSyncType(null);
        return;
      }
      setParsedData(data);
    } catch (err: any) {
      toast({ title: "Parse Error", description: err.message, variant: "destructive" });
      setSyncType(null);
    }
  };

  const handleSync = async () => {
    if (!parsedData || !org || !syncType) { console.error("Missing data to sync", { parsedData: !!parsedData, org: !!org, syncType }); return; }
    setIsProcessing(true);

    try {
      let partiesAdded = 0;
      let invoicesAdded = 0;
      let paymentsAdded = 0;
      const syncErrors: {reason: string, data: any}[] = [];

      for (const party of parsedData) {
        // 1. Upsert Party
        let partyId = "";
        if (syncType === "debtors") {
          const { data: existingClient } = await supabase.from("clients").select("id").eq("org_id", org.id).ilike("display_name", party.partyName).maybeSingle();
          if (existingClient) {
            partyId = existingClient.id;
          } else {
            const { data: newClient } = await supabase.from("clients").insert({ org_id: org.id, display_name: party.partyName }).select("id").single();
            if (newClient) {
              partyId = newClient.id;
              partiesAdded++;
            }
          }
        } else {
          const { data: existingVendor } = await supabase.from("vendors").select("id").eq("org_id", org.id).ilike("display_name", party.partyName).maybeSingle();
          if (existingVendor) {
            partyId = existingVendor.id;
          } else {
            const { data: newVendor } = await supabase.from("vendors").insert({ org_id: org.id, display_name: party.partyName }).select("id").single();
            if (newVendor) {
              partyId = newVendor.id;
              partiesAdded++;
            }
          }
        }

        if (!partyId) continue;

        // 2. Insert Transactions
        for (const txn of party.transactions) {
          if (txn.type === "invoice" || txn.type === "bill") {
            const isInvoice = txn.type === "invoice";
            const table = isInvoice ? "invoices" : "bills";
            
            // Check if exists
            const { data: existingTxn } = await supabase.from(table).select("id").eq("org_id", org.id).eq(isInvoice ? "invoice_number" : "bill_number", txn.reference).maybeSingle();
            if (existingTxn) continue; // Skip existing

            const txnData: any = {
              org_id: org.id,
              ...(isInvoice ? { invoice_number: txn.reference } : { bill_number: txn.reference }),
              invoice_date: txn.date || new Date().toISOString(),
              due_date: txn.date || new Date().toISOString(),
              total: txn.amount,
              balance_due: txn.amount, // Payments will adjust this if we link them, but Tally handles it separately
              status: "sent",
              notes: txn.narration || "",
            };

            if (isInvoice) txnData.client_id = partyId;
            else txnData.vendor_id = partyId;

            const { data: newTxn, error: txnError } = await supabase.from(table).insert(txnData).select("id").single();
            if (txnError) { syncErrors.push({ reason: txnError.message || "Failed to create invoice", data: txn.reference }); continue; }
            
            invoicesAdded++;

            // Insert Items
            const lines = [];
            for (let i = 0; i < txn.items.length; i++) {
              const it = txn.items[i];
              lines.push({
                [isInvoice ? "invoice_id" : "bill_id"]: newTxn.id,
                name: it.name,
                hsn_code: it.hsn,
                quantity: it.qty,
                rate: it.rate,
                amount: it.amount,
                sort_order: i + 1
              });
            }
            if (lines.length > 0) {
              await supabase.from(isInvoice ? "invoice_lines" : "bill_lines").insert(lines);
            }
          } else if (txn.type === "payment_received" || txn.type === "payment_made") {
            // Check if payment exists by reference
            if (!txn.reference) continue; // Skip empty ref payments
            
            const { data: existingPay } = await supabase.from("payments").select("id").eq("org_id", org.id).eq("reference_number", txn.reference).maybeSingle();
            if (existingPay) continue;

            const payData: any = {
              org_id: org.id,
              payment_date: txn.date || new Date().toISOString(),
              amount: txn.amount,
              payment_mode: "bank_transfer",
              reference_number: txn.reference || null,
              notes: txn.narration || ""
            };

            if (txn.type === "payment_received") {
              payData.client_id = partyId;
              payData.payment_number = "PAY-" + Math.floor(Math.random() * 1000000);
              const { error: payErr } = await supabase.from("payments").insert(payData);
              if (payErr) { syncErrors.push({ reason: payErr.message, data: payData.payment_number }); }
            } else {
              payData.vendor_id = partyId;
              payData.payment_number = "BPAY-" + Math.floor(Math.random() * 1000000);
              const { error: bPayErr } = await supabase.from("bill_payments").insert(payData);
              if (bPayErr) { syncErrors.push({ reason: bPayErr.message, data: payData.payment_number }); }
            }
            paymentsAdded++;
          }
        }
      }

setSyncResult({ parties: partiesAdded, invoices: invoicesAdded, payments: paymentsAdded, errors: syncErrors });
    } catch (err: any) {
      toast({ title: "Sync Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getSummary = () => {
    if (!parsedData) return null;
    const parties = parsedData.length;
    const invoices = parsedData.flatMap(p => p.transactions).filter(t => t.type === "invoice" || t.type === "bill").length;
    const payments = parsedData.flatMap(p => p.transactions).filter(t => t.type === "payment_received" || t.type === "payment_made").length;
    return { parties, invoices, payments };
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <SEO title="Tally Master Sync" />
      <PageHeader title="Tally Master Sync" description="Import Clients, Vendors, Sales, Purchases, and Payments directly from Tally Outstanding Reports." />

      {syncResult ? 
      {syncResult && (
        <Card className="mt-6 border-success bg-success/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <div>
                <CardTitle className="text-xl">Sync Complete</CardTitle>
                <CardDescription>Master sync executed successfully</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary">{syncResult.parties}</div>
                <div className="text-xs uppercase text-muted-foreground mt-1">Parties Synced</div>
              </div>
              <div className="p-4 bg-background rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary">{syncResult.invoices}</div>
                <div className="text-xs uppercase text-muted-foreground mt-1">Invoices Synced</div>
              </div>
              <div className="p-4 bg-background rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary">{syncResult.payments}</div>
                <div className="text-xs uppercase text-muted-foreground mt-1">Payments Synced</div>
              </div>
            </div>
            
            {syncResult.errors.length > 0 && (
              <div className="border rounded-md bg-background">
                <div className="bg-destructive/10 px-4 py-2 border-b">
                  <h4 className="text-sm font-semibold text-destructive">Encountered {syncResult.errors.length} Errors</h4>
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                  {syncResult.errors.map((e, i) => (
                    <div key={i} className="text-xs flex gap-2">
                      <span className="font-semibold text-destructive min-w-32">{e.reason}:</span>
                      <span className="text-muted-foreground truncate">{JSON.stringify(e.data)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => { setSyncResult(null); setParsedData(null); setSyncType(null); }}>Done</Button>
            </div>
          </CardContent>
        </Card>
      )}
   : !parsedData ? (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setSyncType("debtors"); fileRef.current?.click(); }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Sundry Debtors (Customers)
              </CardTitle>
              <CardDescription>Upload 'Sundry Debtors' report to import Clients, Sales Invoices, and Payment Receipts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center flex flex-col items-center justify-center bg-muted/10">
                <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="font-medium text-sm">Click to upload Sundry Debtors.xls</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setSyncType("creditors"); fileRef.current?.click(); }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" /> Sundry Creditors (Vendors)
              </CardTitle>
              <CardDescription>Upload 'Sundry Creditors' report to import Vendors, Purchase Bills, and Payments Made.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center flex flex-col items-center justify-center bg-muted/10">
                <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="font-medium text-sm">Click to upload Sundry Creditors.xls</p>
              </div>
            </CardContent>
          </Card>

          <input type="file" ref={fileRef} className="hidden" accept=".xls,.xlsx" onChange={(e) => {
            if (e.target.files && e.target.files[0] && syncType) {
              handleFileUpload(e.target.files[0], syncType);
            }
            e.target.value = "";
          }} />
        </div>
      ) : (
        <Card className="mt-6 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <CheckCircle2 className="w-5 h-5" /> Ready to Sync
            </CardTitle>
            <CardDescription>
              We've successfully parsed your {syncType === "debtors" ? "Sundry Debtors" : "Sundry Creditors"} file. Review the summary below before executing the master sync.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                <div className="text-3xl font-bold text-slate-800">{getSummary()?.parties}</div>
                <div className="text-sm font-medium text-slate-500 uppercase mt-1">{syncType === "debtors" ? "Clients" : "Vendors"} Found</div>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                <div className="text-3xl font-bold text-blue-600">{getSummary()?.invoices}</div>
                <div className="text-sm font-medium text-slate-500 uppercase mt-1">{syncType === "debtors" ? "Sales Invoices" : "Purchase Bills"}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                <div className="text-3xl font-bold text-emerald-600">{getSummary()?.payments}</div>
                <div className="text-sm font-medium text-slate-500 uppercase mt-1">Payments Extracted</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-md mb-6 border border-amber-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Existing records with the same Invoice Number / Reference Number will be skipped to prevent duplicates.</p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setParsedData(null); setSyncType(null); }} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleSync} disabled={isProcessing}>
                {isProcessing ? "Syncing Data..." : "Execute Master Sync"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
