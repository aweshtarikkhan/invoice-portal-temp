import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Check, Loader2, Minus, Plus, Users, Sparkles } from "lucide-react";
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
  const [processingPlan, setProcessingPlan] = useState<boolean>(false);
  
  // Selection state for NEW plans to purchase
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  
  // Active subscription details for the current organization
  const [activePlanNames, setActivePlanNames] = useState<string[]>([]);
  const [activeEmployeeLimit, setActiveEmployeeLimit] = useState<number>(10);
  
  // Extra employee counts:
  // When HR is already active: how many additional employees user wants to add
  const [extraEmployeesToAdd, setExtraEmployeesToAdd] = useState<number>(0);
  // When HR is NOT active and being purchased: total employees desired (default 10 base)
  const [newHrEmployeeCount, setNewHrEmployeeCount] = useState<number>(10);

  const { toast } = useToast();
  const currentOrg = useAppStore((s) => s.organization);
  const storeOrgId = useFeatureStore((s) => s.currentOrgId);
  const orgId = forceOrgId || currentOrg?.id || (storeOrgId && storeOrgId !== "default" ? storeOrgId : null);

  useEffect(() => {
    if (open) {
      loadData();
      loadRazorpayScript();
    } else {
      setSelectedPlanIds([]);
      setExtraEmployeesToAdd(0);
      setValidCoupon(null);
      setPromoCode("");
    }
  }, [open, orgId]);

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
      const [{ data: plansData }, { data: settingsData }, { data: allowFreeData }, { data: subData }] = await Promise.all([
        supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("platform_settings").select("key, value").eq("key", "yearly_discount_pct").maybeSingle(),
        supabase.from("platform_settings").select("key, value").eq("key", "allow_free_plan").maybeSingle(),
        orgId ? supabase.rpc("get_my_org_subscription", { p_org_id: orgId }) : Promise.resolve({ data: null })
      ]);
      
      let finalPlans = (plansData as Plan[]) || [];
      if (allowFreeData && allowFreeData.value === "false") {
        finalPlans = finalPlans.filter(p => p.name !== "free");
      }
      setPlans(finalPlans);
      
      if (settingsData?.value) {
        setYearlyDiscountPct(parseInt(settingsData.value));
      }

      // Parse current active plans from database
      let fetchedActivePlans: string[] = [];
      let empLimit = 10;

      if (subData && subData.plan_name) {
        fetchedActivePlans = subData.plan_name
          .split("+")
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean);
        if (subData.employee_limit) empLimit = subData.employee_limit;
      }

      // Fallback if RPC didn't return paid plans but org record has subscription_plan
      if (fetchedActivePlans.length === 0 || (fetchedActivePlans.length === 1 && fetchedActivePlans[0] === "free")) {
        if (currentOrg?.subscription_plan && currentOrg.subscription_plan !== "free") {
          fetchedActivePlans = [currentOrg.subscription_plan.toLowerCase()];
        } else if (currentPlanName && currentPlanName !== "free") {
          fetchedActivePlans = [currentPlanName.toLowerCase()];
        }
      }

      setActivePlanNames(fetchedActivePlans);
      setActiveEmployeeLimit(empLimit);
      setExtraEmployeesToAdd(0);
      setNewHrEmployeeCount(10);
      setSelectedPlanIds([]);

    } catch (error) {
      console.error("Failed to load plans:", error);
    }
    setLoading(false);
  };

  // Status checks for plans
  const isSuiteActive = activePlanNames.includes("suite");
  const hasPaidPlanActive = isSuiteActive || activePlanNames.some(p => p !== "free");
  const isFreeActive = !hasPaidPlanActive;

  const isPlanActive = (planName: string) => {
    if (planName === "free") return isFreeActive;
    if (planName === "suite") return isSuiteActive;
    if (isSuiteActive) return true; // Suite includes all modular plans
    return activePlanNames.includes(planName);
  };

  const isHrActive = isPlanActive("hr");

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

  // Cost calculation for extra employees (rate: ₹29/employee/mo, with 20% off if yearly)
  const getExtraEmployeeCost = (count: number) => {
    if (count <= 0) return 0;
    const ratePaise = 2900; // ₹29 in paise
    if (billingCycle === "yearly") {
      return Math.round((count * ratePaise * 12) * (1 - yearlyDiscountPct / 100));
    }
    return count * ratePaise;
  };

  const togglePlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // If plan is already active, inform user
    if (isPlanActive(plan.name)) {
      if (plan.name === "hr") {
        toast({
          title: "HR is Already Active",
          description: "Use the counter inside the HR card below to add extra employees at ₹29 each.",
        });
      } else {
        toast({
          title: "Plan Already Active",
          description: `${plan.display_name} is already active for your business.`,
        });
      }
      return;
    }

    setSelectedPlanIds(prev => {
      const isSelecting = !prev.includes(planId);
      if (isSelecting) {
        if (plan.name === "free") {
          return [planId];
        } else {
          const freePlan = plans.find(p => p.name === "free");
          const newSet = prev.filter(id => id !== freePlan?.id);
          return [...newSet, planId];
        }
      } else {
        return prev.filter(id => id !== planId);
      }
    });
  };

  // Final set of newly selected plans
  const finalSelectedPlanIds = new Set<string>(selectedPlanIds);
  const hasNewlySelectedSuite = Array.from(finalSelectedPlanIds).some(id => plans.find(p => p.id === id)?.name === "suite");

  // Calculate total amount to pay
  let totalAmountPaise = 0;

  // 1. Add cost of newly selected plans (excluding already active ones)
  Array.from(finalSelectedPlanIds).forEach(id => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    if (isPlanActive(plan.name)) return;
    if (hasNewlySelectedSuite && plan.name !== "suite" && plan.name !== "free") return;

    let base = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

    // If purchasing HR anew and adding extra employees over base 10
    if (plan.name === "hr" && newHrEmployeeCount > 10) {
      base += getExtraEmployeeCost(newHrEmployeeCount - 10);
    }

    totalAmountPaise += base;
  });

  // 2. If HR is ALREADY active, add cost of extra employees requested
  if (isHrActive && extraEmployeesToAdd > 0) {
    totalAmountPaise += getExtraEmployeeCost(extraEmployeesToAdd);
  }

  // 3. Apply discount coupon if valid
  if (validCoupon) {
    if (validCoupon.type === "percentage") {
      totalAmountPaise = totalAmountPaise - Math.floor((totalAmountPaise * validCoupon.amount) / 100);
    } else {
      totalAmountPaise = Math.max(0, totalAmountPaise - validCoupon.amount);
    }
  }

  const isOnlyAddingExtraEmployees = 
    isHrActive && 
    extraEmployeesToAdd > 0 && 
    (finalSelectedPlanIds.size === 0 || Array.from(finalSelectedPlanIds).every(id => isPlanActive(plans.find(p => p.id === id)?.name || "")));

  const hasAnyActionToCheckout = finalSelectedPlanIds.size > 0 || (isHrActive && extraEmployeesToAdd > 0);

  const handleCheckout = async () => {
    if (!orgId) {
      toast({ title: "Organization Missing", description: "Please select an active organization before upgrading.", variant: "destructive" });
      return;
    }
    setProcessingPlan(true);

    try {
      // Determine plan names to activate/keep
      let targetPlanNames: string[] = [];

      if (isOnlyAddingExtraEmployees) {
        // Keep currently active plans
        targetPlanNames = activePlanNames.length > 0 ? activePlanNames : ["hr"];
      } else {
        targetPlanNames = Array.from(finalSelectedPlanIds)
          .map(id => plans.find(p => p.id === id)?.name)
          .filter(Boolean) as string[];
        
        // Preserve any already active paid plans so they aren't lost
        activePlanNames.forEach(p => {
          if (p !== "free" && !targetPlanNames.includes(p)) {
            targetPlanNames.push(p);
          }
        });
      }

      const totalEmployeesToSend = isOnlyAddingExtraEmployees
        ? Math.max(activeEmployeeLimit, 10) + extraEmployeesToAdd
        : (targetPlanNames.includes("hr") || targetPlanNames.includes("suite") ? newHrEmployeeCount : 0);

      // If total amount is 0 (e.g. Free plan selected or 100% coupon)
      if (totalAmountPaise <= 0) {
        const { error } = await supabase.rpc("activate_org_plans", {
          p_org_id: orgId,
          p_plan_names: targetPlanNames.length > 0 ? targetPlanNames : ["free"],
          p_billing_cycle: billingCycle,
          p_employee_count: totalEmployeesToSend
        });
        if (error) throw error;
        toast({ title: "Plan Updated", description: "Your subscription settings have been updated successfully." });
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      // Ensure Razorpay checkout script is loaded
      if (typeof (window as any).Razorpay === "undefined") {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.id = "razorpay-script";
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load payment gateway SDK. Please check your internet connection."));
          document.body.appendChild(script);
        });
      }

      // Create Razorpay order via Edge Function
      const amountInRupees = Math.round(totalAmountPaise / 100);
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create_razorpay_order", {
        body: {
          action: "create",
          org_id: orgId,
          selected_plan_ids: Array.from(finalSelectedPlanIds).join(','),
          plan_names: targetPlanNames,
          billing_cycle: billingCycle,
          coupon_code: validCoupon ? promoCode : undefined,
          hrms_employee_count: totalEmployeesToSend,
          total_amount: amountInRupees,
          amount_in_paise: totalAmountPaise
        }
      });
      
      if (orderError || !orderData || orderData.error) {
        let errMsg = orderError?.message || orderData?.error || "Failed to initialize payment order";
        throw new Error(errMsg);
      }

      // Open Razorpay Checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Assay Biz",
        description: isOnlyAddingExtraEmployees 
          ? `Add ${extraEmployeesToAdd} Extra Employee Slots`
          : `Subscription Upgrade (${targetPlanNames.join(', ')})`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            setProcessingPlan(true);
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("create_razorpay_order", {
              body: {
                action: "verify",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                org_id: orgId,
                plan_names: targetPlanNames,
                billing_cycle: billingCycle,
                employee_count: totalEmployeesToSend
              }
            });

            if (verifyError || verifyData?.error) {
              throw new Error(verifyError?.message || verifyData?.error || "Payment verification failed");
            }
            
            toast({
              title: "Upgrade Successful!",
              description: isOnlyAddingExtraEmployees
                ? `Successfully added ${extraEmployeesToAdd} extra employee slots.`
                : "Your selected plan(s) have been successfully activated."
            });
            setTimeout(() => window.location.reload(), 1200);
          } catch (err: any) {
            toast({
              title: "Activation Failed",
              description: err.message || "Payment was received but plan activation failed. Please contact support.",
              variant: "destructive"
            });
          } finally {
            setProcessingPlan(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlan(false);
          }
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setProcessingPlan(false);
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Transaction was declined by bank or cancelled.",
          variant: "destructive"
        });
      });
      rzp.open();

    } catch (err: any) {
      setProcessingPlan(false);
      const message = err.message?.includes("Failed to send a request")
        ? "Unable to reach the payment service. Please check your network connection and try again."
        : (err.message || "Failed to initiate plan upgrade.");
      toast({ title: "Upgrade Request Failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={false}>
      {open && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />}
      <DialogContent 
        className="max-w-5xl max-h-[90vh] overflow-y-auto z-50 bg-white text-slate-900 border-slate-200 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-slate-900">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            Select one or more plans to activate for your business, or manage employee capacity.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Loading active subscription & plans...</p>
          </div>
        ) : (
          <div className="space-y-8 mt-4">
            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4 bg-slate-50 py-3 px-4 rounded-xl border border-slate-200 w-fit mx-auto">
              <span className={`text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "text-primary" : "text-slate-500"}`}>
                Monthly Billing
              </span>
              <Switch 
                checked={billingCycle === "yearly"} 
                onCheckedChange={(c) => setBillingCycle(c ? "yearly" : "monthly")} 
              />
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold transition-colors ${billingCycle === "yearly" ? "text-primary" : "text-slate-500"}`}>
                  Yearly Billing
                </span>
                <Badge variant="secondary" className="bg-green-600/10 text-green-700 hover:bg-green-600/20 border-0 font-bold text-xs">
                  Save {yearlyDiscountPct}%
                </Badge>
              </div>
            </div>

            {/* Plans Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Available Plans
                </h3>
                {hasPaidPlanActive && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                    Active plans are highlighted below
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
                  
                  const active = isPlanActive(plan.name);
                  const isIncludedInSuiteActive = isSuiteActive && plan.name !== "suite" && plan.name !== "free";
                  const isIncludedInNewlySelectedSuite = hasNewlySelectedSuite && plan.name !== "suite" && plan.name !== "free";
                  
                  const isSelected = isIncludedInNewlySelectedSuite || finalSelectedPlanIds.has(plan.id);

                  return (
                    <div 
                      key={plan.id} 
                      onClick={() => !isIncludedInNewlySelectedSuite && togglePlan(plan.id)}
                      className={`border rounded-xl p-6 flex flex-col transition-all relative select-none ${
                        active 
                          ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30" 
                          : isIncludedInNewlySelectedSuite
                            ? "opacity-80 border-primary/50 bg-primary/5 cursor-default"
                            : isSelected 
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md cursor-pointer" 
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer"
                      }`}
                    >
                      {/* Active / Included Badges */}
                      {isIncludedInSuiteActive ? (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max max-w-[92%]">
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 border-0 text-xs font-semibold px-2.5 py-0.5 shadow-sm flex items-center gap-1">
                            <Check className="h-3 w-3" /> Active (Included in Suite)
                          </Badge>
                        </div>
                      ) : active ? (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max max-w-[92%]">
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 border-0 text-xs font-semibold px-2.5 py-0.5 shadow-sm flex items-center gap-1">
                            <Check className="h-3 w-3" /> {plan.name === "free" ? "Current Plan" : "Active Plan"}
                          </Badge>
                        </div>
                      ) : isIncludedInNewlySelectedSuite ? (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max max-w-[92%]">
                          <Badge className="bg-primary text-primary-foreground border-0 text-xs truncate">
                            Included in Business Suite
                          </Badge>
                        </div>
                      ) : null}

                      {/* Header & Checkbox */}
                      <div className="flex items-start justify-between mt-2">
                        <h4 className="text-lg font-bold text-slate-900">{plan.display_name}</h4>
                        <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                          active
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-slate-300 bg-white"
                        }`}>
                          {(active || isSelected) && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                      
                      {/* Pricing Section */}
                      <div className="mt-3 mb-4">
                        {active && plan.name !== "free" ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs px-2 py-0.5">
                                Active Subscription
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500 mt-1">
                              {plan.name === "hr" ? "10 Base Employees Included" : "Active for Business"}
                            </span>
                          </div>
                        ) : isIncludedInNewlySelectedSuite ? (
                          <span className="text-xl font-bold text-emerald-600">Included in Suite</span>
                        ) : plan.name === "free" ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">₹0</span>
                            <span className="text-sm text-slate-500">/free forever</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">
                              ₹{(price / 100).toLocaleString('en-IN')}
                            </span>
                            <span className="text-sm text-slate-500">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                          </div>
                        )}
                      </div>

                      {/* HR ONLY: EMPLOYEE INCREASE SECTION */}
                      {plan.name === "hr" && (
                        <div className="mt-2 mb-4">
                          {isHrActive ? (
                            /* State 1: HR is ALREADY ACTIVE -> Add Extra Employees at ₹29 each */
                            <div 
                              className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-slate-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-emerald-600" /> Add Extra Employees
                                </span>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold border-0">
                                  ₹29/emp/mo
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 mb-2.5">
                                Base 10 employees active. Add extra slots at ₹29 each:
                              </p>
                              
                              <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-emerald-300/80 shadow-sm">
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-8 w-8 rounded-md border-slate-300 hover:bg-slate-100" 
                                  disabled={extraEmployeesToAdd <= 0}
                                  onClick={() => setExtraEmployeesToAdd(Math.max(0, extraEmployeesToAdd - 1))}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                
                                <div className="text-center px-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    +{extraEmployeesToAdd} Extra
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    Total: {10 + extraEmployeesToAdd} Employees
                                  </div>
                                </div>
                                
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-8 w-8 rounded-md border-slate-300 hover:bg-slate-100" 
                                  onClick={() => setExtraEmployeesToAdd(extraEmployeesToAdd + 1)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {/* Quick increment buttons */}
                              <div className="flex items-center gap-1.5 mt-2 justify-center">
                                {[5, 10, 20, 50].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => setExtraEmployeesToAdd(num)}
                                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                      extraEmployeesToAdd === num 
                                        ? "bg-emerald-600 text-white border-emerald-600 font-bold" 
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    +{num}
                                  </button>
                                ))}
                                {extraEmployeesToAdd > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setExtraEmployeesToAdd(0)}
                                    className="text-[10px] px-1.5 py-0.5 text-slate-500 hover:text-slate-800 underline"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>

                              {extraEmployeesToAdd > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-950">
                                  <span>Addon Cost:</span>
                                  <span className="text-sm font-bold text-emerald-700">
                                    ₹{(getExtraEmployeeCost(extraEmployeesToAdd) / 100).toLocaleString('en-IN')} / {billingCycle === "yearly" ? "yr" : "mo"}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : isSelected ? (
                            /* State 2: HR is NOT ACTIVE yet, but user selected it to purchase -> choose employee count */
                            <div 
                              className="bg-slate-50 p-3 rounded-lg border border-slate-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                                Total Employees Desired
                              </label>
                              <div className="flex items-center justify-between bg-white p-1 rounded-md border border-slate-200">
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-8 w-8 border-slate-300" 
                                  disabled={newHrEmployeeCount <= 10}
                                  onClick={() => setNewHrEmployeeCount(Math.max(10, newHrEmployeeCount - 1))}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <div className="text-center">
                                  <span className="font-bold text-sm text-slate-900">{newHrEmployeeCount}</span>
                                  <span className="text-[10px] text-slate-500 block">Employees</span>
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-8 w-8 border-slate-300" 
                                  onClick={() => setNewHrEmployeeCount(newHrEmployeeCount + 1)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              {newHrEmployeeCount > 10 && (
                                <div className="text-xs text-amber-600 mt-2 font-medium">
                                  +{newHrEmployeeCount - 10} extra employees (+₹29 each)
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Features List */}
                      <div className="flex-1 space-y-2 mt-auto pt-4 border-t border-slate-100">
                        {plan.features.map((featureKey) => (
                          <div key={featureKey} className="flex items-center gap-2 text-xs text-slate-600">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="capitalize">{featureKey.replace(/-/g, " ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promo Code & Checkout Footer */}
            <div className="border-t border-slate-200 pt-6 mt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Coupon input */}
                <div className="flex w-full max-w-sm gap-2">
                  <Input 
                    placeholder="Enter Promo Code" 
                    value={promoCode} 
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={!!validCoupon}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  />
                  {validCoupon ? (
                    <Button variant="outline" className="border-slate-300 hover:bg-slate-100" onClick={() => { setValidCoupon(null); setPromoCode(""); }}>
                      Remove
                    </Button>
                  ) : (
                    <Button onClick={handleApplyPromo} disabled={!promoCode || couponLoading}>
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  )}
                </div>

                {/* Total & Checkout button */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">
                      {isOnlyAddingExtraEmployees ? "Addon Total" : "Total Payable"}
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      ₹{(totalAmountPaise / 100).toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto min-w-[220px] font-bold"
                    onClick={handleCheckout}
                    disabled={processingPlan || !hasAnyActionToCheckout}
                  >
                    {processingPlan ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                    ) : !hasAnyActionToCheckout ? (
                      "Select a plan or add employees"
                    ) : isOnlyAddingExtraEmployees ? (
                      `Pay ₹${(totalAmountPaise / 100).toLocaleString('en-IN')} & Add ${extraEmployeesToAdd} Slot${extraEmployeesToAdd > 1 ? 's' : ''}`
                    ) : (
                      `Pay ₹${(totalAmountPaise / 100).toLocaleString('en-IN')} & Activate`
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
