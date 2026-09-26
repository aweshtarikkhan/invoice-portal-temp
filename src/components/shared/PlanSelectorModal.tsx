import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Check, Loader2, Minus, Plus, Users, Sparkles, Download, CheckCircle2, AlertCircle, Mail, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureStore } from "@/store/feature-store";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import {
  SubscriptionInvoiceData,
  downloadSubscriptionInvoicePDF,
} from "@/lib/subscription-invoice-pdf";
import { sendSubscriptionInvoiceEmail } from "@/lib/subscription-email-service";
import { normalizePlanKey } from "@/lib/subscription";

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
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<boolean>(false);
  
  // Selection state for NEW plans to purchase
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  
  // Active subscription details for the current organization
  const [activePlanNames, setActivePlanNames] = useState<string[]>([]);
  const [activeEmployeeLimit, setActiveEmployeeLimit] = useState<number>(25);
  
  // Extra employee counts:
  // When HR is already active: how many additional employees user wants to add
  const [extraEmployeesToAdd, setExtraEmployeesToAdd] = useState<number>(() => {
    const h = sessionStorage.getItem("onboarding_hr");
    return h ? parseInt(h) || 0 : 0;
  });
  const [extraPlatformEmployeesToAdd, setExtraPlatformEmployeesToAdd] = useState<number>(() => {
    const p = sessionStorage.getItem("onboarding_plat");
    return p ? parseInt(p) || 0 : 0;
  });
  // When HR is NOT active and being purchased: total employees desired (default 10 base)
  const [newHrEmployeeCount, setNewHrEmployeeCount] = useState<number>(25);

  const { toast } = useToast();
  const { user } = useAuth();
  const [completedInvoice, setCompletedInvoice] = useState<SubscriptionInvoiceData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
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

      if (subData && subData.plan_name) {
        fetchedActivePlans = subData.plan_name
          .split("+")
          .map((s: string) => normalizePlanKey(s))
          .filter(Boolean);
      }

      if (fetchedActivePlans.length === 0) {
        fetchedActivePlans = ["free"];
      }

      // Determine standard base limit for the active plan (NEVER SUMMED)
      let planBaseLimit = 3;
      if (fetchedActivePlans.includes("suite") || fetchedActivePlans.includes("hr")) {
        planBaseLimit = 25;
      } else {
        planBaseLimit = 3;
      }

      let empLimit = planBaseLimit;

      // Only respect genuine purchased extra employees (employee_count in subscriptions table)
      // Never use subData.employee_limit as it sums multiple plans in old accounts
      const purchasedCount = subData?.employee_count || 0;
      if ((fetchedActivePlans.includes("suite") || fetchedActivePlans.includes("hr")) && purchasedCount > 25) {
        empLimit = purchasedCount;
      }

      // Direct query to subscriptions table to check if there is a purchased employee_count > 25
      if (orgId && (fetchedActivePlans.includes("suite") || fetchedActivePlans.includes("hr"))) {
        const { data: directSub } = await supabase
          .from("subscriptions")
          .select("employee_count")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (directSub?.employee_count && directSub.employee_count > empLimit) {
          empLimit = directSub.employee_count;
        }
      }

      setActivePlanNames(fetchedActivePlans);
      setActiveEmployeeLimit(empLimit);
      setExtraEmployeesToAdd(0);
      setNewHrEmployeeCount(Math.max(empLimit, 25));
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

  const isHrActive = isPlanActive("hr") || isPlanActive("suite");

  const getPlanDescription = (planName: string): string => {
    const key = normalizePlanKey(planName);
    switch (key) {
      case "free":
        return "Basic invoicing & business features — 100% Free for 6 Months";
      case "accounting":
        return "Full billing, sales, purchases & inventory management";
      case "hr":
        return "Complete HR solution — attendance, payroll, leaves & shifts";
      case "crm":
        return "Manage leads, deals, sales pipeline and customer relationships";
      case "promotion":
        return "Festival posters, WhatsApp & broadcast marketing campaigns";
      case "suite":
        return "Complete all-in-one business suite with full system access!";
      default:
        return "";
    }
  };

  const getDisplayFeatures = (plan: Plan): string[] => {
    const key = normalizePlanKey(plan.name);
    switch (key) {
      case "free":
        return [
          "100 Invoices Free",
          "Festive Posts",
          "3 Employee Attendance",
          "Up to 50 Leads"
        ];
      case "accounting":
        return [
          "Everything in Free Plan",
          "Unlimited Invoices",
          "Unlimited Quotation & POS",
          "Inventory Management",
          "500 WhatsApp messages",
          "GST Ready Output",
          "Platform access up to 3 employees"
        ];
      case "hr":
        return [
          "Everything in Free Plan",
          "25 Employee Attendance",
          "Attendance & Payroll",
          "Shifts & Leaves",
          "500 WhatsApp messages",
          "Platform access up to 3 employees"
        ];
      case "crm":
        return [
          "Everything in Free Plan",
          "Unlimited Leads",
          "API Integrations",
          "Sales Pipeline",
          "500 WhatsApp messages",
          "Platform access up to 3 employees"
        ];
      case "promotion":
        return [
          "Everything in Free Plan",
          "All Poster Categories",
          "Email & WhatsApp Campaign",
          "500 WhatsApp messages",
          "Platform access up to 3 employees"
        ];
      case "suite":
        return [
          "Everything in Free Plan + Business Accounting + Business HR + Business CRM + Business Promotion",
          "Platform Access up to 5 employees"
        ];
      default:
        return plan.features || [];
    }
  };

  const handleApplyPromo = async () => {
    const trimmed = promoCode.trim().toUpperCase();
    if (!trimmed) {
      setPromoError("Please enter a promo code");
      return;
    }
    setCouponLoading(true);
    setPromoError(null);
    setPromoSuccess(null);
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: trimmed,
        p_billing_cycle: billingCycle,
      });
      if (error) throw error;
      if (data?.valid) {
        setValidCoupon({
          id: data.coupon_id,
          type: data.discount_type,
          amount: data.discount_value
        });
        setPromoSuccess(data.description || "Promo code applied successfully!");
        setPromoError(null);
        toast({ title: "Promo code applied!", description: data.description });
      } else {
        setValidCoupon(null);
        setPromoError(data?.error || "Invalid promo code");
      }
    } catch (err: any) {
      setValidCoupon(null);
      setPromoError(err.message || "Invalid promo code");
    }
    setCouponLoading(false);
  };

  // Cost calculation for extra employees (rate: ₹29/employee/mo, with 20% off if yearly)
  const getExtraPlatformEmployeeCost = (count: number) => {
    if (count <= 0) return 0;
    const ratePaise = 9900;
    if (billingCycle === "yearly") {
      return Math.round((count * ratePaise * 12) * (1 - yearlyDiscountPct / 100));
    }
    return count * ratePaise;
  };

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
    if ((plan.name === "hr" || plan.name === "suite") && newHrEmployeeCount > 25) {
      base += getExtraEmployeeCost(newHrEmployeeCount - 25);
    }

    totalAmountPaise += base;
  });

  // 2. If HR is ALREADY active, add cost of extra employees requested
  if (isHrActive && extraEmployeesToAdd > 0) {
    totalAmountPaise += getExtraEmployeeCost(extraEmployeesToAdd);
  }
  if (extraPlatformEmployeesToAdd > 0) {
    totalAmountPaise += getExtraPlatformEmployeeCost(extraPlatformEmployeesToAdd);
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

  const gstAmountPaise = Math.round(totalAmountPaise * 0.18);
  const finalAmountPaise = totalAmountPaise + gstAmountPaise;

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
        // Keep currently active plans (filter out 'free' if paid plans exist)
        const paidActive = activePlanNames.filter(p => p !== "free");
        targetPlanNames = paidActive.length > 0 ? paidActive : ["suite"];
      } else {
        targetPlanNames = Array.from(finalSelectedPlanIds)
          .map(id => plans.find(p => p.id === id)?.name)
          .filter(Boolean) as string[];
        
        if (targetPlanNames.includes("free") && targetPlanNames.length === 1) {
          // Explicitly chose free
          targetPlanNames = ["free"];
        } else {
          // Preserve any already active paid plans so they aren't lost
          activePlanNames.forEach(p => {
            if (p !== "free" && !targetPlanNames.includes(p)) {
              targetPlanNames.push(p);
            }
          });
        }
      }

      // If user is adding extra employees or HR/Suite was active, ensure suite or hr remains active
      if (extraEmployeesToAdd > 0 || isHrActive) {
        if (!targetPlanNames.includes("suite") && !targetPlanNames.includes("hr")) {
          targetPlanNames.push(isSuiteActive || activePlanNames.includes("suite") ? "suite" : "hr");
        }
      }

      // If any paid plan is present in targetPlanNames, strip "free"
      if (targetPlanNames.some(p => p !== "free")) {
        targetPlanNames = targetPlanNames.filter(p => p !== "free");
      }

      // Safeguard: if targetPlanNames is somehow still empty, fall back to active plans or free
      if (targetPlanNames.length === 0) {
        targetPlanNames = activePlanNames.length > 0 ? activePlanNames : ["free"];
      }

      // Determine base limit for the TARGET plan being checked out
      const isSuiteOrHrTarget = targetPlanNames.includes("suite") || targetPlanNames.includes("hr");
      const targetBaseLimit = isSuiteOrHrTarget ? 25 : 3;

      let totalEmployeesToSend = targetBaseLimit;

      if (isOnlyAddingExtraEmployees) {
        // Adding extra employees to existing active plan
        let currentLimit = Math.max(activeEmployeeLimit || targetBaseLimit, targetBaseLimit);
        if (orgId) {
          try {
            const { data: latestSub } = await supabase
              .from("subscriptions")
              .select("employee_count")
              .eq("org_id", orgId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (latestSub?.employee_count && latestSub.employee_count > currentLimit) {
              currentLimit = latestSub.employee_count;
            }
          } catch (e) {
            console.warn("Could not re-fetch latest sub:", e);
          }
        }
        totalEmployeesToSend = currentLimit + extraEmployeesToAdd;
      } else {
        // Purchasing / upgrading to a new plan
        if (extraEmployeesToAdd > 0) {
          totalEmployeesToSend = targetBaseLimit + extraEmployeesToAdd;
        } else if (isSuiteOrHrTarget && newHrEmployeeCount > 25) {
          totalEmployeesToSend = newHrEmployeeCount;
        } else if (isSuiteOrHrTarget && activeEmployeeLimit > 25) {
          // If already on Suite/HR and had purchased extra capacity, preserve it
          totalEmployeesToSend = activeEmployeeLimit;
        } else {
          totalEmployeesToSend = targetBaseLimit;
        }
      }

      // If total amount is 0 (e.g. Free plan selected or 100% coupon)
      if (finalAmountPaise <= 0) {
        const plansToActivate = targetPlanNames.length > 0 ? targetPlanNames : ["free"];
        const appliedCode = validCoupon && promoCode.trim() ? promoCode.trim().toUpperCase() : null;
        const zeroOrderId = appliedCode ? `COUPON_FREE_${Date.now()}` : "FREE_PLAN";
        const zeroPaymentId = appliedCode ? `COUPON_FREE_${Date.now()}` : "FREE_PLAN";

        const { error } = await supabase.rpc("activate_org_plans", {
          p_org_id: orgId,
          p_plan_names: plansToActivate,
          p_billing_cycle: billingCycle,
          p_employee_count: totalEmployeesToSend,
          p_razorpay_order_id: zeroOrderId,
          p_razorpay_payment_id: zeroPaymentId,
          p_coupon_code: appliedCode
        });
        if (error) throw error;

        // Ensure coupon usage count is incremented in DB
        if (appliedCode) {
          try {
            await supabase.rpc("redeem_coupon", {
              p_code: appliedCode,
              p_org_id: orgId,
              p_discount_applied: validCoupon?.amount || 0,
              p_order_id: zeroOrderId
            });
          } catch (couponErr) {
            console.warn("Coupon redeem error:", couponErr);
          }
        }

        const resolvedPlan = plansToActivate.includes('free') && plansToActivate.length === 1 
          ? 'free' 
          : (plansToActivate.includes('suite') ? 'suite' : plansToActivate[0] || 'free');

        // Also update the organizations table subscription_plan so it doesn't stay 'free'
        await supabase.from('organizations').update({ 
          subscription_plan: resolvedPlan 
        }).eq('id', orgId);

        if (!orgId || orgId === currentOrg?.id) {
          useFeatureStore.getState().setSubscriptionMeta({
            plan_name: resolvedPlan,
            status: 'active',
            trial_ends_at: null,
            employee_limit: totalEmployeesToSend,
            employee_count: totalEmployeesToSend,
            current_period_end: null
          });
        }
        
        // Generate zero-value invoice and send email
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === "yearly") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        const formatDateStr = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const invoiceNumber = `AB-SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-4)}`;
        
        let planDisplay = targetPlanNames.map((p) => {
          const found = plans.find((pl) => pl.name === p);
          return found ? found.display_name : p.toUpperCase();
        }).join(" + ");

        if (targetPlanNames.includes("suite")) {
          planDisplay = "Aassay Biz - Flagship Business Suite";
        } else if (isOnlyAddingExtraEmployees) {
          planDisplay = `HRMS Capacity Expansion (+${extraEmployeesToAdd} Staff Slots)`;
        }

        const invoicePayload: SubscriptionInvoiceData = {
          invoiceNumber,
          invoiceDate: formatDateStr(now),
          billingCycle,
          planNames: targetPlanNames.length > 0 ? targetPlanNames : ["free"],
          planDisplayName: targetPlanNames.length === 0 || (targetPlanNames.length === 1 && targetPlanNames[0] === "free") ? "Free Forever Plan" : planDisplay,
          periodStart: formatDateStr(now),
          periodEnd: formatDateStr(periodEnd),
          customerName: user?.user_metadata?.full_name || currentOrg?.name || user?.email || "Valued Customer",
          customerEmail: user?.email || currentOrg?.email || "",
          customerPhone: currentOrg?.phone || undefined,
          organizationName: currentOrg?.name || "My Business",
          customerGstin: currentOrg?.tax_number || undefined,
          billingAddress: currentOrg?.billing_address || undefined,
          totalAmount: 0,
          subtotal: 0, taxAmount: 0,
          discount: 0,
          paymentMethod: "Promo Code / Free Plan",
          razorpayPaymentId: "N/A",
          razorpayOrderId: "N/A",
          employeeCount: totalEmployeesToSend,
        };

        setCompletedInvoice(invoicePayload);
        setShowSuccessModal(true);

        if (invoicePayload.customerEmail) {
          toast({
            title: "Plan Upgraded! 🚀",
            description: `Dispatching your Tax Invoice PDF to ${invoicePayload.customerEmail}...`,
          });
          sendSubscriptionInvoiceEmail(invoicePayload, orgId).then((res) => {
            if (res.success) {
              toast({ title: "Invoice Emailed! ✉️", description: `Tax Invoice delivered to ${invoicePayload.customerEmail}.` });
            }
          });
        }
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
      const amountInRupees = Number((finalAmountPaise / 100).toFixed(2));
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
          amount_in_paise: finalAmountPaise
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
        name: "Aassay Biz",
        description: isOnlyAddingExtraEmployees 
          ? `Add ${extraEmployeesToAdd} Extra Employee Slots`
          : `Aassay Biz Software Subscription`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            setProcessingPlan(true);
            const appliedCode = validCoupon && promoCode.trim() ? promoCode.trim().toUpperCase() : undefined;
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("create_razorpay_order", {
              body: {
                action: "verify",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                org_id: orgId,
                plan_names: targetPlanNames,
                billing_cycle: billingCycle,
                employee_count: totalEmployeesToSend,
                customer_email: user?.email || currentOrg?.email || "",
                customer_name: user?.user_metadata?.full_name || currentOrg?.name || "",
                total_amount: amountInRupees,
                coupon_code: appliedCode,
                discount_amount: validCoupon?.amount || 0
              }
            });

            if (verifyError || verifyData?.error) {
              throw new Error(verifyError?.message || verifyData?.error || "Payment verification failed");
            }

            // Guaranteed client-side redemption logging if coupon was used
            if (appliedCode) {
              try {
                await supabase.rpc("redeem_coupon", {
                  p_code: appliedCode,
                  p_org_id: orgId,
                  p_discount_applied: validCoupon?.amount || 0,
                  p_order_id: response.razorpay_order_id
                });
              } catch (couponErr) {
                console.warn("Client-side coupon redeem check:", couponErr);
              }
            }
            
            // Generate official subscription invoice details
            const now = new Date();
            const periodEnd = new Date(now);
            if (billingCycle === "yearly") {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            const formatDateStr = (d: Date) =>
              d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
            const invoiceNumber =
              verifyData?.invoice_number ||
              `AB-SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-4)}`;

            let planDisplay = targetPlanNames
              .map((p) => {
                const found = plans.find((pl) => pl.name === p);
                return found ? found.display_name : p.toUpperCase();
              })
              .join(" + ");

            if (targetPlanNames.includes("suite")) {
              planDisplay = "Aassay Biz - Flagship Business Suite";
            } else if (isOnlyAddingExtraEmployees) {
              planDisplay = `HRMS Capacity Expansion (+${extraEmployeesToAdd} Staff Slots)`;
            }

            const invoicePayload: SubscriptionInvoiceData = {
              invoiceNumber,
              invoiceDate: formatDateStr(now),
              billingCycle,
              planNames: targetPlanNames,
              planDisplayName: planDisplay,
              periodStart: formatDateStr(now),
              periodEnd: formatDateStr(periodEnd),
              customerName: user?.user_metadata?.full_name || currentOrg?.name || user?.email || "Valued Customer",
              customerEmail: user?.email || currentOrg?.email || "",
              customerPhone: currentOrg?.phone || undefined,
              organizationName: currentOrg?.name || "My Business",
              customerGstin: currentOrg?.tax_number || undefined,
              billingAddress: currentOrg?.billing_address || undefined,
              totalAmount: Number((finalAmountPaise / 100).toFixed(2)),
              subtotal: Number((totalAmountPaise / 100).toFixed(2)),
              taxAmount: Number((gstAmountPaise / 100).toFixed(2)),
              discount: validCoupon?.amount || 0,
              paymentMethod: "Razorpay Online (UPI/Cards/NetBanking)",
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              employeeCount: totalEmployeesToSend,
            };

            setCompletedInvoice(invoicePayload);
            setShowSuccessModal(true);

            // Update org subscription_plan in DB so it doesn't stay 'free'
            await supabase.from('organizations').update({ 
              subscription_plan: targetPlanNames.includes('suite') ? 'suite' : targetPlanNames[0] || 'suite' 
            }).eq('id', orgId);

            if (!orgId || orgId === currentOrg?.id) {
              // Update in-memory subscription meta so limit is reflected immediately
              useFeatureStore.getState().setSubscriptionMeta({
                plan_name: targetPlanNames[0] || 'suite',
                status: 'active',
                trial_ends_at: null,
                employee_limit: totalEmployeesToSend,
                employee_count: totalEmployeesToSend,
                current_period_end: null
              });
            }

            // Automatically dispatch the invoice email with PDF attachment
            if (invoicePayload.customerEmail) {
              toast({
                title: "Payment Confirmed! 🚀",
                description: `Dispatching your Tax Invoice PDF to ${invoicePayload.customerEmail}...`,
              });

              sendSubscriptionInvoiceEmail(invoicePayload, orgId)
                .then((res) => {
                  if (res.success) {
                    toast({
                      title: "Invoice Emailed! ✉️",
                      description: `Tax Invoice #${invoiceNumber} delivered to ${invoicePayload.customerEmail}.`,
                    });
                  } else {
                    console.warn("Subscription email dispatch returned:", res.error);
                  }
                })
                .catch((e) => {
                  console.error("Subscription email dispatch error:", e);
                });
            }
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

  if (showSuccessModal && completedInvoice) {
    return (
      <Dialog open={open} onOpenChange={(val) => { if (!val) { setShowSuccessModal(false); window.location.reload(); } }}>
        <DialogContent 
          className="max-w-lg p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-3xl z-50 text-slate-900"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#160e3d] via-[#211559] to-[#28166f] p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#e77817]/20 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="inline-block bg-[#e77817] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
              Payment Verified • Invoice Issued
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white mb-1">
              Subscription Activated! 🚀
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Your plan is now active for <strong className="text-white">{completedInvoice.organizationName}</strong>
            </p>
          </div>

          {/* Details & Actions */}
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Active Plan</span>
                <span className="font-bold text-slate-900">{completedInvoice.planDisplayName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tax Invoice No.</span>
                <span className="font-semibold text-slate-900 font-mono">{completedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Amount Paid</span>
                <span className="font-extrabold text-emerald-700 text-base">
                  ₹{Number(completedInvoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Valid Period</span>
                <span className="font-medium text-slate-700">{completedInvoice.periodStart} to {completedInvoice.periodEnd}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <span className="font-bold block">Tax Invoice PDF Emailed!</span>
                An official GST Tax Invoice PDF has been dispatched to <strong>{completedInvoice.customerEmail}</strong>.
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                onClick={() => downloadSubscriptionInvoicePDF(completedInvoice)}
                className="w-full py-6 rounded-xl bg-[#e77817] hover:bg-[#ff8a24] text-white font-bold text-sm shadow-lg shadow-[#e77817]/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Tax Invoice (PDF)</span>
              </Button>
              <Button
                onClick={() => { setShowSuccessModal(false); window.location.reload(); }}
                variant="outline"
                className="w-full py-6 rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm"
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{plan.display_name}</h4>
                          {getPlanDescription(plan.name) && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{getPlanDescription(plan.name)}</p>
                          )}
                        </div>
                        <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors shrink-0 ml-2 ${
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
                              {plan.name === "hr" 
                                ? `${activeEmployeeLimit || 25} Employees Active` 
                                : plan.name === "suite"
                                ? `Active for Business (${activeEmployeeLimit || 25} Employees Quota)`
                                : plan.name === "accounting"
                                ? `Active for Business (${activeEmployeeLimit || 3} Employees Quota)`
                                : "Active for Business"}
                            </span>
                          </div>
                        ) : isIncludedInNewlySelectedSuite ? (
                          <span className="text-xl font-bold text-emerald-600">Included in Suite</span>
                        ) : plan.name === "free" ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">₹0</span>
                            <span className="text-sm text-slate-500">/6 months free</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-slate-900">
                                ₹{billingCycle === "yearly" ? Math.floor((price / 100) / 12).toLocaleString('en-IN') : (price / 100).toLocaleString('en-IN')}
                              </span>
                              <span className="text-sm text-slate-500">/mo</span>
                            </div>
                            {billingCycle === "yearly" && (
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Billed ₹{(price / 100).toLocaleString('en-IN')}/yr upfront
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/*  HR AND SUITE: EMPLOYEE INCREASE SECTION  */}
                      {(plan.name === "hr" || plan.name === "suite") && (
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
                                Current limit: {activeEmployeeLimit || 25} employees active. Add extra slots at ₹29 each:
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
                                    Total: {(activeEmployeeLimit || 25) + extraEmployeesToAdd} Employees
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
                                  disabled={newHrEmployeeCount <= 25}
                                  onClick={() => setNewHrEmployeeCount(Math.max(25, newHrEmployeeCount - 1))}
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
                              {newHrEmployeeCount > 25 && (
                                <div className="text-xs text-amber-600 mt-2 font-medium">
                                  +{newHrEmployeeCount - 25} extra employees (+₹29 each)
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Features List */}
                      <div className="flex-1 space-y-2 mt-auto pt-4 border-t border-slate-100">
                        {getDisplayFeatures(plan).map((featureText, idx) => {
                          const isEverythingInFree = featureText.toLowerCase().includes("everything in free");
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-2 text-xs ${
                                isEverythingInFree ? "font-semibold text-[#28166f]" : "text-slate-600"
                              }`}
                            >
                              <Check className={`h-3.5 w-3.5 shrink-0 ${
                                isEverythingInFree ? "text-[#e77817] stroke-[2.5]" : "text-primary"
                              }`} />
                              <span>{featureText.replace(/-/g, " ")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            
            {/* Global Add-ons Section */}
            {(hasAnyActionToCheckout || plans.some(p => isPlanActive(p.name) && p.name !== 'free')) && (
              <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-5 mt-6 mb-2">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      Extra Admin / Platform Users
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-md">
                      Your paid plan includes standard platform access. Need to invite more managers to the Admin Panel? Add them here for ₹99/user/month.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 min-w-[140px]">
                    <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-indigo-200 w-full shadow-sm">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8 rounded-md hover:bg-indigo-50 hover:text-indigo-700" 
                        disabled={extraPlatformEmployeesToAdd <= 0}
                        onClick={() => setExtraPlatformEmployeesToAdd(Math.max(0, extraPlatformEmployeesToAdd - 1))}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      
                      <div className="text-center px-2 flex-1">
                        <span className="text-sm font-bold text-slate-900">
                          +{extraPlatformEmployeesToAdd}
                        </span>
                      </div>
                      
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8 rounded-md hover:bg-indigo-50 hover:text-indigo-700" 
                        onClick={() => setExtraPlatformEmployeesToAdd(extraPlatformEmployeesToAdd + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {extraPlatformEmployeesToAdd > 0 && (
                      <span className="text-xs font-semibold text-indigo-700">
                        +₹{getExtraPlatformEmployeeCost(extraPlatformEmployeesToAdd) / 100} / {billingCycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Promo Code & Checkout Footer */}
            <div className="border-t border-slate-200 pt-6 mt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Coupon input */}
                <div className="flex flex-col w-full max-w-sm">
                  <div className="flex w-full gap-2">
                    <Input 
                      placeholder="Enter Promo Code" 
                      value={promoCode} 
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        if (promoError) setPromoError(null);
                        if (promoSuccess) setPromoSuccess(null);
                      }}
                      disabled={!!validCoupon}
                      className={`bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 ${
                        promoError ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                    />
                    {validCoupon ? (
                      <Button 
                        variant="outline" 
                        className="border-slate-300 hover:bg-slate-100" 
                        onClick={() => { 
                          setValidCoupon(null); 
                          setPromoCode(""); 
                          setPromoError(null); 
                          setPromoSuccess(null); 
                        }}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button onClick={handleApplyPromo} disabled={!promoCode || couponLoading}>
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    )}
                  </div>

                  {/* Error message right below promo code input */}
                  {promoError && (
                    <p className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{promoError}</span>
                    </p>
                  )}

                  {/* Success message right below promo code input */}
                  {validCoupon && promoSuccess && (
                    <p className="text-xs font-semibold text-emerald-600 mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{promoSuccess}</span>
                    </p>
                  )}
                </div>

                {/* Total & Checkout button */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">
                      {isOnlyAddingExtraEmployees ? "Addon Subtotal" : "Subtotal"}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                      ₹{(totalAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {totalAmountPaise > 0 && (
                      <>
                        <div className="text-[10px] text-slate-500 font-medium mt-1">+ GST (18%)</div>
                        <div className="text-xs font-semibold text-slate-700">
                          ₹{(gstAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1.5 pt-1.5 border-t">Total Payable</div>
                        <div className="text-2xl font-bold text-slate-900">
                          ₹{(finalAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </>
                    )}
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
                      `Pay ₹${(finalAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} & Add ${extraEmployeesToAdd} Slot${extraEmployeesToAdd > 1 ? 's' : ''}`
                    ) : (
                      `Pay ₹${(finalAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} & Activate`
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
