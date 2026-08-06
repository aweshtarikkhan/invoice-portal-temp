import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Warehouse,
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  User,
  Star,
  CheckCircle2,
  MoreVertical,
  Building2,
} from "lucide-react";
import { AddWarehouseDialog } from "@/components/shared/AddWarehouseDialog";
import { CatalogNav } from "@/components/shared/CatalogNav";
import { useSearchParams } from "react-router-dom";
import { formatCurrency } from "@/lib/currency";

export default function WarehousesPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const shouldOpenAdd = searchParams.get("add") === "1";

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(shouldOpenAdd);
  const [editWarehouse, setEditWarehouse] = useState<any | null>(null);
  const [warehouseValues, setWarehouseValues] = useState<Record<string, number>>({});
  const cur = (org as any)?.currency || "INR";

  const loadWarehouses = async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("warehouses")
        .select("*")
        .eq("org_id", org.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      const { data: movements } = await (supabase as any)
        .from("stock_movements")
        .select("warehouse_id, item_id, change_qty, items(purchase_price)")
        .eq("org_id", org.id);

      if (error) throw error;
      setWarehouses(data || []);
      
      if (movements) {
        const values: Record<string, number> = {};
        const qtyMap: Record<string, Record<string, number>> = {};
        
        movements.forEach((m: any) => {
          if (!m.warehouse_id) return;
          const wid = m.warehouse_id;
          const iid = m.item_id;
          const qty = Number(m.change_qty || 0);
          
          if (!qtyMap[wid]) qtyMap[wid] = {};
          if (!qtyMap[wid][iid]) qtyMap[wid][iid] = 0;
          qtyMap[wid][iid] += qty;
        });
        
        const prices: Record<string, number> = {};
        movements.forEach((m: any) => {
          if (m.items?.purchase_price) prices[m.item_id] = Number(m.items.purchase_price);
        });
        
        Object.keys(qtyMap).forEach(wid => {
          let total = 0;
          Object.keys(qtyMap[wid]).forEach(iid => {
             const netQty = qtyMap[wid][iid];
             if (netQty > 0) {
                total += netQty * (prices[iid] || 0);
             }
          });
          values[wid] = total;
        });
        
        setWarehouseValues(values);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load warehouses",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [org?.id]);

  const orgGstin = (org?.gst_number || org?.tax_number || "").trim().toUpperCase();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter((w) => {
      const name = w.name?.toLowerCase() || "";
      const code = w.address?.code?.toLowerCase() || "";
      const city = w.address?.city?.toLowerCase() || "";
      const state = w.address?.state?.toLowerCase() || "";
      const manager = w.address?.manager?.toLowerCase() || "";
      const gstin = w.address?.gstin?.toLowerCase() || "";
      return (
        name.includes(q) ||
        code.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        manager.includes(q) ||
        gstin.includes(q)
      );
    });
  }, [warehouses, search]);

  const defaultWarehouse = warehouses.find((w) => w.is_default) || warehouses[0];

  const handleMakeDefault = async (wh: any) => {
    if (!org?.id) return;
    try {
      await (supabase as any)
        .from("warehouses")
        .update({ is_default: false })
        .eq("org_id", org.id);

      const { error } = await (supabase as any)
        .from("warehouses")
        .update({ is_default: true })
        .eq("id", wh.id);

      if (error) throw error;
      toast({ title: `"${wh.name}" is now the default warehouse.` });
      loadWarehouses();
    } catch (err: any) {
      toast({ title: "Failed to update default warehouse", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (wh: any) => {
    if (!confirm(`Are you sure you want to delete "${wh.name}"?`)) return;
    try {
      const { error } = await (supabase as any)
        .from("warehouses")
        .delete()
        .eq("id", wh.id);

      if (error) throw error;
      toast({ title: "Warehouse deleted successfully" });
      loadWarehouses();
    } catch (err: any) {
      toast({
        title: "Failed to delete warehouse",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (wh: any) => {
    setEditWarehouse(wh);
    setDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditWarehouse(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <SEO title="Warehouses - BillFlow" description="Manage warehouses, fulfillment centers and storage locations." />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Warehouses & Godowns</h1>
            <CatalogNav active="warehouses" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Track and organize inventory stock across multiple storage locations and fulfillment centers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Warehouse
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
              <Warehouse className="h-4 w-4 text-primary" /> Total Locations
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{warehouses.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Active warehouses in your organization
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Default Warehouse
            </CardDescription>
            <CardTitle className="text-xl font-bold truncate">
              {defaultWarehouse ? defaultWarehouse.name : "None Set"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {defaultWarehouse?.address?.city
              ? `${defaultWarehouse.address.city}, ${defaultWarehouse.address.state || ""}`
              : "Auto-selected for new challans and GRNs"}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
              <Building2 className="h-4 w-4 text-emerald-600" /> Mode
            </CardDescription>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Multi-Warehouse Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Stock can be separated per location
          </CardContent>
        </Card>
      </div>

      {/* Warehouses Table / Search */}
      <Card className="border-border/60">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by warehouse name, city, GSTIN, code..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Showing {filtered.length} of {warehouses.length} warehouse(s)
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Loading warehouses...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Warehouse}
                title={search ? "No matching warehouses found" : "No warehouses added yet"}
                description={
                  search
                    ? "Try adjusting your search criteria"
                    : "Create your first warehouse or godown to start tracking stock across locations."
                }
                actionLabel={search ? undefined : "Add Warehouse"}
                onAction={search ? undefined : handleOpenNew}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Location / Address</TableHead>
                  <TableHead>Manager / Contact</TableHead>
                  <TableHead className="text-right">Inventory Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((wh) => {
                  const addr = wh.address || {};
                  const addressParts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
                  const effectiveGstin = addr.gstin || (addr.gst_type === "same" ? orgGstin : "");
                  const isSeparateGst = addr.gst_type === "different" || (addr.gstin && addr.gstin !== orgGstin);

                  return (
                    <TableRow key={wh.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            <Warehouse className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {wh.name}
                              {wh.is_default && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0 h-4">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {addr.code || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {effectiveGstin ? (
                          <div className="space-y-1">
                            <div className="font-mono text-xs font-semibold text-foreground tracking-wide">
                              {effectiveGstin}
                            </div>
                            <div>
                              {isSeparateGst ? (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                  Separate GST
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Org GST
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">Not Set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[260px]">
                          {addressParts.length > 0 ? (
                            <>
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="truncate">{addressParts.join(", ")}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground/60">No address added</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          {addr.manager && (
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {addr.manager}
                            </div>
                          )}
                          {addr.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {addr.phone}
                            </div>
                          )}
                          {!addr.manager && !addr.phone && (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {warehouseValues[wh.id] ? formatCurrency(warehouseValues[wh.id], cur) : "-"}
                      </TableCell>
                      <TableCell>
                        {wh.is_default ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit text-xs">
                            <CheckCircle2 className="h-3 w-3" /> Primary
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleMakeDefault(wh)}
                          >
                            Set Default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleOpenEdit(wh)}
                            title="Edit Warehouse"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(wh)}
                            title="Delete Warehouse"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <AddWarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editWarehouse={editWarehouse}
        onWarehouseAdded={() => {
          loadWarehouses();
        }}
      />
    </div>
  );
}
