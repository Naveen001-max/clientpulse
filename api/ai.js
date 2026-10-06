// /api/ai.js — Groq API proxy (free tier)
// GROQ_API_KEY lives in Vercel env vars only
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  if(req.method!=="POST")return res.status(405).end();
  try{
    const{system,messages}=req.body;
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${process.env.GROQ_API_KEY}`,
      },
      body:JSON.stringify({
        model:"llama-3.3-70b-versatile", // free, fast, smart
        max_tokens:1024,
        messages:[
          ...(system?[{role:"system",content:system}]:[]),
          ...messages,
        ],
      }),
    });
    const d=await r.json();
    // Normalize to Anthropic-style response so frontend code stays the same
    const text=d.choices?.[0]?.message?.content||"";
    return res.status(r.status).json({
      content:[{type:"text",text}]
    });
  }catch(e){
    return res.status(500).json({error:e.message});
  }
}
