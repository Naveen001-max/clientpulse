// ═══════════════════════════════════════════════════════════════
// /api/auth/google/callback.js — Vercel Serverless Function
// Called by frontend AFTER Google redirects back with access_token
// ALL secrets stay here — never in frontend code
// ═══════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  // Security headers on every response
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if(req.method === "OPTIONS") return res.status(200).end();
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { access_token } = req.body || {};
  if(!access_token) return res.status(400).json({ error: "Missing access_token" });

  // Create Supabase client with SERVICE ROLE KEY (server only — never sent to browser)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Verify the Google token with Supabase — cannot be faked by client
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if(error || !user) return res.status(401).json({ error: "Invalid or expired token" });

    // Get or create user profile in DB
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at, razorpay_payment_id")
      .eq("id", user.id)
      .single();

    // Verify plan hasn't expired
    let plan = "free";
    if(profile?.plan && profile.plan !== "free") {
      const expired = profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
      plan = expired ? "free" : profile.plan;
      // If expired, downgrade in DB
      if(expired) {
        await supabase.from("profiles").update({ plan: "free" }).eq("id", user.id);
      }
    }

    // If no profile exists yet, create one
    if(!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        plan: "free",
        created_at: new Date().toISOString(),
      });
    }

    // Issue a signed JWT (our own — short-lived, tamper-proof)
    // This is what the frontend stores — NOT the Supabase token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split("@")[0],
        plan,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d", issuer: "clientpulse" }
    );

    return res.status(200).json({ token: sessionToken });
  } catch(err) {
    console.error("Auth callback error:", err.message);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
