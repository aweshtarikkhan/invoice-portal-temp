import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSequenceNumber } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { logStockMovements, detectNegativeStock } from "@/lib/stock";
import { CustomFieldsForm, saveCustomFieldValues } from "@/components/shared/CustomFieldsForm";
import { CURRENCIES, formatCurrency } from "@/lib/currency";
import { COMMON_UNITS, INDIAN_STATES, INDIAN_GST_SLABS } from "@/lib/constants";
import { stateCodeFromGstin } from "@/lib/gst";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, Trash2, Plus, GripVertical, Printer, Share2, Clock, ChevronDown, AlertTriangle, Layers, Check, Mail, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContactPromptDialog } from "@/components/shared/ContactPromptDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BillSettingsSheet } from "@/components/shared/BillSettingsSheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddVendorDialog } from "@/components/shared/AddVendorDialog";
import { openWhatsappShare } from "@/lib/share";
import { ItemFormDialog } from "@/components/shared/ItemFormDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LineItem {
  id: string;
  item_id: string | null;
  name: string;
  description: string;
  unit: string;
  quantity: any;
  rate: any;
  discount: any;
  discount_type: "percentage" | "fixed";
  tax_id: string | null;
  tax_amount: number;
  amount: number;
  hsn_code: string;
  sub_unit?: string;
  sub_unit_conversion_rate?: number;
  primary_unit?: string;
  base_unit_price?: number;
  expiry_warning?: string;
}

const UNITS = COMMON_UNITS;

function createEmptyLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    item_id: null,
    name: "",
    description: "",
    unit: "pcs",
    quantity: 1,
    rate: "",
    discount: "",
    discount_type: "percentage",
    tax_id: null,
    tax_amount: 0,
    amount: 0,
    hsn_code: "",
    sub_unit: "",
    sub_unit_conversion_rate: 1,
    primary_unit: "pcs",
    base_unit_price: 0,
  };
}

