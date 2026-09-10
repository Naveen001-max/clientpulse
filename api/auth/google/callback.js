// /api/auth/google/callback.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if(req.method === "OPTIONS") return res.status(200).end();
  if(req.method !== "POST") return res.status(405).end();

  const { access_token } = req.body || {};
  if(!access_token) return res.status(400).json({ error: "Missing token" });

  try {
    // Verify token with Supabase using service role key (server-side only)
    const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });

    if(!userRes.ok) {
      const err = await userRes.text();
      console.error("Supabase error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await userRes.json();
    if(!user?.id) return res.status(401).json({ error: "No user found" });

    // Build session — no jwt package needed, use btoa for simple signing
    const payload = {
      userId: user.id,
      email:  user.email,
      name:   user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
      plan:   "free",
      iat:    Date.now(),
      exp:    Date.now() + 604800000, // 7 days
    };

    // Simple base64 token — signed with JWT_SECRET via HMAC
    const header  = btoa(JSON.stringify({ alg:"HS256", typ:"JWT" }));
    const body    = btoa(JSON.stringify(payload));
    const secret  = process.env.JWT_SECRET || "fallback_secret";

    // Use Web Crypto API (available in Vercel Edge/Node without packages)
    const enc     = new TextEncoder();
    const key     = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]
    );
    const sigBuf  = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
    const sig     = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
      .replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");

    const token = `${header}.${body}.${sig}`;
    return res.status(200).json({ token });

  } catch(err) {
    console.error("Callback error:", err.message, err.stack);
    return res.status(500).json({ error: "Internal error: " + err.message });
  }
}
