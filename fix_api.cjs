
const fs = require("fs");
let code = fs.readFileSync("src/components/shared/PlanSelectorModal.tsx", "utf8");

code = code.replace(
  `const { data: orderData, error: orderError } = await supabase.functions.invoke("create_razorpay_order", {
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
        if (!orderData) throw new Error("No order data returned");`,
  `
        const planNames = Array.from(selectedPlanIds).map(id => plans.find(p => p.id === id)?.name).filter(Boolean);
        const orderRes = await fetch("http://localhost:4000/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: orgId,
            plan_names: planNames,
            billing_cycle: billingCycle,
            coupon_code: validCoupon ? promoCode : undefined,
            employee_count: hrmsEmployeeCount
          })
        });
        
        if (!orderRes.ok) {
          const errData = await orderRes.json();
          throw new Error(errData.error || "Failed to create order");
        }
        const orderData = await orderRes.json();
  `
);

code = code.replace(
  `body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  org_id: orgId,
                  selected_plan_ids: selectedPlanIds.join(
),
                  billing_cycle: billingCycle,
                  coupon_id: orderData.coupon_id,
                  discounted_price: orderData.discount_applied,
                  employee_count: hrmsEmployeeCount
                })`,
  `body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  org_id: orgId,
                  plan_names: Array.from(selectedPlanIds).map(id => plans.find(p => p.id === id)?.name).filter(Boolean),
                  billing_cycle: billingCycle,
                  coupon_id: orderData.coupon_id,
                  discounted_price: orderData.discount_applied,
                  employee_count: hrmsEmployeeCount
                })`
);

fs.writeFileSync("src/components/shared/PlanSelectorModal.tsx", code);

