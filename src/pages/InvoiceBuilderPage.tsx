import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { postInvoiceJournal } from "@/lib/accounting";
import { useAppStore } from "@/store/app-store";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { logStockMovements, detectNegativeStock } from "@/lib/stock";
import { CustomFieldsForm, saveCustomFieldValues } from "@/components/shared/CustomFieldsForm";
import { CURRENCIES, formatCurrency } from "@/lib/currency";
import { formatSequenceNumber } from "@/lib/utils";
import { COMMON_UNITS, INDIAN_STATES, INDIAN_GST_SLABS } from "@/lib/constants";
import { stateCodeFromGstin } from "@/lib/gst";
import { getWhatsappTemplate, compileWhatsappMessage, openWhatsappShare } from "@/lib/whatsapp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, Trash2, Plus, GripVertical, Printer, Share2, Clock, ChevronDown, AlertTriangle, Layers, Check, CreditCard, Mail, MessageCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { InvoiceSettingsSheet } from "@/components/shared/InvoiceSettingsSheet";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddClientDialog } from "@/components/shared/AddClientDialog";
import { ItemFormDialog } from "@/components/shared/ItemFormDialog";
import { ContactPromptDialog } from "@/components/shared/ContactPromptDialog";
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
  org,
}: {
  line: LineItem;
  index: number;
  taxRates: any[];
  items: any[];
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onAddItem: () => void;
  currency: string;
  org: any;
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
                      {isSellingInSubUnit ? `Switch to ${line.primary_unit?.toUpperCase() || 'BOX'}` : `Sell in ${line.sub_unit?.toUpperCase()}`}
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
        {org?.gst_number && (
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
        )}
        {/* Amount */}
        <div className={`text-right pt-1 ${!org?.gst_number ? 'col-span-4' : 'col-span-2'}`}>
          <span className="text-sm font-bold">{fmt(org?.gst_number ? line.amount - (line.tax_amount || 0) : line.amount)}</span>
        </div>
      </div>
      <button onClick={() => onRemove(index)} className="text-muted-foreground hover:text-destructive shrink-0 mt-2 ml-1">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function InvoiceBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const { user } = useAuth();
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const [clients, setClients] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);

  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [clientStateOverride, setClientStateOverride] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingName, setShippingName] = useState("");
  const [shippingAddressText, setShippingAddressText] = useState("");
  const [shippingContact, setShippingContact] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [tdsTcsApplicable, setTdsTcsApplicable] = useState(false);
  const [tdsTcsType, setTdsTcsType] = useState<"tds" | "tcs">("tds");
  const [tdsTcsRate, setTdsTcsRate] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [adjustment, setAdjustment] = useState(0);
  const [adjustmentName, setAdjustmentName] = useState("Adjustment");
  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [lines, setLines] = useState<LineItem[]>([createEmptyLine()]);
  const [deductStock, setDeductStock] = useState(true);
  const [prevDeductStock, setPrevDeductStock] = useState(true);
  const [amountPaid, setAmountPaid] = useState(0);

  // Bank details per organization
  const [includeBankDetails, setIncludeBankDetails] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankUpiId, setBankUpiId] = useState("");

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
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);

  const [contactPromptOpen, setContactPromptOpen] = useState(false);
  const [contactPromptMissing, setContactPromptMissing] = useState<"email" | "phone">("email");
  const [pendingAction, setPendingAction] = useState<"email" | "whatsapp" | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch reference data
  useEffect(() => {
    if (!org?.id) return;
    const fetchData = async () => {
      const [c, i, t] = await Promise.all([
        supabase.from("clients").select("*").eq("org_id", org.id).eq("status", "active").order("display_name"),
        supabase.from("items").select("*").eq("org_id", org.id).eq("is_active", true).order("name"),
        supabase.from("tax_rates").select("*").eq("org_id", org.id),
      ]);
      setClients(c.data || []);
      setCatalogItems(i.data || []);
      setTaxRates(t.data || []);

      // Auto-generate invoice number from fresh DB value
      if (!id) {
        const { data: freshOrg } = await supabase
          .from("organizations")
          .select("invoice_next_number, invoice_prefix, payment_terms, default_notes, default_terms, bank_name, bank_account_name, bank_account_number, bank_ifsc, bank_branch, bank_details_enabled, upi_id, name")
          .eq("id", org.id)
          .single();
        const prefix = freshOrg?.invoice_prefix || org.invoice_prefix || "INV";
        const num = freshOrg?.invoice_next_number || org.invoice_next_number || 1;
        setInvoiceNumber(formatSequenceNumber(prefix, num, "INV"));
        setPaymentTerms(freshOrg?.payment_terms || org.payment_terms || 30);
        setNotes(freshOrg?.default_notes || org.default_notes || "");
        setTerms(freshOrg?.default_terms || org.default_terms || "");

        if (freshOrg) {
          if (freshOrg.bank_name || freshOrg.bank_account_number || freshOrg.bank_ifsc) {
            setIncludeBankDetails(freshOrg.bank_details_enabled !== false);
            setBankName(freshOrg.bank_name || "");
            setBankAccountName(freshOrg.bank_account_name || freshOrg.name || org.name || "");
            setBankAccountNumber(freshOrg.bank_account_number || "");
            setBankIfsc(freshOrg.bank_ifsc || "");
            setBankBranch(freshOrg.bank_branch || "");
            setBankUpiId(freshOrg.upi_id || org.upi_id || "");
          } else {
            const { data: bAccs } = await supabase.from("bank_accounts").select("*").eq("org_id", org.id).eq("is_active", true).limit(1);
            if (bAccs && bAccs.length > 0) {
              const acc = bAccs[0];
              setIncludeBankDetails(true);
              setBankName(acc.bank_name || "");
              setBankAccountName(acc.name || freshOrg.name || org.name || "");
              setBankAccountNumber(acc.account_number || "");
              setBankIfsc(acc.ifsc || "");
              setBankBranch("");
              setBankUpiId(acc.upi_id || freshOrg.upi_id || org.upi_id || "");
            }
          }
        }
      }
    };
    fetchData();
  }, [org?.id, id, duplicateId]);

  // Update due date when issue date or payment terms change
  useEffect(() => {
    if (issueDate) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + paymentTerms);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [issueDate, paymentTerms]);

  // Load existing invoice for editing or duplicating
  useEffect(() => {
    const sourceId = id || duplicateId;
    if (!sourceId || !org?.id) return;
    const loadInvoice = async () => {
      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (!inv) return;

      setClientId(inv.client_id);
      const matchedClient = clients.find((c) => c.id === inv.client_id);
      if (matchedClient) setClientSearch(matchedClient.display_name);
      
      if (!duplicateId) {
        setInvoiceNumber(inv.invoice_number);
        if (inv.metadata && (inv.metadata as any).shipping_same_as_billing !== undefined) setShippingSameAsBilling((inv.metadata as any).shipping_same_as_billing);
        setIssueDate(inv.issue_date);
        setDueDate(inv.due_date);
        // removed extra brace
        if (inv.shipping_address) {
          try {
             const parsed = typeof inv.shipping_address === "string" ? JSON.parse(inv.shipping_address) : inv.shipping_address;
             setShippingAddress(parsed?.street || String(inv.shipping_address));
          } catch {
             setShippingAddress(String(inv.shipping_address));
          }
        }
      }
      
      setNotes(inv.notes || "");
      setTerms(inv.terms_conditions || "");
      setDiscount(Number(inv.discount));
      setDiscountType(inv.discount_type as any);
      setShippingCharge(Number(inv.shipping_charge));
      setExpenses(Number((inv as any).expenses || 0));
      setAdjustment(Number(inv.adjustment));
      setAdjustmentName(inv.adjustment_name || "Adjustment");
        if (inv.metadata) {
          if ((inv.metadata as any).auto_round_off !== undefined) setAutoRoundOff((inv.metadata as any).auto_round_off);
          if ((inv.metadata as any).show_bank_details !== undefined) setShowBankDetails((inv.metadata as any).show_bank_details);
          if ((inv.metadata as any).show_terms !== undefined) setShowTerms((inv.metadata as any).show_terms);
          if ((inv.metadata as any).show_notes !== undefined) setShowNotes((inv.metadata as any).show_notes);
        }
      setTdsTcsApplicable(!!(inv as any).tds_tcs_applicable);
      setTdsTcsType((inv as any).tds_tcs_type === "tcs" ? "tcs" : "tds");
      setDeductStock((inv as any).deduct_stock !== undefined && (inv as any).deduct_stock !== null ? !!(inv as any).deduct_stock : true);
      setPrevDeductStock((inv as any).deduct_stock !== undefined && (inv as any).deduct_stock !== null ? !!(inv as any).deduct_stock : true);
      setAmountPaid(duplicateId ? 0 : Number(inv.amount_paid || 0));

      if (inv.bank_details && typeof inv.bank_details === "object") {
        setIncludeBankDetails(!!inv.bank_details.enabled);
        setBankName(inv.bank_details.bank_name || "");
        setBankAccountName(inv.bank_details.bank_account_name || "");
        setBankAccountNumber(inv.bank_details.bank_account_number || "");
        setBankIfsc(inv.bank_details.bank_ifsc || "");
        setBankBranch(inv.bank_details.bank_branch || "");
        setBankUpiId(inv.bank_details.bank_upi_id || "");
      } else if (org) {
        if ((org as any).bank_name || (org as any).bank_account_number) {
          setIncludeBankDetails((org as any).bank_details_enabled !== false);
          setBankName((org as any).bank_name || "");
          setBankAccountName((org as any).bank_account_name || org.name || "");
          setBankAccountNumber((org as any).bank_account_number || "");
          setBankIfsc((org as any).bank_ifsc || "");
          setBankBranch((org as any).bank_branch || "");
          setBankUpiId(org.upi_id || "");
        }
      }

      // Phase 5 compliance load
      if (!duplicateId) {
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
      }

      const { data: lineData } = await supabase
        .from("invoice_lines")
        .select("*")
        .eq("invoice_id", sourceId)
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
    loadInvoice();
  }, [id, duplicateId, org?.id, clients]);

  // Fetch client pending invoices when client changes
  useEffect(() => {
    if (!clientId || !org?.id) { setClientInvoices([]); return; }
    const fetchClientInvoices = async () => {
      const { data } = await supabase
        .from("invoices")
        .select("total, balance_due, due_date, status")
        .eq("client_id", clientId)
        .eq("org_id", org.id)
        .neq("status", "void")
        .neq("status", "draft");
      setClientInvoices(data || []);
    };
    fetchClientInvoices();
  }, [clientId, org?.id]);

  const clientAgingSummary = useMemo(() => {
    if (!clientInvoices.length) return null;
    const today = new Date();
    let totalDue = 0;
    let over15 = 0;
    let over45 = 0;
    let totalBilled = 0;

    clientInvoices.forEach((inv) => {
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
  }, [clientInvoices]);


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
    let computedAmount = afterDiscount;
    const hasGst = Boolean(org?.gst_number);

    if (line.tax_id) {
      const slab = INDIAN_GST_SLABS.find(s => s.id === line.tax_id);
      const taxRateObj = taxRates.find((t: any) => t.id === line.tax_id);
      const rate = slab ? slab.rate : (taxRateObj ? Number(taxRateObj.rate) : 0);
      const computedTax = afterDiscount * (rate / 100);
      
      if (!hasGst) {
        computedAmount += computedTax;
        tax_amount = 0; // absorb tax into item amount
      } else {
        tax_amount = computedTax;
        computedAmount += tax_amount;
      }
    }
    
    return { ...line, tax_amount, amount: computedAmount };
  }, [taxRates, org?.gst_number]);

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

  const baseClientState = useMemo(() => {
    const client = clients.find(c => c.id === clientId);
    if (client?.tax_number) return stateCodeFromGstin(client.tax_number);
    if (client?.billing_address && typeof client.billing_address === 'object' && (client.billing_address as any).state) return String((client.billing_address as any).state);
    return null;
  }, [clientId, clients]);

  const clientState = clientStateOverride || baseClientState;

  const isInterstate = Boolean(orgState && clientState && orgState !== clientState);

  // Totals
  const rawSubtotal = lines.reduce((s, l) => s + ((Number(l.quantity) || 0) * (Number(l.rate) || 0)), 0);
  // Item-level discounts total (for subtotal display)
  const itemLevelDiscountTotal = lines.reduce((s, l) => {
    const lineAmt = (Number(l.quantity) || 0) * (Number(l.rate) || 0);
    return s + (l.discount_type === "percentage" ? lineAmt * (l.discount / 100) : l.discount);
  }, 0);
  const totalDiscount = discountType === "percentage" ? rawSubtotal * (discount / 100) : discount;
  
  // Calculate item-wise totals
  const calculatedLines = lines.map(line => calculateLine(line, totalDiscount, rawSubtotal));
  // subtotal after item-level discounts (before global discount)
  const subtotal = rawSubtotal - itemLevelDiscountTotal;
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
  const baseTotalBeforeTdsTcs = discountedSubtotal + totalTax + shippingCharge + (autoRoundOff ? 0 : adjustment) - expenses;

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

    let finalAdjustment = autoRoundOff ? 0 : adjustment;
    let finalAdjustmentName = autoRoundOff ? "Round Off" : adjustmentName;

    if (autoRoundOff) {
      const roundedTotal = Math.round(total);
      finalAdjustment = Number((roundedTotal - total).toFixed(2));
      total = roundedTotal;
    }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const handleActionClick = (action: "email" | "whatsapp") => {
    if (action === "whatsapp" && !(useAppStore.getState().userRole === 'admin' || useAppStore.getState().userRole === 'owner' || useAppStore.getState().userPermissions.includes('whatsapp_access'))) {
      toast({ title: "Access Denied", description: "You don't have permission to use WhatsApp features.", variant: "destructive" });
      return;
    }
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      toast({ title: "Select a client first", variant: "destructive" });
      return;
    }
    if (action === "email" && !client.email) {
      setContactPromptMissing("email");
      setPendingAction("email");
      setContactPromptOpen(true);
      return;
    }
    if (action === "whatsapp" && !client.phone) {
      setContactPromptMissing("phone");
      setPendingAction("whatsapp");
      setContactPromptOpen(true);
      return;
    }
    handleSave("sent", action);
  };

  const handleSave = async (status: "draft" | "sent" = "draft", postAction?: "email" | "whatsapp") => {
    if (!clientId) {
      toast({ title: "Select a client", variant: "destructive" });
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
        const { data: prev } = await supabase.from("invoice_lines").select("item_id, quantity").eq("invoice_id", id);
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

    const bankDetailsPayload = includeBankDetails && (bankName.trim() || bankAccountNumber.trim() || bankIfsc.trim()) ? {
      enabled: true,
      bank_name: bankName.trim(),
      bank_account_name: bankAccountName.trim(),
      bank_account_number: bankAccountNumber.trim(),
      bank_ifsc: bankIfsc.trim(),
      bank_branch: bankBranch.trim(),
      bank_upi_id: bankUpiId.trim(),
    } : { enabled: false };

    const invoicePayload = {
      org_id: org!.id,
      client_id: clientId,
      metadata: {
        template_style: org?.template_style,
        template_accent_color: org?.template_accent_color,
        template_font: org?.template_font,
        template_paper_size: org?.template_paper_size,
        has_gst: Boolean(org?.gst_number),
          shipping_same_as_billing: shippingSameAsBilling,
          auto_round_off: autoRoundOff,
          show_bank_details: showBankDetails,
          show_terms: showTerms,
          show_notes: showNotes,
      },
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate,
      currency_code: org!.currency_code,
      discount,
      discount_type: discountType,
      shipping_charge: shippingCharge,
      expenses,
      adjustment,
      adjustment_name: adjustmentName,
      deduct_stock: deductStock,
      bank_details: bankDetailsPayload,
      irn: generateIrn && irn.trim() ? irn.trim() : null,
      ack_no: generateIrn && ackNo.trim() ? ackNo.trim() : null,
      ack_date: generateIrn && ackDate ? ackDate : null,
      eway_bill_no: generateEway && ewayBillNo.trim() ? ewayBillNo.trim() : null,
      eway_valid_until: generateEway && ewayValidUntil ? ewayValidUntil : null,
      eway_vehicle_no: generateEway && ewayVehicleNo.trim() ? ewayVehicleNo.trim() : null,
      eway_transport_mode: generateEway ? ewayTransportMode : null,
      eway_distance_km: generateEway && ewayDistanceKm ? parseInt(ewayDistanceKm) : null,
      subtotal,
      total_tax: totalTax,
      total_discount: totalDiscount,
      tds_tcs_applicable: tdsTcsApplicable,
      tds_tcs_type: tdsTcsType,
      tds_tcs_rate: tdsTcsRate,
      tds_tcs_amount: tdsTcsAmount,
      total,
      balance_due: total - amountPaid,
      status: (total - amountPaid) <= 0 && amountPaid > 0 ? "paid" : (amountPaid > 0 ? "partial" : status),
      notes,
      terms_conditions: terms,
      ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}),
    };

    try {
      let invoiceId = id;
      // Capture previous lines for stock restoration on edit
      let prevLines: any[] = [];
      if (id) {
        const { data: existing } = await supabase.from("invoice_lines").select("item_id, quantity").eq("invoice_id", id);
        prevLines = existing || [];
        const { error } = await supabase.from("invoices").update(invoicePayload).eq("id", id);
        if (error) throw error;
        // Delete old lines and re-insert
        await supabase.from("invoice_lines").delete().eq("invoice_id", id);
      } else {
        let currentPayload = { ...invoicePayload };
        let currentNum = -1;
        let retryCount = 0;
        let insertData = null;
        
        while (retryCount < 3) {
          const { data, error } = await supabase.from("invoices").insert(currentPayload).select().single();
          if (error) {
            if (error.code === "23505" && error.message.includes("invoices_org_id_invoice_number_key")) {
              // Fetch fresh invoice number and retry
              const { data: currentOrg } = await supabase.from("organizations").select("invoice_next_number, invoice_prefix").eq("id", org!.id).single();
              currentNum = currentOrg?.invoice_next_number || 1;
              const newNum = formatSequenceNumber(currentOrg?.invoice_prefix || "INV", currentNum, "INV");
              currentPayload.invoice_number = newNum;
              setInvoiceNumber(newNum); // Update UI state
              retryCount++;
              continue;
            }
            throw error;
          }
          insertData = data;
          break;
        }
        
        if (!insertData) {
           throw new Error("Failed to generate a unique invoice number. Please try again.");
        }
        
        invoiceId = insertData.id;
        
        // If we didn't fetch currentNum during retry, fetch it now to increment
        if (currentNum === -1) {
           const { data: currentOrg } = await supabase.from("organizations").select("invoice_next_number").eq("id", org!.id).single();
           currentNum = currentOrg?.invoice_next_number || 1;
        }
        
        await supabase.from("organizations").update({
          invoice_next_number: currentNum + 1,
        }).eq("id", org!.id);
      }

      // Ensure tax rate records exist in DB for any slab selected
      const slabMap: Record<string, string> = {};
      for (const l of calculatedLines) {
        if (l.tax_id && INDIAN_GST_SLABS.some(s => s.id === l.tax_id)) {
          const slab = INDIAN_GST_SLABS.find(s => s.id === l.tax_id)!;
          if (slab.rate === 0) {
            slabMap[slab.id] = "";
          } else if (!slabMap[slab.id]) {
            const existing = taxRates.find(t => Number(t.rate) === slab.rate);
            if (existing) {
              slabMap[slab.id] = existing.id;
            } else {
              const { data: newTax } = await supabase.from("tax_rates").insert({
                org_id: org!.id,
                name: slab.name,
                rate: slab.rate,
              }).select().single();
              if (newTax) {
                slabMap[slab.id] = newTax.id;
                setTaxRates(prev => [...prev, newTax]);
              }
            }
          }
        }
      }

      // Insert lines
      const linePayloads = calculatedLines
        .filter((l) => l.name.trim() || l.rate > 0)
        .map((l, i) => {
          let resolvedTaxId = l.tax_id;
          if (resolvedTaxId && slabMap[resolvedTaxId] !== undefined) {
            resolvedTaxId = slabMap[resolvedTaxId] || null;
          }
          return {
            invoice_id: invoiceId!,
            item_id: l.item_id,
            name: l.name,
            description: l.description,
            unit: l.unit || "pcs",
            quantity: l.quantity,
            rate: l.rate,
            discount: l.discount,
            discount_type: l.discount_type,
            tax_id: resolvedTaxId,
            tax_amount: l.tax_amount || 0,
            amount: l.amount,
            sort_order: i,
            hsn_code: l.hsn_code?.trim() || null,
            sub_unit: l.sub_unit,
            sub_unit_conversion_rate: l.sub_unit_conversion_rate
          };
        });

      const { error: lineError } = await supabase.from("invoice_lines").insert(linePayloads);

        // Sync Journal Entry
        try {
          const subtotal = linePayloads.reduce((sum, line) => sum + (line.rate * line.quantity), 0);
          const taxTotal = linePayloads.reduce((sum, line) => sum + (line.tax_amount || 0), 0);
          await postInvoiceJournal(org!.id, invoiceId, invoicePayload.issue_date, invoicePayload.invoice_number, subtotal, taxTotal, Number(invoicePayload.total), invoicePayload.branch_id || null);
        } catch (jErr) {
          console.error("Journal sync failed:", jErr);
        }

      if (lineError) throw lineError;

      // Inventory: adjust stock for product items (only when invoice opts in)
      if (prevDeductStock || deductStock) {
        const delta: Record<string, number> = {};
        if (prevDeductStock) {
          for (const pl of prevLines) {
            if (pl.item_id) delta[pl.item_id] = (delta[pl.item_id] || 0) + Number(pl.quantity || 0);
          }
        }
        if (deductStock) {
          for (const ln of linePayloads) {
            if (ln.item_id) delta[ln.item_id] = (delta[ln.item_id] || 0) - Number(ln.quantity || 0);
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
              reason: id ? "Invoice updated" : "Invoice created",
              refType: "invoice",
              refId: invoiceId,
              refNumber: invoiceNumber,
              createdBy: user?.id || null,
            });
          }
          await logStockMovements(movements);
        }
        setPrevDeductStock(deductStock);
      }

      // Save custom fields
      if (invoiceId && Object.keys(customFieldValues).length > 0) {
        await saveCustomFieldValues(invoiceId, customFieldValues);
      }

      // Audit log
      if (org && user) {
        await logAudit({
          orgId: org.id, userId: user.id, entityType: "invoice",
          entityId: invoiceId, action: id ? "update" : "create",
          description: `Invoice ${invoiceNumber} ${id ? "updated" : "created"} (${status})`,
        });
      }

      // Sync client opening_balance
      if (clientId) {
        const { data: cInvoices } = await supabase.from("invoices").select("balance_due").eq("client_id", clientId);
        const totalDue = (cInvoices || []).reduce((s: number, inv: any) => s + Number(inv.balance_due), 0);
        await supabase.from("clients").update({ opening_balance: totalDue }).eq("id", clientId);
      }

      // Persist bank details per organization so next invoices have it pre-filled
      if (includeBankDetails && (bankName.trim() || bankAccountNumber.trim() || bankIfsc.trim())) {
        await supabase.from("organizations").update({
          bank_name: bankName.trim() || null,
          bank_account_name: bankAccountName.trim() || null,
          bank_account_number: bankAccountNumber.trim() || null,
          bank_ifsc: bankIfsc.trim() || null,
          bank_branch: bankBranch.trim() || null,
          bank_details_enabled: true,
          ...(bankUpiId.trim() ? { upi_id: bankUpiId.trim() } : {}),
        }).eq("id", org!.id);
      }

      // Check Post Actions (Email / WhatsApp)
      if (postAction === "email") {
        const client = clients.find(c => c.id === clientId);
        if (client?.email) {
          navigate(`/invoices/${invoiceId}?sendEmail=true`);
          toast({ title: "Saving and generating PDF..." });
          setSaving(false);
          return;
        }
      } else if (postAction === "whatsapp") {
        const client = clients.find(c => c.id === clientId);
        if (client?.phone) {
          const { data: existing } = await supabase.from("portal_tokens").select("token").eq("entity_type", "invoice").eq("entity_id", invoiceId).maybeSingle();
          let token = existing?.token;
          if (!token) {
            const { data } = await supabase.from("portal_tokens").insert({ org_id: org!.id, entity_type: "invoice", entity_id: invoiceId }).select("token").single();
            token = data?.token;
          }

          const template = await getWhatsappTemplate(org!.id, "invoice");
          const txt = compileWhatsappMessage(template, {
            client_name: client.display_name,
            document_no: invoiceNumber,
            total: fmt(Number(calculateTotal())),
            due_date: dueDate || "",
            subtotal: fmt(Number(calculateSubtotal())),
            tax: fmt(Number(calculateTax())),
            discount: fmt(Number(discountTotal)),
            tds: tdsEnabled && tdsPercentage > 0 ? fmt(Number(calculateTdsAmount())) : "0.00",
            adjustment: adjustmentEnabled && adjustmentAmount ? fmt(Number(adjustmentAmount)) : "0.00",
            items: lines.map(l => `- ${l.name || 'Item'} x${l.quantity}`).join('\n'),
            portal_link: token ? `${window.location.origin}/portal/${token}` : "",
            org_name: org!.name
          });

          await openWhatsappShare({
            phone: client.phone,
            message: txt,
            orgId: org!.id
          });
          toast({ title: "Invoice saved and WhatsApp sent!" });
        }
      }



      toast({ title: status === "sent" ? "Invoice sent!" : "Invoice saved!" });
      navigate(`/invoices`);
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
  }, [clientId, lines, subtotal]);

  // Auto-save every 60s
  useEffect(() => {
    if (!clientId || !lines.some((l) => l.name.trim())) return;
    const interval = setInterval(() => {
      if (id) handleSave("draft");
    }, 60000);
    return () => clearInterval(interval);
  }, [id, clientId, lines]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ContactPromptDialog
        open={contactPromptOpen}
        onOpenChange={setContactPromptOpen}
        entityType="client"
        entityId={clientId || ""}
        entityName={clients.find(c => c.id === clientId)?.display_name || ""}
        missingField={contactPromptMissing}
        onSuccess={(val) => {
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, [contactPromptMissing]: val } : c));
          if (pendingAction) handleSave("sent", pendingAction);
        }}
      />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{id ? "Edit Invoice" : "New Invoice"}</h1>
        <div className="flex gap-2">
          <InvoiceSettingsSheet />
          <Button variant="outline" onClick={() => navigate("/invoices")}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" /> Save as Draft
          </Button>
          <div className="flex">
            <Button className="rounded-r-none font-semibold shadow-sm" onClick={() => handleSave("sent")} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" /> Save Invoice
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
                <DropdownMenuItem onClick={() => handleActionClick("whatsapp")}>
                  <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> Save and WhatsApp
                </DropdownMenuItem>

                <DropdownMenuItem onClick={async () => { await handleSave("sent"); setTimeout(() => window.print(), 500); }}>
                  <Printer className="mr-2 h-4 w-4" /> Save and Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  await handleSave("sent");
                  if (id) {
                    const { data: existing } = await supabase.from("portal_tokens").select("token").eq("entity_type", "invoice").eq("entity_id", id).maybeSingle();
                    let token = existing?.token;
                    if (!token) {
                      const { data } = await supabase.from("portal_tokens").insert({ org_id: org!.id, entity_type: "invoice", entity_id: id }).select("token").single();
                      token = data?.token;
                    }
                    if (token) {
                      await navigator.clipboard.writeText(`${window.location.origin}/portal/${token}`);
                      toast({ title: "Invoice saved & portal link copied!" });
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
                <Label>Client *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      className="h-9"
                      placeholder="Type to search clients..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setClientDropdownOpen(true);
                        if (!e.target.value) setClientId("");
                      }}
                      onFocus={() => setClientDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setClientDropdownOpen(false), 200)}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-9 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox id="same_as_billing" checked={shippingSameAsBilling} onCheckedChange={(c) => setShippingSameAsBilling(!!c)} />
                    <label htmlFor="same_as_billing" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Bill To and Ship To are same
                    </label>
                  </div>
                  {!shippingSameAsBilling && (
                    <div className="mt-2">
                       <Textarea 
                         placeholder="Enter Shipping Address..." 
                         value={shippingAddress} 
                         onChange={(e) => setShippingAddress(e.target.value)} 
                         className="h-20 resize-none text-sm"
                       />
                    </div>
                  )}
                  <div className="flex gap-2 relative">
                  <div className="relative flex-1">
                    {clientDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                        {clients
                          .filter((c) => !clientSearch.trim() || c.display_name.toLowerCase().includes(clientSearch.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${clientId === c.id ? "bg-accent/50 font-medium" : ""}`}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setClientId(c.id);
                                setClientSearch(c.display_name);
                                setClientDropdownOpen(false);
                              }}
                            >
                              {c.display_name}
                            </button>
                          ))}
                        {clients.filter((c) => !clientSearch.trim() || c.display_name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No clients found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => setAddClientOpen(true)} title="Add New Client">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <AddClientDialog open={addClientOpen} onOpenChange={setAddClientOpen} onClientAdded={(c) => { setClients(prev => [...prev, c]); setClientId(c.id); setClientSearch(c.display_name); }} />
                <ItemFormDialog open={addItemOpen} onOpenChange={setAddItemOpen} onItemSaved={(item) => { if(item) setCatalogItems(prev => [...prev, item]); }} />
                {clientId && clientAgingSummary && clientAgingSummary.totalDue > 0 && (
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="h-4 w-4" />
                      Client Pending Summary
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-background p-2 border">
                        <span className="text-muted-foreground">Total Billed</span>
                        <p className="font-bold text-foreground">{formatCurrency(clientAgingSummary.totalBilled, org?.currency_code || "INR")}</p>
                      </div>
                      <div className="rounded-md bg-background p-2 border border-destructive/30">
                        <span className="text-muted-foreground">Total Due</span>
                        <p className="font-bold text-destructive">{formatCurrency(clientAgingSummary.totalDue, org?.currency_code || "INR")}</p>
                      </div>
                      {clientAgingSummary.over15 > 0 && (
                        <div className="rounded-md bg-background p-2 border border-orange-300 dark:border-orange-700">
                          <span className="text-muted-foreground">15+ Days Overdue</span>
                          <p className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(clientAgingSummary.over15, org?.currency_code || "INR")}</p>
                        </div>
                      )}
                      {clientAgingSummary.over45 > 0 && (
                        <div className="rounded-md bg-background p-2 border border-destructive/50">
                          <span className="text-muted-foreground">45+ Days Overdue</span>
                          <p className="font-bold text-destructive">{formatCurrency(clientAgingSummary.over45, org?.currency_code || "INR")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* State Override if Client State is missing */}
                {clientId && !baseClientState && (
                  <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4" />
                      Client state missing
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      Select the client's state to correctly calculate CGST/SGST vs IGST.
                    </p>
                    <Select value={clientStateOverride} onValueChange={setClientStateOverride}>
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
                  <Label>Invoice #</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
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
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
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
          <CustomFieldsForm entityType="invoice" entityId={id} onChange={setCustomFieldValues} />
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
            {org?.gst_number && <div className="col-span-2 text-left pl-2">Tax</div>}
            <div className={`text-right ${!org?.gst_number ? 'col-span-4' : 'col-span-2'}`}>Amount</div>
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
              {org?.gst_number && <div className="col-span-3 text-right text-xs">0.00</div>}
              {!org?.gst_number && <div className="col-span-3 text-right text-xs">0.00</div>}
            </div>
          </div>
          {/* Live Calculation Totals Row */}
          {lines.length > 0 && (
            <div className="flex items-center gap-1 py-3 border-b border-t mt-[-1px] bg-slate-50/50 text-slate-700 font-medium">
              <div className="w-4 shrink-0" /> {/* Spacer for grip handle */}
              <div className="grid flex-1 grid-cols-12 gap-2 items-center px-1">
                <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-right pr-2">Total</div>
                <div className="col-span-2 text-center text-sm font-semibold">{calculatedLines.reduce((s, l) => s + (Number(l.quantity) || 0), 0).toFixed(2)}</div>
                <div className="col-span-2 text-right text-sm font-semibold text-slate-600">
                  {/* Original rate total (before discount) */}
                  <div>{formatCurrency(lines.reduce((s, l) => s + ((Number(l.quantity) || 0) * (Number(l.rate) || 0)), 0), org?.currency_code || "INR")}</div>
                  {/* Discounted rate total — shown below if any item has discount */}
                  {lines.some(l => Number(l.discount) > 0) && (
                    <div className="text-[10px] text-emerald-600 font-semibold">
                      {formatCurrency(calculatedLines.reduce((s, l) => s + (l.amount - l.tax_amount), 0), org?.currency_code || "INR")} (discounted)
                    </div>
                  )}
                </div>
                {org?.gst_number && <div className="col-span-2 text-left pl-2 text-sm font-semibold text-slate-600">{formatCurrency(calculatedLines.reduce((s, l) => s + l.tax_amount, 0), org?.currency_code || "INR")}</div>}
                <div className={`text-right text-sm font-bold ${!org?.gst_number ? 'col-span-4' : 'col-span-2'}`}>
                  {/* Amount = discounted price WITHOUT GST */}
                  {formatCurrency(calculatedLines.reduce((s, l) => s + (org?.gst_number ? l.amount - l.tax_amount : l.amount), 0), org?.currency_code || "INR")}
                </div>
              </div>
            </div>
          )}
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
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes visible on invoice..." />
          </div>
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, late fees..." />
          </div>

          {/* Bank Account Details */}
          <div className="space-y-3 rounded-md border p-3.5 bg-card/60">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Bank Account Details</span>
              </div>
              <Checkbox
                checked={includeBankDetails}
                onCheckedChange={(v) => setIncludeBankDetails(!!v)}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Display bank transfer &amp; payment instructions on this invoice. Saved automatically for this organization.
            </p>

            {includeBankDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Bank Name</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Account Holder Name</Label>
                  <Input
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="e.g. Company / Business Name"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Account Number</Label>
                  <Input
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 50200012345678"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">IFSC Code</Label>
                  <Input
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Branch Name</Label>
                  <Input
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="e.g. Connaught Place, New Delhi"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UPI ID (Optional)</Label>
                  <Input
                    value={bankUpiId}
                    onChange={(e) => setBankUpiId(e.target.value)}
                    placeholder="e.g. company@okhdfcbank"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">Display Options</div>
              <p className="text-xs text-muted-foreground mb-2">Configure what appears on the invoice PDF.</p>
              
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={autoRoundOff} onCheckedChange={(v) => setAutoRoundOff(!!v)} />
                <span className="text-sm font-medium">Auto Round Off Total</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={showBankDetails} onCheckedChange={(v) => setShowBankDetails(!!v)} />
                <span className="text-sm font-medium">Show Bank / UPI Details</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={showTerms} onCheckedChange={(v) => setShowTerms(!!v)} />
                <span className="text-sm font-medium">Show Terms & Conditions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={showNotes} onCheckedChange={(v) => setShowNotes(!!v)} />
                <span className="text-sm font-medium">Show Notes</span>
              </label>
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
                When saved, product item quantities on this invoice will be subtracted from stock.
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
              <span className="text-sm font-medium">E-invoice (IRN) details</span>
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
                      <input type="radio" name="tdsTcsType" checked={tdsTcsType === "tds"} onChange={() => setTdsTcsType("tds")} className="cursor-pointer" />
                      <span>TDS (-)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="tdsTcsType" checked={tdsTcsType === "tcs"} onChange={() => setTdsTcsType("tcs")} className="cursor-pointer" />
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
                  value={finalAdjustmentName}
                  onChange={(e) => setAdjustmentName(e.target.value)}
                  disabled={autoRoundOff}
                />
                <Input
                  type="number"
                  className="h-7 w-24 text-xs text-right"
                  value={finalAdjustment}
                  onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                  disabled={autoRoundOff}
                />
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="sticky bottom-0 z-30 -mx-6 -mb-6 mt-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-t px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Amount:</span>
            <span className="text-xl font-extrabold text-foreground">{fmt(total)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground border-l pl-4 border-border">
            <span className="font-medium">{lines.filter(l => l.name.trim() || l.rate > 0).length} Line Item(s)</span>
            <span className="text-muted-foreground/40">•</span>
            <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-foreground select-none">
              <Checkbox
                checked={deductStock}
                onCheckedChange={(v) => setDeductStock(!!v)}
                className="h-4 w-4"
              />
              <span>Deduct from Inventory</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/invoices")}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" /> Save as Draft
          </Button>
          <div className="flex">
            <Button className="rounded-r-none font-semibold shadow-sm" onClick={() => handleSave("sent")} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" /> Save Invoice
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
                <DropdownMenuItem onClick={() => handleActionClick("whatsapp")}>
                  <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> Save and WhatsApp
                </DropdownMenuItem>

                <DropdownMenuItem onClick={async () => { await handleSave("sent"); setTimeout(() => window.print(), 500); }}>
                  <Printer className="mr-2 h-4 w-4" /> Save and Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  await handleSave("sent");
                  if (id) {
                    const { data: existing } = await supabase.from("portal_tokens").select("token").eq("entity_type", "invoice").eq("entity_id", id).maybeSingle();
                    let token = existing?.token;
                    if (!token) {
                      const { data } = await supabase.from("portal_tokens").insert({ org_id: org!.id, entity_type: "invoice", entity_id: id }).select("token").single();
                      token = data?.token;
                    }
                    if (token) {
                      await navigator.clipboard.writeText(`${window.location.origin}/portal/${token}`);
                      toast({ title: "Invoice saved & portal link copied!" });
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

    </div>
  );
}
