import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

// Alias mapping between modern plan keys and legacy keys
const PLAN_ALIASES: Record<string, string> = {
  accounting: "plan_2",
  suite: "plan_3",
  hr: "plan_4",
  crm: "plan_5",
  promotion: "plan_6",
};

// Helper to ensure prices from DB are in Rupees
const normalizePriceToRupees = (price: number, isYearly: boolean): number => {
  if (!price || price <= 0) return 0;
  if (isYearly) {
    return price >= 50000 ? Math.round(price / 100) : price;
  }
  return price >= 10000 ? Math.round(price / 100) : price;
};

export function PlansManager() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from("plans").select("*").order("sort_order");
    if (data) setPlans(data);
    setLoading(false);
  };

  const handleUpdate = async (planName: string, monthly: number, yearly: number) => {
    setSavingPlan(planName);

    // Calculate paise if DB uses paise or direct rupees
    // Standardize: if > 0, store paise or raw
    const planNamesToUpdate = [planName];
    if (PLAN_ALIASES[planName]) planNamesToUpdate.push(PLAN_ALIASES[planName]);
    const reverseAlias = Object.entries(PLAN_ALIASES).find(([, v]) => v === planName)?.[0];
    if (reverseAlias) planNamesToUpdate.push(reverseAlias);

    try {
      // 1. Direct update to plans table
      const { error: directErr } = await supabase
        .from("plans")
        .update({
          price_monthly: monthly,
          price_yearly: yearly,
          updated_at: new Date().toISOString()
        })
        .in("name", planNamesToUpdate);

      // 2. RPC call for trigger/backend sync
      try {
        await supabase.rpc("update_plan_price", {
          p_plan_name: planName,
          p_price_monthly: monthly,
          p_price_yearly: yearly
        });
      } catch (_) {}

      if (directErr) {
        toast({ title: "Error Updating Plan", description: directErr.message, variant: "destructive" });
      } else {
        toast({ title: "Plan Pricing Saved! 💳", description: `Updated ${planName} pricing.` });
        loadPlans();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
      </div>
    );
  }

  // Deduplicate: filter out legacy plan_* entries if modern canonical key exists
  const hasModernKeys = plans.some(p => ["accounting", "suite", "hr", "crm", "promotion"].includes(p.name));
  const displayPlans = hasModernKeys 
    ? plans.filter(p => !p.name.startsWith("plan_"))
    : plans;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Subscription Plans & Pricing</h3>
          <p className="text-xs text-slate-500">Configure public subscription pricing for monthly and annual billing cycles.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPlans} className="text-xs">
          Refresh Plans
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayPlans.map(plan => {
          const planTypeName = (plan.plan_type || "tiered").toUpperCase();

          return (
            <Card key={plan.id} className="bg-white border-slate-200 text-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900">{plan.display_name || plan.name}</CardTitle>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {planTypeName}
                  </span>
                </div>
                <CardDescription className="text-slate-500 text-xs font-mono">Key: {plan.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Monthly Price (₹)
                  </Label>
                  <div className="flex gap-2">
                    <span className="flex items-center text-slate-500 font-bold text-sm">₹</span>
                    <Input 
                      type="number" 
                      className="bg-slate-50 border-slate-300 text-slate-900 font-bold focus:border-indigo-600 h-10"
                      value={normalizePriceToRupees(plan.price_monthly, false)} 
                      onChange={e => {
                        const newPlans = [...plans];
                        const idx = newPlans.findIndex(p => p.id === plan.id);
                        newPlans[idx].price_monthly = parseInt(e.target.value) || 0;
                        setPlans(newPlans);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Yearly Price (₹)
                  </Label>
                  <div className="flex gap-2">
                    <span className="flex items-center text-slate-500 font-bold text-sm">₹</span>
                    <Input 
                      type="number" 
                      className="bg-slate-50 border-slate-300 text-slate-900 font-bold focus:border-indigo-600 h-10"
                      value={normalizePriceToRupees(plan.price_yearly, true)} 
                      onChange={e => {
                        const newPlans = [...plans];
                        const idx = newPlans.findIndex(p => p.id === plan.id);
                        newPlans[idx].price_yearly = parseInt(e.target.value) || 0;
                        setPlans(newPlans);
                      }}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                  disabled={savingPlan === plan.name}
                  onClick={() => handleUpdate(plan.name, plan.price_monthly, plan.price_yearly)}
                >
                  {savingPlan === plan.name ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Prices
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
