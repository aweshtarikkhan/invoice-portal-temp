import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUp, ArrowDown, ChevronDown, ChevronRight, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type InvoiceLineDetail = {
  id: string;
  invoice_number: string;
  client_name: string;
  issue_date: string;
  quantity: number;
  rate: number;
  amount: number;
};

type GroupedBillingItem = {
  key: string;
  item_id: string | null;
  item_name: string;
  unit: string | null;
  total_selling: number;
  total_quantity: number;
  buyers_count: number;
  hsn_code: string | null;
  tax_rate: number | null;
  purchase_price: number | null;
  profit: number | null;
  invoices: InvoiceLineDetail[];
};

export function ItemWiseBillingTab() {
  const org = useAppStore((s) => s.organization);
  const navigate = useNavigate();
  const [data, setData] = useState<GroupedBillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [hsnDialogOpen, setHsnDialogOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hsnCode, setHsnCode] = useState("");
  const [savingHsn, setSavingHsn] = useState(false);

  type SortKey = "item_name" | "total_selling" | "buyers_count" | "profit";
  const [sortKey, setSortKey] = useState<SortKey>("total_selling");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };
  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />
    ) : null;

  const fetchData = async () => {
    if (!org?.id) return;
    setLoading(true);

    const { data: rawData, error } = await supabase
      .from("invoice_lines")
      .select(`
        id, item_id, name, quantity, rate, amount,
        items(hsn_code, purchase_price, tax_rates(rate), unit),
        invoices!inner(
          org_id, status, invoice_number, issue_date, client_id,
          clients!inner(display_name)
        )
      `)
      .eq("invoices.org_id", org.id);

    if (!error && rawData) {
      const groupedMap = new Map<string, GroupedBillingItem & { buyersSet: Set<string> }>();

      rawData
        .filter((line: any) => line.invoices?.status !== "void" && line.invoices?.status !== "draft")
        .forEach((line: any) => {
          const key = line.item_id || line.name || "Unknown";
          const name = line.name || "Unknown";
          const clientId = line.invoices?.client_id;
          const clientName = line.invoices?.clients?.display_name || "";
          
          if (!groupedMap.has(key)) {
            groupedMap.set(key, {
              key,
              item_id: line.item_id,
              item_name: name,
              unit: line.items?.unit || null,
              total_selling: 0,
              total_quantity: 0,
              buyers_count: 0,
              buyersSet: new Set(),
              hsn_code: line.items?.hsn_code || null,
              tax_rate: line.items?.tax_rates?.rate || null,
              purchase_price: line.items?.purchase_price ? Number(line.items.purchase_price) : null,
              profit: null,
              invoices: []
            });
          }
          
          const group = groupedMap.get(key)!;
          const amount = Number(line.amount || 0);
          const qty = Number(line.quantity || 0);
          
          group.total_selling += amount;
          group.total_quantity += qty;
          if (clientId) group.buyersSet.add(clientId);
          
          group.invoices.push({
            id: line.id,
            invoice_number: line.invoices?.invoice_number || "",
            client_name: clientName,
            issue_date: line.invoices?.issue_date || "",
            quantity: qty,
            rate: Number(line.rate || 0),
            amount: amount
          });
        });

      const items = Array.from(groupedMap.values()).map(group => {
        group.buyers_count = group.buyersSet.size;
        if (group.purchase_price !== null) {
          group.profit = group.total_selling - (group.total_quantity * group.purchase_price);
        }
        return group;
      });
      setData(items);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [org?.id]);

  const filtered = useMemo(() => {
    let arr = [...data];
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((i) =>
        i.item_name.toLowerCase().includes(q) ||
        (i.hsn_code && i.hsn_code.toLowerCase().includes(q)) ||
        (i.tax_rate !== null && i.tax_rate.toString().includes(q)) ||
        i.total_selling.toString().includes(q) ||
        i.invoices.some(inv => 
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.client_name.toLowerCase().includes(q) ||
          inv.amount.toString().includes(q) ||
          inv.rate.toString().includes(q)
        )
      );
    }
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "item_name": av = a.item_name; bv = b.item_name; break;
        case "total_selling": av = a.total_selling; bv = b.total_selling; break;
        case "buyers_count": av = a.buyers_count; bv = b.buyers_count; break;
        case "profit": av = a.profit || 0; bv = b.profit || 0; break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, search, sortKey, sortDir]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
  const fmtDate = (d: string) => d ? new Intl.DateTimeFormat("en-IN").format(new Date(d)) : "";

  const handleSaveHsn = async () => {
    if (!activeItemId) return;
    setSavingHsn(true);
    const { error } = await supabase.from("items").update({ hsn_code: hsnCode }).eq("id", activeItemId);
    setSavingHsn(false);
    if (error) {
      toast({ title: "Failed to update HSN", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "HSN Code updated successfully" });
      setHsnDialogOpen(false);
      setData(prev => prev.map(item => item.item_id === activeItemId ? { ...item, hsn_code: hsnCode } : item));
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Item Name, Invoice #, HSN, Amount, Rate or Client"
              className="pl-10 h-11 border-0 bg-transparent focus-visible:ring-0 text-sm shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="text-sm">
              <span className="font-semibold">Total:</span>{" "}
              <span className="text-muted-foreground">{filtered.length} Items</span>
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No items found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-transparent hover:bg-transparent">
                  <TableHead className="w-10 pl-5"></TableHead>
                  <TableHead onClick={() => toggleSort("item_name")} className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground cursor-pointer select-none">Item Name<SortArrow k="item_name" /></TableHead>
                  <TableHead className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">HSN Code</TableHead>
                  <TableHead className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground text-right">GST Rate</TableHead>
                  <TableHead onClick={() => toggleSort("buyers_count")} className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground cursor-pointer select-none text-right">Buyers<SortArrow k="buyers_count" /></TableHead>
                  <TableHead onClick={() => toggleSort("total_selling")} className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground cursor-pointer select-none text-right">Total Selling<SortArrow k="total_selling" /></TableHead>
                  {org?.inventory_enabled && (
                    <TableHead onClick={() => toggleSort("profit")} className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground cursor-pointer select-none text-right pr-5">Profit<SortArrow k="profit" /></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const isExpanded = expandedId === item.key;
                  return (
                    <React.Fragment key={item.key}>
                      <TableRow 
                        onClick={() => setExpandedId(isExpanded ? null : item.key)} 
                        className={`cursor-pointer hover:bg-muted/40 ${isExpanded ? "bg-muted/20" : ""}`}
                      >
                        <TableCell className="pl-5">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.item_name}
                          {item.unit && <span className="text-muted-foreground text-xs font-normal ml-1">({item.unit})</span>}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {item.hsn_code ? (
                            <span className="text-muted-foreground">{item.hsn_code}</span>
                          ) : item.item_id ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                              onClick={() => {
                                setActiveItemId(item.item_id);
                                setHsnCode("");
                                setHsnDialogOpen(true);
                              }}
                            >
                              <PlusCircle className="h-3 w-3 mr-1" /> Missing
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.tax_rate !== null ? `${item.tax_rate}%` : "—"}</TableCell>
                        <TableCell className="text-right">{item.buyers_count}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(item.total_selling)}</TableCell>
                        {org?.inventory_enabled && (
                          <TableCell className="text-right pr-5">
                            {item.profit !== null ? (
                              <span className={item.profit >= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}>
                                {item.profit > 0 ? "+" : ""}{fmt(item.profit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">No cost data</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={org?.inventory_enabled ? 7 : 6} className="p-0 border-b-0">
                            <div className="p-4 pl-14">
                              <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/30">
                                      <TableHead className="text-xs">Invoice #</TableHead>
                                      <TableHead className="text-xs">Client Name</TableHead>
                                      <TableHead className="text-xs">Date</TableHead>
                                      <TableHead className="text-xs text-right">Qty</TableHead>
                                      <TableHead className="text-xs text-right">Rate</TableHead>
                                      <TableHead className="text-xs text-right">Amount</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {item.invoices.sort((a,b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()).map(inv => (
                                      <TableRow 
                                        key={inv.id} 
                                        className="cursor-pointer hover:bg-muted/50" 
                                        onClick={() => navigate(`/invoices/${inv.id}`)}
                                      >
                                        <TableCell className="text-xs font-medium text-primary hover:underline">{inv.invoice_number}</TableCell>
                                        <TableCell className="text-xs">{inv.client_name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{fmtDate(inv.issue_date)}</TableCell>
                                        <TableCell className="text-xs text-right">{inv.quantity}</TableCell>
                                        <TableCell className="text-xs text-right">{fmt(inv.rate)}</TableCell>
                                        <TableCell className="text-xs text-right font-medium">{fmt(inv.amount)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={hsnDialogOpen} onOpenChange={setHsnDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add HSN Code</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Enter HSN Code" 
              value={hsnCode} 
              onChange={(e) => setHsnCode(e.target.value)} 
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHsnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveHsn} disabled={savingHsn || !hsnCode.trim()}>
              {savingHsn ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
