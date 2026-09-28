import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageActionBar } from "@/components/shared/PageActionBar";
import { SummaryRibbon } from "@/components/shared/SummaryRibbon";
import { AnalyticsGrid } from "@/components/shared/AnalyticsGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Search, Download } from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";
import { format, parseISO } from "date-fns";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

export default function DebitNotesPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!org?.id) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("debit_notes" as any)
        .select("*, vendors:vendor_id(id, name, display_name)")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setDebitNotes(data);
      }
      setLoading(false);
    };
    fetch();
  }, [org?.id]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const summary = useMemo(() => {
    const total = debitNotes.reduce((s, c) => s + Number(c.total || 0), 0);
    const issued = debitNotes.filter(c => c.status === "issued" || c.status === "open");
    const issuedValue = issued.reduce((s, c) => s + Number(c.total || 0), 0);
    return { total, issuedValue, count: debitNotes.length };
  }, [debitNotes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return debitNotes;
    const q = search.toLowerCase();
    return debitNotes.filter(c =>
      (c.debit_note_number || "").toLowerCase().includes(q) ||
      (c.vendors?.name || c.vendors?.display_name || "").toLowerCase().includes(q) ||
      (c.reason || "").toLowerCase().includes(q)
    );
  }, [debitNotes, search]);

  const handleExport = () => {
    downloadCSV("debit-notes.csv", filtered.map(c => ({
      "Debit Note #": c.debit_note_number,
      "Vendor": c.vendors?.display_name || c.vendors?.name || "Unknown",
      "Date": c.issue_date || "",
      "Status": c.status || "draft",
      "Subtotal": c.subtotal || 0,
      "Tax": c.total_tax || 0,
      "Total": c.total || 0,
      "Reason": c.reason || "",
    })));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debit Notes (Purchase Returns)</h1>
          <p className="text-muted-foreground text-sm">
            Manage goods returned to vendors, reduce accounts payable, and sync stock inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => navigate("/debit-notes/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Debit Note
          </Button>
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Total Debit Notes</div>
            <div className="text-2xl font-bold mt-1">{summary.count}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Total Returned Value</div>
            <div className="text-2xl font-bold text-primary mt-1">{fmt(summary.total)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/60">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Issued & Adjusted</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{fmt(summary.issuedValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card className="rounded-xl border border-border/60">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search debit notes by number, vendor, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading debit notes...</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Debit Notes Found"
              description="Record purchase returns to vendors to reverse stock quantities and adjust outstanding bill payables."
              actionLabel="Create Debit Note"
              onAction={() => navigate("/debit-notes/new")}
            />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Debit Note #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((dn) => (
                    <TableRow key={dn.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/debit-notes/${dn.id}`)}>
                      <TableCell className="font-semibold text-primary">{dn.debit_note_number}</TableCell>
                      <TableCell>{dn.vendors?.display_name || dn.vendors?.name || "Unknown"}</TableCell>
                      <TableCell>{dn.issue_date || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{dn.reason || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          dn.status === 'issued' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {dn.status?.toUpperCase() || 'DRAFT'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(Number(dn.total || 0))}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/debit-notes/${dn.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
