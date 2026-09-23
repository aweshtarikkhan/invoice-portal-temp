import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Tag, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export function CouponsManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCoupons(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    const trimmedCode = newCoupon.code.trim().toUpperCase();
    if (!trimmedCode) {
      toast({ title: "Code Required", description: "Please enter a promo code.", variant: "destructive" });
      return;
    }

    const rawVal = parseFloat(newCoupon.discount_value);
    if (isNaN(rawVal) || rawVal <= 0) {
      toast({ title: "Invalid Discount", description: "Please enter a valid discount amount.", variant: "destructive" });
      return;
    }

    // In DB, percentage is stored as number (e.g. 20 for 20%)
    // Flat is stored in paise (e.g. 50000 for ₹500)
    let calculatedValue = Math.round(rawVal);
    if (newCoupon.discount_type === "flat") {
      calculatedValue = Math.round(rawVal * 100);
    } else if (newCoupon.discount_type === "percentage") {
      if (rawVal > 100) {
        toast({ title: "Invalid Percentage", description: "Percentage cannot be greater than 100%.", variant: "destructive" });
        return;
      }
      calculatedValue = Math.round(rawVal);
    }

    setCreating(true);
    
    const { error } = await supabase.from("coupons").insert({
      code: trimmedCode,
      description: newCoupon.description.trim() || null,
      discount_type: newCoupon.discount_type,
      discount_value: calculatedValue,
      max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
      applicable_plans: ["all"],
      applicable_cycles: ["all"],
      is_active: true
    });

    setCreating(false);
    
    if (error) {
      toast({ title: "Error Creating Coupon", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon Created! 🎟️", description: `Promo code ${trimmedCode} is now active.` });
      setNewCoupon({ code: "", description: "", discount_type: "percentage", discount_value: "", max_uses: "" });
      loadCoupons();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !currentStatus ? "Coupon Activated" : "Coupon Deactivated" });
      loadCoupons();
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon Deleted" });
      loadCoupons();
    }
  };

  const handleResetUsage = async (id: string, code: string) => {
    if (!confirm(`Reset usage count for promo code ${code} back to 0 and reactivate it?`)) return;
    const { error } = await supabase
      .from("coupons")
      .update({ used_count: 0, is_active: true })
      .eq("id", id);

    if (error) {
      toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usage Reset", description: `Promo code ${code} usage count reset to 0.` });
      loadCoupons();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="animate-spin h-7 w-7 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Promo Code Card */}
      <Card className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50/70 to-slate-50 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Create Promo Code</CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Generate new discount coupons for customer subscription upgrades.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Promo Code Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Promo Code <span className="text-red-500">*</span>
              </Label>
              <Input 
                className="bg-white border-slate-300 text-slate-900 font-bold uppercase tracking-wide placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-indigo-600 h-10" 
                placeholder="e.g. SUMMER50"
                value={newCoupon.code}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Discount Type
              </Label>
              <Select 
                value={newCoupon.discount_type} 
                onValueChange={v => setNewCoupon({ ...newCoupon, discount_type: v })}
              >
                <SelectTrigger className="bg-white border-slate-300 text-slate-900 font-semibold h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="percentage" className="font-medium">Percentage (%)</SelectItem>
                  <SelectItem value="flat" className="font-medium">Flat Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Discount Value <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input 
                  type="number" 
                  min="1"
                  max={newCoupon.discount_type === "percentage" ? "100" : undefined}
                  className="bg-white border-slate-300 text-slate-900 font-bold placeholder:text-slate-400 focus:border-indigo-600 pr-10 h-10" 
                  placeholder={newCoupon.discount_type === "percentage" ? "e.g. 20" : "e.g. 500"}
                  value={newCoupon.discount_value}
                  onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  {newCoupon.discount_type === "percentage" ? "%" : "₹"}
                </span>
              </div>
            </div>

            {/* Max Usage Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Max Uses (Optional)
              </Label>
              <Input 
                type="number" 
                min="1"
                className="bg-white border-slate-300 text-slate-900 font-semibold placeholder:text-slate-400 focus:border-indigo-600 h-10" 
                placeholder="Unlimited if left blank"
                value={newCoupon.max_uses}
                onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Description (Optional)
              </Label>
              <Input 
                className="bg-white border-slate-300 text-slate-900 font-medium placeholder:text-slate-400 focus:border-indigo-600 h-10" 
                placeholder="e.g. Special launch discount"
                value={newCoupon.description}
                onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button 
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                onClick={handleCreate}
                disabled={creating || !newCoupon.code || !newCoupon.discount_value}
              >
                {creating ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span>Create Coupon</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Promo Codes List */}
      <Card className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            Active Promo Codes
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {coupons.length}
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadCoupons} className="text-xs text-indigo-600 hover:text-indigo-800">
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map(coupon => {
                  const isFlat = coupon.discount_type === "flat";
                  const discountLabel = isFlat
                    ? `₹${Math.round(coupon.discount_value / 100)} OFF`
                    : `${coupon.discount_value}% OFF`;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-600 tracking-wide text-sm">
                          {coupon.code}
                        </div>
                        {coupon.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="secondary" 
                          className={isFlat 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs" 
                            : "bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs"
                          }
                        >
                          {discountLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                        <span className="font-bold text-slate-900">{coupon.used_count}</span>
                        {" / "}
                        <span>{coupon.max_uses ? coupon.max_uses : "∞"}</span>
                      </td>
                      <td className="py-3 px-4">
                        {coupon.max_uses && coupon.used_count >= coupon.max_uses ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Exhausted
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}
                            className="inline-flex items-center gap-1.5 cursor-pointer"
                            title="Click to toggle status"
                          >
                            {coupon.is_active ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors">
                                <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Reset Usage Count"
                          onClick={() => handleResetUsage(coupon.id, coupon.code)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Coupon"
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          disabled={deletingId === coupon.id}
                        >
                          {deletingId === coupon.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                      No promo codes created yet. Use the form above to generate one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
