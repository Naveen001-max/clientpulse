// /api/auth/verify.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  if(req.method === "OPTIONS") return res.status(200).end();
  if(req.method !== "GET") return res.status(405).end();

  const auth = req.headers.authorization;
  if(!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });

  const token = auth.slice(7);
  try {
    const parts = token.split(".");
    if(parts.length !== 3) throw new Error("Invalid token format");

    // Verify signature
    const enc    = new TextEncoder();
    const secret = process.env.JWT_SECRET || "fallback_secret";
    const key    = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["verify"]
    );
    const sigBuf = Uint8Array.from(
      atob(parts[2].replace(/-/g,"+").replace(/_/g,"/")), c=>c.charCodeAt(0)
    );
    const valid  = await crypto.subtle.verify(
      "HMAC", key, sigBuf, enc.encode(`${parts[0]}.${parts[1]}`)
    );
    if(!valid) return res.status(401).json({ error: "Invalid signature" });

    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    if(Date.now() > payload.exp) return res.status(401).json({ error: "Expired" });

    // Check plan from Supabase DB
    const dbRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${payload.userId}&select=plan,plan_expires_at`,
      { headers: {
        "apikey":        process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      }}
    );

    let plan = payload.plan || "free";
    if(dbRes.ok) {
      const rows = await dbRes.json();
      if(rows?.[0]) {
        const expired = rows[0].plan_expires_at && new Date(rows[0].plan_expires_at) < new Date();
        plan = expired ? "free" : (rows[0].plan || "free");
      }
    }

    return res.status(200).json({ userId:payload.userId, email:payload.email, name:payload.name, plan });
  } catch(err) {
    console.error("Verify error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}
