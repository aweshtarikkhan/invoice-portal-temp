import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureStore } from "@/store/feature-store";
import { useAppStore } from "@/store/app-store";

interface Plan {
  id: string;
  name: string;
  display_name: string;
  plan_type: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  employee_limit: number | null;
  employee_price_extra: number | null;
}

interface PlanSelectorModalProps {
  open: boolean;
  onClose: () => void;
  currentPlanName?: string;
  forceOrgId?: string | null;
}

export function PlanSelectorModal({ open, onClose, currentPlanName, forceOrgId }: PlanSelectorModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [yearlyDiscountPct, setYearlyDiscountPct] = useState(20);
  const [promoCode, setPromoCode] = useState("");
  const [validCoupon, setValidCoupon] = useState<{ id: string; amount: number; type: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [hrmsEmployeeCount, setHrmsEmployeeCount] = useState(5);
  const [processingPlan, setProcessingPlan] = useState<boolean>(false);
  
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  
  const { toast } = useToast();
  const storeOrgId = useFeatureStore((s) => s.currentOrgId);
  const orgId = forceOrgId || storeOrgId;
  const { subscriptionStatus } = useFeatureStore();
  const myOrganizations = useAppStore((s) => s.myOrganizations);

  useEffect(() => {
    if (open) {
      loadData();
      loadRazorpayScript();
    }
  }, [open]);

  const loadRazorpayScript = () => {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: plansData }, { data: settingsData }, { data: allowFreeData }] = await Promise.all([
        supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("platform_settings").select("key, value").eq("key", "yearly_discount_pct").maybeSingle(),
        supabase.from("platform_settings").select("key, value").eq("key", "allow_free_plan").maybeSingle()
      ]);
      
      let finalPlans = (plansData as Plan[]) || [];
      if (allowFreeData && allowFreeData.value === "false") {
        finalPlans = finalPlans.filter(p => p.name !== "free");
      }
      setPlans(finalPlans);
      
      if (settingsData?.value) setYearlyDiscountPct(parseInt(settingsData.value));



    } catch (error) {
      console.error("Failed to load plans:", error);
    }
    setLoading(false);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: promoCode,
        p_billing_cycle: billingCycle,
      });
      if (error) throw error;
      if (data?.valid) {
        setValidCoupon({
          id: data.coupon_id,
          type: data.discount_type,
          amount: data.discount_value
        });
        toast({ title: "Promo code applied!", description: data.description });
      } else {
        setValidCoupon(null);
        toast({ title: "Invalid code", description: data?.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setCouponLoading(false);
  };

  const getPlanPrice = (plan: Plan) => {
    let base = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    
    // Add extra employees for HRMS plan
    if (plan.name === "plan_4" && plan.employee_limit && plan.employee_price_extra) {
      const extra = Math.max(0, hrmsEmployeeCount - plan.employee_limit);
      const extraCost = extra * plan.employee_price_extra;
      // If yearly, multiply extra cost by 12 and apply yearly discount
      if (billingCycle === "yearly") {
        base += (extraCost * 12) * (1 - yearlyDiscountPct / 100);
      } else {
        base += extraCost;
      }
    }
    return base;
  };

  const basePlans = plans.filter(p => ['free', 'plan_2', 'plan_3'].includes(p.name));
  const addOns = plans.filter(p => ['plan_4', 'plan_5', 'plan_6'].includes(p.name));

  const basePlan = basePlans.find(p => p.name === selectedBasePlan);
  
  let totalAmount = 0;
  if (basePlan) {
    totalAmount += getPlanPrice(basePlan);
  }

  const activeAddonIds: string[] = [];
  const selectedPlanIds: string[] = [];
  if (basePlan) selectedPlanIds.push(basePlan.id);

  addOns.forEach((addon) => {
    const isIncludedInPlan3 = selectedBasePlan === 'plan_3' && (addon.name === 'plan_5' || addon.name === 'plan_6');
    const isManuallySelected = selectedAddons.includes(addon.id);
    
    if (isIncludedInPlan3 || isManuallySelected) {
      activeAddonIds.push(addon.id);
      if (!selectedPlanIds.includes(addon.id)) selectedPlanIds.push(addon.id);
      
      if (!isIncludedInPlan3) {
        totalAmount += getPlanPrice(addon);
      }
    }
  });

  if (validCoupon) {
    if (validCoupon.type === "percentage") {
      totalAmount = totalAmount - Math.floor((totalAmount * validCoupon.amount) / 100);
    } else {
      totalAmount = Math.max(0, totalAmount - validCoupon.amount);
    }
  }

  const handleCheckout = async () => {
    if (!orgId) return;
    setProcessingPlan(true);
    try {
      // 1. Create order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create_razorpay_order", {
        body: {
          org_id: orgId,
          selected_plan_ids: selectedPlanIds.join(','),
          billing_cycle: billingCycle,
          coupon_code: validCoupon ? promoCode : undefined,
          hrms_employee_count: hrmsEmployeeCount,
          total_amount: totalAmount
        }
      });
      
      if (orderError) throw new Error(orderError.message || "Failed to create order");
      if (!orderData) throw new Error("No order data returned");

      if (orderData.amount === 0) {
        // Free plan logic if applicable
        if (basePlan && basePlan.name === 'free') {
          const { error } = await supabase.rpc("start_org_trial", {
            p_org_id: orgId,
            p_plan_name: basePlan.name
          });
          if (error) throw error;
          toast({ title: "Plan Activated", description: `You are now on the Free plan.` });
          window.location.reload();
          return;
        } else {
           throw new Error("Free plans should use Start Trial");
        }
      }

      // 2. Open Razorpay Modal
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Assay Biz",
        description: `Subscription Upgrade`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment signature
            const verifyRes = await fetch("http://localhost:4000/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                org_id: orgId,
                selected_plan_ids: selectedPlanIds.join(','),
                billing_cycle: billingCycle,
                coupon_id: orderData.coupon_id,
                discounted_price: orderData.discount_applied,
                employee_count: hrmsEmployeeCount
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
            
            // 4. Activate the plan in the database
            const { data: activateData, error: activateError } = await supabase.rpc("activate_org_plan", {
              p_org_id: orgId,
              p_plan_name: basePlan?.name || "premium",
              p_billing_cycle: billingCycle,
              p_razorpay_order_id: response.razorpay_order_id,
              p_razorpay_payment_id: response.razorpay_payment_id,
              p_employee_count: hrmsEmployeeCount
            });

            if (activateError) {
              console.error("Plan activation error:", activateError);
              throw new Error("Payment received but plan activation failed. Please contact support with payment ID: " + response.razorpay_payment_id);
            }
            
            toast({ title: "🎉 Payment Successful!", description: `Plans have been activated for your business.` });
            window.location.reload();
          } catch (err: any) {
            toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
          }
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
      });
      rzp.open();

    } catch (err: any) {
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
    }
    setProcessingPlan(false);
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={false}>
      {open && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />}
      <DialogContent 
        className="max-w-5xl max-h-[90vh] overflow-y-auto z-50 bg-slate-950 text-slate-50 border-slate-800"
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Choose your base plan and customize with add-ons.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-8 mt-4">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-primary" : "text-slate-400"}`}>Monthly</span>
              <Switch 
                checked={billingCycle === "yearly"} 
                onCheckedChange={(c) => setBillingCycle(c ? "yearly" : "monthly")} 
              />
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-primary" : "text-slate-400"}`}>Yearly</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0">Save {yearlyDiscountPct}%</Badge>
              </div>
            </div>

            {/* Base Plans Selection */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Select Base Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {basePlans.map((plan) => {
                  const price = getPlanPrice(plan);
                  const isSelected = selectedBasePlan === plan.name;
                  
                  return (
                    <div 
                      key={plan.id} 
                      onClick={() => setSelectedBasePlan(plan.name)}
                      className={`border rounded-xl p-6 flex flex-col cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-slate-800 hover:border-slate-700 bg-slate-900"} relative`}
                    >
                      <h4 className="text-lg font-bold">{plan.display_name}</h4>
                      
                      <div className="mt-4 mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">₹{(price / 100).toLocaleString('en-IN')}</span>
                          <span className="text-sm text-slate-400">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        {plan.features.map((featureKey) => (
                          <div key={featureKey} className="flex items-center gap-2 text-sm text-slate-300">
                            <Check className="h-4 w-4 text-primary shrink-0" />
                            <span className="capitalize">{featureKey.replace("-", " ")}</span>
                          </div>
                        ))}
                      </div>

                      {isSelected && (
                        <div className="mt-4 flex justify-end">
                          <Check className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add-ons Selection */}
            {addOns.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Select Add-ons</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {addOns.map((addon) => {
                    const price = getPlanPrice(addon);
                    const isIncludedInPlan3 = selectedBasePlan === 'plan_3' && (addon.name === 'plan_5' || addon.name === 'plan_6');
                    const isSelected = isIncludedInPlan3 || selectedAddons.includes(addon.id);

                    return (
                      <div 
                        key={addon.id} 
                        onClick={() => !isIncludedInPlan3 && toggleAddon(addon.id)}
                        className={`border rounded-xl p-6 flex flex-col transition-all ${isIncludedInPlan3 ? "opacity-80 border-primary/50 bg-primary/5" : isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-slate-800 bg-slate-900 hover:border-slate-700 cursor-pointer"} relative`}
                      >
                        {isIncludedInPlan3 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max max-w-[90%]">
                            <Badge className="bg-primary text-primary-foreground border-0 text-xs truncate">Included in {basePlans.find(p => p.name === 'plan_3')?.display_name || 'Plan 3'}</Badge>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mt-2">
                          <h4 className="text-lg font-bold">{addon.display_name}</h4>
                          <div className={`h-5 w-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-600'}`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                        
                        <div className="mt-4 mb-6">
                          {isIncludedInPlan3 ? (
                            <span className="text-xl font-bold text-green-500">Free</span>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold">₹{(price / 100).toLocaleString('en-IN')}</span>
                              <span className="text-sm text-slate-400">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                            </div>
                          )}
                        </div>

                        {addon.name === "plan_4" && isSelected && (
                          <div className="mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Employees Count</label>
                            <div className="flex items-center justify-between">
                              <Button size="icon" variant="outline" className="h-8 w-8 border-slate-700" onClick={() => setHrmsEmployeeCount(Math.max(5, hrmsEmployeeCount - 1))}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold">{hrmsEmployeeCount}</span>
                              <Button size="icon" variant="outline" className="h-8 w-8 border-slate-700" onClick={() => setHrmsEmployeeCount(hrmsEmployeeCount + 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {hrmsEmployeeCount > (addon.employee_limit || 0) && (
                              <div className="text-xs text-amber-500 mt-2">
                                +{hrmsEmployeeCount - (addon.employee_limit || 0)} extra employees (₹{((addon.employee_price_extra||0)/100)} each)
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 space-y-3">
                          {addon.features.map((featureKey) => (
                            <div key={featureKey} className="flex items-center gap-2 text-sm text-slate-300">
                              <Check className="h-4 w-4 text-primary shrink-0" />
                              <span className="capitalize">{featureKey.replace("-", " ")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Promo Code & Checkout */}
            <div className="border-t border-slate-800 pt-8 mt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex w-full max-w-sm gap-2">
                  <Input 
                    placeholder="Enter Promo Code" 
                    value={promoCode} 
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={!!validCoupon}
                    className="bg-slate-900 border-slate-800"
                  />
                  {validCoupon ? (
                    <Button variant="outline" className="border-slate-700 hover:bg-slate-800" onClick={() => { setValidCoupon(null); setPromoCode(""); }}>Remove</Button>
                  ) : (
                    <Button onClick={handleApplyPromo} disabled={!promoCode || couponLoading}>
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Total Amount</div>
                    <div className="text-2xl font-bold">₹{(totalAmount / 100).toLocaleString('en-IN')}</div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto"
                    onClick={handleCheckout}
                    disabled={processingPlan || finalSelectedPlanIds.size === 0}
                  >
                    {processingPlan ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                    ) : (
                      `Pay ₹${(totalAmount / 100).toLocaleString('en-IN')} & Activate`
                    )}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
