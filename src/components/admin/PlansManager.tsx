import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
    const { data, error } = await supabase.from("plans").select("*").order("sort_order");
    if (data) setPlans(data);
    setLoading(false);
  };

  const handleUpdate = async (planName: string, monthly: number, yearly: number) => {
    setSavingPlan(planName);
    const { error } = await supabase.rpc("update_plan_price", {
      p_plan_name: planName,
      p_price_monthly: monthly,
      p_price_yearly: yearly
    });
    setSavingPlan(null);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan Updated", description: "Pricing saved successfully." });
      loadPlans();
    }
  };

  if (loading) return <div><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Subscription Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className="bg-slate-900 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">{plan.display_name}</CardTitle>
              <CardDescription className="text-slate-400">{plan.plan_type.toUpperCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-slate-400">Monthly Price (INR)</Label>
                <div className="flex gap-2">
                  <span className="flex items-center text-slate-500">₹</span>
                  <Input 
                    type="number" 
                    className="bg-slate-800 border-slate-700 text-white"
                    value={plan.price_monthly / 100} 
                    onChange={e => {
                      const newPlans = [...plans];
                      const idx = newPlans.findIndex(p => p.id === plan.id);
                      newPlans[idx].price_monthly = (parseInt(e.target.value) || 0) * 100;
                      setPlans(newPlans);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Yearly Price (INR)</Label>
                <div className="flex gap-2">
                  <span className="flex items-center text-slate-500">₹</span>
                  <Input 
                    type="number" 
                    className="bg-slate-800 border-slate-700 text-white"
                    value={plan.price_yearly / 100} 
                    onChange={e => {
                      const newPlans = [...plans];
                      const idx = newPlans.findIndex(p => p.id === plan.id);
                      newPlans[idx].price_yearly = (parseInt(e.target.value) || 0) * 100;
                      setPlans(newPlans);
                    }}
                  />
                </div>
              </div>
              <Button 
                variant="secondary"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                disabled={savingPlan === plan.name}
                onClick={() => handleUpdate(plan.name, plan.price_monthly, plan.price_yearly)}
              >
                {savingPlan === plan.name ? "Saving..." : "Save Prices"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
