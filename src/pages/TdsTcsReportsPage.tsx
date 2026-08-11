import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calculator } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { downloadCSV } from "@/lib/export-csv";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function TdsTcsReportsPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    if (!org?.id) return;
    const fetch = async () => {
      setLoading(true);
      // Fetch invoices with client details
      const { data: invData } = await supabase
        .from("invoices")
        .select(`*, clients(display_name)`)
        .eq("org_id", org.id)
        .eq("tds_tcs_applicable", true)
        .gt("tds_tcs_amount", 0)
        .neq("status", "void")
        .neq("status", "draft");

      // Fetch bills with vendor details
      const { data: billData } = await (supabase as any)
        .from("bills")
        .select(`*, vendors(name)`)
        .eq("org_id", org.id)
        .eq("tds_tcs_applicable", true)
        .gt("tds_tcs_amount", 0)
        .neq("status", "void")
        .neq("status", "draft");

      setInvoices(invData || []);
      setBills(billData || []);
      setLoading(false);
    };
    fetch();
  }, [org?.id]);

  const { filteredInvoices, filteredBills, summary } = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

    const fInvoices = invoices.filter((i) => {
      if (!i.issue_date) return false;
      const d = parseISO(i.issue_date);
      return isWithinInterval(d, { start, end });
    });

    const fBills = bills.filter((b) => {
      if (!b.bill_date) return false;
      const d = parseISO(b.bill_date);
      return isWithinInterval(d, { start, end });
    });

    let totalTdsCollected = 0, totalTcsCollected = 0;
    let totalTdsDeducted = 0, totalTcsPaid = 0;

    fInvoices.forEach(i => {
      if (i.tds_tcs_type === "tds") {
        totalTdsCollected += Number(i.tds_tcs_amount || 0);
      } else if (i.tds_tcs_type === "tcs") {
        totalTcsCollected += Number(i.tds_tcs_amount || 0);
      }
    });

    fBills.forEach(b => {
      if (b.tds_tcs_type === "tds") {
        totalTdsDeducted += Number(b.tds_tcs_amount || 0);
      } else if (b.tds_tcs_type === "tcs") {
        totalTcsPaid += Number(b.tds_tcs_amount || 0);
      }
    });

    return {
      filteredInvoices: fInvoices,
      filteredBills: fBills,
      summary: {
        totalTdsCollected,
        totalTcsCollected,
        totalTdsDeducted,
        totalTcsPaid
      }
    };
  }, [invoices, bills, selectedMonth, selectedYear]);

  const currency = org?.currency_code || "INR";
  const fmt = (v: number) => formatCurrency(v, currency);

  const handleExportCSV = () => {
    // Generate two tables in one export or two exports? Let's just do two exports or combined.
    // We will do a single combined export with a "Type" column
    const rows = [];
    
    // Add Sales
    filteredInvoices.forEach(i => {
      rows.push({
        "Document Type": "Invoice (Sale)",
        "Date": i.issue_date,
        "Document Number": i.number,
        "Party Name": i.clients?.display_name || "Unknown Client",
        "Total Amount": i.total,
        "TDS/TCS Type": i.tds_tcs_type?.toUpperCase(),
        "Rate (%)": i.tds_tcs_rate,
        "Amount": i.tds_tcs_amount
      });
    });

    // Add Purchases
    filteredBills.forEach(b => {
      rows.push({
        "Document Type": "Bill (Purchase)",
        "Date": b.bill_date,
        "Document Number": b.number,
        "Party Name": b.vendors?.name || "Unknown Vendor",
        "Total Amount": b.total,
        "TDS/TCS Type": b.tds_tcs_type?.toUpperCase(),
        "Rate (%)": b.tds_tcs_rate,
        "Amount": b.tds_tcs_amount
      });
    });

    if (rows.length === 0) {
      toast({ title: "No Data", description: "No TDS/TCS entries found for this period to export." });
      return;
    }

    const filename = `TDS-TCS-Return-${MONTHS[selectedMonth]}-${selectedYear}.csv`;
    downloadCSV(rows, filename);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <SEO title="TDS/TCS Returns - Assay Biz" description="Track and export TDS deducted and TCS collected across sales and purchases." />
      <PageHeader 
        title="TDS/TCS Returns"
        description="Track and export TDS deducted and TCS collected across sales and purchases."
      >
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((offset) => {
                const y = today.getFullYear() - offset;
                return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>TDS Collected (Sales)</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{fmt(summary.totalTdsCollected)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>TCS Collected (Sales)</CardDescription>
            <CardTitle className="text-2xl text-green-600">{fmt(summary.totalTcsCollected)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>TDS Deducted (Purchases)</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{fmt(summary.totalTdsDeducted)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>TCS Paid (Purchases)</CardDescription>
            <CardTitle className="text-2xl text-purple-600">{fmt(summary.totalTcsPaid)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Sales (Invoices)</CardTitle>
            <CardDescription>TDS/TCS applied on your invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : filteredInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this period.</p>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Invoice #</th>
                      <th className="px-3 py-2 text-left font-medium">Client</th>
                      <th className="px-3 py-2 text-right font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Rate</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2">{inv.issue_date}</td>
                        <td className="px-3 py-2">{inv.number}</td>
                        <td className="px-3 py-2 truncate max-w-[120px]" title={inv.clients?.display_name}>
                          {inv.clients?.display_name || "Unknown"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {inv.tds_tcs_type?.toUpperCase()}
                        </td>
                        <td className="px-3 py-2 text-right">{inv.tds_tcs_rate}%</td>
                        <td className="px-3 py-2 text-right font-medium">{fmt(inv.tds_tcs_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Purchases (Bills)</CardTitle>
            <CardDescription>TDS/TCS applied on your bills.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : filteredBills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this period.</p>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Bill #</th>
                      <th className="px-3 py-2 text-left font-medium">Vendor</th>
                      <th className="px-3 py-2 text-right font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Rate</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2">{bill.bill_date}</td>
                        <td className="px-3 py-2">{bill.number}</td>
                        <td className="px-3 py-2 truncate max-w-[120px]" title={bill.vendors?.name}>
                          {bill.vendors?.name || "Unknown"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {bill.tds_tcs_type?.toUpperCase()}
                        </td>
                        <td className="px-3 py-2 text-right">{bill.tds_tcs_rate}%</td>
                        <td className="px-3 py-2 text-right font-medium">{fmt(bill.tds_tcs_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
