import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const action = body.action || "create";

    // 1. Fetch Razorpay keys from platform_settings or env
    let keyId = Deno.env.get("RAZORPAY_KEY_ID");
    let keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["razorpay_key_id", "razorpay_key_secret"]);

      if (settings) {
        for (const s of settings) {
          if (s.key === "razorpay_key_id") keyId = s.value;
          if (s.key === "razorpay_key_secret") keySecret = s.value;
        }
      }
    }

    // Default to verified test keys if not present
    if (!keyId) keyId = "rzp_test_TNxuYUOdjOiviO";
    if (!keySecret) keySecret = "aubnSJ1cPmrxKI4bkb1PZ2E1";

    // ==========================================
    // ACTION: CREATE ORDER
    // ==========================================
    if (action === "create") {
      const { org_id, selected_plan_ids, billing_cycle, coupon_code, hrms_employee_count, total_amount, amount_in_paise } = body;

      if (!org_id) {
        throw new Error("Missing org_id parameter.");
      }

      // If total amount is 0 (e.g. Free plan)
      const inputAmount = Number(amount_in_paise !== undefined ? amount_in_paise : (total_amount || 0));
      if (inputAmount <= 0) {
        return new Response(
          JSON.stringify({
            is_free: true,
            amount: 0,
            currency: "INR"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Determine final amount in paise:
      // 1. If amount_in_paise is explicitly passed, use it directly (e.g., 59900 = ₹599, 599900 = ₹5,999)
      // 2. If total_amount > 25000, it was sent in paise by an un-updated client (e.g., 59900, 599900, 1499900)
      // 3. Otherwise, total_amount is in Rupees (e.g., 599, 5999, 14999), so multiply by 100 to convert to paise
      let finalAmountInPaise: number;
      if (amount_in_paise !== undefined && amount_in_paise !== null && Number(amount_in_paise) > 0) {
        finalAmountInPaise = Math.round(Number(amount_in_paise));
      } else {
        const raw = Number(total_amount);
        finalAmountInPaise = raw > 25000 ? Math.round(raw) : Math.round(raw * 100);
      }

      // Call Razorpay API
      const auth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: finalAmountInPaise,
          currency: "INR",
          receipt: `rcpt_${org_id.slice(0, 8)}_${Date.now()}`
        })
      });

      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) {
        throw new Error(rzpData.error?.description || "Failed to create Razorpay order");
      }

      return new Response(
        JSON.stringify({
          order_id: rzpData.id,
          amount: rzpData.amount,
          currency: rzpData.currency,
          razorpay_key_id: keyId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // ACTION: VERIFY PAYMENT & ACTIVATE
    // ==========================================
    if (action === "verify") {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        org_id,
        plan_names,
        billing_cycle,
        employee_count
      } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error("Missing payment verification parameters.");
      }

      // Verify HMAC SHA-256 signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(keySecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
      const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (generatedSignature !== razorpay_signature) {
        return new Response(
          JSON.stringify({ error: "Payment verification failed: Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Payment verified! Now activate the organization plan in Supabase DB
      const targetPlans = Array.isArray(plan_names) && plan_names.length > 0 ? plan_names : ["suite"];
      const { data: actData, error: actError } = await supabase.rpc("activate_org_plans", {
        p_org_id: org_id,
        p_plan_names: targetPlans,
        p_billing_cycle: billing_cycle || "monthly",
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_payment_id: razorpay_payment_id,
        p_employee_count: employee_count || 0
      });

      if (actError) {
        console.error("activate_org_plans error:", actError);
        throw new Error("Payment verified, but plan activation failed: " + actError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment verified and plans activated successfully!",
          result: actData
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unsupported action: ${action}`);
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
