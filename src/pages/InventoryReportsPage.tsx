import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Package, AlertTriangle, ArrowRightLeft, IndianRupee, Download, FileText, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#64748b", "#84cc16"];

export default function InventoryReportsPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [billLines, setBillLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org?.id) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      const [itemsRes, movementsRes, billLinesRes] = await Promise.all([
        (supabase as any).from("items").select("*").eq("org_id", org.id).order("name"),
        (supabase as any).from("stock_movements").select("*, items(name, type)").eq("org_id", org.id).order("created_at", { ascending: false }),
        (supabase as any).from("bill_lines").select("item_id, quantity, rate, bills(status, deduct_stock)").eq("org_id", org.id)
      ]);
      
      const rawItems = itemsRes.data || [];
      const rawBillLines = billLinesRes.data || [];
      setMovements(movementsRes.data || []);
      setBillLines(rawBillLines);

      // Enhance items with accurate stock quantity & purchase cost
      const enhanced = rawItems.map((item: any) => {
        let stock = Number(item?.stock_quantity ?? item?.quantity ?? 0);
        
        // If stock is 0, check if this item was purchased on a purchase invoice
        if (item?.type !== "service") {
          const purchasedQty = rawBillLines
            .filter((bl: any) => bl.item_id === item.id && bl.bills?.status !== "cancelled")
            .reduce((sum: number, bl: any) => sum + (Number(bl.quantity) || 0), 0);
          
          if (stock === 0 && purchasedQty > 0) {
            stock = purchasedQty;
            // Background sync to items table to permanently update stock_quantity
            (supabase as any)
              .from("items")
              .update({ stock_quantity: purchasedQty })
              .eq("id", item.id)
              .then();
          }
        }

        const pPrice = Number(item?.purchase_price) || 0;
        const recentBillRate = Number(rawBillLines.find((bl: any) => bl.item_id === item.id && Number(bl.rate) > 0)?.rate) || 0;
        const uPrice = Number(item?.unit_price) || 0;
        const effectiveCost = pPrice > 0 ? pPrice : (recentBillRate > 0 ? recentBillRate : uPrice);
        
        const reorderLevel = Number(item?.low_stock_threshold ?? item?.reorder_level ?? org?.low_stock_threshold ?? 5);
        const isLow = item?.type !== "service" && stock <= reorderLevel;
        const isOut = item?.type !== "service" && stock <= 0;
        const itemValuation = item?.type === "service" ? 0 : (stock * effectiveCost);

        return {
          ...item,
          displayQty: stock,
          effectiveCost,
          itemValuation,
          reorderLevel,
          isLow,
          isOut
        };
      });

      setItems(enhanced);
      setLoading(false);
    };
    
    fetchData();
  }, [org?.id]);

  const currency = (org as any)?.currency || (org as any)?.currency_code || "INR";

  const stats = useMemo(() => {
    const safeItems = items || [];
    const safeMovements = movements || [];
    const totalItems = safeItems.length;
    
    const productItems = safeItems.filter(item => item?.type !== 'service');
    
    // Total stock valuation: sum of (effectiveStock * effectiveCost) for product items
    const totalValue = productItems.reduce((sum, item) => sum + (Number(item?.itemValuation) || 0), 0);
    
    // Low stock items: only product items where stock <= reorderLevel
    const lowStockItems = productItems.filter(item => item?.isLow);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const thisMonthMovements = safeMovements.filter(m => {
      const dStr = m.created_at || m.movement_date;
      if (!dStr) return false;
      const d = new Date(dStr);
      return !isNaN(d.getTime()) && isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
    
    return {
      totalItems,
      totalValue,
      lowStockItems,
      allProductItems: productItems,
      totalMovementsThisMonth: thisMonthMovements.length
    };
  }, [items, movements]);

  const itemsByType = useMemo(() => {
    const safeItems = items || [];
    const counts = safeItems.reduce((acc, item) => {
      const type = item?.type || 'product';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Unknown',
      value
    }));
  }, [items]);

  const movementsByMonth = useMemo(() => {
    const safeMovements = movements || [];
    const data: Record<string, { in: number, out: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      data[format(d, 'MMM yyyy')] = { in: 0, out: 0 };
    }
    
    safeMovements.forEach(m => {
      const dateStr = m.created_at || m.movement_date;
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const monthStr = format(d, 'MMM yyyy');
        if (data[monthStr]) {
          const qty = Number(m.change_qty ?? m.quantity ?? 0);
          if (qty > 0 || m.type?.toUpperCase() === 'IN') {
            data[monthStr].in += Math.abs(qty);
          } else {
            data[monthStr].out += Math.abs(qty);
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    return Object.entries(data).map(([month, values]) => ({
      month,
      IN: values.in,
      OUT: values.out
    }));
  }, [movements]);

  return (
    <div className="space-y-6" id="inventory-report-page">
      <SEO title="Inventory Reports" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory Reports</h1>
          <p className="text-muted-foreground">View analytics and KPIs for your inventory and stock movements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/inventory")}>
            <Package className="mr-1.5 h-4 w-4" /> Go to Inventory
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Reports
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Catalog items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(stats.totalValue, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Valuation based on purchase cost/rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.lowStockItems.length > 0 ? "text-destructive" : "text-emerald-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.lowStockItems.length > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {stats.lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Items at or below reorder level</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Movements This Month</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovementsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Inbound / outbound stock logs</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Movements (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementsByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="IN" name="Stock In" fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="OUT" name="Stock Out" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {itemsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={itemsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {itemsByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No items available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactive Stock Tables */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Stock Inventory Status</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Live stock quantities, reorder thresholds, and valuations</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ["Item Name", "Type", "Current Stock", "Cost/Rate", "Total Valuation", "Reorder Level", "Status"];
                const rows = (stats.allProductItems || []).map(item => [
                  item.name,
                  item.type || 'Product',
                  `${item.displayQty} ${item.unit || ''}`.trim(),
                  formatCurrency(item.effectiveCost, currency),
                  formatCurrency(item.itemValuation, currency),
                  item.reorderLevel,
                  item.displayQty <= 0 ? "Out of Stock" : (item.isLow ? "Low Stock" : "In Stock")
                ]);
                exportTableToCSV(headers, rows, "inventory_stock_report");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ["Item Name", "Type", "Current Stock", "Cost/Rate", "Total Valuation", "Reorder Level", "Status"];
                const rows = (stats.allProductItems || []).map(item => [
                  item.name,
                  item.type || 'Product',
                  `${item.displayQty} ${item.unit || ''}`.trim(),
                  formatCurrency(item.effectiveCost, currency),
                  formatCurrency(item.itemValuation, currency),
                  item.reorderLevel,
                  item.displayQty <= 0 ? "Out of Stock" : (item.isLow ? "Low Stock" : "In Stock")
                ]);
                exportTableToPDF("Inventory Stock Report", headers, rows, "inventory_stock_report");
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <span>All Products ({stats.allProductItems.length})</span>
              </TabsTrigger>
              <TabsTrigger value="low" className="flex items-center gap-1.5">
                <AlertTriangle className={`h-4 w-4 ${stats.lowStockItems.length > 0 ? "text-amber-500" : ""}`} />
                <span>Low Stock Alerts ({stats.lowStockItems.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* All Products Tab */}
            <TabsContent value="all">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Cost / Rate</TableHead>
                    <TableHead className="text-right">Total Stock Value</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading items...
                      </TableCell>
                    </TableRow>
                  ) : stats.allProductItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No product items found. Add items to inventory.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.allProductItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{item.type || 'Product'}</TableCell>
                        <TableCell className="text-right font-bold text-slate-800">
                          {item.displayQty} {item.unit || "pcs"}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatCurrency(item.effectiveCost, currency)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">
                          {formatCurrency(item.itemValuation, currency)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.reorderLevel} {item.unit || "pcs"}</TableCell>
                        <TableCell className="text-right">
                          {item.displayQty <= 0 ? (
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
                              Out of Stock
                            </Badge>
                          ) : item.isLow ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Low Stock Alerts Tab */}
            <TabsContent value="low">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading items...
                      </TableCell>
                    </TableRow>
                  ) : stats.lowStockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-emerald-600 font-medium">
                        <CheckCircle2 className="inline-block h-4 w-4 mr-1.5" />
                        No low stock items! All products are adequately stocked above their reorder levels.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.lowStockItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{item.type || 'Product'}</TableCell>
                        <TableCell className="text-right text-destructive font-bold">
                          {item.displayQty} {item.unit || "pcs"}
                        </TableCell>
                        <TableCell className="text-right">{item.reorderLevel} {item.unit || "pcs"}</TableCell>
                        <TableCell className="text-right">
                          {item.displayQty <= 0 ? (
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
                              Out of Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                              Low Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
