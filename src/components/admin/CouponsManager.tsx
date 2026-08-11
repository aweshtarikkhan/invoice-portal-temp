import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

export function CouponsManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newCoupon.code || !newCoupon.discount_value) return;
    setCreating(true);
    
    const { error } = await supabase.from("coupons").insert({
      code: newCoupon.code.toUpperCase(),
      description: newCoupon.description,
      discount_type: newCoupon.discount_type,
      discount_value: parseInt(newCoupon.discount_value),
      max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
      applicable_plans: ["all"],
      applicable_cycles: ["all"]
    });

    setCreating(false);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon Created", description: "The promo code has been created successfully." });
      setNewCoupon({ code: "", description: "", discount_type: "percentage", discount_value: "", max_uses: "" });
      loadCoupons();
    }
  };

  if (loading) return <div><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Create Promo Code</CardTitle>
          <CardDescription className="text-slate-400">Generate a new discount coupon.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input 
                className="bg-slate-800 border-slate-700 uppercase" 
                placeholder="e.g. SUMMER50"
                value={newCoupon.code}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newCoupon.discount_type} onValueChange={v => setNewCoupon({ ...newCoupon, discount_type: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat Amount (Paise)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input 
                type="number" 
                className="bg-slate-800 border-slate-700" 
                placeholder={newCoupon.discount_type === "percentage" ? "e.g. 20" : "e.g. 50000"}
                value={newCoupon.discount_value}
                onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Uses (Optional)</Label>
              <Input 
                type="number" 
                className="bg-slate-800 border-slate-700" 
                placeholder="e.g. 100"
                value={newCoupon.max_uses}
                onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
              />
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleCreate}
              disabled={creating || !newCoupon.code || !newCoupon.discount_value}
            >
              {creating ? <Loader2 className="animate-spin h-4 w-4" /> : <><Plus className="h-4 w-4 mr-2" /> Create</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Active Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="pb-3 pr-4">Code</th>
                <th className="pb-3 pr-4">Discount</th>
                <th className="pb-3 pr-4">Uses</th>
                <th className="pb-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id} className="border-b border-slate-800/50">
                  <td className="py-3 pr-4 font-bold text-indigo-400">{coupon.code}</td>
                  <td className="py-3 pr-4">
                    {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `?${coupon.discount_value / 100}`}
                  </td>
                  <td className="py-3 pr-4">
                    {coupon.used_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : "(Unlimited)"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${coupon.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-slate-500">No promo codes found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
