
const fs = require("fs");
let code = fs.readFileSync("backend/src/razorpay.ts", "utf8");

// Change calculateAmount to handle multiple plans
code = code.replace(
  `async function calculateAmount(planName: string, billingCycle: string, couponCode?: string) {`,
  `async function calculateAmount(planNames: string[], billingCycle: string, couponCode?: string) {`
);

code = code.replace(
  `  const { data: plan } = await supabase.from("plans").select("price_monthly, price_yearly").eq("name", planName).single();\n  if (!plan) return { amount: 0, discountApplied: 0, error: "Plan not found" };\n  let baseAmount = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;`,
  `  let baseAmount = 0;
  for (const name of planNames) {
    const { data: plan } = await supabase.from("plans").select("price_monthly, price_yearly").eq("name", name).single();
    if (plan) {
      baseAmount += (billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly);
    }
  }`
);

// We need to change coupon validation to p_plan_name: planNames.join(",")
code = code.replace(
  `p_plan_name: planName`,
  `p_plan_name: planNames.join(",")`
);

// update /create-order route
code = code.replace(
  `  const { org_id, plan_name, billing_cycle = "monthly", coupon_code } = req.body;
  if (!org_id || !plan_name) return res.status(400).json({ error: "org_id and plan_name are required" });
  try {
    const { amount, discountApplied, couponId, error } = await calculateAmount(plan_name, billing_cycle, coupon_code);`,
  `  const { org_id, plan_names, billing_cycle = "monthly", coupon_code } = req.body;
  if (!org_id || !plan_names || !Array.isArray(plan_names)) return res.status(400).json({ error: "org_id and plan_names are required" });
  try {
    const { amount, discountApplied, couponId, error } = await calculateAmount(plan_names, billing_cycle, coupon_code);`
);

// fix notes in razorpay.orders.create
code = code.replace(
  `notes: { org_id, plan_name, billing_cycle, coupon_code: coupon_code || "", coupon_id: couponId || "", discount_applied: discountApplied.toString() },`,
  `notes: { org_id, plan_names: plan_names.join(","), billing_cycle, coupon_code: coupon_code || "", coupon_id: couponId || "", discount_applied: discountApplied.toString() },`
);

code = code.replace(
  `res.json({ order_id: order.id, amount: finalAmount, currency: "INR", razorpay_key_id: process.env.RAZORPAY_KEY_ID, plan_name, billing_cycle, discount_applied: discountApplied, coupon_id: couponId });`,
  `res.json({ order_id: order.id, amount: finalAmount, currency: "INR", razorpay_key_id: process.env.RAZORPAY_KEY_ID, plan_names, billing_cycle, discount_applied: discountApplied, coupon_id: couponId });`
);

// update verify-payment route
code = code.replace(
  `  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, org_id, plan_name, billing_cycle = "monthly", coupon_id, discounted_price, employee_count } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !org_id || !plan_name) return res.status(400).json({ success: false, error: "Missing required fields" });`,
  `  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, org_id, plan_names, billing_cycle = "monthly", coupon_id, discounted_price, employee_count } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !org_id || !plan_names || !Array.isArray(plan_names)) return res.status(400).json({ success: false, error: "Missing required fields" });`
);

code = code.replace(
  `    const { data: plan } = await supabase.from("plans").select("id, price_monthly, price_yearly").eq("name", plan_name).single();
    if (!plan) return res.status(400).json({ success: false, error: "Plan not found" });
    const now = new Date();
    const periodEnd = new Date(now);
    billing_cycle === "yearly" ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);
    const { error: subError } = await supabase.from("subscriptions").upsert({ org_id, plan_id: plan.id, billing_cycle, status: "active", current_period_start: now.toISOString(), current_period_end: periodEnd.toISOString(), coupon_id: coupon_id || null, discounted_price: discounted_price || null, employee_count: employee_count || 0, razorpay_order_id, razorpay_payment_id, updated_at: now.toISOString() }, { onConflict: "org_id" });
    if (subError) return res.status(500).json({ success: false, error: "Failed to activate subscription" });`,
  `    const now = new Date();
    const periodEnd = new Date(now);
    billing_cycle === "yearly" ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Delete existing active subscriptions to replace them
    await supabase.from("subscriptions").delete().eq("org_id", org_id);

    let totalPrice = 0;
    for (const name of plan_names) {
      const { data: plan } = await supabase.from("plans").select("id, price_monthly, price_yearly").eq("name", name).single();
      if (!plan) continue;
      
      totalPrice += (billing_cycle === "yearly" ? plan.price_yearly : plan.price_monthly);

      const { error: subError } = await supabase.from("subscriptions").insert({ 
        org_id, plan_id: plan.id, billing_cycle, status: "active", 
        current_period_start: now.toISOString(), current_period_end: periodEnd.toISOString(), 
        coupon_id: coupon_id || null, discounted_price: discounted_price || null, 
        employee_count: (name === "plan_4" ? (employee_count || 0) : 0), 
        razorpay_order_id, razorpay_payment_id, updated_at: now.toISOString() 
      });
      if (subError) {
        console.error(subError);
      }
    }`
);

code = code.replace(
  `discount_applied: discounted_price ? (billing_cycle === "yearly" ? plan.price_yearly : plan.price_monthly) - discounted_price : 0`,
  `discount_applied: discounted_price ? totalPrice - discounted_price : 0`
);

code = code.replace(
  `    res.json({ success: true, plan_name, billing_cycle, period_end: periodEnd.toISOString() });`,
  `    res.json({ success: true, plan_names, billing_cycle, period_end: periodEnd.toISOString() });`
);

fs.writeFileSync("backend/src/razorpay.ts", code);

