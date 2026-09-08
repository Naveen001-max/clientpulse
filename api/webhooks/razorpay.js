// ═══════════════════════════════════════════════════════════════
// /api/webhooks/razorpay.js — Vercel Serverless Function
// Razorpay calls this URL after every payment
// Verifies the webhook signature before trusting it
// ONLY this function can upgrade a user's plan — not the frontend
// ═══════════════════════════════════════════════════════════════
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Disable body parsing so we can verify raw signature
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if(req.method !== "POST") return res.status(405).end();

  const rawBody = await getRawBody(req);
  const signature = req.headers["x-razorpay-signature"];

  // ── Step 1: Verify webhook signature ─────────────────────────
  // If this fails, someone is trying to fake a payment — reject it
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if(expectedSig !== signature) {
    console.warn("Invalid Razorpay webhook signature — possible attack");
    return res.status(401).json({ error: "Invalid signature" });
  }

  // ── Step 2: Parse and handle the event ───────────────────────
  let event;
  try { event = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { event: eventType, payload } = event;

  // Payment captured = user paid successfully
  if(eventType === "payment.captured") {
    const payment = payload.payment.entity;
    const userId = payment.notes?.userId;
    const plan   = payment.notes?.plan; // "pro" or "agency"

    if(!userId || !plan) {
      console.error("Payment missing userId or plan in notes");
      return res.status(400).json({ error: "Missing notes" });
    }

    // Calculate plan expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Upgrade the user's plan in the database
    const { error } = await supabase
      .from("profiles")
      .update({
        plan,
        plan_expires_at: expiresAt.toISOString(),
        razorpay_payment_id: payment.id,
        upgraded_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if(error) {
      console.error("Failed to upgrade plan:", error.message);
      return res.status(500).json({ error: "DB update failed" });
    }

    console.log(`Plan upgraded: user=${userId} plan=${plan} payment=${payment.id}`);
  }

  // Payment failed — make sure they stay on free
  if(eventType === "payment.failed") {
    const payment = payload.payment.entity;
    console.log(`Payment failed: ${payment.id} — no plan change`);
  }

  return res.status(200).json({ received: true });
}
