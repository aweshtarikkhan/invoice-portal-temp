import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { COMMON_UNITS } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImportDialog, ImportField } from "@/components/shared/ImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/dialog";
import { ItemFormDialog } from "@/components/shared/ItemFormDialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Search, Upload, Download, Trash2, FileText, Tag, Users, Database, ArrowRight, X, Settings, Info, Ruler } from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";
import { Badge } from "@/components/ui/badge";



const itemImportFields: ImportField[] = [
  { key: "name", label: "Item Name", required: true },
  { key: "description", label: "Description" },
  { key: "sku", label: "SKU" },
  { key: "type", label: "Product Type (service/product/goods)" },
  { key: "unit_price", label: "Rate / Price" },
  { key: "unit", label: "Unit" },
  { key: "tax_name", label: "Tax Name" },
  { key: "is_active", label: "Active (true/false)" },
];

export default function ItemsPage() {
  const org = useAppStore((s) => s.organization);
  const [items, setItems] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState("all");


  const fetchItems = async () => {
    if (!org?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("items")
      .select("*, tax_rates(name, rate)")
      .eq("org_id", org.id)
      .order("name");
    setItems(data || []);
    const { data: taxes } = await supabase
      .from("tax_rates")
      .select("*")
      .eq("org_id", org.id);
    setTaxRates(taxes || []);

    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [org?.id]);

  const resetForm = () => {
    setEditItem(null);
  };

  const categories = useMemo(() => {
    const cats = new Set(items.map((i: any) => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const openCreate = () => { 
    resetForm(); 
    setDialogOpen(true); 
  };

  const openEdit = async (item: any) => {
    if (selected.size > 0) return;
    setEditItem(item);
    setDialogOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  const handleDeleteSelected = async () => {
    setDeleting(true);
    const ids = Array.from(selected);
    // Remove references in invoice_lines, estimate_lines, credit_note_lines
    await supabase.from("invoice_lines").update({ item_id: null }).in("item_id", ids);
    await supabase.from("estimate_lines").update({ item_id: null }).in("item_id", ids);
    await supabase.from("credit_note_lines").update({ item_id: null }).in("item_id", ids);
    const { error } = await supabase.from("items").delete().in("id", ids);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} item(s) deleted` });
    }
    setSelected(new Set());
    setDeleteOpen(false);
    setDeleting(false);
    fetchItems();
  };

  const filtered = items.filter((i) => {
    const matchSearch = [i.name, i.sku, i.description].filter(Boolean).some((f) => f.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === "all" || (i.category || "") === categoryFilter;
    return matchSearch && matchCategory;
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const parsePrice = (val: any): number => {
    if (val == null) return 0;
    const s = String(val).replace(/[^0-9.\-]/g, "");
    return parseFloat(s) || 0;
  };

  const normalizeType = (val: any): "service" | "product" => {
    const v = String(val || "").toLowerCase().trim();
    if (v === "product" || v === "goods") return "product";
    return "service";
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Products and services catalog</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" className="h-10 rounded-lg" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete ({selected.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-10 rounded-lg px-4" onClick={() => {
            downloadCSV(items.map(i => ({
              name: i.name,
              description: i.description || "",
              sku: i.sku || "",
              type: i.type,
              rate: i.unit_price,
              unit: i.unit || "",
              tax: (i as any).tax_rates?.name || "",
            })), "items");
          }}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" className="h-10 rounded-lg px-4" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" /> Import
          </Button>
          <Button onClick={openCreate} size="sm" className="h-10 rounded-lg px-4">
            <Plus className="mr-1.5 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-10 h-11 rounded-xl bg-card border-border/60 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 shadow-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Package} title="No items yet" description="Add products or services to use in invoices." actionLabel="Add Item" onAction={openCreate} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => openEdit(item)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.type}</Badge>
                    </TableCell>
                    <TableCell>{item.category ? <Badge variant="outline">{item.category}</Badge> : "—"}</TableCell>
                    <TableCell>{item.unit || "—"}</TableCell>
                    <TableCell className="text-right">{fmt(Number(item.unit_price))}</TableCell>
                    <TableCell className={`text-right ${org?.inventory_enabled && item.type === "product" && Number(item.stock_quantity) <= Number(org?.low_stock_threshold ?? 5) ? "text-destructive font-medium" : ""}`}>
                      {org?.inventory_enabled && item.type === "product" ? Number(item.stock_quantity) : "—"}
                    </TableCell>
                    <TableCell>{item.tax_rates ? `${item.tax_rates.name} (${item.tax_rates.rate}%)` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} Item(s)?</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected items. Invoice/estimate line items referencing them will be unlinked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ItemFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        editItem={editItem} 
        onItemSaved={() => fetchItems()} 
        categories={categories}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={itemImportFields}
        entityName="Items"
        onImport={async (rows) => {
          let success = 0, errors = 0;
          for (const row of rows) {
            const matchedTax = row.tax_name ? taxRates.find((t: any) => t.name.toLowerCase() === row.tax_name.toLowerCase()) : null;
            const price = parsePrice(row.unit_price);
            const type = normalizeType(row.type);
            const { error } = await supabase.from("items").insert({
              org_id: org!.id,
              name: row.name || "Unnamed",
              description: row.description || null,
              sku: row.sku || null,
              type,
              unit_price: price,
              unit: row.unit || null,
              tax_id: matchedTax?.id || null,
              is_active: row.is_active === "false" ? false : true,
            });
            if (error) errors++; else success++;
          }
          fetchItems();
          return { success, errors };
        }}
      />
    </div>
  );
}
