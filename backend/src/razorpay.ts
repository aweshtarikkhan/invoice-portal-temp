import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post("/create-order", async (req, res) => {
  try {
    const { org_id, plan_name, billing_cycle, coupon_code } = req.body;

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

    // Hardcode amounts for plans (mock logic)
    let amount = 0;
    if (plan_name === 'premium') amount = billing_cycle === 'yearly' ? 47990 : 499900;
    else if (plan_name === 'hrms') amount = billing_cycle === 'yearly' ? 1507 : 15700;
    else if (plan_name === 'crm') amount = billing_cycle === 'yearly' ? 1910 : 19900;
    else amount = 10000; // Default 100 INR

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay keys are not configured in the backend.");
    }

    // Since we don't have the razorpay sdk installed, we'll use fetch to call razorpay REST API
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `rcpt_${org_id.slice(0, 8)}_${Date.now()}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || "Failed to create order");
    }

    res.json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      razorpay_key_id: RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, org_id, plan_name } = req.body;

    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret key not configured.");
    }

    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay verify-payment error:", error);
    res.status(500).json({ error: error.message || "Verification failed" });
  }
});

export default router;
