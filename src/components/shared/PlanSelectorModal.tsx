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
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  
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

  const calculatePrice = (plan: Plan) => {
    let base = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    
    // Add extra employees for HRMS plan
    if (plan.name === "hrms" && plan.employee_limit && plan.employee_price_extra) {
      const extra = Math.max(0, hrmsEmployeeCount - plan.employee_limit);
      const extraCost = extra * plan.employee_price_extra;
      // If yearly, multiply extra cost by 12 and apply yearly discount
      if (billingCycle === "yearly") {
        base += (extraCost * 12) * (1 - yearlyDiscountPct / 100);
      } else {
        base += extraCost;
      }
    }

    let final = base;
    if (validCoupon) {
      if (validCoupon.type === "percentage") {
        final = final - Math.floor((final * validCoupon.amount) / 100);
      } else {
        final = Math.max(0, final - validCoupon.amount);
      }
    }
    return { base, final };
  };

  const handleStartTrial = async (plan: Plan) => {
    if (!orgId) return;
    setProcessingPlan(`trial_${plan.id}`);
    try {
      const { error } = await supabase.rpc("start_org_trial", {
        p_org_id: orgId,
        p_plan_name: plan.name
      });
      if (error) throw error;
      toast({ title: "Trial Started", description: `You are now on a trial of the ${plan.display_name}.` });
      window.location.reload(); // Reload to refresh features
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessingPlan(null);
  };

  const handlePay = async (plan: Plan) => {
    if (!orgId) return;
    setProcessingPlan(`pay_${plan.id}`);
    try {
      // 1. Create order
      const response = await fetch("http://localhost:4000/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          plan_name: plan.name,
          billing_cycle: billingCycle,
          coupon_code: validCoupon ? promoCode : undefined,
        })
      });
      const orderData = await response.json();
      if (!response.ok) throw new Error(orderData.error);

      if (orderData.amount === 0) {
        // Free plan logic if applicable (bypass razorpay)
        throw new Error("Free plans should use Start Trial");
      }



      // 2. Open Razorpay Modal
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Assay Biz",
        description: `Subscription to ${plan.display_name}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          // 3. Verify payment signature with backend
          try {
            const verifyRes = await fetch("http://localhost:4000/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                org_id: orgId,
                plan_name: plan.name,
                billing_cycle: billingCycle,
                coupon_id: orderData.coupon_id,
                discounted_price: orderData.discount_applied,
                employee_count: plan.name === "hrms" ? hrmsEmployeeCount : 0
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);
            
            // 4. Activate the plan in the database via Supabase RPC
            const { data: activateData, error: activateError } = await supabase.rpc("activate_org_plan", {
              p_org_id: orgId,
              p_plan_name: plan.name,
              p_billing_cycle: billingCycle,
              p_razorpay_order_id: response.razorpay_order_id,
              p_razorpay_payment_id: response.razorpay_payment_id,
              p_employee_count: plan.name === "hrms" ? hrmsEmployeeCount : 0
            });

            if (activateError) {
              console.error("Plan activation error:", activateError);
              throw new Error("Payment received but plan activation failed. Please contact support with payment ID: " + response.razorpay_payment_id);
            }
            
            toast({ title: "🎉 Payment Successful!", description: `${plan.display_name} plan has been activated for your business.` });
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
    setProcessingPlan(null);
  };

  const isNewOrgPurchase = !!forceOrgId;
  const canShowTrial = !isNewOrgPurchase && subscriptionStatus !== "active" && subscriptionStatus !== "cancelled" && myOrganizations.length <= 1;

  return (
    <Dialog open={open} onOpenChange={onClose} modal={false}>
      {/* Semi-transparent backdrop for modal={false} */}
      {open && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />}
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto z-50"
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Choose the perfect plan for your business needs.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-primary" : "text-muted-foreground"}`}>Monthly</span>
              <Switch 
                checked={billingCycle === "yearly"} 
                onCheckedChange={(c) => setBillingCycle(c ? "yearly" : "monthly")} 
              />
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-primary" : "text-muted-foreground"}`}>Yearly</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Save {yearlyDiscountPct}%</Badge>
              </div>
            </div>

            <div className="flex max-w-md mx-auto gap-2">
              <Input 
                placeholder="Enter Promo Code" 
                value={promoCode} 
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={!!validCoupon}
              />
              {validCoupon ? (
                <Button variant="outline" onClick={() => { setValidCoupon(null); setPromoCode(""); }}>Remove</Button>
              ) : (
                <Button onClick={handleApplyPromo} disabled={!promoCode || couponLoading}>
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const prices = calculatePrice(plan);
                const isCurrent = currentPlanName === plan.name;
                
                return (
                  <div key={plan.id} className={`border rounded-xl p-6 flex flex-col ${isCurrent ? "border-primary ring-2 ring-primary/20" : "border-slate-200 dark:border-slate-800"} relative`}>
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary">Current Plan</Badge>
                      </div>
                    )}
                    
                    <h3 className="text-lg font-bold">{plan.display_name}</h3>
                    
                    <div className="mt-4 mb-6">
                      {validCoupon && (
                        <div className="text-sm text-muted-foreground line-through mb-1">
                          ₹{(prices.base / 100).toLocaleString('en-IN')}
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">₹{(prices.final / 100).toLocaleString('en-IN')}</span>
                        <span className="text-sm text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                      </div>
                    </div>

                    {plan.name === "hrms" && (
                      <div className="mb-6 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Employees Count</label>
                        <div className="flex items-center justify-between">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setHrmsEmployeeCount(Math.max(5, hrmsEmployeeCount - 1))}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold">{hrmsEmployeeCount}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setHrmsEmployeeCount(hrmsEmployeeCount + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {hrmsEmployeeCount > (plan.employee_limit || 0) && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                            +{hrmsEmployeeCount - (plan.employee_limit || 0)} extra employees (₹{((plan.employee_price_extra||0)/100)} each)
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 space-y-3 mb-8">
                      {plan.features.map((featureKey) => (
                        <div key={featureKey} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="capitalize">{featureKey.replace("-", " ")}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                      {canShowTrial && (
                        <Button 
                          variant={isCurrent ? "outline" : "secondary"}
                          onClick={() => handleStartTrial(plan)}
                          disabled={processingPlan !== null || isCurrent}
                        >
                          {processingPlan === `trial_${plan.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Start 14-Day Free Trial"}
                        </Button>
                      )}
                      <Button 
                        variant={isCurrent ? "outline" : "default"}
                        onClick={() => handlePay(plan)}
                        disabled={processingPlan !== null}
                      >
                        {processingPlan === `pay_${plan.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Pay & Activate"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
