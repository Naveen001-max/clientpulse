// /api/ai.js — Vercel serverless function
// Proxies Anthropic API calls to fix CORS
// ANTHROPIC_API_KEY lives in Vercel env vars — never in frontend
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  if(req.method!=="POST")return res.status(405).end();
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key":process.env.ANTHROPIC_API_KEY,
        "anthropic-version":"2023-06-01",
      },
      body:JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens:1024,
        ...req.body,
      }),
    });
    const d=await r.json();
    return res.status(r.status).json(d);
  }catch(e){
    return res.status(500).json({error:e.message});
  }
}
