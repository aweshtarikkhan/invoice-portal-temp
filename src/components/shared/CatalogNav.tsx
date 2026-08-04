import { NavLink } from "react-router-dom";
import { Package, Boxes, Warehouse } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface CatalogNavProps {
  active: "items" | "inventory" | "warehouses";
  className?: string;
}

export function CatalogNav({ active, className }: CatalogNavProps) {
  const org = useAppStore((s) => s.organization);
  const inventoryEnabled = (org as any)?.inventory_enabled;
  const multiWarehouseEnabled = (org as any)?.multi_warehouse_enabled;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/40 rounded-xl w-fit border border-border/50 shadow-sm", className)}>
      <NavLink
        to="/items"
        className={cn(
          "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all",
          active === "items"
            ? "bg-background text-foreground shadow-sm shadow-black/5 font-semibold text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <Package className="h-4 w-4" />
        <span>Items</span>
      </NavLink>

      {inventoryEnabled && (
        <NavLink
          to="/inventory"
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all",
            active === "inventory"
              ? "bg-background text-foreground shadow-sm shadow-black/5 font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Boxes className="h-4 w-4" />
          <span>Inventory</span>
        </NavLink>
      )}

      {multiWarehouseEnabled && (
        <NavLink
          to="/warehouses"
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all",
            active === "warehouses"
              ? "bg-background text-foreground shadow-sm shadow-black/5 font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Warehouse className="h-4 w-4" />
          <span>Warehouses</span>
        </NavLink>
      )}
    </div>
  );
}