function SortableLineItem({
  line,
  index,
  taxRates,
  items,
  onChange,
  onRemove,
  onAddItem,
  currency,
}: {
  line: LineItem;
  index: number;
  taxRates: any[];
  items: any[];
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onAddItem: () => void;
  currency: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: line.id });
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleItemSelect = async (item: any) => {
    onChange(index, "item_id", item.id);
    onChange(index, "name", item.name);
    if (item.has_expiry && item.expiry_date) {
      const exp = new Date(item.expiry_date);
      const now = new Date();
      const days = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
      const { format } = await import("date-fns");
      if (days < 0) {
        onChange(index, "expiry_warning", `Expired on ${format(exp, 'MMM d, yyyy')}`);
      } else if (days < 30) {
        onChange(index, "expiry_warning", `Expiring on ${format(exp, 'MMM d, yyyy')}`);
      } else {
        onChange(index, "expiry_warning", "");
      }
    } else {
      onChange(index, "expiry_warning", "");
    }
    let extraDesc = "";
    const { data: cfs } = await supabase
      .from("custom_field_values")
      .select("value, custom_field_definitions(field_name)")
      .eq("entity_id", item.id);
      
    if (cfs && cfs.length > 0) {
      extraDesc = cfs
        .filter((cf: any) => cf.value)
        .map((cf: any) => `${(cf.custom_field_definitions as any)?.field_name}: ${cf.value}`)
        .join("\n");
    }
    onChange(index, "description", item.description ? (extraDesc ? `${item.description}\n${extraDesc}` : item.description) : extraDesc);
        let __rate = Number(item.unit_price) || 0;
    const __priceType = window.location.pathname.includes("bill") || window.location.pathname.includes("purchase") || window.location.pathname.includes("grn") ? (item.purchase_price_type || "without_tax") : (item.sales_price_type || "without_tax");
    if (__priceType === "with_tax" && item.tax_id) {
      const __tax = taxRates.find((t: any) => t.id === item.tax_id);
      if (__tax && Number(__tax.rate) > 0) {
        __rate = Number((__rate / (1 + Number(__tax.rate) / 100)).toFixed(2));
      }
    }
    onChange(index, "rate", __rate);
    onChange(index, "discount", Number(item.discount) || 0);
    onChange(index, "discount_type", "percentage");
    onChange(index, "unit", item.unit || "pcs");
    onChange(index, "primary_unit", item.unit || "pcs");
    onChange(index, "base_unit_price", Number(item.unit_price) || 0);
    onChange(index, "hsn_code", item.hsn_code || "");
    onChange(index, "tax_id", item.tax_id || null);
    onChange(index, "sub_unit", item.sub_unit || "");
    onChange(index, "sub_unit_conversion_rate", Number(item.sub_unit_conversion_rate) || 1);
    setItemDropdownOpen(false);
  };

  const filteredItems = useMemo(() => {
    if (!line.name.trim()) return items;
    return items.filter((i: any) => i.name.toLowerCase().includes(line.name.toLowerCase()));
  }, [line.name, items]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const hasSubUnit = Boolean(line.sub_unit && line.sub_unit_conversion_rate && line.sub_unit_conversion_rate > 1);
  const isSellingInSubUnit = hasSubUnit && line.unit?.toLowerCase() === line.sub_unit?.toLowerCase();

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1 py-3 border-b last:border-0">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground shrink-0 mt-2">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="grid flex-1 grid-cols-12 gap-2 items-start">
        {/* Item Details - Name + Description */}
        <div className="col-span-4 space-y-1">
          <div className="flex gap-0.5">
            <div className="relative flex-1">
              <Input
                className="h-8 text-xs pr-7"
                placeholder="Type or click to select an item"
                value={line.name}
                onChange={(e) => {
                  onChange(index, "item_id", null);
                  onChange(index, "name", e.target.value);
                  setItemDropdownOpen(true);
                }}
                onFocus={() => setItemDropdownOpen(true)}
                onBlur={() => setTimeout(() => setItemDropdownOpen(false), 200)}
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-8 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                onClick={() => setItemDropdownOpen(!itemDropdownOpen)}
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              {itemDropdownOpen && filteredItems.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {filteredItems.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground flex justify-between items-center"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{item.description}</div>
                        )}
                      </div>
                      <div className="text-right">
                        {Number(item.discount) > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-emerald-700">
                              {fmt(Number(item.unit_price) * (1 - Number(item.discount) / 100))}
                            </span>
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="line-through text-muted-foreground">{fmt(Number(item.unit_price))}</span>
                              <span className="text-emerald-600 font-bold">({item.discount}% off)</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">{fmt(Number(item.unit_price))}</span>
                        )}
                        {item.sub_unit && item.sub_unit_conversion_rate > 1 && (
                          <div className="text-[9px] text-muted-foreground">1 {item.unit || 'Box'} = {item.sub_unit_conversion_rate} {item.sub_unit}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={onAddItem} className="h-8 w-8 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent shrink-0" title="Add New Item">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <Textarea
            className="text-xs min-h-[40px] resize-none"
            placeholder="Add a description to your item"
            value={line.description}
            onChange={(e) => onChange(index, "description", e.target.value)}
            rows={2}
          />
          {line.expiry_warning && <div className="text-[10px] text-red-500 font-medium mt-1">{line.expiry_warning}</div>}
        </div>
        {/* Quantity */}
        <div className="col-span-2 space-y-1">
          <Input placeholder="1" type="number" className="h-8 text-xs text-center font-medium" onFocus={(e) => e.target.select()} onBlur={(e) => { if (!e.target.value || parseFloat(e.target.value) <= 0) onChange(index, "quantity", 1); }} value={line.quantity} onChange={(e) => onChange(index, "quantity", e.target.value === "" ? "" : (parseFloat(e.target.value) || 0))} min={0} step="0.01" />
          {line.item_id ? (
            <div className="flex flex-col items-center">
              {hasSubUnit ? (
                <div className="w-full flex flex-col items-center gap-0.5">
                  <div className="flex items-center justify-center gap-1 bg-muted/60 rounded px-1 py-0.5 w-full">
                    <span className="text-[10px] font-bold text-foreground uppercase">{line.unit}</span>
                    <button
                      type="button"
                      title="Switch unit"
                      onClick={() => {
                        if (isSellingInSubUnit) {
                          // Switch to Primary Unit (e.g. BOX)
                          const targetUnit = line.primary_unit || "box";
                          const targetRate = line.base_unit_price || Number((line.rate * (line.sub_unit_conversion_rate || 1)).toFixed(2));
                          onChange(index, "unit", targetUnit);
                          onChange(index, "rate", targetRate);
                        } else {
                          // Switch to Sub-Unit (e.g. PCS)
                          const targetUnit = line.sub_unit;
                          const base = line.base_unit_price || line.rate;
                          const targetRate = Number((base / (line.sub_unit_conversion_rate || 1)).toFixed(2));
                          onChange(index, "unit", targetUnit);
                          onChange(index, "rate", targetRate);
                        }
                      }}
                      className="text-[9px] text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {isSellingInSubUnit ? `Switch to ${line.primary_unit?.toUpperCase() || 'BOX'}` : `Buy in ${line.sub_unit?.toUpperCase()}`}
                    </button>
                  </div>
                  {!isSellingInSubUnit ? (
                    <span className="text-[9px] text-muted-foreground text-center">
                      = {(line.quantity * (line.sub_unit_conversion_rate || 1)).toLocaleString("en-IN", { maximumFractionDigits: 2 })} {line.sub_unit}
                    </span>
                  ) : (
                    <span className="text-[9px] text-blue-600/80 text-center">
                      (1 {line.primary_unit || 'box'} = {line.sub_unit_conversion_rate} {line.sub_unit})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">{line.unit || "pcs"}</span>
              )}
            </div>
          ) : (
            <Input
              className="h-5 text-[10px] text-muted-foreground text-center border-0 border-b border-dashed bg-transparent px-1 py-0 focus-visible:ring-0 focus-visible:ring-offset-0 mt-0.5 uppercase"
              placeholder="unit"
              value={line.unit === "pcs" && !line.name ? "" : line.unit}
              onChange={(e) => onChange(index, "unit", e.target.value)}
            />
          )}
        </div>
        {/* Rate */}
        <div className="col-span-2 space-y-0.5">
          <Input placeholder="0" type="number" className="h-8 text-xs text-right" value={line.rate} onChange={(e) => onChange(index, "rate", e.target.value === "" ? "" : (parseFloat(e.target.value) || 0))} min={0} step="0.01" />
          {Number(line.discount) > 0 && (
            <div className="flex flex-col items-end mt-1 text-[10px]">
              <span className="text-emerald-600 font-semibold">{line.discount_type === 'percentage' ? `${line.discount}%` : `₹${line.discount}`} discount</span>
              <span className="text-muted-foreground font-medium">= ₹{(line.discount_type === 'percentage' ? Number(line.rate) * (1 - Number(line.discount)/100) : Number(line.rate) - Number(line.discount)).toFixed(2)}</span>
            </div>
          )}
        </div>
        {/* Tax */}
        <div className="col-span-2">
          <Select 
            value={
              line.tax_id 
                ? (INDIAN_GST_SLABS.find(s => s.id === line.tax_id)?.id || 
                   INDIAN_GST_SLABS.find(s => {
                     const t = taxRates.find((tr: any) => tr.id === line.tax_id);
                     return t && Number(t.rate) === s.rate;
                   })?.id || line.tax_id)
                : "exempt"
            } 
            onValueChange={(val) => {
              if (val === "exempt") {
                onChange(index, "tax_id", null);
                return;
              }
              const slab = INDIAN_GST_SLABS.find(s => s.id === val);
              if (slab) {
                const matched = taxRates.find((t: any) => Number(t.rate) === slab.rate);
                onChange(index, "tax_id", matched ? matched.id : slab.id);
              } else {
                onChange(index, "tax_id", val);
              }
            }}
          >
            <SelectTrigger className="h-8 text-[11px] px-2 bg-transparent border-dashed">
              <SelectValue placeholder="Tax" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_GST_SLABS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Amount */}
        <div className="col-span-2 text-right pt-1">
          <span className="text-sm font-bold">{fmt(line.amount - (line.tax_amount || 0))}</span>
        </div>
      </div>
      <button onClick={() => onRemove(index)} className="text-muted-foreground hover:text-destructive shrink-0 mt-2 ml-1">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function BillBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const { user } = useAuth();
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const [vendors, setVendors] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);

  const [vendorId, setVendorId] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [vendorStateOverride, setVendorStateOverride] = useState<string>("");
  const [billNumber, setBillNumber] = useState("");
  const [vendorBillNumber, setVendorBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [shippingCharge, setShippingCharge] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [adjustment, setAdjustment] = useState(0);
  const [adjustmentName, setAdjustmentName] = useState("Adjustment");
  const [tdsTcsApplicable, setTdsTcsApplicable] = useState(false);
  const [tdsTcsType, setTdsTcsType] = useState<"tds" | "tcs">("tds");
  const [tdsTcsRate, setTdsTcsRate] = useState(0);
  const [lines, setLines] = useState<LineItem[]>([createEmptyLine()]);
  const [deductStock, setDeductStock] = useState(false);
  const [prevDeductStock, setPrevDeductStock] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  // Phase 5 — opt-in compliance
  const [generateIrn, setGenerateIrn] = useState(false);
  const [irn, setIrn] = useState("");
  const [ackNo, setAckNo] = useState("");
  const [ackDate, setAckDate] = useState("");
  const [generateEway, setGenerateEway] = useState(false);
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [ewayValidUntil, setEwayValidUntil] = useState("");
  const [ewayVehicleNo, setEwayVehicleNo] = useState("");
  const [ewayTransportMode, setEwayTransportMode] = useState("road");
  const [ewayDistanceKm, setEwayDistanceKm] = useState("");
  const [saving, setSaving] = useState(false);
  const [vendorBills, setVendorBills] = useState<any[]>([]);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [contactPromptOpen, setContactPromptOpen] = useState(false);
  const [contactPromptMissing, setContactPromptMissing] = useState<"email" | "phone">("email");
  const [pendingAction, setPendingAction] = useState<"email" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch reference data
  useEffect(() => {
    if (!org?.id) return;
    const fetchData = async () => {
      const [c, i, t] = await Promise.all([
        supabase.from("vendors").select("*").eq("org_id", org.id).eq("is_active", true).order("display_name"),
        supabase.from("items").select("*").eq("org_id", org.id).eq("is_active", true).order("name"),
        supabase.from("tax_rates").select("*").eq("org_id", org.id),
      ]);
      setVendors(c.data || []);
      setCatalogItems(i.data || []);
      setTaxRates(t.data || []);

      // Auto-generate bill number from fresh DB value
      if (!id) {
        const { data: freshOrg } = await supabase.from("organizations").select("bill_next_number, bill_prefix, payment_terms, default_notes, default_terms").eq("id", org.id).single();
        const prefix = freshOrg?.bill_prefix || org.bill_prefix || "INV";
        const num = freshOrg?.bill_next_number || org.bill_next_number || 1;
        setBillNumber(formatSequenceNumber(prefix, num, "BILL"));
        setPaymentTerms(freshOrg?.payment_terms || org.payment_terms || 30);
        setNotes(freshOrg?.default_notes || org.default_notes || "");
        setTerms(freshOrg?.default_terms || org.default_terms || "");
      }
    };
    fetchData();
  }, [org?.id, id, duplicateId]);

  // Update due date when issue date or payment terms change
  useEffect(() => {
    if (billDate) {
      const d = new Date(billDate);
      d.setDate(d.getDate() + paymentTerms);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [billDate, paymentTerms]);

  // Load existing bill for editing or duplicating
  useEffect(() => {
    const sourceId = id || duplicateId;
    if (!sourceId || !org?.id) return;
    const loadBill = async () => {
      const { data: inv } = await supabase
        .from("bills")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (!inv) return;

      setVendorId(inv.vendor_id);
      const matchedVendor = vendors.find((c) => c.id === inv.vendor_id);
      if (matchedVendor) setVendorSearch(matchedVendor.display_name);
      
      if (!duplicateId) {
        setBillNumber(inv.bill_number);
        setBillDate(inv.bill_date);
        setDueDate(inv.due_date);
      }
      
      setNotes(inv.notes || "");
      setTerms(inv.terms_conditions || "");
      setDiscount(Number(inv.discount));
      setDiscountType(inv.discount_type as any);
      setShippingCharge(Number(inv.shipping_charge));
      setExpenses(Number((inv as any).expenses || 0));
      setAdjustment(Number(inv.adjustment));
      setAdjustmentName(inv.adjustment_name || "Adjustment");
      setTdsTcsApplicable(!!(inv as any).tds_tcs_applicable);
      setTdsTcsType((inv as any).tds_tcs_type === "tcs" ? "tcs" : "tds");
      setTdsTcsRate(Number((inv as any).tds_tcs_rate || 0));
      setDeductStock(!!(inv as any).deduct_stock);
      setPrevDeductStock(!!(inv as any).deduct_stock);
      setAmountPaid(duplicateId ? 0 : Number(inv.amount_paid || 0));
      
      // Phase 5 compliance load
      const _irn = (inv as any).irn || "";
      const _eway = (inv as any).eway_bill_no || "";
      setIrn(_irn);
      setAckNo((inv as any).ack_no || "");
      setAckDate((inv as any).ack_date ? String((inv as any).ack_date).slice(0, 10) : "");
      setGenerateIrn(!!_irn);
      setEwayBillNo(_eway);
      setEwayValidUntil((inv as any).eway_valid_until ? String((inv as any).eway_valid_until).slice(0, 10) : "");
      setEwayVehicleNo((inv as any).eway_vehicle_no || "");
      setEwayTransportMode((inv as any).eway_transport_mode || "road");
      setEwayDistanceKm((inv as any).eway_distance_km ? String((inv as any).eway_distance_km) : "");
      setGenerateEway(!!_eway);

      const { data: lineData } = await supabase
        .from("bill_lines")
        .select("*")
        .eq("bill_id", sourceId)
        .order("sort_order");

      if (lineData?.length) {
        setLines(lineData.map((l) => ({
          id: duplicateId ? crypto.randomUUID() : l.id,
          item_id: l.item_id,
          name: l.name,
          description: l.description || "",
          unit: l.unit || "pcs",
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          discount: Number(l.discount),
          discount_type: l.discount_type as any,
          tax_id: l.tax_id,
          tax_amount: Number(l.tax_amount),
          amount: Number(l.amount),
          hsn_code: (l as any).hsn_code || "",
          sub_unit: (l as any).sub_unit || "",
          sub_unit_conversion_rate: Number((l as any).sub_unit_conversion_rate) || 1,
        })));
      }
    };
    loadBill();
  }, [id, duplicateId, org?.id, vendors]);

  // Fetch vendor pending bills when vendor changes
  useEffect(() => {
    if (!vendorId || !org?.id) { setVendorBills([]); return; }
    const fetchVendorBills = async () => {
      const { data } = await supabase
        .from("bills")
        .select("total, balance_due, due_date, status")
        .eq("vendor_id", vendorId)
        .eq("org_id", org.id)
        .neq("status", "void")
        .neq("status", "draft");
      setVendorBills(data || []);
    };
    fetchVendorBills();
  }, [vendorId, org?.id]);

  const vendorAgingSummary = useMemo(() => {
    if (!vendorBills.length) return null;
    const today = new Date();
    let totalDue = 0;
    let over15 = 0;
    let over45 = 0;
    let totalBilled = 0;

    vendorBills.forEach((inv) => {
      totalBilled += Number(inv.total);
      const bal = Number(inv.balance_due);
      if (bal <= 0) return;
      totalDue += bal;
      const dueDt = new Date(inv.due_date);
      const daysPast = Math.floor((today.getTime() - dueDt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPast > 45) over45 += bal;
      else if (daysPast > 15) over15 += bal;
    });

    return { totalBilled, totalDue, over15, over45 };
  }, [vendorBills]);


  const calculateLine = useCallback((line: LineItem, globalDiscountTotal: number, totalSubtotalWithoutDiscount: number): LineItem => {
    const lineSubtotal = line.quantity * line.rate;
    // Calculate global discount ratio
    const ratio = totalSubtotalWithoutDiscount > 0 ? lineSubtotal / totalSubtotalWithoutDiscount : 0;
    const globalDiscountAllocated = globalDiscountTotal * ratio;
    
    // Add item specific discount if applicable
    const itemDiscount = line.discount_type === "percentage"
      ? lineSubtotal * (line.discount / 100)
      : line.discount;
      
    const afterDiscount = Math.max(0, lineSubtotal - itemDiscount - globalDiscountAllocated);
    
    let tax_amount = 0;
    let tax_rate = 0;
    if (line.tax_id) {
      const slab = INDIAN_GST_SLABS.find(s => s.id === line.tax_id);
      const taxRateObj = taxRates.find((t: any) => t.id === line.tax_id);
      tax_rate = slab ? slab.rate : (taxRateObj ? Number(taxRateObj.rate) : 0);
      tax_amount = afterDiscount * (tax_rate / 100);
    }
    
    return { ...line, tax_amount, tax_rate, amount: afterDiscount + tax_amount };
  }, [taxRates]);

  const handleLineChange = (index: number, field: string, value: any) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addLine = () => setLines((prev) => [...prev, createEmptyLine()]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLines((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // State Detection
  const orgState = useMemo(() => {
    if (org?.gst_number) return stateCodeFromGstin(org.gst_number);
    if (org?.address && typeof org.address === 'object' && (org.address as any).state) return String((org.address as any).state);
    return null;
  }, [org]);

  const baseVendorState = useMemo(() => {
    const vendor = vendors.find(c => c.id === vendorId);
    if (vendor?.tax_number) return stateCodeFromGstin(vendor.tax_number);
    if (vendor?.billing_address && typeof vendor.billing_address === 'object' && (vendor.billing_address as any).state) return String((vendor.billing_address as any).state);
    return null;
  }, [vendorId, vendors]);

  const vendorState = vendorStateOverride || baseVendorState;

  const isInterstate = Boolean(orgState && vendorState && orgState !== vendorState);

  // Totals
  const rawSubtotal = lines.reduce((s, l) => s + ((Number(l.quantity) || 0) * (Number(l.rate) || 0)), 0);
  const totalDiscount = discountType === "percentage" ? rawSubtotal * (discount / 100) : discount;
  
  // Calculate item-wise totals
  const calculatedLines = lines.map(line => calculateLine(line, totalDiscount, rawSubtotal));
  const subtotal = calculatedLines.reduce((s, l) => s + ((Number(l.quantity) || 0) * (Number(l.rate) || 0)), 0);
  const discountedSubtotal = calculatedLines.reduce((s, l) => s + (l.amount - l.tax_amount), 0);
  
  // Aggregate Taxes
  const taxBreakdownMap: Record<string, { id: string, name: string, rate: number, amount: number }> = {};
  
  let maxTaxRate = 0;
  calculatedLines.forEach(line => {
    if (line.tax_id && line.tax_amount > 0) {
      const tax = taxRates.find((t: any) => t.id === line.tax_id);
      if (tax) {
        const rate = Number(tax.rate);
        if (rate > maxTaxRate) maxTaxRate = rate;
        if (isInterstate) {
          const key = `IGST_${rate}`;
          if (!taxBreakdownMap[key]) taxBreakdownMap[key] = { id: key, name: `IGST @ ${rate}%`, rate, amount: 0 };
          taxBreakdownMap[key].amount += line.tax_amount;
        } else {
          const cgstKey = `CGST_${rate/2}`;
          const sgstKey = `SGST_${rate/2}`;
          if (!taxBreakdownMap[cgstKey]) taxBreakdownMap[cgstKey] = { id: cgstKey, name: `CGST @ ${rate/2}%`, rate: rate/2, amount: 0 };
          if (!taxBreakdownMap[sgstKey]) taxBreakdownMap[sgstKey] = { id: sgstKey, name: `SGST @ ${rate/2}%`, rate: rate/2, amount: 0 };
          taxBreakdownMap[cgstKey].amount += line.tax_amount / 2;
          taxBreakdownMap[sgstKey].amount += line.tax_amount / 2;
        }
      }
    }
  });

  if (maxTaxRate > 0 && (shippingCharge > 0 || expenses > 0)) {
    const extraTaxBase = shippingCharge + expenses;
    const extraTaxAmount = extraTaxBase * (maxTaxRate / 100);
    if (extraTaxAmount > 0) {
      if (isInterstate) {
        const key = `IGST_${maxTaxRate}`;
        if (!taxBreakdownMap[key]) taxBreakdownMap[key] = { id: key, name: `IGST @ ${maxTaxRate}%`, rate: maxTaxRate, amount: 0 };
        taxBreakdownMap[key].amount += extraTaxAmount;
      } else {
        const cgstKey = `CGST_${maxTaxRate/2}`;
        const sgstKey = `SGST_${maxTaxRate/2}`;
        if (!taxBreakdownMap[cgstKey]) taxBreakdownMap[cgstKey] = { id: cgstKey, name: `CGST @ ${maxTaxRate/2}%`, rate: maxTaxRate/2, amount: 0 };
        if (!taxBreakdownMap[sgstKey]) taxBreakdownMap[sgstKey] = { id: sgstKey, name: `SGST @ ${maxTaxRate/2}%`, rate: maxTaxRate/2, amount: 0 };
        taxBreakdownMap[cgstKey].amount += extraTaxAmount / 2;
        taxBreakdownMap[sgstKey].amount += extraTaxAmount / 2;
      }
    }
  }

  const taxBreakdown = Object.values(taxBreakdownMap);
  const totalTax = taxBreakdown.reduce((s, t) => s + t.amount, 0);

  // Gross total before TDS/TCS
  const baseTotalBeforeTdsTcs = discountedSubtotal + totalTax + shippingCharge + adjustment - expenses;

  // TDS is calculated BEFORE GST on Subtotal (taxable value) and DEDUCTED (-)
  // TCS is calculated AFTER GST on Total Value (subtotal + tax + shipping + adjustment) and ADDED (+)
  const tdsTcsAmount = tdsTcsApplicable
    ? tdsTcsType === "tds"
      ? (subtotal * Math.max(0, tdsTcsRate)) / 100
      : (baseTotalBeforeTdsTcs * Math.max(0, tdsTcsRate)) / 100
    : 0;
  
  let total = baseTotalBeforeTdsTcs;
  if (tdsTcsApplicable) {
    if (tdsTcsType === "tds") {
      total -= tdsTcsAmount;
    } else {
      total += tdsTcsAmount;
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const handleActionClick = (action: "email") => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) {
      toast({ title: "Select a vendor first", variant: "destructive" });
      return;
    }
    if (action === "email" && !vendor.email) {
      setContactPromptMissing("email");
      setPendingAction("email");
      setContactPromptOpen(true);
      return;
    }
    handleSave("received", action);
  };

  const handleSave = async (status: "draft" | "received" = "received", postAction?: "email") => {
    if (!org) return;
    if (!vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }
    // Auto-remove empty/blank lines before saving
    const validLines = lines.filter((l) => l.name.trim() || l.rate > 0 || l.quantity > 0);
    if (!validLines.length) {
      toast({ title: "Add at least one line item", variant: "destructive" });
      return;
    }
    setLines(validLines);

    // Non-blocking negative-stock warning (only when deducting)
    if (deductStock) {
      const restorePrev: Record<string, number> = {};
      if (prevDeductStock && id) {
        const { data: prev } = await supabase.from("bill_lines").select("item_id, quantity").eq("bill_id", id);
        for (const p of prev || []) {
          if (p.item_id) restorePrev[p.item_id] = (restorePrev[p.item_id] || 0) + Number(p.quantity || 0);
        }
      }
      const warnings = await detectNegativeStock(
        validLines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, name: l.name })),
        { restorePrevQty: restorePrev }
      );
      if (warnings.length) {
        toast({
          title: "Low stock warning",
          description: warnings.slice(0, 3).map((w) => `${w.name}: need ${w.requested}, have ${w.available}`).join(" • "),
          variant: "destructive",
        });
      }
    }

    setSaving(true);
      const billPayload = {
        org_id: org!.id,
        vendor_id: vendorId,
        bill_number: billNumber,
        vendor_bill_number: vendorBillNumber,
        bill_date: billDate,
        due_date: dueDate,
        currency: org!.currency_code,
        discount: totalDiscount,
        subtotal,
        tax_total: totalTax,
        total,
        balance_due: total - amountPaid,
        amount_paid: amountPaid,
        status: (total - amountPaid) <= 0 && amountPaid > 0 ? "paid" : (amountPaid > 0 ? "partial" : status),
        tds_tcs_applicable: tdsTcsApplicable,
        tds_tcs_type: tdsTcsType,
        tds_tcs_rate: tdsTcsRate,
        tds_tcs_amount: tdsTcsAmount,
        notes,
        terms,
      };

    try {
      let billId = id;
      // Capture previous lines for stock restoration on edit
      let prevLines: any[] = [];
      if (id) {
        const { data: existing } = await supabase.from("bill_lines").select("item_id, quantity").eq("bill_id", id);
        prevLines = existing || [];
        const { error } = await supabase.from("bills").update(billPayload).eq("id", id);
        if (error) throw error;
        // Delete old lines and re-insert
        await supabase.from("bill_lines").delete().eq("bill_id", id);
      } else {
        const { data, error } = await supabase.from("bills").insert(billPayload).select().single();
        if (error) throw error;
        billId = data.id;
        // Increment org next number using fresh DB value
        const { data: currentOrg } = await supabase.from("organizations").select("bill_next_number").eq("id", org!.id).single();
        const currentNum = currentOrg?.bill_next_number || 1;
        await supabase.from("organizations").update({
          bill_next_number: currentNum + 1,
        }).eq("id", org!.id);
      }

      // Insert lines
      const linePayloads = calculatedLines
        .filter((l) => l.name.trim() || l.rate > 0)
        .map((l, i) => ({
          bill_id: billId!,
          org_id: org!.id,
          item_id: l.item_id,
          description: l.name + (l.description ? `\n${l.description}` : ""),
          unit: l.unit || "pcs",
          quantity: l.quantity,
          rate: l.rate,
          discount: l.discount_amount || 0,
          tax_rate: l.tax_rate,
          tax_amount: l.tax_amount || 0,
          amount: l.amount,
          sort_order: i,
          hsn: l.hsn_code?.trim() || null,
        }));

      const { error: lineError } = await supabase.from("bill_lines").insert(linePayloads);
      if (lineError) throw lineError;

      // Inventory: adjust stock for product items (only when bill opts in)
      // Purchase bill = stock INCREASES. Undo previous addition on edit, then add new quantities.
      if (prevDeductStock || deductStock) {
        const delta: Record<string, number> = {};
        if (prevDeductStock) {
          for (const pl of prevLines) {
            if (pl.item_id) delta[pl.item_id] = (delta[pl.item_id] || 0) - Number(pl.quantity || 0);
          }
        }
        if (deductStock) {
          for (const ln of linePayloads) {
            if (ln.item_id) delta[ln.item_id] = (delta[ln.item_id] || 0) + Number(ln.quantity || 0);
          }
        }
        const itemIds = Object.keys(delta).filter((k) => delta[k] !== 0);
        if (itemIds.length) {
          const { data: itemsForStock } = await supabase.from("items").select("id, type, stock_quantity").in("id", itemIds);
          const movements: Parameters<typeof logStockMovements>[0] = [];
          for (const it of itemsForStock || []) {
            if (it.type !== "product") continue;
            const newQty = Math.max(0, Number(it.stock_quantity || 0) + delta[it.id]);
            await supabase.from("items").update({ stock_quantity: newQty }).eq("id", it.id);
            movements.push({
              orgId: org!.id,
              itemId: it.id,
              changeQty: delta[it.id],
              balanceAfter: newQty,
              reason: id ? "Purchase bill updated" : "Purchase bill created",
              refType: "bill",
              refId: billId,
              refNumber: billNumber,
              createdBy: user?.id || null,
            });
          }
          await logStockMovements(movements);
        }
        setPrevDeductStock(deductStock);
      }

      // Save custom fields
      if (billId && Object.keys(customFieldValues).length > 0) {
        await saveCustomFieldValues(billId, customFieldValues);
      }

      // Audit log
      if (org && user) {
        await logAudit({
          orgId: org.id, userId: user.id, entityType: "bill",
          entityId: billId, action: id ? "update" : "create",
          description: `Bill ${billNumber} ${id ? "updated" : "created"} (${status})`,
        });
      }

      // Sync vendor opening_balance
      if (vendorId) {
        const { data: cBills } = await supabase.from("bills").select("balance_due").eq("vendor_id", vendorId);
        const totalDue = (cBills || []).reduce((s: number, inv: any) => s + Number(inv.balance_due), 0);
        await supabase.from("vendors").update({ opening_balance: totalDue }).eq("id", vendorId);
      }

      if (postAction === "email") {
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor?.email) {
          navigate(`/bills/${billId}?sendEmail=true`);
          toast({ title: "Saving and generating PDF..." });
          setSaving(false);
          return;
        }
      } else {
        toast({ title: status === "received" ? "Bill saved!" : "Bill saved as draft!" });
      }

      navigate(`/bills`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave("draft");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [vendorId, lines, subtotal]);

  // Auto-save every 60s
  useEffect(() => {
    if (!vendorId || !lines.some((l) => l.name.trim())) return;
    const interval = setInterval(() => {
      if (id) handleSave("draft");
    }, 60000);
    return () => clearInterval(interval);
  }, [id, vendorId, lines]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ContactPromptDialog
        open={contactPromptOpen}
        onOpenChange={setContactPromptOpen}
        entityType="vendor"
        entityId={vendorId || ""}
        entityName={vendors.find(v => v.id === vendorId)?.display_name || ""}
        missingField={contactPromptMissing}
        onSuccess={(val) => {
          setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, [contactPromptMissing]: val } : v));
          if (pendingAction) handleSave("received", pendingAction);
        }}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{id ? "Edit Bill" : "New Bill"}</h1>
        <div className="flex gap-2">
          <BillSettingsSheet />
          <Button variant="outline" onClick={() => navigate("/bills")}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" /> Save as Draft
          </Button>
          <div className="flex">
            <Button className="rounded-r-none font-semibold shadow-sm" onClick={() => handleSave("received")} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" /> Save Bill
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-l-none border-l border-primary-foreground/20 px-2.5 shadow-sm" disabled={saving}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => handleActionClick("email")}>
                  <Mail className="mr-2 h-4 w-4 text-blue-600" /> Save and Email
                </DropdownMenuItem>

                <DropdownMenuItem onClick={async () => { await handleSave("received"); setTimeout(() => window.print(), 500); }}>
                  <Printer className="mr-2 h-4 w-4" /> Save and Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  await handleSave("received");
                  if (id) {
                    const { data: existing } = await supabase.from("portal_tokens").select("token").eq("entity_type", "bill").eq("entity_id", id).maybeSingle();
                    let token = existing?.token;
                    if (!token) {
                      const { data } = await supabase.from("portal_tokens").insert({ org_id: org!.id, entity_type: "bill", entity_id: id }).select("token").single();
                      token = data?.token;
                    }
                    if (token) {
                      await navigator.clipboard.writeText(`${window.location.origin}/portal/${token}`);
                      toast({ title: "Bill saved & portal link copied!" });
                    }
                  }
                }}>
                  <Share2 className="mr-2 h-4 w-4" /> Save and Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSave("draft")}>
                  <Clock className="mr-2 h-4 w-4" /> Save and Send Later
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      className="h-9"
                      placeholder="Type to search vendors..."
                      value={vendorSearch}
                      onChange={(e) => {
                        setVendorSearch(e.target.value);
                        setVendorDropdownOpen(true);
                        if (!e.target.value) setVendorId("");
                      }}
                      onFocus={() => setVendorDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setVendorDropdownOpen(false), 200)}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-9 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {vendorDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                        {vendors
                          .filter((c) => !vendorSearch.trim() || c.display_name.toLowerCase().includes(vendorSearch.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${vendorId === c.id ? "bg-accent/50 font-medium" : ""}`}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setVendorId(c.id);
                                setVendorSearch(c.display_name);
                                setVendorDropdownOpen(false);
                              }}
                            >
                              {c.display_name}
                            </button>
                          ))}
                        {vendors.filter((c) => !vendorSearch.trim() || c.display_name.toLowerCase().includes(vendorSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No vendors found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => setAddVendorOpen(true)} title="Add New Vendor">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <AddVendorDialog open={addVendorOpen} onOpenChange={setAddVendorOpen} onVendorAdded={(c) => { setVendors(prev => [...prev, c]); setVendorId(c.id); setVendorSearch(c.display_name); }} />
                <ItemFormDialog open={addItemOpen} onOpenChange={setAddItemOpen} taxRates={taxRates} onItemAdded={(item) => { setCatalogItems(prev => [...prev, item]); }} />
                {vendorId && vendorAgingSummary && vendorAgingSummary.totalDue > 0 && (
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="h-4 w-4" />
                      Vendor Pending Summary
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-background p-2 border">
                        <span className="text-muted-foreground">Total Billed</span>
                        <p className="font-bold text-foreground">{formatCurrency(vendorAgingSummary.totalBilled, org?.currency_code || "INR")}</p>
                      </div>
                      <div className="rounded-md bg-background p-2 border border-destructive/30">
                        <span className="text-muted-foreground">Total Due</span>
                        <p className="font-bold text-destructive">{formatCurrency(vendorAgingSummary.totalDue, org?.currency_code || "INR")}</p>
                      </div>
                      {vendorAgingSummary.over15 > 0 && (
                        <div className="rounded-md bg-background p-2 border border-orange-300 dark:border-orange-700">
                          <span className="text-muted-foreground">15+ Days Overdue</span>
                          <p className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(vendorAgingSummary.over15, org?.currency_code || "INR")}</p>
                        </div>
                      )}
                      {vendorAgingSummary.over45 > 0 && (
                        <div className="rounded-md bg-background p-2 border border-destructive/50">
                          <span className="text-muted-foreground">45+ Days Overdue</span>
                          <p className="font-bold text-destructive">{formatCurrency(vendorAgingSummary.over45, org?.currency_code || "INR")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Label className="text-muted-foreground flex items-center gap-1.5">Vendor Bill Number</Label>
                  <Input 
                    value={vendorBillNumber} 
                    onChange={e => setVendorBillNumber(e.target.value)} 
                    className="h-11 bg-white border-muted font-medium text-blue-600 focus-visible:ring-blue-500 shadow-sm"
                    placeholder="Original Bill No (e.g. VEN-101)"
                  />
                </div>
                
                {/* State Override if Vendor State is missing */}
                {vendorId && !baseVendorState && (
                  <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4" />
                      Vendor state missing
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      Select the vendor's state to correctly calculate CGST/SGST vs IGST.
                    </p>
                    <Select value={vendorStateOverride} onValueChange={setVendorStateOverride}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-background">
                        <SelectValue placeholder="Select State Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>{state.code} - {state.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Bill #</Label>
                  <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select value={String(paymentTerms)} onValueChange={(v) => setPaymentTerms(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Net 15</SelectItem>
                      <SelectItem value="30">Net 30</SelectItem>
                      <SelectItem value="45">Net 45</SelectItem>
                      <SelectItem value="60">Net 60</SelectItem>
                      <SelectItem value="0">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardContent className="pt-6">
          <CustomFieldsForm entityType="bill" entityId={id} onChange={setCustomFieldValues} />
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={() => { setBulkSelected(new Set()); setBulkAddOpen(true); }}>
            <Layers className="mr-1 h-4 w-4" /> Bulk Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider grid grid-cols-12 gap-2 px-6 pb-2 border-b">
            <div className="col-span-4">Item Details</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-left pl-2">Tax</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={lines.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {lines.map((line, index) => (
                <SortableLineItem
                  key={line.id}
                  line={calculatedLines[index] || line}
                  index={index}
                  taxRates={taxRates}
                  items={catalogItems}
                  onChange={handleLineChange}
                  onRemove={removeLine}
                  onAddItem={() => setAddItemOpen(true)}
                  currency={org?.currency_code || "INR"}
                  org={org}
                />
              ))}
            </SortableContext>
          </DndContext>
          {/* Empty row placeholder */}
          <div className="flex items-center gap-1 py-3 border-b text-muted-foreground">
            <GripVertical className="h-3.5 w-3.5 opacity-30 shrink-0" />
            <div className="grid flex-1 grid-cols-12 gap-2 items-center px-1">
              <div className="col-span-5 text-xs italic cursor-pointer hover:text-foreground" onClick={addLine}>
                Type or click to select an item.
              </div>
              <div className="col-span-2 text-center text-xs">1.00</div>
              <div className="col-span-2 text-right text-xs">0.00</div>
              <div className="col-span-3 text-right text-xs">0.00</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={addLine} className="mt-2">
            <Plus className="mr-1 h-4 w-4" /> Add Line
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Add Items Dialog */}
      <Dialog open={bulkAddOpen} onOpenChange={setBulkAddOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Add Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {catalogItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No items in catalog. Add items first.</p>
            ) : (
              <>
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={bulkSelected.size === catalogItems.length}
                    onCheckedChange={(checked) => {
                      if (checked) setBulkSelected(new Set(catalogItems.map((i: any) => i.id)));
                      else setBulkSelected(new Set());
                    }}
                  />
                  <span className="text-sm font-medium">Select All ({catalogItems.length} items)</span>
                </div>
                {catalogItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-accent/50">
                    <Checkbox
                      checked={bulkSelected.has(item.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(bulkSelected);
                        if (checked) next.add(item.id); else next.delete(item.id);
                        setBulkSelected(next);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.description && <span className="text-xs text-muted-foreground ml-2">{item.description}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{item.unit || "pcs"}</span>
                    <span className="text-sm font-medium">{formatCurrency(Number(item.unit_price), org?.currency_code || "INR")}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAddOpen(false)}>Cancel</Button>
            <Button
              disabled={bulkSelected.size === 0}
              onClick={() => {
                const newLines: LineItem[] = [];
                bulkSelected.forEach((itemId) => {
                  const item = catalogItems.find((i: any) => i.id === itemId);
                  if (item) {
                    let line = createEmptyLine();
                    line.item_id = item.id;
                    line.name = item.name;
                    let extraDesc = "";
                    if (item.custom_field_values && item.custom_field_values.length > 0) {
                      extraDesc = item.custom_field_values
                        .filter((cf: any) => cf.value)
                        .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.value}`)
                        .join("\n");
                    }
                    line.description = item.description ? (extraDesc ? `${item.description}\n${extraDesc}` : item.description) : extraDesc;
                    line.rate = Number(item.unit_price);
                    line.unit = item.unit || "pcs";
                    line.quantity = 1;
                    line.hsn_code = item.hsn_code || "";
                    line.tax_id = item.tax_id || null;
                    // Calculate amount
                    line.amount = line.quantity * line.rate;
                    newLines.push(line);
                  }
                });
                setLines((prev) => {
                  const filtered = prev.filter((l) => l.name || l.rate > 0);
                  return [...filtered, ...newLines];
                });
                setBulkAddOpen(false);
                toast({ title: `${newLines.length} items added` });
              }}
            >
              Add {bulkSelected.size} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Totals & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes visible on bill..." />
          </div>
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, late fees..." />
          </div>
          <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
            <Checkbox
              checked={deductStock}
              onCheckedChange={(v) => setDeductStock(!!v)}
              className="mt-0.5"
            />
            <div className="text-sm">
              <div className="font-medium">Deduct stock from inventory</div>
              <div className="text-xs text-muted-foreground">
                When saved, product item quantities on this bill will be subtracted from stock.
              </div>
            </div>
          </label>

          {/* Phase 5 — Opt-in Compliance */}
          <div className="space-y-2 rounded-md border p-3">
            <div className="text-sm font-medium">Compliance (optional)</div>
            <p className="text-xs text-muted-foreground">
              Tick to record IRN / E-way bill details. Nothing is generated automatically — paste the values you receive from the GST / NIC portal.
            </p>

            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <Checkbox checked={generateIrn} onCheckedChange={(v) => setGenerateIrn(!!v)} className="mt-0.5" />
              <span className="text-sm font-medium">E-bill (IRN) details</span>
            </label>
            {generateIrn && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pl-6">
                <div className="md:col-span-3">
                  <Label className="text-xs">IRN</Label>
                  <Input value={irn} onChange={(e) => setIrn(e.target.value)} placeholder="64-char hash" className="h-8 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-xs">Ack No.</Label>
                  <Input value={ackNo} onChange={(e) => setAckNo(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Ack Date</Label>
                  <Input type="date" value={ackDate} onChange={(e) => setAckDate(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            )}

            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <Checkbox checked={generateEway} onCheckedChange={(v) => setGenerateEway(!!v)} className="mt-0.5" />
              <span className="text-sm font-medium">E-way bill details</span>
            </label>
            {generateEway && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-6">
                <div>
                  <Label className="text-xs">EWB No.</Label>
                  <Input value={ewayBillNo} onChange={(e) => setEwayBillNo(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Valid Until</Label>
                  <Input type="date" value={ewayValidUntil} onChange={(e) => setEwayValidUntil(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Vehicle No.</Label>
                  <Input value={ewayVehicleNo} onChange={(e) => setEwayVehicleNo(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Transport Mode</Label>
                  <Select value={ewayTransportMode} onValueChange={setEwayTransportMode}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="road">Road</SelectItem>
                      <SelectItem value="rail">Rail</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Distance (km)</Label>
                  <Input type="number" value={ewayDistanceKm} onChange={(e) => setEwayDistanceKm(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="h-7 w-16 text-xs text-right"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                  <SelectTrigger className="h-7 w-14 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">₹</SelectItem>
                  </SelectContent>
                </Select>
                {totalDiscount > 0 && <span className="text-destructive">-{fmt(totalDiscount)}</span>}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">Tax</span>
              </div>
              {taxBreakdown.length === 0 && <span className="text-xs text-muted-foreground">No taxes applied</span>}
              {taxBreakdown.map((tb) => (
                <div key={tb.id} className="flex items-center justify-between text-xs pl-4 text-muted-foreground">
                  <span>{tb.name} ({tb.rate}%)</span>
                  <span>+{fmt(tb.amount)}</span>
                </div>
              ))}
            </div>
            {/* TDS/TCS Section */}
            <div className="space-y-2 border-y py-3 my-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">TDS / TCS Applicable?</span>
                <Checkbox checked={tdsTcsApplicable} onCheckedChange={(v) => setTdsTcsApplicable(!!v)} />
              </label>
              {tdsTcsApplicable && (
                <div className="flex items-center justify-between text-sm gap-2 mt-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="tdsTcsTypeBill" checked={tdsTcsType === "tds"} onChange={() => setTdsTcsType("tds")} className="cursor-pointer" />
                      <span>TDS (-)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="tdsTcsTypeBill" checked={tdsTcsType === "tcs"} onChange={() => setTdsTcsType("tcs")} className="cursor-pointer" />
                      <span>TCS</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      className="h-7 w-16 text-xs text-right"
                      value={tdsTcsRate}
                      onChange={(e) => setTdsTcsRate(Math.abs(Number(e.target.value)))}
                      placeholder="Rate"
                    />
                    <span className="text-muted-foreground">%</span>
                    {tdsTcsAmount > 0 && (
                      <span className={tdsTcsType === "tds" ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                        {tdsTcsType === "tds" ? "-" : ""}{fmt(tdsTcsAmount)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground">Shipping</span>
              <Input
                type="number"
                className="h-7 w-24 text-xs text-right"
                value={shippingCharge}
                onChange={(e) => setShippingCharge(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground">Expenses (Fixed Cost)</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="h-7 w-24 text-xs text-right"
                  value={expenses}
                  onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                />
                {expenses > 0 && <span className="text-destructive">-{fmt(expenses)}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm gap-2">
              <Input
                className="h-7 w-24 text-xs"
                value={adjustmentName}
                onChange={(e) => setAdjustmentName(e.target.value)}
              />
              <Input
                type="number"
                className="h-7 w-24 text-xs text-right"
                value={adjustment}
                onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
