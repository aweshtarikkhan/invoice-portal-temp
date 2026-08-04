import os

file_path = os.path.join(os.getcwd(), 'src', 'pages', 'ItemsPage.tsx')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update lucide-react imports
if 'ArrowDown' not in content:
    content = content.replace(
        'import { Plus, Package, Search, Upload, Download, Trash2, FileText, Tag, Users, Database, ArrowRight, X, Settings, Info, Ruler, Warehouse } from "lucide-react";',
        'import { Plus, Package, Search, Upload, Download, Trash2, FileText, Tag, Users, Database, ArrowRight, X, Settings, Info, Ruler, Warehouse, ArrowDown, ArrowUp, ArrowUpDown, CalendarClock } from "lucide-react";\nimport { format } from "date-fns";'
    )

# 2. Add state
if 'const [sortField, setSortField] = useState<string>("name");' not in content:
    content = content.replace(
        '  const [loading, setLoading] = useState(true);',
        '  const [loading, setLoading] = useState(true);\n  const [sortField, setSortField] = useState<string>("name");\n  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");'
    )

# 3. Add handleSort and SortIcon
sort_funcs = """
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/40" />;
    return sortDirection === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };
"""
if 'const handleSort' not in content:
    content = content.replace(
        '  const openEdit = (i: any) => {',
        sort_funcs + '\n  const openEdit = (i: any) => {'
    )

# 4. Update filtered logic
old_filtered = """  const filtered = items.filter((i) => {
    const matchSearch = [i.name, i.sku, i.description].filter(Boolean).some((f) => f.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === "all" || (i.category || "") === categoryFilter;
    return matchSearch && matchCategory;
  });"""

new_filtered = """  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      const matchSearch = [i.name, i.sku, i.description].filter(Boolean).some((f) => f.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === "all" || (i.category || "") === categoryFilter;
      return matchSearch && matchCategory;
    });

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "price") {
        valA = Number(a.unit_price) * (1 - (Number(a.discount) || 0) / 100);
        valB = Number(b.unit_price) * (1 - (Number(b.discount) || 0) / 100);
      } else if (sortField === "stock") {
        valA = Number(a.stock_quantity) || 0;
        valB = Number(b.stock_quantity) || 0;
      } else if (sortField === "tax") {
        valA = a.tax_rates?.rate || 0;
        valB = b.tax_rates?.rate || 0;
      } else if (sortField === "expiry_date") {
        valA = a.has_expiry && a.expiry_date ? new Date(a.expiry_date).getTime() : (sortDirection === 'asc' ? float('inf') : float('-inf'));
        valB = b.has_expiry && b.expiry_date ? new Date(b.expiry_date).getTime() : (sortDirection === 'asc' ? float('inf') : float('-inf'));
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, search, categoryFilter, sortField, sortDirection]);"""
  
new_filtered = new_filtered.replace("float('inf')", "Infinity").replace("float('-inf')", "-Infinity")

if 'const filtered = items.filter((i) => {' in content:
    content = content.replace(old_filtered, new_filtered)


# 5. Update TableHeader
old_table_header = """              <TableHeader>
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
              </TableHeader>"""

new_table_header = """              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>Name <SortIcon field="name" /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("sku")}>SKU <SortIcon field="sku" /></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("expiry_date")}>Expiry Date <SortIcon field="expiry_date" /></TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("price")}>Rate <SortIcon field="price" /></TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("stock")}>Stock <SortIcon field="stock" /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("tax")}>Tax <SortIcon field="tax" /></TableHead>
                </TableRow>
              </TableHeader>"""
if old_table_header in content:
    content = content.replace(old_table_header, new_table_header)

# 6. Update TableBody rows (add expiry cell)
old_cell = '<TableCell>{item.category ? <Badge variant="outline">{item.category}</Badge> : "—"}</TableCell>'
new_cell = '''<TableCell>{item.category ? <Badge variant="outline">{item.category}</Badge> : "—"}</TableCell>
                    <TableCell>
                      {item.has_expiry ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                          {item.expiry_date ? format(new Date(item.expiry_date), "MMM d, yyyy") : "Not Set"}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>'''
if new_cell not in content:
    content = content.replace(old_cell, new_cell)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
