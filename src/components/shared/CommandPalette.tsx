import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  User,
  Users,
  Package,
  Truck,
  Briefcase,
  Compass,
  ArrowRight,
  Loader2,
  PlusCircle,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";

const routes = [
  { label: "Dashboard", path: "/dashboard", group: "Pages", icon: Compass },
  { label: "Invoices", path: "/invoices", group: "Pages", icon: FileText },
  { label: "Quotations / Estimates", path: "/quotations", group: "Pages", icon: FileText },
  { label: "New Invoice", path: "/invoices/new", group: "Actions", icon: PlusCircle },
  { label: "New Quotation", path: "/quotations/new", group: "Actions", icon: PlusCircle },
  { label: "Clients", path: "/clients", group: "Pages", icon: User },
  { label: "Items & Catalog", path: "/items", group: "Pages", icon: Package },
  { label: "Inventory Stock", path: "/inventory", group: "Pages", icon: Package },
  { label: "Vendors & Suppliers", path: "/vendors", group: "Pages", icon: Truck },
  { label: "Purchase Invoices", path: "/purchase-invoices", group: "Pages", icon: FileText },
  { label: "Employees & Staff", path: "/employees", group: "Pages", icon: Users },
  { label: "Attendance Portal", path: "/attendance", group: "Pages", icon: Briefcase },
  { label: "Leaves Management", path: "/leaves", group: "Pages", icon: Briefcase },
  { label: "Payroll", path: "/payroll", group: "Pages", icon: Briefcase },
  { label: "Leads (CRM)", path: "/leads", group: "Pages", icon: User },
  { label: "Warehouses", path: "/warehouses", group: "Pages", icon: Package },
  { label: "Payments Received", path: "/payments", group: "Pages", icon: FileText },
  { label: "Record Payment", path: "/payments/new", group: "Actions", icon: PlusCircle },
  { label: "Audit Logs", path: "/audit-logs", group: "Pages", icon: Compass },
  { label: "Settings", path: "/settings", group: "Pages", icon: Compass },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Strict tenant-scoped search across invoices, clients, items, vendors, employees (Case 33)
  useEffect(() => {
    const cleanQ = query.trim();
    if (!open || !org?.id || cleanQ.length < 2) {
      setInvoices([]);
      setClients([]);
      setItems([]);
      setVendors([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [invRes, cliRes, itmRes, venRes, empRes] = await Promise.allSettled([
          supabase
            .from("invoices")
            .select("id, invoice_number, total, balance_due, status")
            .eq("org_id", org.id)
            .ilike("invoice_number", `%${cleanQ}%`)
            .limit(5),
          supabase
            .from("clients")
            .select("id, display_name, company_name, phone, email")
            .eq("org_id", org.id)
            .or(`display_name.ilike.%${cleanQ}%,company_name.ilike.%${cleanQ}%,phone.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%`)
            .limit(5),
          supabase
            .from("items")
            .select("id, name, sku, selling_price, stock_quantity")
            .eq("org_id", org.id)
            .or(`name.ilike.%${cleanQ}%,sku.ilike.%${cleanQ}%`)
            .limit(5),
          supabase
            .from("vendors")
            .select("id, name, display_name, phone, email")
            .eq("org_id", org.id)
            .or(`name.ilike.%${cleanQ}%,display_name.ilike.%${cleanQ}%,phone.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%`)
            .limit(5),
          supabase
            .from("employees")
            .select("id, name, employee_code, designation")
            .eq("org_id", org.id)
            .or(`name.ilike.%${cleanQ}%,employee_code.ilike.%${cleanQ}%,designation.ilike.%${cleanQ}%`)
            .limit(5),
        ]);

        if (invRes.status === "fulfilled") setInvoices(invRes.value.data || []);
        if (cliRes.status === "fulfilled") setClients(cliRes.value.data || []);
        if (itmRes.status === "fulfilled") setItems(itmRes.value.data || []);
        if (venRes.status === "fulfilled") setVendors(venRes.value.data || []);
        if (empRes.status === "fulfilled") setEmployees(empRes.value.data || []);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open, org?.id]);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const matchingRoutes = routes.filter((r) =>
    !query.trim() || r.label.toLowerCase().includes(query.toLowerCase())
  );

  const hasAnyResults =
    matchingRoutes.length > 0 ||
    invoices.length > 0 ||
    clients.length > 0 ||
    items.length > 0 ||
    vendors.length > 0 ||
    employees.length > 0;

  return (
    <>
      <button
        className="flex h-10 w-64 items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search anything...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded bg-slate-200/50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 sm:flex dark:bg-slate-800 dark:text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <div className="relative">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search invoices, clients, items, staff, pages (this business only)..."
          />
          {loading && (
            <div className="absolute right-4 top-3.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Searching...</span>
            </div>
          )}
        </div>

        <CommandList className="max-h-[380px] overflow-y-auto">
          {!loading && !hasAnyResults && (
            <CommandEmpty>No results found for "{query}".</CommandEmpty>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <CommandGroup heading="Invoices">
              {invoices.map((inv) => (
                <CommandItem
                  key={`inv-${inv.id}`}
                  onSelect={() => handleSelect(`/invoices/${inv.id}`)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="font-semibold">{inv.invoice_number}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ₹{Number(inv.total || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[11px] capitalize">
                    {inv.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Clients */}
          {clients.length > 0 && (
            <CommandGroup heading="Clients & Customers">
              {clients.map((c) => (
                <CommandItem
                  key={`cli-${c.id}`}
                  onSelect={() => handleSelect(`/clients/${c.id}`)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-medium">{c.display_name}</span>
                      {c.company_name && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({c.company_name})
                        </span>
                      )}
                    </div>
                  </div>
                  {c.phone && (
                    <span className="text-xs font-mono text-muted-foreground">{c.phone}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Items */}
          {items.length > 0 && (
            <CommandGroup heading="Items & Inventory">
              {items.map((item) => (
                <CommandItem
                  key={`item-${item.id}`}
                  onSelect={() => handleSelect(`/items`)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="h-4 w-4 text-purple-500 shrink-0" />
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.sku && (
                        <span className="text-xs font-mono text-muted-foreground ml-2">
                          [{item.sku}]
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold">
                      ₹{Number(item.selling_price || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-2">
                      ({item.stock_quantity ?? 0} in stock)
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Vendors */}
          {vendors.length > 0 && (
            <CommandGroup heading="Vendors & Suppliers">
              {vendors.map((v) => (
                <CommandItem
                  key={`ven-${v.id}`}
                  onSelect={() => handleSelect(`/vendors/${v.id}`)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-medium">{v.name || v.display_name}</span>
                    </div>
                  </div>
                  {v.phone && (
                    <span className="text-xs font-mono text-muted-foreground">{v.phone}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Employees */}
          {employees.length > 0 && (
            <CommandGroup heading="Employees & Staff">
              {employees.map((emp) => (
                <CommandItem
                  key={`emp-${emp.id}`}
                  onSelect={() => handleSelect(`/employees`)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="font-medium">{emp.name}</span>
                      {emp.designation && (
                        <span className="text-xs text-muted-foreground ml-2">
                          • {emp.designation}
                        </span>
                      )}
                    </div>
                  </div>
                  {emp.employee_code && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {emp.employee_code}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Navigation Pages & Actions */}
          {["Actions", "Pages"].map((grp) => {
            const grpItems = matchingRoutes.filter((r) => r.group === grp);
            if (!grpItems.length) return null;
            return (
              <CommandGroup key={grp} heading={grp}>
                {grpItems.map((item) => {
                  const Icon = item.icon || ArrowRight;
                  return (
                    <CommandItem
                      key={item.path}
                      onSelect={() => handleSelect(item.path)}
                      className="flex items-center gap-2.5 py-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{item.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
