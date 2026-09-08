// ═══════════════════════════════════════════════════════════════
// /api/auth/verify.js — Vercel Serverless Function
// Frontend calls this on every page load to verify the session
// and get the current plan from the database (not from localStorage)
// ═══════════════════════════════════════════════════════════════
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");

  if(req.method === "OPTIONS") return res.status(200).end();
  if(req.method !== "GET") return res.status(405).end();

  const authHeader = req.headers.authorization;
  if(!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });

  const token = authHeader.slice(7);

  try {
    // Verify our signed JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "clientpulse" });

    // Always re-check plan from DB — cannot be faked by editing localStorage
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", decoded.userId)
      .single();

    // Check expiry
    let plan = "free";
    if(profile?.plan && profile.plan !== "free") {
      const expired = profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
      plan = expired ? "free" : profile.plan;
      if(expired) {
        await supabase.from("profiles").update({ plan: "free" }).eq("id", decoded.userId);
      }
    }

    return res.status(200).json({
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      plan,
    });
  } catch(err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
