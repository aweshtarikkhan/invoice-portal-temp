import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CURRENCIES } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Search, Shield, Settings2, Receipt, Building2, Package, User, Mail, Phone, Globe, Warehouse, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { fetchGstDetails } from "@/lib/gst-service";
import { AddWarehouseDialog } from "@/components/shared/AddWarehouseDialog";
import { INDIAN_GST_SLABS } from "@/lib/constants";

export default function SettingsPage() {
  const org = useAppStore((s) => s.organization);
  const setOrganization = useAppStore((s) => s.setOrganization);
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "organization";
  const [addWarehouseOpen, setAddWarehouseOpen] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: "", last_name: "", phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Org form
  const [orgForm, setOrgForm] = useState({
    name: "", email: "", phone: "", website: "",
    tax_number: "", tax_name: "", currency_code: "INR",
    invoice_prefix: "INV", payment_terms: 30,
    default_notes: "", default_terms: "",
    address: { street: "", city: "", state: "", zip: "", country: "" },
    gst_enabled: false, gst_number: "", show_client_gst: false, qr_code_enabled: false,
    upi_id: "",
    inventory_enabled: false, low_stock_threshold: 5,
    multi_warehouse_enabled: false,
    sub_unit_enabled: false,
  });
  const [isFetchingGst, setIsFetchingGst] = useState(false);

  // Tax rates
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: "", rate: 0, is_default: false });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: (profile as any).phone || user?.phone || (user?.user_metadata as any)?.phone || "",
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (!org) return;
    setOrgForm({
      name: org.name || "", email: org.email || "", phone: org.phone || "",
      website: org.website || "", tax_number: org.tax_number || "", tax_name: org.tax_name || "",
      currency_code: org.currency_code || "INR", invoice_prefix: org.invoice_prefix || "INV",
      payment_terms: org.payment_terms || 30, default_notes: org.default_notes || "",
      default_terms: org.default_terms || "",
      address: (org.address as any) || { street: "", city: "", state: "", zip: "", country: "" },
      gst_enabled: org.gst_enabled || false, gst_number: org.gst_number || "",
      show_client_gst: org.show_client_gst || false, qr_code_enabled: org.qr_code_enabled || false,
      upi_id: (org as any).upi_id || "",
      inventory_enabled: (org as any).inventory_enabled || false,
      low_stock_threshold: Number((org as any).low_stock_threshold ?? 5),
      multi_warehouse_enabled: (org as any).multi_warehouse_enabled || false,
      sub_unit_enabled: (org as any).sub_unit_enabled || false,
    });
    fetchTaxRates();
  }, [org]);

  const saveProfile = async () => {
    if (!profile?.id) return;
    setProfileSaving(true);
    const { error } = await supabase.from("profiles").update({
      first_name: profileForm.first_name.trim(),
      last_name: profileForm.last_name.trim(),
      phone: profileForm.phone.trim() || null,
    }).eq("id", profile.id);
    setProfileSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully!" });
    }
  };

  const fetchTaxRates = async () => {
    if (!org?.id) return;
    const { data } = await supabase.from("tax_rates").select("*").eq("org_id", org.id).order("name");
    setTaxRates(data || []);
  };

  const saveOrg = async () => {
    if (!org?.id) return;
    const { error } = await supabase.from("organizations").update(orgForm).eq("id", org.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOrganization({ ...org, ...orgForm } as any);
      toast({ title: "Settings saved!" });
    }
  };

  const handleFetchGst = async () => {
    if (!orgForm.gst_number || orgForm.gst_number.length !== 15) {
      toast({ title: "Invalid GST", description: "Please enter a valid 15-character GSTIN", variant: "destructive" });
      return;
    }
    setIsFetchingGst(true);
    try {
      const details = await fetchGstDetails(orgForm.gst_number);
      setOrgForm(prev => ({
        ...prev,
        name: details.legalName || details.tradeName || prev.name,
        address: {
          ...prev.address,
          street: details.address || prev.address.street,
          city: prev.address.city, // Keep city or derive if possible
          state: details.state || prev.address.state,
          zip: details.pincode || prev.address.zip,
        }
      }));
      toast({ title: "GST Details Fetched", description: "Business details auto-filled successfully!" });
    } catch (err: any) {
      toast({ title: "GST Fetch Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsFetchingGst(false);
    }
  };

  const saveTaxRate = async () => {
    if (!taxForm.name.trim()) return;
    const { error } = await supabase.from("tax_rates").insert({
      org_id: org!.id,
      name: taxForm.name,
      rate: taxForm.rate,
      is_default: taxForm.is_default,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTaxDialogOpen(false);
      setTaxForm({ name: "", rate: 0, is_default: false });
      fetchTaxRates();
      toast({ title: "Tax rate added!" });
    }
  };

  const deleteTaxRate = async (id: string) => {
    await supabase.from("tax_rates").delete().eq("id", id);
    fetchTaxRates();
    toast({ title: "Tax rate deleted" });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SEO title="Settings" description="Configure organization details, currency, tax rates, branding and document preferences." path="/settings" />
      <PageHeader title="Settings" description="Manage your organization and preferences" />

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="taxes">Tax Rates</TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5" /> Account Information</CardTitle>
              <CardDescription>Details from your signup. Email cannot be changed here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  {profileForm.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">
                    {[profileForm.first_name, profileForm.last_name].filter(Boolean).join(" ") || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {user?.email || "—"}
                  </p>
                  {org && (
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" /> {org.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Registered Email</Label>
                <Input value={user?.email || ""} disabled className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email is linked to your login and cannot be changed from here.</p>
              </div>

              <div className="space-y-2">
                <Label>Mobile / Phone Number</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
                <p className="text-xs text-muted-foreground">Your contact number for billing and communications.</p>
              </div>

              <div className="space-y-2">
                <Label>Current Organization</Label>
                <Input value={org?.name || "—"} disabled className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">To change organization details or address, use the Organization tab above.</p>
              </div>

              <div className="space-y-2">
                <Label>User Role</Label>
                <Input value={useAppStore.getState().userRole || "—"} disabled className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed capitalize" />
              </div>

              <Button onClick={saveProfile} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Business Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={orgForm.website} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input value={orgForm.address.street} onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, street: e.target.value } })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={orgForm.address.city} onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, city: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label>State (GST Code)</Label>
                  <Select value={orgForm.address.state} onValueChange={(val) => setOrgForm({ ...orgForm, address: { ...orgForm.address, state: val } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="27">27 - Maharashtra</SelectItem>
                      <SelectItem value="07">07 - Delhi</SelectItem>
                      <SelectItem value="09">09 - Uttar Pradesh</SelectItem>
                      <SelectItem value="24">24 - Gujarat</SelectItem>
                      <SelectItem value="29">29 - Karnataka</SelectItem>
                      <SelectItem value="33">33 - Tamil Nadu</SelectItem>
                      <SelectItem value="19">19 - West Bengal</SelectItem>
                      <SelectItem value="08">08 - Rajasthan</SelectItem>
                      <SelectItem value="00">00 - Other / Unregistered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={orgForm.address.country} onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, country: e.target.value } })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Name (e.g. GST, VAT)</Label>
                  <Input value={orgForm.tax_name} onChange={(e) => setOrgForm({ ...orgForm, tax_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tax Number</Label>
                  <Input value={orgForm.tax_number} onChange={(e) => setOrgForm({ ...orgForm, tax_number: e.target.value })} />
                </div>
              </div>
              <Button onClick={saveOrg}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6 mt-4">
          <Tabs defaultValue="preferences">
            <TabsList>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="defaults">Defaults & Numbering</TabsTrigger>
            </TabsList>

            <TabsContent value="preferences" className="space-y-6 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id="edit-sent" />
                    <Label htmlFor="edit-sent">Allow editing of Sent Invoice?</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Payments</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox id="notify-online" defaultChecked />
                    <Label htmlFor="notify-online">Get notified when customers pay online</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="receipt-thankyou" defaultChecked />
                    <Label htmlFor="receipt-thankyou">Include the payment receipt along with the Thank You note?</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="auto-thankyou" />
                    <Label htmlFor="auto-thankyou">Automate thank you note to customer on receipt of online payment</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Zero-Value Line Items</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox id="hide-zero" />
                    <Label htmlFor="hide-zero">Hide zero-value line items</Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-7">
                    Choose whether to hide zero-value line items in an invoice's PDF and the Customer Portal. They will still be visible while editing an invoice.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Terms & Conditions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Terms & Conditions</Label>
                    <Textarea value={orgForm.default_terms} onChange={(e) => setOrgForm({ ...orgForm, default_terms: e.target.value })} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Notes</Label>
                    <Textarea value={orgForm.default_notes} onChange={(e) => setOrgForm({ ...orgForm, default_notes: e.target.value })} placeholder="Thanks for your business." rows={4} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">GST Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable GST</Label>
                      <p className="text-xs text-muted-foreground">Show GST details on invoices</p>
                    </div>
                    <Switch checked={orgForm.gst_enabled} onCheckedChange={(v) => setOrgForm({ ...orgForm, gst_enabled: v })} />
                  </div>
                  {orgForm.gst_enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Your GST Number</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={orgForm.gst_number || ""} 
                            onChange={(e) => setOrgForm({ ...orgForm, gst_number: e.target.value.toUpperCase() })} 
                            placeholder="e.g. 22AAAAA0000A1Z5" 
                            maxLength={15}
                          />
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleFetchGst}
                            disabled={isFetchingGst || (orgForm.gst_number || "").length !== 15}
                          >
                            {isFetchingGst ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Fetch Details
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Client GST</Label>
                          <p className="text-xs text-muted-foreground">Include client's GST number on invoice for input tax credit claims</p>
                        </div>
                        <Switch checked={orgForm.show_client_gst} onCheckedChange={(v) => setOrgForm({ ...orgForm, show_client_gst: v })} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">QR Code & UPI Payment</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Embed QR Code</Label>
                      <p className="text-xs text-muted-foreground">Add a UPI payment QR code to invoices with exact invoice amount</p>
                    </div>
                    <Switch checked={orgForm.qr_code_enabled} onCheckedChange={(v) => setOrgForm({ ...orgForm, qr_code_enabled: v })} />
                  </div>
                  {orgForm.qr_code_enabled && (
                    <div className="space-y-2">
                      <Label>UPI ID</Label>
                      <Input value={orgForm.upi_id} onChange={(e) => setOrgForm({ ...orgForm, upi_id: e.target.value })} placeholder="e.g. yourname@upi or 9999999999@paytm" />
                      <p className="text-xs text-muted-foreground">Enter your UPI ID to generate payment QR codes on invoices with the exact balance amount</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Inventory Management</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Inventory Tracking</Label>
                      <p className="text-xs text-muted-foreground">Turn on if you sell physical products. Stock auto-deducts on each invoice. Service businesses can leave this off.</p>
                    </div>
                    <Switch checked={orgForm.inventory_enabled} onCheckedChange={(v) => setOrgForm({ ...orgForm, inventory_enabled: v })} />
                  </div>
                  {orgForm.inventory_enabled && (
                    <div className="space-y-2">
                      <Label>Low Stock Alert Threshold</Label>
                      <Input type="number" min={0} value={orgForm.low_stock_threshold} onChange={(e) => setOrgForm({ ...orgForm, low_stock_threshold: parseFloat(e.target.value) || 0 })} />
                      <p className="text-xs text-muted-foreground">Items at or below this stock level appear in the dashboard low-stock alert.</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label>Multi-warehouse mode</Label>
                      <p className="text-xs text-muted-foreground">Track stock across multiple locations. When off, a single shared stock pool is used (recommended for most users).</p>
                    </div>
                    <Switch checked={orgForm.multi_warehouse_enabled} onCheckedChange={(v) => setOrgForm({ ...orgForm, multi_warehouse_enabled: v })} />
                  </div>

                  {orgForm.multi_warehouse_enabled && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Warehouse className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">Warehouses & Storage Locations</div>
                          <div className="text-xs text-muted-foreground">Configure godowns, fulfillment centers, and default dispatch locations.</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs flex-1 sm:flex-initial"
                          onClick={() => setAddWarehouseOpen(true)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Warehouse
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1.5 text-xs flex-1 sm:flex-initial"
                          onClick={() => navigate("/warehouses")}
                        >
                          Manage Warehouses <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label>Enable Sub Units (e.g. 1 Box = 10 Packs)</Label>
                      <p className="text-xs text-muted-foreground">Allows selling products in smaller sub-units.</p>
                    </div>
                    <Switch checked={orgForm.sub_unit_enabled} onCheckedChange={(v) => setOrgForm({ ...orgForm, sub_unit_enabled: v })} />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={saveOrg}>Save</Button>
            </TabsContent>

            <TabsContent value="defaults" className="space-y-6 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Invoice Defaults</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Invoice Prefix</Label>
                      <Input value={orgForm.invoice_prefix} onChange={(e) => setOrgForm({ ...orgForm, invoice_prefix: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={orgForm.currency_code} onValueChange={(v) => setOrgForm({ ...orgForm, currency_code: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms (days)</Label>
                      <Input type="number" value={orgForm.payment_terms} onChange={(e) => setOrgForm({ ...orgForm, payment_terms: parseInt(e.target.value) || 30 })} />
                    </div>
                  </div>
                  <Button onClick={saveOrg}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6 mt-4">
          <Card className="border-indigo-100 bg-indigo-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-indigo-950">Official GST Slabs</CardTitle>
              <CardDescription className="text-xs text-indigo-700">
                Standard GST tax slabs configured across your catalog, items, and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {INDIAN_GST_SLABS.map((slab) => (
                  <div key={slab.id} className="p-3 bg-white rounded-lg border border-indigo-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded mb-1.5">
                        {slab.rate}%
                      </span>
                      <div className="font-semibold text-xs text-slate-800 line-clamp-1">{slab.name.split(" - ")[1] || slab.name}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      {slab.rate === 0 && "Exempted goods & services"}
                      {slab.rate === 3 && "Gold, silver & precious metals"}
                      {slab.rate === 5 && "Essential goods & food items"}
                      {slab.rate === 18 && "Standard goods & services"}
                      {slab.rate === 40 && "Luxury & sin goods"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Custom / Saved Tax Rates</CardTitle>
                <CardDescription className="text-xs">Database tax rate entries synced with your invoices</CardDescription>
              </div>
              <Button size="sm" onClick={() => {
                setTaxForm({ name: "", rate: 18, is_default: false });
                setTaxDialogOpen(true);
              }}>
                <Plus className="mr-1 h-4 w-4" /> Add Tax Rate
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {taxRates.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No custom tax rates saved. Standard 5 GST slabs are automatically active.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRates.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.rate}%</TableCell>
                        <TableCell>{t.is_default ? "Yes" : "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteTaxRate(t.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Tax Rate</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preset Slab</Label>
                  <Select onValueChange={(val) => {
                    const slab = INDIAN_GST_SLABS.find(s => s.id === val);
                    if (slab) {
                      setTaxForm(prev => ({ ...prev, name: slab.name, rate: slab.rate }));
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Pick a standard GST slab" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_GST_SLABS.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} placeholder="e.g. GST 18%" />
                </div>
                <div className="space-y-2">
                  <Label>Rate (%)</Label>
                  <Input type="number" step="0.01" value={taxForm.rate} onChange={(e) => setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={taxForm.is_default} onCheckedChange={(v) => setTaxForm({ ...taxForm, is_default: !!v })} />
                  <Label>Set as default</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveTaxRate}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <AddWarehouseDialog
        open={addWarehouseOpen}
        onOpenChange={setAddWarehouseOpen}
        onWarehouseAdded={() => {
          toast({ title: "Warehouse added successfully" });
        }}
      />
    </div>
  );
}
