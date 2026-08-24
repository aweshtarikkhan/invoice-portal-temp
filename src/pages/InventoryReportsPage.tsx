import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Package, AlertTriangle, ArrowRightLeft, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#94a3b8"];

export default function InventoryReportsPage() {
  const org = useAppStore((s) => s.organization);
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org?.id) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      const [itemsRes, movementsRes] = await Promise.all([
        (supabase as any).from("items").select("*").eq("org_id", org.id),
        (supabase as any).from("stock_movements").select("*, items(name, type)").eq("org_id", org.id)
      ]);
      
      if (itemsRes.data) setItems(itemsRes.data);
      if (movementsRes.data) setMovements(movementsRes.data);
      
      setLoading(false);
    };
    
    fetchData();
  }, [org?.id]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    
    const totalValue = items.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.cost || item.rate || 0);
    }, 0);
    
    const lowStockItems = items.filter(item => {
      if (item.type === 'service') return false;
      const reorderLevel = item.reorder_level ?? 5;
      return (item.quantity || 0) <= reorderLevel;
    });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const thisMonthMovements = movements.filter(m => {
      if (!m.movement_date) return false;
      return isWithinInterval(parseISO(m.movement_date), { start: monthStart, end: monthEnd });
    });
    
    return {
      totalItems,
      totalValue,
      lowStockItems,
      totalMovementsThisMonth: thisMonthMovements.length
    };
  }, [items, movements]);

  const itemsByType = useMemo(() => {
    const counts = items.reduce((acc, item) => {
      const type = item.type || 'product';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [items]);

  const movementsByMonth = useMemo(() => {
    const data: Record<string, { in: number, out: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      data[format(d, 'MMM yyyy')] = { in: 0, out: 0 };
    }
    
    movements.forEach(m => {
      if (!m.movement_date) return;
      const monthStr = format(parseISO(m.movement_date), 'MMM yyyy');
      if (data[monthStr]) {
        if (m.type?.toUpperCase() === 'IN' || m.quantity > 0) {
          data[monthStr].in += Math.abs(m.quantity);
        } else {
          data[monthStr].out += Math.abs(m.quantity);
        }
      }
    });
    
    return Object.entries(data).map(([month, values]) => ({
      month,
      IN: values.in,
      OUT: values.out
    }));
  }, [movements]);

  return (
    <div className="space-y-6">
      <SEO title="Inventory Reports" />
      <PageHeader
        title="Inventory Reports"
        description="View analytics and KPIs for your inventory and stock movements."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalValue, org?.currency || "INR")}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Movements This Month</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovementsThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Movements (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
            ) : movementsByMonth.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="IN" name="Stock In" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="OUT" name="Stock Out" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
            ) : itemsByType.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={itemsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {itemsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No low stock items found.
                  </TableCell>
                </TableRow>
              ) : (
                stats.lowStockItems.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="capitalize">{item.type || 'Product'}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{item.quantity || 0}</TableCell>
                    <TableCell className="text-right">{item.reorder_level || 5}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive">
                        Low Stock
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
