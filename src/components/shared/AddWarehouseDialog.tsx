import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Warehouse, CheckCircle2, ShieldCheck, HelpCircle, MapPin } from "lucide-react";
import { INDIAN_STATES } from "@/lib/constants";

const GST_STATE_MAP: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

interface AddWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWarehouseAdded?: (warehouse: any) => void;
  editWarehouse?: any | null;
}

export function AddWarehouseDialog({
  open,
  onOpenChange,
  onWarehouseAdded,
  editWarehouse = null,
}: AddWarehouseDialogProps) {
  const org = useAppStore((s) => s.organization);
  const orgGstin = (org?.gst_number || org?.tax_number || "").trim().toUpperCase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(editWarehouse?.name || "");
  const [code, setCode] = useState(editWarehouse?.address?.code || "");
  const [phone, setPhone] = useState(editWarehouse?.address?.phone || "");
  const [manager, setManager] = useState(editWarehouse?.address?.manager || "");
  const [street, setStreet] = useState(editWarehouse?.address?.street || "");
  const [city, setCity] = useState(editWarehouse?.address?.city || "");
  const [state, setState] = useState(editWarehouse?.address?.state || "");
  const [pincode, setPincode] = useState(editWarehouse?.address?.pincode || "");
  const [isDefault, setIsDefault] = useState(editWarehouse?.is_default || false);

  // GST settings
  const [gstType, setGstType] = useState<"same" | "different" | "none">("same");
  const [customGstin, setCustomGstin] = useState("");

  // Sync when dialog opens or editWarehouse changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editWarehouse) {
      const addr = editWarehouse.address || {};
      setName(editWarehouse.name || "");
      setCode(addr.code || "");
      setPhone(addr.phone || "");
      setManager(addr.manager || "");
      setStreet(addr.street || "");
      setCity(addr.city || "");
      setState(addr.state || "");
      setPincode(addr.pincode || "");
      setIsDefault(editWarehouse.is_default || false);

      // Determine GST type
      const savedGstType = addr.gst_type;
      const savedGstin = (addr.gstin || "").trim().toUpperCase();
      if (savedGstType === "different" || (savedGstin && savedGstin !== orgGstin)) {
        setGstType("different");
        setCustomGstin(savedGstin);
      } else if (savedGstType === "none") {
        setGstType("none");
        setCustomGstin("");
      } else {
        setGstType("same");
        setCustomGstin("");
      }
    } else if (isOpen && !editWarehouse) {
      setName("");
      setCode("");
      setPhone("");
      setManager("");
      setStreet("");
      setCity("");
      setState("");
      setPincode("");
      setIsDefault(false);
      setGstType(orgGstin ? "same" : "different");
      setCustomGstin("");
    }
    onOpenChange(isOpen);
  };

  const getEffectiveGstin = () => {
    if (gstType === "same") return orgGstin;
    if (gstType === "different") return customGstin.trim().toUpperCase();
    return "";
  };

  const customStateCode = customGstin.trim().slice(0, 2);
  const detectedState = GST_STATE_MAP[customStateCode];

  const handleCustomGstinChange = (val: string) => {
    const formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    setCustomGstin(formatted);

    // Auto-fill state if empty and 2-digit state code matches
    const sc = formatted.slice(0, 2);
    const matchedState = INDIAN_STATES.find((s) => s.code === sc)?.name || GST_STATE_MAP[sc];
    if (matchedState && !state) {
      setState(matchedState);
    }
  };

  const handleSave = async () => {
    if (!org?.id) return;
    if (!name.trim()) {
      toast({ title: "Warehouse name is required", variant: "destructive" });
      return;
    }

    if (gstType === "different" && customGstin.trim()) {
      const g = customGstin.trim();
      if (g.length !== 15) {
        toast({
          title: "Invalid GSTIN format",
          description: "GSTIN must be exactly 15 alphanumeric characters (e.g. 27AAAAA0000A1Z5).",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (isDefault) {
        // Clear default on other warehouses
        await (supabase as any)
          .from("warehouses")
          .update({ is_default: false })
          .eq("org_id", org.id);
      }

      const effectiveGstin = getEffectiveGstin();

      const addressData = {
        code: code.trim() || undefined,
        phone: phone.trim() || undefined,
        manager: manager.trim() || undefined,
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        gstin: effectiveGstin || undefined,
        gst_type: gstType,
      };

      const payload = {
        org_id: org.id,
        name: name.trim(),
        address: addressData,
        is_default: isDefault,
      };

      let resultData;
      if (editWarehouse?.id) {
        const { data, error } = await (supabase as any)
          .from("warehouses")
          .update(payload)
          .eq("id", editWarehouse.id)
          .select()
          .single();
        if (error) throw error;
        resultData = data;
        toast({ title: "Warehouse updated successfully" });
      } else {
        const { data, error } = await (supabase as any)
          .from("warehouses")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        resultData = data;
        toast({ title: "Warehouse added successfully" });
      }

      if (onWarehouseAdded && resultData) {
        onWarehouseAdded(resultData);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to save warehouse",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{editWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
              <DialogDescription>
                Configure warehouse location, storage details, and GST registration.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="wh-name">Warehouse / Godown Name *</Label>
              <Input
                id="wh-name"
                placeholder="e.g. Main Central Warehouse, Bhiwandi Godown"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wh-code">Warehouse Code</Label>
              <Input
                id="wh-code"
                placeholder="e.g. WH-01, GDWN-BLR"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wh-manager">Manager / Contact Person</Label>
              <Input
                id="wh-manager"
                placeholder="e.g. Rajesh Kumar"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wh-phone">Contact Phone</Label>
              <Input
                id="wh-phone"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wh-pincode">Pincode</Label>
              <Input
                id="wh-pincode"
                placeholder="e.g. 400001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>
          </div>

          {/* Location Address */}
          <div className="space-y-1.5">
            <Label htmlFor="wh-street">Street Address / Locality</Label>
            <Textarea
              id="wh-street"
              placeholder="Building No, Plot No, Industrial Area"
              rows={2}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wh-city">City / District</Label>
              <Input
                id="wh-city"
                placeholder="e.g. Mumbai, Surat, Bangalore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wh-state">State / UT</Label>
              <Select value={state} onValueChange={(val) => setState(val)}>
                <SelectTrigger id="wh-state" className="h-10 bg-background">
                  <SelectValue placeholder="Select State / UT" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s.code + s.name} value={s.name}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span>{s.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          {s.code}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GSTIN Configuration Section */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Warehouse GSTIN (GST Number)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Alag state ya location ke hisab se alag GSTIN select ya enter karein.
                </p>
              </div>
            </div>

            <RadioGroup
              value={gstType}
              onValueChange={(val: "same" | "different" | "none") => setGstType(val)}
              className="space-y-2 pt-1"
            >
              {/* Option 1: Same as Business */}
              <label
                htmlFor="gst-opt-same"
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  gstType === "same"
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <RadioGroupItem value="same" id="gst-opt-same" className="mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      Same as Registered Business GSTIN
                    </span>
                    {orgGstin && (
                      <Badge variant="outline" className="text-[10px] font-mono bg-background">
                        {orgGstin}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {orgGstin
                      ? "Main business GSTIN will be applied to this warehouse."
                      : "Organization GSTIN is not set in Settings. Please configure or choose a custom GSTIN."}
                  </p>
                </div>
              </label>

              {/* Option 2: Different GSTIN */}
              <label
                htmlFor="gst-opt-diff"
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  gstType === "different"
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <RadioGroupItem value="different" id="gst-opt-diff" className="mt-0.5" />
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-medium text-foreground">
                    Separate / Different GSTIN for this Warehouse
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Use when this godown/warehouse operates in another state with its own state GST registration.
                  </p>
                </div>
              </label>

              {/* Option 3: No GST */}
              <label
                htmlFor="gst-opt-none"
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  gstType === "none"
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <RadioGroupItem value="none" id="gst-opt-none" className="mt-0.5" />
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-medium text-foreground">
                    No Separate GST / Unregistered
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Storage depot without distinct GST registration.
                  </p>
                </div>
              </label>
            </RadioGroup>

            {/* Custom GSTIN Input when selected */}
            {gstType === "different" && (
              <div className="pt-2 space-y-1.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-gstin" className="text-xs font-medium">
                    Warehouse GSTIN (15 Digits) *
                  </Label>
                  {detectedState && (
                    <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      State: {detectedState} ({customStateCode})
                    </Badge>
                  )}
                </div>
                <Input
                  id="custom-gstin"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="font-mono uppercase tracking-wider text-sm h-10"
                  maxLength={15}
                  value={customGstin}
                  onChange={(e) => handleCustomGstinChange(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  First 2 digits represent the state code (e.g. 27 for MH, 24 for GJ, 07 for DL).
                </p>
              </div>
            )}
          </div>

          {/* Default Warehouse Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Default Warehouse</Label>
              <p className="text-xs text-muted-foreground">
                Auto-select this warehouse on delivery challans, GRNs, and invoices.
              </p>
            </div>
            <Switch
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : editWarehouse ? "Update Warehouse" : "Add Warehouse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
