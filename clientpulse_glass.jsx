import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from "react";

// ═══════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════
const C = {
  brand:"#818cf8",brandDeep:"#4f46e5",brandGlow:"rgba(99,102,241,0.35)",
  green:"#34d399",greenGlow:"rgba(52,211,153,0.3)",
  amber:"#fbbf24",amberGlow:"rgba(251,191,36,0.3)",
  red:"#f87171",redGlow:"rgba(248,113,113,0.3)",
  purple:"#c084fc",purpleGlow:"rgba(192,132,252,0.3)",cyan:"#22d3ee",white:"#ffffff",
  glass:"rgba(255,255,255,0.08)",glassMid:"rgba(255,255,255,0.12)",
  glassHigh:"rgba(255,255,255,0.18)",glassBorder:"rgba(255,255,255,0.15)",
  glassBorderHover:"rgba(255,255,255,0.30)",
  textPrimary:"rgba(255,255,255,0.95)",textSec:"rgba(255,255,255,0.60)",
  textMuted:"rgba(255,255,255,0.35)",
};
const R={sm:6,md:10,lg:14,xl:18,xxl:24,full:9999};
const F={
  family:"'Inter',system-ui,sans-serif",mono:"'JetBrains Mono',monospace",
  xs:10,sm:11,base:13,md:14,lg:16,xl:20,xxl:26,
  regular:400,medium:500,semibold:600,bold:700,black:800,
};
const S={1:4,2:8,3:12,4:16,5:20,6:24,8:32,10:40,12:48};
const Z={dropdown:100,modal:200,panel:300};

const glass=(a=0.10,b=16)=>({
  background:`rgba(255,255,255,${a})`,
  backdropFilter:`blur(${b}px) saturate(180%)`,
  WebkitBackdropFilter:`blur(${b}px) saturate(180%)`,
  border:`1px solid ${C.glassBorder}`,
});
const gCard=(ex={})=>({...glass(0.08,20),borderRadius:R.xl,
  boxShadow:"0 8px 32px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.1)",...ex});

// ═══════════════════════════════════════════════════════
// PLAN DEFINITIONS
// ═══════════════════════════════════════════════════════
const PLANS = {
  free:{
    id:"free",name:"Free",price:0,label:"Free forever",color:C.textSec,
    limits:{clients:3,aiDrafts:5,invoices:5,pipeline:false},
    features:["3 clients","5 AI drafts/month","5 invoices","Task manager","Email support"],
    locked:["Pipeline board","Unlimited AI","Unlimited clients","Team seats"],
    checkoutUrl:null,
  },
  pro:{
    id:"pro",name:"Pro",price:39,label:"$39/month",color:C.brand,
    limits:{clients:Infinity,aiDrafts:Infinity,invoices:Infinity,pipeline:true},
    features:["Unlimited clients","Unlimited AI drafts","Unlimited invoices","Pipeline board","Priority support"],
    locked:["Team seats","White-label"],
    // ⚠️  Replace with your real Lemon Squeezy checkout URL
    checkoutUrl:"https://clientpulse.lemonsqueezy.com/checkout/buy/YOUR_PRO_VARIANT_ID",
  },
  agency:{
    id:"agency",name:"Agency",price:79,label:"$79/month",color:C.purple,
    limits:{clients:Infinity,aiDrafts:Infinity,invoices:Infinity,pipeline:true},
    features:["Everything in Pro","5 team seats","White-label","Client portal","Dedicated support"],
    locked:[],
    // ⚠️  Replace with your real Lemon Squeezy checkout URL
    checkoutUrl:"https://clientpulse.lemonsqueezy.com/checkout/buy/YOUR_AGENCY_VARIANT_ID",
  },
};

const planOrder={free:0,pro:1,agency:2};
const hasPlan=(current,required)=>(planOrder[current]||0)>=(planOrder[required]||0);

// ═══════════════════════════════════════════════════════
// DOMAIN
// ═══════════════════════════════════════════════════════
const CLIENT_STATUS={
  active:   {label:"Active",   color:C.green, bg:"rgba(52,211,153,0.18)"},
  overdue:  {label:"Overdue",  color:C.red,   bg:"rgba(248,113,113,0.18)"},
  prospect: {label:"Prospect", color:C.amber, bg:"rgba(251,191,36,0.18)"},
  completed:{label:"Completed",color:C.textSec,bg:"rgba(255,255,255,0.10)"},
};
const INVOICE_STATUS={
  draft:  {label:"Draft",  color:C.textSec,bg:"rgba(255,255,255,0.10)"},
  sent:   {label:"Sent",   color:C.brand,  bg:"rgba(129,140,248,0.18)"},
  paid:   {label:"Paid",   color:C.green,  bg:"rgba(52,211,153,0.18)"},
  overdue:{label:"Overdue",color:C.red,    bg:"rgba(248,113,113,0.18)"},
};
const PRIORITY={
  high:  {label:"High",  color:C.red},
  medium:{label:"Medium",color:C.amber},
  low:   {label:"Low",   color:C.green},
};
const AVATAR_COLORS=[C.brand,C.green,C.amber,C.red,C.purple,C.cyan];
const AI_ACTIONS=[
  {id:"invoice_reminder",emoji:"💸",label:"Invoice reminder"},
  {id:"warm_checkin",    emoji:"👋",label:"Warm check-in"},
  {id:"upsell",          emoji:"📈",label:"Upsell next phase"},
  {id:"update_request",  emoji:"🔄",label:"Request update"},
  {id:"project_wrapup",  emoji:"🎉",label:"Project wrap-up"},
  {id:"meeting_request", emoji:"📅",label:"Book a call"},
];
const NAV=[
  {id:"dashboard",label:"Dashboard",  icon:"◈"},
  {id:"clients",  label:"Clients",    icon:"⬡",badgeKey:"overdueClients"},
  {id:"invoices", label:"Invoices",   icon:"◻",badgeKey:"overdueInvoices"},
  {id:"tasks",    label:"Tasks",      icon:"◇",badgeKey:"highPriorityTasks"},
  {id:"pipeline", label:"Pipeline",   icon:"◑",planRequired:"pro"},
  {id:"launch",   label:"Launch Guide",icon:"↗"},
];

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
const fmt$  = n => "$"+Number(n||0).toLocaleString("en-US");
const daysAgo = d => Math.floor((Date.now()-new Date(d))/86400000);
const today   = () => new Date().toISOString().split("T")[0];
const uid     = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const initials= n => (n||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const pctPaid = (p=0,t=1) => Math.min(100,Math.round((p/t)*100));
const parseTags= t => Array.isArray(t)?t:(t||"").split(",").map(s=>s.trim()).filter(Boolean);
const stale   = d => d>21?C.red:d>10?C.amber:C.green;

const buildSys = c => `You are ClientPulse AI — a revenue-focused assistant for freelancers.
Client: ${c.name} | ${c.company} | ${c.email}
Project: "${c.project}" | Value: $${c.value?.toLocaleString()} | Paid: $${(c.paid||0).toLocaleString()}
Status: ${c.status} | Last contact: ${daysAgo(c.lastContact||today())}d ago | Invoice pending: ${c.invoicePending?"Yes":"No"}
Notes: ${c.notes||"None"}
Rules: address by first name only, under 110 words, warm but confident, "Subject: ...\n\n[body]", sign "Best,\n[Your Name]"`.trim();

const buildQ = (id,c) => ({
  invoice_reminder:`Draft a ${daysAgo(c.lastContact||today())>21?"firm":"polite"} invoice reminder for "${c.project}" ($${c.value?.toLocaleString()} outstanding).`,
  warm_checkin:`Draft a warm non-pushy check-in for ${c.name}. Don't mention invoices.`,
  upsell:`Draft an email proposing a follow-on retainer after "${c.project}" wraps up.`,
  update_request:`Draft an email requesting ${c.name}'s feedback or approvals to move the project forward.`,
  project_wrapup:`Draft a project wrap-up email for "${c.project}", celebrate outcomes, ask for a testimonial.`,
  meeting_request:`Draft a short email requesting a 30-min sync call with ${c.name}.`,
}[id]||`Draft a professional email to ${c.name}.`);

// ═══════════════════════════════════════════════════════
// AUTH (localStorage — swap for Supabase in production)
// ═══════════════════════════════════════════════════════
const AUTH_KEY  = "cp_auth_v2";
const USERS_KEY = "cp_users_v2";
const dataKey   = uid => `cp_data_v2_${uid}`;

const loadAuth  = () => { try{ return JSON.parse(localStorage.getItem(AUTH_KEY)||"null"); }catch{ return null; } };
const saveAuth  = d  => { try{ localStorage.setItem(AUTH_KEY, JSON.stringify(d)); }catch{} };
const loadData  = id => { try{ return JSON.parse(localStorage.getItem(dataKey(id))||"null"); }catch{ return null; } };
const saveData  = (id,d) => { try{ localStorage.setItem(dataKey(id), JSON.stringify(d)); }catch{} };
const loadUsers = () => { try{ return JSON.parse(localStorage.getItem(USERS_KEY)||"{}"); }catch{ return {}; } };
const saveUsers = u => { try{ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }catch{} };

// ═══════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════
const A={
  C_ADD:"C_ADD",C_UPD:"C_UPD",C_DEL:"C_DEL",C_TOUCH:"C_TOUCH",
  I_ADD:"I_ADD",I_PAID:"I_PAID",
  T_ADD:"T_ADD",T_TOG:"T_TOG",T_DEL:"T_DEL",
  ACT_PUSH:"ACT_PUSH",
  PAGE:"PAGE",AI:"AI",PRICING:"PRICING",PLAN:"PLAN",AI_USED:"AI_USED",
};

const initState = (plan="free") => ({
  clients:[],invoices:[],tasks:[],activity:[],
  ui:{page:"dashboard",aiClient:null,pricing:false},
  plan,aiUsed:0,
});

function reducer(s,{type:t,p}){
  switch(t){
    case A.C_ADD:   return{...s,clients:[...s.clients,{...p,id:uid(),createdAt:today(),lastContact:today(),tags:parseTags(p.tags)}]};
    case A.C_UPD:   return{...s,clients:s.clients.map(c=>c.id===p.id?{...c,...p,tags:parseTags(p.tags)}:c)};
    case A.C_DEL:   return{...s,clients:s.clients.filter(c=>c.id!==p)};
    case A.C_TOUCH: return{...s,clients:s.clients.map(c=>c.id===p?{...c,lastContact:today()}:c)};
    case A.I_ADD:   return{...s,invoices:[...s.invoices,{...p,id:`INV-${String(s.invoices.length+1).padStart(3,"0")}`,date:today()}]};
    case A.I_PAID:
      return{...s,
        invoices:s.invoices.map(i=>i.id===p?{...i,status:"paid"}:i),
        clients:s.clients.map(c=>{
          const inv=s.invoices.find(i=>i.id===p);
          if(!inv||c.id!==inv.clientId) return c;
          const np=(c.paid||0)+inv.amount;
          return{...c,paid:np,invoicePending:np<c.value};
        }),
      };
    case A.T_ADD:   return{...s,tasks:[...s.tasks,{...p,id:uid(),done:false}]};
    case A.T_TOG:   return{...s,tasks:s.tasks.map(t=>t.id===p?{...t,done:!t.done}:t)};
    case A.T_DEL:   return{...s,tasks:s.tasks.filter(t=>t.id!==p)};
    case A.ACT_PUSH:return{...s,activity:[p,...s.activity].slice(0,20)};
    case A.PAGE:    return{...s,ui:{...s.ui,page:p}};
    case A.AI:      return{...s,ui:{...s.ui,aiClient:p}};
    case A.PRICING: return{...s,ui:{...s.ui,pricing:p}};
    case A.PLAN:    return{...s,plan:p,ui:{...s.ui,pricing:false}};
    case A.AI_USED: return{...s,aiUsed:s.aiUsed+1};
    default:        return s;
  }
}

function useStore(userId,initPlan){
  const saved=loadData(userId);
  const[s,dispatch]=useReducer(reducer,saved||initState(initPlan||"free"));
  useEffect(()=>{ saveData(userId,s); },[s,userId]);

  const act=useMemo(()=>({
    addClient:    d => dispatch({type:A.C_ADD,  p:d}),
    updateClient: d => dispatch({type:A.C_UPD,  p:d}),
    deleteClient: id=> dispatch({type:A.C_DEL,  p:id}),
    markContacted:id=> dispatch({type:A.C_TOUCH,p:id}),
    addInvoice:   d => dispatch({type:A.I_ADD,  p:d}),
    markPaid:     id=> dispatch({type:A.I_PAID, p:id}),
    addTask:      d => dispatch({type:A.T_ADD,  p:d}),
    toggleTask:   id=> dispatch({type:A.T_TOG,  p:id}),
    deleteTask:   id=> dispatch({type:A.T_DEL,  p:id}),
    pushActivity: d => dispatch({type:A.ACT_PUSH,p:d}),
    setPage:      p => dispatch({type:A.PAGE,   p}),
    setAI:        c => dispatch({type:A.AI,     p:c}),
    setPricing:   v => dispatch({type:A.PRICING,p:v}),
    setPlan:      p => dispatch({type:A.PLAN,   p}),
    aiUsed:       ()=> dispatch({type:A.AI_USED}),
  }),[]);

  const derived=useMemo(()=>{
    const{clients,invoices,tasks,plan,aiUsed}=s;
    const cfg=PLANS[plan]||PLANS.free;
    const totalPipeline =clients.reduce((x,c)=>x+c.value,0);
    const totalCollected=clients.reduce((x,c)=>x+(c.paid||0),0);
    const overdueInvs   =invoices.filter(i=>i.status==="overdue");
    const needsFollowUp =clients.filter(c=>daysAgo(c.lastContact||today())>10&&c.status!=="completed");
    const canAddClient  =clients.length<cfg.limits.clients;
    const canUseAI      =aiUsed<cfg.limits.aiDrafts;
    const aiLeft        =cfg.limits.aiDrafts===Infinity?Infinity:cfg.limits.aiDrafts-aiUsed;
    return{
      totalPipeline,totalCollected,outstanding:totalPipeline-totalCollected,
      overdueInvs,needsFollowUp,
      openTasks:tasks.filter(t=>!t.done),
      activeClients:clients.filter(c=>c.status==="active").length,
      canAddClient,canUseAI,aiLeft,cfg,
      badges:{
        overdueClients:   clients.filter(c=>c.status==="overdue").length,
        overdueInvoices:  invoices.filter(i=>i.status==="overdue").length,
        highPriorityTasks:tasks.filter(t=>!t.done&&t.priority==="high").length,
      },
    };
  },[s]);

  return{s,act,derived};
}

// ═══════════════════════════════════════════════════════
// AI SERVICE + HOOK
// ═══════════════════════════════════════════════════════
async function callAI(sys,hist,text){
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1024,system:sys,
      messages:[...hist,{role:"user",content:text}]}),
  });
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.error?.message||`API ${res.status}`);}
  const d=await res.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}

function useAIChat(client){
  const[msgs,setMsgs]=useState([]);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState(null);
  const sysRef=useRef("");
  sysRef.current=buildSys(client);
  const send=useCallback(async text=>{
    if(!text.trim()||loading)return;
    setMsgs(p=>[...p,{role:"user",content:text}]);
    setLoading(true);setError(null);
    try{
      const r=await callAI(sysRef.current,msgs,text);
      setMsgs(p=>[...p,{role:"assistant",content:r}]);
    }catch(e){setError(e.message);setMsgs(p=>p.slice(0,-1));}
    setLoading(false);
  },[msgs,loading]);
  const reset=useCallback(()=>{setMsgs([]);setLoading(false);setError(null);},[]);
  return{msgs,loading,error,send,reset};
}

// ═══════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════
function Btn({children,onClick,variant="secondary",size="md",disabled=false,fullWidth=false,style:ex={}}){
  const[hov,setHov]=useState(false);
  const sz={sm:{fontSize:F.xs,padding:"5px 12px",borderRadius:R.md},md:{fontSize:F.base,padding:"9px 18px",borderRadius:R.md},lg:{fontSize:F.md,padding:"12px 24px",borderRadius:R.lg}};
  const vt={
    primary:    {bg:`linear-gradient(135deg,${C.brand},${C.brandDeep})`,co:C.white,bo:"none",sh:`0 4px 20px ${C.brandGlow}`},
    secondary:  {bg:hov?C.glassMid:C.glass,co:C.textPrimary,bo:`1px solid ${C.glassBorder}`,sh:"none"},
    ghost:      {bg:hov?"rgba(255,255,255,0.08)":"transparent",co:C.textSec,bo:"none",sh:"none"},
    danger:     {bg:`linear-gradient(135deg,${C.red},#ef4444)`,co:C.white,bo:"none",sh:`0 4px 16px ${C.redGlow}`},
    success:    {bg:`linear-gradient(135deg,${C.green},#059669)`,co:C.white,bo:"none",sh:`0 4px 16px ${C.greenGlow}`},
    brand_ghost:{bg:hov?"rgba(129,140,248,0.18)":"rgba(129,140,248,0.10)",co:C.brand,bo:`1px solid rgba(129,140,248,0.3)`,sh:"none"},
    amber:      {bg:`linear-gradient(135deg,#fbbf24,#f59e0b)`,co:"#000",bo:"none",sh:`0 4px 20px ${C.amberGlow}`},
  };
  const v=vt[variant]||vt.secondary;const ss=sz[size]||sz.md;
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...ss,background:v.bg,color:v.co,border:v.bo,boxShadow:v.sh,
        fontFamily:F.family,fontWeight:F.semibold,cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.45:1,display:"inline-flex",alignItems:"center",justifyContent:"center",
        gap:S[2],whiteSpace:"nowrap",transition:"all 0.15s",width:fullWidth?"100%":undefined,
        backdropFilter:"blur(8px)",...ex}}>
      {children}
    </button>
  );
}

function Inp({label,value,onChange,type="text",placeholder="",required=false,style:ex={}}){
  const[foc,setFoc]=useState(false);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[1]}}>
      {label&&<label style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textSec}}>
        {label}{required&&<span style={{color:C.red}}> *</span>}
      </label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
        style={{padding:"9px 13px",borderRadius:R.md,fontSize:F.base,fontFamily:F.family,
          color:C.textPrimary,outline:"none",transition:"all 0.15s",
          background:foc?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",
          border:`1px solid ${foc?"rgba(129,140,248,0.6)":C.glassBorder}`,
          boxShadow:foc?`0 0 0 3px rgba(129,140,248,0.15)`:"none",
          backdropFilter:"blur(8px)",...ex}}/>
    </div>
  );
}

function Txta({label,value,onChange,placeholder="",rows=3}){
  const[foc,setFoc]=useState(false);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[1]}}>
      {label&&<label style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textSec}}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
        style={{padding:"9px 13px",borderRadius:R.md,fontSize:F.base,fontFamily:F.family,
          color:C.textPrimary,outline:"none",resize:"vertical",transition:"all 0.15s",
          background:foc?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",
          border:`1px solid ${foc?"rgba(129,140,248,0.6)":C.glassBorder}`,backdropFilter:"blur(8px)"}}/>
    </div>
  );
}

function Sel({label,value,onChange,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[1]}}>
      {label&&<label style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textSec}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{padding:"9px 13px",borderRadius:R.md,fontSize:F.base,fontFamily:F.family,
          color:C.textPrimary,outline:"none",cursor:"pointer",
          background:"rgba(15,10,40,0.9)",border:`1px solid ${C.glassBorder}`}}>
        {children}
      </select>
    </div>
  );
}

function Badge({label,color,bg}){
  return <span style={{background:bg,color,fontSize:F.xs,fontWeight:F.bold,padding:"3px 9px",
    borderRadius:R.full,whiteSpace:"nowrap",border:`1px solid ${color}30`}}>{label}</span>;
}

function Avt({name,idx=0,size=38}){
  const color=AVATAR_COLORS[idx%AVATAR_COLORS.length];
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:`${color}22`,color,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.33),
      fontWeight:F.bold,flexShrink:0,border:`1.5px solid ${color}44`,boxShadow:`0 0 12px ${color}33`}}>
      {initials(name)}
    </div>
  );
}

function Card({children,style:ex={},onClick,glow}){
  const[hov,setHov]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...gCard(),border:`1px solid ${hov&&onClick?C.glassBorderHover:C.glassBorder}`,
        boxShadow:hov&&onClick?`0 12px 40px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.12),0 0 20px ${glow||C.brandGlow}`:"0 8px 32px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.08)",
        cursor:onClick?"pointer":undefined,transition:"all 0.2s",...ex}}>
      {children}
    </div>
  );
}

function Modal({title,onClose,children,width=520}){
  useEffect(()=>{
    const h=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[onClose]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.75)",zIndex:Z.modal,
      display:"flex",alignItems:"center",justifyContent:"center",padding:S[6],backdropFilter:"blur(12px)"}}>
      <div style={{...gCard({background:"rgba(20,15,50,0.88)",backdropFilter:"blur(30px) saturate(200%)"}),
        width,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto",borderRadius:R.xxl,
        boxShadow:"0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)"}}>
        {title&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:`${S[5]}px ${S[6]}px`,borderBottom:`1px solid ${C.glassBorder}`}}>
            <h2 style={{margin:0,fontSize:F.lg,fontWeight:F.bold,color:C.textPrimary}}>{title}</h2>
            <button onClick={onClose} style={{...glass(0.12,8),border:`1px solid ${C.glassBorder}`,
              borderRadius:R.sm,width:28,height:28,cursor:"pointer",color:C.textSec,fontSize:18,
              display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        )}
        <div style={{padding:`${S[5]}px ${S[6]}px`}}>{children}</div>
      </div>
    </div>
  );
}

function Progress({pct,color}){
  const c=color||(pct===100?C.green:pct>50?C.brand:C.amber);
  return(
    <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:R.full,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c}88,${c})`,
        borderRadius:R.full,transition:"width 0.6s ease",boxShadow:`0 0 8px ${c}66`}}/>
    </div>
  );
}

function StatCard({label,value,sub,trend,color,icon}){
  return(
    <Card style={{padding:S[5]}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:S[2]}}>
        <span style={{fontSize:F.sm,color:C.textSec,fontWeight:F.medium}}>{label}</span>
        {icon&&<span style={{fontSize:18,opacity:0.6}}>{icon}</span>}
      </div>
      <div style={{fontSize:F.xxl,fontWeight:F.black,color:color||C.textPrimary,letterSpacing:"-0.025em",
        lineHeight:1.1,marginBottom:S[1],textShadow:color?`0 0 20px ${color}66`:"none"}}>{value}</div>
      {sub&&<div style={{fontSize:F.xs,color:C.textMuted}}>{sub}</div>}
      {trend!==undefined&&<div style={{fontSize:F.xs,fontWeight:F.semibold,color:trend>=0?C.green:C.red,marginTop:S[1]}}>
        {trend>=0?"▲":"▼"} {Math.abs(trend)}% vs last month</div>}
    </Card>
  );
}

function Empty({icon,title,body,action}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:`${S[12]}px ${S[6]}px`,textAlign:"center",gap:S[3]}}>
      {icon&&<div style={{fontSize:40,opacity:0.4}}>{icon}</div>}
      <div style={{fontSize:F.md,fontWeight:F.semibold,color:C.textSec}}>{title}</div>
      {body&&<div style={{fontSize:F.base,color:C.textMuted,maxWidth:340,lineHeight:1.7}}>{body}</div>}
      {action}
    </div>
  );
}

function FTab({label,active,onClick,badge}){
  const[hov,setHov]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{fontSize:F.sm,fontWeight:active?F.bold:F.regular,padding:"7px 15px",borderRadius:R.full,
        border:`1px solid ${active?"rgba(129,140,248,0.6)":hov?"rgba(255,255,255,0.2)":C.glassBorder}`,
        background:active?"rgba(129,140,248,0.2)":hov?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)",
        color:active?C.brand:C.textSec,cursor:"pointer",fontFamily:F.family,
        display:"inline-flex",alignItems:"center",gap:S[1],transition:"all 0.15s",backdropFilter:"blur(8px)"}}>
      {label}
      {badge>0&&<span style={{background:C.red,color:C.white,fontSize:9,fontWeight:F.bold,
        borderRadius:R.full,padding:"1px 5px",minWidth:14,textAlign:"center"}}>{badge}</span>}
    </button>
  );
}

function Search({value,onChange,placeholder="Search…"}){
  const[foc,setFoc]=useState(false);
  return(
    <div style={{position:"relative",flex:1,minWidth:200}}>
      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.textMuted,pointerEvents:"none"}}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
        style={{width:"100%",padding:"9px 13px 9px 34px",borderRadius:R.md,fontSize:F.base,
          fontFamily:F.family,color:C.textPrimary,outline:"none",boxSizing:"border-box",transition:"all 0.15s",
          background:foc?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",
          border:`1px solid ${foc?"rgba(129,140,248,0.6)":C.glassBorder}`,
          backdropFilter:"blur(12px)",boxShadow:foc?`0 0 0 3px rgba(129,140,248,0.15)`:"none"}}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("login");
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);

  const submit=async()=>{
    setErr("");
    if(!email||!pass){setErr("Please fill in all fields.");return;}
    if(mode==="signup"&&!name){setErr("Please enter your name.");return;}
    if(pass.length<6){setErr("Password must be at least 6 characters.");return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,500));
    const users=loadUsers();
    if(mode==="signup"){
      if(users[email]){setErr("Email already registered. Sign in instead.");setLoading(false);return;}
      const id=uid();
      users[email]={id,name,pass,plan:"free",created:today()};
      saveUsers(users);
      const auth={id,email,name,plan:"free"};
      saveAuth(auth);onAuth(auth);
    } else {
      const u=users[email];
      if(!u||u.pass!==pass){setErr("Invalid email or password.");setLoading(false);return;}
      const auth={id:u.id,email,name:u.name,plan:u.plan||"free"};
      saveAuth(auth);onAuth(auth);
    }
    setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(135deg,#05031e 0%,#0d0826 40%,#0a1628 100%)",
      fontFamily:F.family,position:"relative",overflow:"hidden",padding:S[6]}}>
      <div style={{position:"fixed",top:-200,left:-200,width:600,height:600,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:-300,right:-100,width:700,height:700,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(192,132,252,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:S[8]}}>
          <div style={{width:52,height:52,borderRadius:R.lg,
            background:`linear-gradient(135deg,${C.brand},${C.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,
            margin:"0 auto",marginBottom:S[3],boxShadow:`0 8px 32px ${C.brandGlow}`}}>⚡</div>
          <div style={{fontSize:F.xxl,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.025em"}}>ClientPulse</div>
          <div style={{fontSize:F.base,color:C.textMuted,marginTop:S[1]}}>AI-powered CRM for freelancers</div>
        </div>

        <div style={{...gCard({background:"rgba(20,15,50,0.85)",backdropFilter:"blur(30px)"}),
          borderRadius:R.xxl,padding:S[6],
          boxShadow:"0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12)"}}>

          <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:R.lg,padding:S[1],marginBottom:S[5]}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}}
                style={{flex:1,padding:"8px 0",borderRadius:R.md,border:"none",cursor:"pointer",
                  fontFamily:F.family,fontSize:F.base,fontWeight:F.semibold,transition:"all 0.15s",
                  background:mode===m?"rgba(129,140,248,0.25)":"transparent",
                  color:mode===m?C.textPrimary:C.textMuted}}>
                {m==="login"?"Sign in":"Create account"}
              </button>
            ))}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
            {mode==="signup"&&<Inp label="Full name" value={name} onChange={setName} placeholder="Jane Smith" required/>}
            <Inp label="Email" value={email} onChange={setEmail} type="email" placeholder="jane@example.com" required/>
            <Inp label="Password" value={pass} onChange={setPass} type="password" placeholder="Min. 6 characters" required/>
          </div>

          {err&&<div style={{marginTop:S[3],background:"rgba(248,113,113,0.12)",color:C.red,fontSize:F.sm,
            borderRadius:R.md,padding:`${S[2]}px ${S[3]}px`,border:`1px solid rgba(248,113,113,0.25)`}}>{err}</div>}

          <Btn onClick={submit} variant="primary" fullWidth disabled={loading}
            style={{marginTop:S[5],borderRadius:R.md,padding:"12px 0",fontSize:F.md}}>
            {loading?"Please wait…":mode==="login"?"Sign in →":"Create free account →"}
          </Btn>

          {mode==="signup"&&(
            <div style={{marginTop:S[4],textAlign:"center",fontSize:F.xs,color:C.textMuted,lineHeight:1.6}}>
              Free plan: 3 clients · 5 AI drafts/month · No credit card needed
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:S[5],fontSize:F.xs,color:C.textMuted}}>
          🔒 Data stored securely in your browser · Upgrade anytime
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PRICING MODAL
// ═══════════════════════════════════════════════════════
function PricingModal({currentPlan,onClose,onSimulate}){
  const openCheckout=(plan)=>{
    if(!plan.checkoutUrl||plan.checkoutUrl.includes("YOUR_")){
      // Demo: simulate upgrade
      onSimulate(plan.id);
    } else {
      window.open(plan.checkoutUrl,"_blank","noopener,noreferrer");
      // In production: listen for Lemon Squeezy webhook → update plan via your backend
    }
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.88)",zIndex:Z.panel+10,
      display:"flex",alignItems:"center",justifyContent:"center",padding:S[6],backdropFilter:"blur(16px)"}}>
      <div style={{...gCard({background:"rgba(15,10,40,0.92)",backdropFilter:"blur(30px)"}),
        width:"min(940px,95vw)",borderRadius:R.xxl,overflow:"hidden",
        boxShadow:"0 24px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.12)"}}>

        <div style={{padding:`${S[6]}px ${S[8]}px ${S[5]}px`,textAlign:"center",
          borderBottom:`1px solid ${C.glassBorder}`,position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",right:S[5],top:S[4],
            ...glass(0.12,8),border:`1px solid ${C.glassBorder}`,borderRadius:R.sm,
            width:30,height:30,cursor:"pointer",color:C.textSec,fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <div style={{fontSize:F.xs,fontWeight:F.bold,textTransform:"uppercase",letterSpacing:"0.1em",color:C.brand,marginBottom:S[2]}}>Pricing</div>
          <div style={{fontSize:F.xxl,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.025em",marginBottom:S[2]}}>Choose your plan</div>
          <div style={{fontSize:F.base,color:C.textSec}}>Start free. Upgrade when you're ready. Cancel anytime.</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:S[5],padding:`${S[6]}px ${S[8]}px ${S[8]}px`}}>
          {Object.values(PLANS).map(plan=>{
            const isCurrent=currentPlan===plan.id;
            const isPop=plan.id==="pro";
            return(
              <div key={plan.id} style={{...gCard(),borderRadius:R.xl,overflow:"hidden",
                border:`2px solid ${isCurrent?plan.color:isPop?"rgba(129,140,248,0.4)":C.glassBorder}`,
                boxShadow:isPop?`0 0 40px ${C.brandGlow}`:"0 8px 24px rgba(0,0,0,0.2)",
                display:"flex",flexDirection:"column"}}>

                {isPop&&<div style={{background:`linear-gradient(90deg,${C.brand},${C.purple})`,
                  textAlign:"center",padding:"6px 0",fontSize:F.xs,fontWeight:F.bold,color:C.white,
                  letterSpacing:"0.05em",textTransform:"uppercase"}}>⭐ Most Popular</div>}
                {isCurrent&&!isPop&&<div style={{background:"rgba(52,211,153,0.2)",textAlign:"center",
                  padding:"6px 0",fontSize:F.xs,fontWeight:F.bold,color:C.green,textTransform:"uppercase"}}>Current Plan</div>}

                <div style={{padding:S[5],flex:1,display:"flex",flexDirection:"column",gap:S[4]}}>
                  <div>
                    <div style={{fontSize:F.lg,fontWeight:F.black,color:plan.color,marginBottom:S[1]}}>{plan.name}</div>
                    <div style={{fontSize:32,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.03em",lineHeight:1}}>
                      {plan.price===0?"Free":`$${plan.price}`}
                    </div>
                    {plan.price>0&&<div style={{fontSize:F.xs,color:C.textMuted,marginTop:S[1]}}>per month · cancel anytime</div>}
                  </div>

                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:S[2]}}>
                    {plan.features.map(f=>(
                      <div key={f} style={{display:"flex",gap:S[2],alignItems:"flex-start"}}>
                        <span style={{color:C.green,fontSize:F.sm,flexShrink:0,marginTop:1}}>✓</span>
                        <span style={{fontSize:F.sm,color:C.textSec,lineHeight:1.5}}>{f}</span>
                      </div>
                    ))}
                    {plan.locked.map(f=>(
                      <div key={f} style={{display:"flex",gap:S[2],alignItems:"flex-start",opacity:0.35}}>
                        <span style={{color:C.textMuted,fontSize:F.sm,flexShrink:0,marginTop:1}}>✗</span>
                        <span style={{fontSize:F.sm,color:C.textMuted,lineHeight:1.5}}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrent?(
                    <div style={{textAlign:"center",padding:"10px 0",fontSize:F.base,fontWeight:F.semibold,color:C.green}}>✓ Active plan</div>
                  ):plan.id==="free"?(
                    <Btn onClick={()=>onSimulate("free")} variant="secondary" fullWidth>Downgrade to Free</Btn>
                  ):(
                    <Btn onClick={()=>openCheckout(plan)} variant={plan.id==="pro"?"primary":"brand_ghost"} fullWidth>
                      {plan.id==="pro"?"Get Pro — $39/mo":"Get Agency — $79/mo"}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{textAlign:"center",padding:`0 0 ${S[5]}px`,fontSize:F.xs,color:C.textMuted}}>
          🔒 Secure payment via Lemon Squeezy · 7-day money-back guarantee · Cancel anytime
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PLAN GATE COMPONENT
// ═══════════════════════════════════════════════════════
function PlanGate({currentPlan,requiredPlan,featureName,onUpgrade,children}){
  if(hasPlan(currentPlan,requiredPlan)) return children;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:`${S[12]}px ${S[6]}px`,textAlign:"center",gap:S[4]}}>
      <div style={{fontSize:48}}>🔒</div>
      <div style={{fontSize:F.xl,fontWeight:F.bold,color:C.textPrimary}}>{featureName}</div>
      <div style={{fontSize:F.base,color:C.textMuted,maxWidth:340,lineHeight:1.7}}>
        Available on the <strong style={{color:PLANS[requiredPlan].color}}>{PLANS[requiredPlan].name} plan</strong>. Upgrade to unlock pipeline visibility, unlimited clients and AI drafts.
      </div>
      <Btn onClick={onUpgrade} variant="primary" size="lg">✨ Upgrade to {PLANS[requiredPlan].name} — {PLANS[requiredPlan].label}</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════
function Sidebar({page,onNav,badges,plan,onUpgrade,onLogout,userName}){
  const cfg=PLANS[plan]||PLANS.free;
  return(
    <aside style={{width:220,background:"rgba(10,5,30,0.88)",backdropFilter:"blur(20px)",
      display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",
      overflowY:"auto",borderRight:`1px solid ${C.glassBorder}`}}>

      <div style={{padding:`${S[6]}px ${S[5]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`}}>
        <div style={{display:"flex",alignItems:"center",gap:S[3]}}>
          <div style={{width:34,height:34,borderRadius:R.md,
            background:`linear-gradient(135deg,${C.brand},${C.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,
            boxShadow:`0 4px 20px ${C.brandGlow}`}}>⚡</div>
          <div>
            <div style={{fontSize:F.md,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.02em",lineHeight:1.1}}>ClientPulse</div>
            <div style={{fontSize:F.xs,color:C.textMuted}}>AI-powered CRM</div>
          </div>
        </div>
      </div>

      <nav style={{padding:S[3],display:"flex",flexDirection:"column",gap:2,flex:1}}>
        <div style={{fontSize:9,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",
          letterSpacing:"0.1em",padding:`${S[3]}px ${S[2]}px ${S[2]}px`}}>Navigation</div>
        {NAV.map(item=>{
          const isActive=page===item.id;
          const badge=item.badgeKey?badges[item.badgeKey]:0;
          const locked=item.planRequired&&!hasPlan(plan,item.planRequired);
          return <NavBtn key={item.id} item={item} active={isActive} badge={badge} locked={locked} onClick={()=>onNav(item.id)}/>;
        })}
      </nav>

      <div style={{padding:`${S[3]}px`}}>
        <div style={{...glass(0.06,12),borderRadius:R.lg,padding:`${S[3]}px ${S[4]}px`,marginBottom:S[2],
          border:`1px solid ${cfg.color}30`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:plan==="free"?S[1]:0}}>
            <span style={{fontSize:F.xs,fontWeight:F.bold,color:cfg.color}}>{cfg.name} Plan</span>
            {plan==="free"&&<button onClick={onUpgrade}
              style={{fontSize:9,fontWeight:F.bold,padding:"2px 7px",borderRadius:R.full,
                background:`linear-gradient(135deg,${C.brand},${C.purple})`,color:C.white,
                border:"none",cursor:"pointer",fontFamily:F.family}}>UPGRADE</button>}
          </div>
          {plan==="free"&&<div style={{fontSize:F.xs,color:C.textMuted}}>3 clients · 5 AI drafts</div>}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:S[2],padding:`${S[2]}px ${S[1]}px`}}>
          <div style={{width:28,height:28,borderRadius:"50%",
            background:`linear-gradient(135deg,${C.brand},${C.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:F.xs,color:C.white,fontWeight:F.bold,flexShrink:0}}>
            {initials(userName||"U")}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textPrimary,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
              {userName||"User"}
            </div>
            <button onClick={onLogout}
              style={{fontSize:F.xs,color:C.textMuted,background:"none",border:"none",
                cursor:"pointer",fontFamily:F.family,padding:0}}>Sign out</button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavBtn({item,active,badge,locked,onClick}){
  const[hov,setHov]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[2]+1}px ${S[3]}px`,
        borderRadius:R.md,border:"none",cursor:"pointer",fontFamily:F.family,width:"100%",textAlign:"left",
        background:active?"rgba(129,140,248,0.18)":hov?"rgba(255,255,255,0.06)":"transparent",
        color:active?C.textPrimary:locked?C.textMuted:hov?"rgba(255,255,255,0.7)":C.textSec,
        fontWeight:active?F.semibold:F.regular,fontSize:F.base,transition:"all 0.15s"}}>
      <span style={{fontSize:15,width:16,textAlign:"center",flexShrink:0}}>{item.icon}</span>
      <span style={{flex:1}}>{item.label}</span>
      {locked&&<span style={{fontSize:9,color:C.textMuted}}>🔒</span>}
      {!locked&&badge>0&&<span style={{background:C.red,color:C.white,fontSize:9,borderRadius:R.full,
        padding:"2px 6px",fontWeight:F.bold}}>{badge}</span>}
    </button>
  );
}

function Topbar({page,alerts=0,plan,onUpgrade}){
  const titles={dashboard:"Dashboard",clients:"Clients",invoices:"Invoices",tasks:"Tasks",pipeline:"Pipeline",launch:"Launch Guide"};
  const subs={dashboard:"Your business at a glance",clients:"Manage relationships and projects",
    invoices:"Track payments and outstanding balances",tasks:"Stay on top of your to-do list",
    pipeline:"Visualise your deal stages",launch:"Your $0→$10K MRR roadmap"};
  return(
    <header style={{...glass(0.06,20),borderBottom:`1px solid ${C.glassBorder}`,
      padding:`0 ${S[6]}px`,height:60,display:"flex",alignItems:"center",
      justifyContent:"space-between",flexShrink:0}}>
      <div>
        <h1 style={{margin:0,fontSize:F.lg,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.02em",lineHeight:1.1}}>
          {titles[page]||page}
        </h1>
        <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>{subs[page]}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:S[3]}}>
        {plan==="free"&&(
          <button onClick={onUpgrade}
            style={{background:`linear-gradient(135deg,${C.brand},${C.purple})`,color:C.white,
              border:"none",borderRadius:R.full,padding:"7px 16px",fontSize:F.xs,fontWeight:F.bold,
              cursor:"pointer",fontFamily:F.family,boxShadow:`0 4px 16px ${C.brandGlow}`}}>
            ✨ Upgrade to Pro
          </button>
        )}
        {alerts>0&&<div style={{background:"rgba(248,113,113,0.15)",color:C.red,fontSize:F.xs,
          fontWeight:F.bold,padding:"5px 12px",borderRadius:R.full,border:`1px solid rgba(248,113,113,0.3)`}}>
          🔔 {alerts} alert{alerts!==1?"s":""}
        </div>}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════
// AI PANEL
// ═══════════════════════════════════════════════════════
function AIPanel({client,onClose,canUseAI,aiLeft,onUpgrade,onUsed}){
  const{msgs,loading,error,send,reset}=useAIChat(client);
  const[input,setInput]=useState("");
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const go=(text)=>{
    if(!canUseAI){onUpgrade();return;}
    send(text);onUsed();setInput("");
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.75)",zIndex:Z.panel,
      display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:S[6],backdropFilter:"blur(10px)"}}>
      <div style={{...gCard({background:"rgba(15,10,40,0.92)",backdropFilter:"blur(40px)"}),
        width:460,height:640,display:"flex",flexDirection:"column",borderRadius:R.xxl,
        boxShadow:"0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)",overflow:"hidden"}}>

        <div style={{background:`linear-gradient(135deg,${C.brandDeep}99,${C.purple}66)`,
          padding:`${S[4]}px ${S[5]}px`,display:"flex",alignItems:"center",gap:S[3],
          borderBottom:`1px solid ${C.glassBorder}`,flexShrink:0}}>
          <Avt name={client.name} idx={client.avatarIdx||0} size={36}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>AI for {client.name.split(" ")[0]}</div>
            <div style={{fontSize:F.xs,color:C.textSec}}>
              {aiLeft===Infinity?"Unlimited drafts":`${aiLeft} draft${aiLeft!==1?"s":""} left this month`}
            </div>
          </div>
          {msgs.length>0&&<button onClick={reset}
            style={{...glass(0.15,8),border:`1px solid ${C.glassBorder}`,borderRadius:R.sm,
              padding:"4px 10px",cursor:"pointer",color:C.textSec,fontSize:F.xs,fontFamily:F.family}}>
            New chat
          </button>}
          <button onClick={onClose}
            style={{...glass(0.15,8),border:`1px solid ${C.glassBorder}`,borderRadius:R.sm,
              width:28,height:28,cursor:"pointer",color:C.textSec,fontSize:18,
              display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        {!canUseAI&&(
          <div style={{padding:S[5],textAlign:"center",borderBottom:`1px solid ${C.glassBorder}`,flexShrink:0}}>
            <div style={{fontSize:F.base,fontWeight:F.bold,color:C.amber,marginBottom:S[3]}}>
              🚫 You've used all {PLANS.free.limits.aiDrafts} free AI drafts this month
            </div>
            <Btn onClick={onUpgrade} variant="primary">Upgrade for unlimited AI drafts</Btn>
          </div>
        )}

        {msgs.length===0&&canUseAI&&(
          <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,flexShrink:0}}>
            <div style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",
              letterSpacing:"0.07em",marginBottom:S[3]}}>Quick actions</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[2]}}>
              {AI_ACTIONS.map(a=>(
                <button key={a.id} onClick={()=>go(buildQ(a.id,client))}
                  style={{...glass(0.06,8),border:`1px solid ${C.glassBorder}`,borderRadius:R.md,
                    padding:`${S[2]}px ${S[3]}px`,fontSize:F.xs,cursor:"pointer",textAlign:"left",
                    color:C.textSec,fontFamily:F.family,fontWeight:F.medium,
                    display:"flex",gap:S[2],alignItems:"center",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(129,140,248,0.15)";e.currentTarget.style.color=C.textPrimary;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color=C.textSec;}}>
                  <span>{a.emoji}</span>{a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{flex:1,overflowY:"auto",padding:`${S[4]}px ${S[5]}px`,display:"flex",flexDirection:"column",gap:S[4]}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
              {m.role==="assistant"&&<div style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,marginBottom:S[1],
                textTransform:"uppercase",letterSpacing:"0.06em"}}>✨ ClientPulse AI</div>}
              <div style={{maxWidth:"90%",
                background:m.role==="user"?`linear-gradient(135deg,${C.brandDeep},${C.purple})`:"rgba(255,255,255,0.08)",
                color:C.textPrimary,
                borderRadius:m.role==="user"?`${R.xl}px ${R.xl}px ${R.sm}px ${R.xl}px`:`${R.sm}px ${R.xl}px ${R.xl}px ${R.xl}px`,
                padding:`${S[3]}px ${S[4]}px`,fontSize:F.base,lineHeight:1.65,whiteSpace:"pre-wrap",
                border:`1px solid ${m.role==="user"?"transparent":C.glassBorder}`}}>
                {m.content}
              </div>
              {m.role==="assistant"&&(
                <button onClick={()=>navigator.clipboard?.writeText(m.content)}
                  style={{marginTop:S[1],fontSize:F.xs,color:C.textMuted,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:F.family}}>
                  📋 Copy
                </button>
              )}
            </div>
          ))}
          {loading&&<div style={{fontSize:F.base,color:C.textMuted,fontStyle:"italic"}}>✨ Writing…</div>}
          {error&&<div style={{background:"rgba(248,113,113,0.12)",color:C.red,fontSize:F.sm,borderRadius:R.md,
            padding:`${S[2]}px ${S[3]}px`,border:`1px solid rgba(248,113,113,0.25)`}}>⚠️ {error}</div>}
          <div ref={bottomRef}/>
        </div>

        <div style={{padding:`${S[3]}px ${S[4]}px`,borderTop:`1px solid ${C.glassBorder}`,display:"flex",gap:S[2],flexShrink:0}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(input.trim())go(input.trim());}}}
            placeholder={canUseAI?"Ask AI to draft anything…":"Upgrade to use AI"}
            disabled={!canUseAI}
            style={{flex:1,fontSize:F.base,padding:"9px 13px",borderRadius:R.md,fontFamily:F.family,
              color:C.textPrimary,outline:"none",transition:"all 0.15s",
              background:"rgba(255,255,255,0.06)",border:`1px solid ${C.glassBorder}`,
              backdropFilter:"blur(8px)",opacity:canUseAI?1:0.5}}/>
          <Btn onClick={()=>input.trim()&&go(input.trim())} variant="primary"
            disabled={loading||!input.trim()||!canUseAI} style={{borderRadius:R.md}}>↗</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CLIENT COMPONENTS
// ═══════════════════════════════════════════════════════
const EC={name:"",company:"",email:"",phone:"",project:"",value:"",paid:"0",
  status:"active",stage:"In Progress",dueDate:"",tags:"",notes:""};

function ClientForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial?{...initial,value:String(initial.value),paid:String(initial.paid||0),
    tags:Array.isArray(initial.tags)?initial.tags.join(", "):initial.tags||""}:{...EC});
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  const valid=f.name.trim()&&f.email.trim()&&f.project.trim()&&f.value.trim();
  const submit=()=>{
    if(!valid)return;
    onSave({...f,value:Number(f.value)||0,paid:Number(f.paid)||0,
      invoicePending:(Number(f.paid)||0)<(Number(f.value)||0),
      avatarIdx:initial?.avatarIdx??Math.floor(Math.random()*AVATAR_COLORS.length)});
    onClose();
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
        <Inp label="Full name"    value={f.name}    onChange={set("name")}    placeholder="Jane Smith"     required/>
        <Inp label="Company"      value={f.company} onChange={set("company")} placeholder="Acme Inc."/>
        <Inp label="Email"        value={f.email}   onChange={set("email")}   type="email" placeholder="jane@acme.com" required/>
        <Inp label="Phone"        value={f.phone}   onChange={set("phone")}   placeholder="+1 415 000 0000"/>
        <div style={{gridColumn:"1/-1"}}><Inp label="Project name" value={f.project} onChange={set("project")} placeholder="Website Redesign" required/></div>
        <Inp label="Contract ($)" value={f.value}   onChange={set("value")}   type="number" placeholder="5000" required/>
        <Inp label="Paid so far ($)" value={f.paid} onChange={set("paid")}    type="number" placeholder="0"/>
        <Sel label="Status" value={f.status} onChange={set("status")}>
          <option value="active">Active</option><option value="prospect">Prospect</option>
          <option value="overdue">Overdue</option><option value="completed">Completed</option>
        </Sel>
        <Inp label="Stage"    value={f.stage}   onChange={set("stage")}   placeholder="In Progress"/>
        <Inp label="Due date" value={f.dueDate} onChange={set("dueDate")} type="date"/>
        <Inp label="Tags (comma-separated)" value={f.tags} onChange={set("tags")} placeholder="design, dev"/>
      </div>
      <Txta label="Notes" value={f.notes} onChange={set("notes")} placeholder="Any context about this client…" rows={3}/>
      {!valid&&f.name&&<div style={{fontSize:F.xs,color:C.red}}>Please fill in all required fields.</div>}
      <div style={{display:"flex",gap:S[3]}}>
        <Btn onClick={onClose} variant="secondary" fullWidth>Cancel</Btn>
        <Btn onClick={submit} variant="primary" fullWidth disabled={!valid}>{initial?"Save changes":"Add client"}</Btn>
      </div>
    </div>
  );
}

function ClientCard({client,onSelect,onAI}){
  const cfg=CLIENT_STATUS[client.status]||CLIENT_STATUS.active;
  const days=daysAgo(client.lastContact||today());
  const pct=pctPaid(client.paid,client.value);
  const color=AVATAR_COLORS[(client.avatarIdx||0)%AVATAR_COLORS.length];
  return(
    <Card onClick={()=>onSelect(client)} glow={`${color}33`}
      style={{padding:S[5],display:"flex",flexDirection:"column",gap:S[3]}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:S[3]}}>
          <Avt name={client.name} idx={client.avatarIdx||0} size={40}/>
          <div>
            <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,lineHeight:1.2}}>{client.name}</div>
            <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>{client.company}</div>
          </div>
        </div>
        <Badge label={cfg.label} color={cfg.color} bg={cfg.bg}/>
      </div>
      <div style={{fontSize:F.xs,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        📁 {client.project}
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
          <span style={{fontSize:F.xs,color:C.textMuted}}>Payment ({pct}%)</span>
          <span style={{fontSize:F.xs,fontWeight:F.bold,color:C.textPrimary}}>
            ${(client.paid||0).toLocaleString()} / ${client.value.toLocaleString()}
          </span>
        </div>
        <Progress pct={pct}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:F.xs,color:stale(days),fontWeight:F.semibold}}>
          🕐 {days===0?"Today":`${days}d ago`}
        </span>
        <div style={{display:"flex",gap:S[1],alignItems:"center"}}>
          {client.tags?.slice(0,2).map(t=>(
            <span key={t} style={{fontSize:F.xs,fontWeight:F.semibold,padding:"2px 8px",borderRadius:R.full,
              background:"rgba(129,140,248,0.12)",color:C.brand,border:`1px solid rgba(129,140,248,0.25)`}}>{t}</span>
          ))}
          <button onClick={e=>{e.stopPropagation();onAI(client);}}
            style={{fontSize:F.xs,fontWeight:F.bold,padding:"3px 10px",borderRadius:R.full,
              background:"rgba(129,140,248,0.15)",color:C.brand,border:`1px solid rgba(129,140,248,0.3)`,
              cursor:"pointer",fontFamily:F.family,transition:"all 0.15s"}}>✨ AI</button>
        </div>
      </div>
    </Card>
  );
}

function ClientDetail({client,onClose,onEdit,onDelete,onAI,onMarkContacted}){
  const cfg=CLIENT_STATUS[client.status]||CLIENT_STATUS.active;
  const days=daysAgo(client.lastContact||today());
  const pct=pctPaid(client.paid,client.value);
  return(
    <Modal title="" onClose={onClose} width={560}>
      <div style={{display:"flex",alignItems:"center",gap:S[4],marginBottom:S[5]}}>
        <Avt name={client.name} idx={client.avatarIdx||0} size={54}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:S[2],marginBottom:S[1]}}>
            <h2 style={{margin:0,fontSize:F.xl,fontWeight:F.black,color:C.textPrimary}}>{client.name}</h2>
            <Badge label={cfg.label} color={cfg.color} bg={cfg.bg}/>
          </div>
          <div style={{fontSize:F.base,color:C.textSec}}>{client.company}</div>
          <a href={`mailto:${client.email}`} style={{fontSize:F.xs,color:C.brand}}>{client.email}</a>
          {client.phone&&<span style={{fontSize:F.xs,color:C.textMuted,marginLeft:S[3]}}>{client.phone}</span>}
        </div>
      </div>
      <div style={{height:1,background:C.glassBorder,marginBottom:S[5]}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3],marginBottom:S[5]}}>
        <StatCard label="Contract"     value={fmt$(client.value)} icon="💼"/>
        <StatCard label="Paid"         value={fmt$(client.paid||0)} color={client.paid>=client.value?C.green:C.amber} icon="✅"/>
        <StatCard label="Last contact" value={days===0?"Today":`${days}d ago`} color={days>14?C.red:C.green} icon="🕐"/>
        <StatCard label="Due date"     value={client.dueDate||"—"} icon="📅"/>
      </div>
      <div style={{marginBottom:S[4]}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
          <span style={{fontSize:F.sm,color:C.textSec}}>Payment progress</span>
          <span style={{fontSize:F.sm,fontWeight:F.bold,color:C.textPrimary}}>{pct}%</span>
        </div>
        <Progress pct={pct}/>
      </div>
      <div style={{display:"flex",gap:S[3],marginBottom:S[4]}}>
        {[["Project",client.project],["Stage",client.stage||"—"]].map(([l,v])=>(
          <div key={l} style={{flex:1,...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`}}>
            <div style={{fontSize:F.xs,color:C.textMuted,marginBottom:2}}>{l}</div>
            <div style={{fontSize:F.base,fontWeight:F.semibold,color:C.textPrimary}}>{v}</div>
          </div>
        ))}
      </div>
      {client.notes&&<div style={{...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`,
        marginBottom:S[4],fontSize:F.base,color:C.textSec,lineHeight:1.7,borderLeft:`3px solid ${C.brand}`}}>
        {client.notes}</div>}
      {client.tags?.length>0&&<div style={{display:"flex",gap:S[1],flexWrap:"wrap",marginBottom:S[5]}}>
        {client.tags.map(t=>(
          <span key={t} style={{fontSize:F.xs,fontWeight:F.semibold,padding:"2px 9px",borderRadius:R.full,
            background:"rgba(129,140,248,0.12)",color:C.brand,border:`1px solid rgba(129,140,248,0.25)`}}>{t}</span>
        ))}
      </div>}
      <div style={{height:1,background:C.glassBorder,marginBottom:S[4]}}/>
      <div style={{display:"flex",gap:S[2],flexWrap:"wrap"}}>
        <Btn onClick={()=>{onMarkContacted(client.id);onClose();}} variant="success">✅ Mark contacted</Btn>
        <Btn onClick={()=>{onAI(client);onClose();}} variant="brand_ghost">✨ AI Draft</Btn>
        <Btn onClick={()=>onEdit(client)} variant="secondary">✏️ Edit</Btn>
        <Btn onClick={()=>{onDelete(client.id);onClose();}} variant="danger">🗑 Delete</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════
function BarChart({data,color}){
  const max=Math.max(...data.map(d=>d.v),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:60}}>
      {data.map((d,i)=>{
        const isLast=i===data.length-1;
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:S[1]}}>
            <div style={{width:"100%",height:Math.max((d.v/max)*48,3),
              background:isLast?`linear-gradient(180deg,${color},${color}88)`:`${color}33`,
              borderRadius:`${R.sm}px ${R.sm}px 0 0`,transition:"height 0.6s ease",
              boxShadow:isLast?`0 0 16px ${color}55`:"none"}}/>
            <span style={{fontSize:9,color:C.textMuted,fontWeight:isLast?F.bold:F.regular}}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardPage({clients,invoices,tasks,activity,derived,onAI,onUpgrade,onAddClient}){
  const{totalPipeline,totalCollected,outstanding,overdueInvs,activeClients,needsFollowUp}=derived;
  const pct=totalPipeline>0?Math.round((totalCollected/totalPipeline)*100):0;
  const openTasks=tasks.filter(t=>!t.done);

  if(clients.length===0){
    return(
      <div style={{display:"flex",flexDirection:"column",gap:S[6]}}>
        <div style={{background:`linear-gradient(135deg,rgba(79,70,229,0.6),rgba(192,132,252,0.4))`,
          backdropFilter:"blur(20px)",borderRadius:R.xxl,padding:`${S[8]}px`,textAlign:"center",
          border:`1px solid rgba(129,140,248,0.3)`,color:C.textPrimary,
          boxShadow:`0 8px 40px rgba(79,70,229,0.3)`}}>
          <div style={{fontSize:52,marginBottom:S[3]}}>⚡</div>
          <div style={{fontSize:F.xxl,fontWeight:F.black,letterSpacing:"-0.025em",marginBottom:S[3]}}>Welcome to ClientPulse!</div>
          <div style={{fontSize:F.base,color:"rgba(255,255,255,0.7)",marginBottom:S[5],maxWidth:480,margin:"0 auto",lineHeight:1.7}}>
            Your AI CRM is ready. Add your first client to start tracking projects,<br/>payments, and let AI draft your follow-up emails.
          </div>
          <div style={{height:S[5]}}/>
          <Btn onClick={onAddClient} variant="primary" size="lg">+ Add your first client</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:S[4]}}>
          {[["📊","Dashboard","Revenue stats, alerts, and activity all in one place"],
            ["✨","AI Drafts","One click writes the perfect follow-up email for any client"],
            ["📄","Invoices","Create, track, and mark invoices paid. Balances auto-update"],
            ["◑","Pipeline","Kanban board showing every deal from prospect to done"],
          ].map(([icon,title,desc])=>(
            <Card key={title} style={{padding:S[5],textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:S[2]}}>{icon}</div>
              <div style={{fontSize:F.md,fontWeight:F.bold,color:C.textPrimary,marginBottom:S[1]}}>{title}</div>
              <div style={{fontSize:F.xs,color:C.textMuted,lineHeight:1.6}}>{desc}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const chartData=[
    {label:"Feb",v:0},{label:"Mar",v:0},{label:"Apr",v:0},
    {label:"May",v:0},{label:"Jun",v:0},{label:"Jul",v:totalCollected},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[6]}}>
      <div style={{background:`linear-gradient(135deg,rgba(79,70,229,0.6),rgba(192,132,252,0.4))`,
        backdropFilter:"blur(20px)",borderRadius:R.xxl,padding:`${S[6]}px ${S[8]}px`,
        border:`1px solid rgba(129,140,248,0.3)`,color:C.textPrimary,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        boxShadow:`0 8px 40px rgba(79,70,229,0.3),inset 0 1px 0 rgba(255,255,255,0.15)`}}>
        <div>
          <div style={{fontSize:F.sm,color:"rgba(255,255,255,0.6)",marginBottom:S[1]}}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </div>
          <div style={{fontSize:30,fontWeight:F.black,letterSpacing:"-0.025em",lineHeight:1.1}}>Good morning 👋</div>
          <div style={{fontSize:F.base,color:"rgba(255,255,255,0.6)",marginTop:S[2]}}>
            {openTasks.length} tasks · {needsFollowUp.length} need follow-up
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:36,fontWeight:F.black,letterSpacing:"-0.035em",lineHeight:1}}>{fmt$(totalPipeline)}</div>
          <div style={{fontSize:F.sm,color:"rgba(255,255,255,0.5)",marginTop:S[1]}}>pipeline · {pct}% collected</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:S[4]}}>
        <StatCard label="Revenue collected" value={fmt$(totalCollected)} sub={`${pct}% of pipeline`} color={C.green} icon="💰"/>
        <StatCard label="Outstanding" value={fmt$(outstanding)} sub={`${clients.filter(c=>c.invoicePending).length} unpaid`} color={outstanding>5000?C.red:C.amber} icon="⏳"/>
        <StatCard label="Overdue invoices" value={overdueInvs.length} sub={overdueInvs.length?fmt$(overdueInvs.reduce((s,i)=>s+i.amount,0))+" at risk":"All clear"} color={overdueInvs.length?C.red:C.green} icon="🚨"/>
        <StatCard label="Active clients" value={activeClients} sub={`${clients.length} total`} color={C.brand} icon="👥"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:S[5]}}>
        <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
          <Card style={{padding:`${S[5]}px ${S[6]}px`}}>
            <div style={{fontWeight:F.bold,fontSize:F.lg,color:C.textPrimary,marginBottom:S[5]}}>Revenue collected</div>
            <BarChart data={chartData} color={C.brand}/>
          </Card>
          <Card>
            <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>
              Top clients by value
            </div>
            {[...clients].sort((a,b)=>b.value-a.value).slice(0,5).map((c,i)=>{
              const p=pctPaid(c.paid,c.value);
              const cfg=CLIENT_STATUS[c.status];
              return(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[3]}px ${S[5]}px`,borderBottom:i<4?`1px solid ${C.glassBorder}`:"none"}}>
                  <Avt name={c.name} idx={c.avatarIdx||0} size={34}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:F.semibold,fontSize:F.base,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div style={{fontSize:F.xs,color:C.textMuted}}>{c.project}</div>
                    <div style={{marginTop:S[1]}}><Progress pct={p}/></div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:F.bold,fontSize:F.base,color:C.textPrimary}}>{fmt$(c.value)}</div>
                    {cfg&&<Badge label={cfg.label} color={cfg.color} bg={cfg.bg}/>}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
          {(needsFollowUp.length>0||overdueInvs.length>0)&&(
            <Card>
              <div style={{padding:`${S[3]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`,display:"flex",alignItems:"center",gap:S[2]}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:C.red,boxShadow:`0 0 8px ${C.redGlow}`}}/>
                <span style={{fontWeight:F.bold,fontSize:F.base,color:C.textPrimary}}>Needs attention</span>
              </div>
              {[
                ...overdueInvs.slice(0,2).map(inv=>({text:`${inv.client}: ${fmt$(inv.amount)} overdue`,color:C.red,client:clients.find(c=>c.id===inv.clientId)})),
                ...needsFollowUp.slice(0,3).map(c=>({text:`${c.name}: ${daysAgo(c.lastContact||today())}d no contact`,color:C.amber,client:c})),
              ].slice(0,5).map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:S[2],padding:`${S[3]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:a.color,flexShrink:0}}/>
                  <span style={{fontSize:F.xs,color:C.textSec,flex:1,lineHeight:1.5}}>{a.text}</span>
                  {a.client&&<button onClick={()=>onAI(a.client)}
                    style={{fontSize:F.xs,fontWeight:F.bold,padding:"3px 9px",borderRadius:R.full,
                      background:"rgba(129,140,248,0.15)",color:C.brand,border:`1px solid rgba(129,140,248,0.3)`,
                      cursor:"pointer",fontFamily:F.family,whiteSpace:"nowrap"}}>AI ✨</button>}
                </div>
              ))}
            </Card>
          )}
          <Card style={{flex:1}}>
            <div style={{padding:`${S[3]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`,fontWeight:F.bold,fontSize:F.base,color:C.textPrimary}}>Recent activity</div>
            {activity.length===0?(
              <div style={{padding:`${S[6]}px`,textAlign:"center",fontSize:F.xs,color:C.textMuted}}>
                No activity yet. Add clients to get started.
              </div>
            ):activity.slice(0,6).map((item,i)=>(
              <div key={item.id} style={{display:"flex",gap:S[3],padding:`${S[3]}px ${S[4]}px`,borderBottom:i<5?`1px solid ${C.glassBorder}`:"none",alignItems:"flex-start"}}>
                <span style={{fontSize:14,flexShrink:0}}>{item.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:F.xs,color:C.textSec,lineHeight:1.5}}>{item.text}</div>
                  <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{item.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ClientsPage({clients,act,onAI,derived,onUpgrade}){
  const[selected,setSelected]=useState(null);
  const[editing,setEditing]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const[search,setSearch]=useState("");
  const[sf,setSf]=useState("all");

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return clients.filter(c=>{
      const mQ=!q||["name","company","project","email"].some(k=>String(c[k]||"").toLowerCase().includes(q));
      const mS=sf==="all"||c.status===sf;
      return mQ&&mS;
    });
  },[clients,search,sf]);

  const handleAdd=()=>{ if(!derived.canAddClient){onUpgrade();return;} setShowAdd(true); };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"flex",gap:S[3],alignItems:"center",flexWrap:"wrap"}}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, company, project…"/>
        <div style={{display:"flex",gap:S[2],flexWrap:"wrap"}}>
          {["all","active","overdue","prospect","completed"].map(s=>(
            <FTab key={s} label={s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)} active={sf===s} onClick={()=>setSf(s)}/>
          ))}
        </div>
        <Btn onClick={handleAdd} variant="primary">
          {derived.canAddClient?"+ Add client":"🔒 Upgrade to add more"}
        </Btn>
      </div>

      {!derived.canAddClient&&(
        <div style={{...glass(0.06,12),borderRadius:R.lg,padding:`${S[3]}px ${S[5]}px`,
          border:`1px solid rgba(251,191,36,0.3)`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:S[4]}}>
          <div style={{fontSize:F.sm,color:C.amber}}>
            ⚠️ You've reached the <strong>3-client limit</strong> on the Free plan.
          </div>
          <Btn onClick={onUpgrade} variant="amber" size="sm">Upgrade to Pro</Btn>
        </div>
      )}

      {filtered.length===0?(
        <Empty icon="👥" title="No clients yet"
          body="Add your first client to start tracking projects, payments, and follow-ups."
          action={<Btn onClick={handleAdd} variant="primary">+ Add client</Btn>}/>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:S[4]}}>
          {filtered.map(c=><ClientCard key={c.id} client={c} onSelect={setSelected} onAI={onAI}/>)}
        </div>
      )}

      {selected&&!editing&&(
        <ClientDetail client={selected} onClose={()=>setSelected(null)}
          onEdit={c=>{setEditing(c);setSelected(null);}}
          onDelete={id=>{act.deleteClient(id);setSelected(null);}}
          onAI={onAI} onMarkContacted={act.markContacted}/>
      )}
      {editing&&<Modal title="Edit client" onClose={()=>setEditing(null)}>
        <ClientForm initial={editing} onSave={act.updateClient} onClose={()=>setEditing(null)}/>
      </Modal>}
      {showAdd&&<Modal title="Add new client" onClose={()=>setShowAdd(false)}>
        <ClientForm onSave={act.addClient} onClose={()=>setShowAdd(false)}/>
      </Modal>}
    </div>
  );
}

function InvForm({clients,onSave,onClose}){
  const[f,setF]=useState({clientId:clients[0]?.id||"",desc:"",amount:"",due:"",status:"draft"});
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  const client=clients.find(c=>c.id==f.clientId);
  const valid=!!f.amount&&!!f.clientId;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
      <Sel label="Client" value={f.clientId} onChange={set("clientId")}>
        {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
      </Sel>
      <Inp label="Description" value={f.desc} onChange={set("desc")} placeholder="Website design – Phase 1"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
        <Inp label="Amount ($)" value={f.amount} onChange={set("amount")} type="number" placeholder="2500" required/>
        <Inp label="Due date"   value={f.due}    onChange={set("due")}    type="date"/>
      </div>
      <Sel label="Status" value={f.status} onChange={set("status")}>
        <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option>
      </Sel>
      <div style={{display:"flex",gap:S[3]}}>
        <Btn onClick={onClose} variant="secondary" fullWidth>Cancel</Btn>
        <Btn onClick={()=>{if(!valid)return;onSave({clientId:f.clientId,client:client?.name,amount:Number(f.amount),desc:f.desc,due:f.due,status:f.status});onClose();}}
          variant="primary" fullWidth disabled={!valid}>Create invoice</Btn>
      </div>
    </div>
  );
}

function InvoicesPage({invoices,clients,act,derived,onUpgrade}){
  const[filter,setFilter]=useState("all");
  const[showAdd,setShowAdd]=useState(false);
  const filtered=invoices.filter(i=>filter==="all"||i.status===filter);
  const tot=s=>invoices.filter(i=>s==="all"||i.status===s).reduce((x,i)=>x+i.amount,0);
  const canAdd=invoices.length<derived.cfg.limits.invoices;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:S[4]}}>
        <StatCard label="Total invoiced" value={fmt$(tot("all"))}     icon="📄"/>
        <StatCard label="Paid"           value={fmt$(tot("paid"))}    color={C.green} icon="✅"/>
        <StatCard label="Outstanding"    value={fmt$(tot("sent"))}    color={C.amber} icon="⏳"/>
        <StatCard label="Overdue"        value={fmt$(tot("overdue"))} color={C.red}   icon="🚨"/>
      </div>
      <div style={{display:"flex",gap:S[3],alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:S[2],flexWrap:"wrap"}}>
          {["all","sent","paid","overdue","draft"].map(s=>(
            <FTab key={s} label={s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)} active={filter===s} onClick={()=>setFilter(s)}/>
          ))}
        </div>
        <div style={{flex:1}}/>
        {clients.length===0
          ?<span style={{fontSize:F.xs,color:C.textMuted}}>Add a client first</span>
          :<Btn onClick={()=>{if(!canAdd){onUpgrade();return;}setShowAdd(true);}} variant="primary">
            {canAdd?"+ New invoice":"🔒 Upgrade"}
          </Btn>
        }
      </div>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"90px 1fr 1.5fr 90px 100px 130px",gap:S[3],
          padding:`${S[3]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,background:"rgba(255,255,255,0.03)"}}>
          {["Invoice","Client","Description","Amount","Due","Status"].map(h=>(
            <div key={h} style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</div>
          ))}
        </div>
        {filtered.length===0
          ?<Empty icon="📄" title="No invoices yet" body={clients.length===0?"Add a client first, then create invoices.":"Click '+ New invoice' to create your first."}/>
          :filtered.map((inv,i)=>{
            const cfg=INVOICE_STATUS[inv.status]||INVOICE_STATUS.draft;
            return(
              <div key={inv.id} style={{display:"grid",gridTemplateColumns:"90px 1fr 1.5fr 90px 100px 130px",
                gap:S[3],padding:`${S[4]}px ${S[5]}px`,borderBottom:i<filtered.length-1?`1px solid ${C.glassBorder}`:"none",
                alignItems:"center",transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:F.sm,fontWeight:F.bold,color:C.brand,fontFamily:F.mono}}>{inv.id}</div>
                <div style={{fontSize:F.base,fontWeight:F.medium,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.client}</div>
                <div style={{fontSize:F.xs,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.desc}</div>
                <div style={{fontSize:F.base,fontWeight:F.bold,color:C.textPrimary}}>{fmt$(inv.amount)}</div>
                <div style={{fontSize:F.xs,color:inv.status==="overdue"?C.red:C.textSec,fontWeight:inv.status==="overdue"?F.bold:F.regular}}>{inv.due||"—"}</div>
                <div style={{display:"flex",gap:S[2],alignItems:"center"}}>
                  <Badge label={cfg.label} color={cfg.color} bg={cfg.bg}/>
                  {inv.status!=="paid"&&(
                    <button onClick={()=>act.markPaid(inv.id)}
                      style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",
                        borderRadius:R.sm,padding:"3px 8px",cursor:"pointer",fontSize:F.xs,
                        color:C.green,fontWeight:F.bold,fontFamily:F.family,transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.25)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(52,211,153,0.15)";}}>
                      ✓ Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </Card>
      {showAdd&&<Modal title="Create invoice" onClose={()=>setShowAdd(false)}>
        <InvForm clients={clients} onSave={act.addInvoice} onClose={()=>setShowAdd(false)}/>
      </Modal>}
    </div>
  );
}

function TaskForm({clients,onSave,onClose}){
  const[f,setF]=useState({clientId:clients[0]?.id||"",text:"",due:"",priority:"medium"});
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  const client=clients.find(c=>c.id==f.clientId);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
      <Sel label="Client" value={f.clientId} onChange={set("clientId")}>
        {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
      </Sel>
      <Inp label="Task description" value={f.text} onChange={set("text")} placeholder="Send revised proposal…" required/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
        <Inp label="Due date" value={f.due} onChange={set("due")} type="date"/>
        <Sel label="Priority" value={f.priority} onChange={set("priority")}>
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </Sel>
      </div>
      <div style={{display:"flex",gap:S[3]}}>
        <Btn onClick={onClose} variant="secondary" fullWidth>Cancel</Btn>
        <Btn onClick={()=>{if(!f.text.trim())return;onSave({clientId:f.clientId,client:client?.name,text:f.text,due:f.due,priority:f.priority});onClose();}}
          variant="primary" fullWidth disabled={!f.text.trim()}>Add task</Btn>
      </div>
    </div>
  );
}

function TasksPage({tasks,clients,act}){
  const[filter,setFilter]=useState("open");
  const[showAdd,setShowAdd]=useState(false);
  const filtered=tasks
    .filter(t=>filter==="all"?true:filter==="open"?!t.done:t.done)
    .sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;const o={high:0,medium:1,low:2};return(o[a.priority]??1)-(o[b.priority]??1);});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:S[4]}}>
        <StatCard label="Open"          value={tasks.filter(t=>!t.done).length}                          color={C.brand} icon="📋"/>
        <StatCard label="High priority" value={tasks.filter(t=>!t.done&&t.priority==="high").length}     color={C.red}   icon="🔥"/>
        <StatCard label="Completed"     value={tasks.filter(t=>t.done).length}                           color={C.green} icon="✅"/>
      </div>
      <div style={{display:"flex",gap:S[3],alignItems:"center"}}>
        <div style={{display:"flex",gap:S[2]}}>
          {[["open","Open"],["done","Done"],["all","All"]].map(([v,l])=>(
            <FTab key={v} label={l} active={filter===v} onClick={()=>setFilter(v)}/>
          ))}
        </div>
        <div style={{flex:1}}/>
        <Btn onClick={()=>setShowAdd(true)} variant="primary">+ Add task</Btn>
      </div>
      <Card>
        {filtered.length===0
          ?<Empty icon="✅" title="No tasks here" body="Add tasks to stay on top of your client work." action={<Btn onClick={()=>setShowAdd(true)} variant="primary">Add task</Btn>}/>
          :filtered.map((t,i)=>{
            const p=PRIORITY[t.priority]||PRIORITY.medium;
            const overdue=t.due&&!t.done&&new Date(t.due)<new Date();
            return(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[4]}px ${S[5]}px`,
                borderBottom:i<filtered.length-1?`1px solid ${C.glassBorder}`:"none",opacity:t.done?0.45:1,transition:"opacity 0.2s"}}>
                <input type="checkbox" checked={t.done} onChange={()=>act.toggleTask(t.id)}
                  style={{width:16,height:16,cursor:"pointer",accentColor:C.brand,flexShrink:0}}/>
                <span style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,boxShadow:`0 0 6px ${p.color}88`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:F.base,color:C.textPrimary,fontWeight:F.medium,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
                  <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>
                    {t.client}{t.due&&<span style={{color:overdue?C.red:C.textMuted}}> · Due {t.due}</span>}
                  </div>
                </div>
                <span style={{fontSize:F.xs,fontWeight:F.semibold,color:p.color,background:`${p.color}15`,
                  padding:"2px 8px",borderRadius:R.full,border:`1px solid ${p.color}30`,whiteSpace:"nowrap"}}>{p.label}</span>
                <button onClick={()=>act.deleteTask(t.id)}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"rgba(255,255,255,0.2)",padding:S[1],lineHeight:1,transition:"color 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.red;}}
                  onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.2)";}}>🗑</button>
              </div>
            );
          })}
      </Card>
      {showAdd&&<Modal title="Add task" onClose={()=>setShowAdd(false)}>
        <TaskForm clients={clients} onSave={act.addTask} onClose={()=>setShowAdd(false)}/>
      </Modal>}
    </div>
  );
}

function PipelinePage({clients,onAI,plan,onUpgrade}){
  if(!hasPlan(plan,"pro")){
    return <PlanGate currentPlan={plan} requiredPlan="pro" featureName="Pipeline Board" onUpgrade={onUpgrade}><div/></PlanGate>;
  }
  const STAGES=[
    {id:"prospect",label:"Prospect",color:C.amber},
    {id:"active",  label:"Active",  color:C.brand},
    {id:"overdue", label:"Overdue", color:C.red},
    {id:"completed",label:"Done",   color:C.green},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:S[4]}}>
        {STAGES.map(st=>{
          const sc=clients.filter(c=>c.status===st.id);
          return(
            <Card key={st.id} style={{padding:`${S[4]}px ${S[5]}px`,borderTop:`3px solid ${st.color}`}}>
              <div style={{fontSize:F.xs,color:C.textSec,marginBottom:S[2]}}>{st.label}</div>
              <div style={{fontSize:F.xxl,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.02em",textShadow:`0 0 20px ${st.color}55`}}>
                {fmt$(sc.reduce((s,c)=>s+c.value,0))}
              </div>
              <div style={{fontSize:F.xs,color:C.textMuted,marginTop:S[1]}}>{sc.length} client{sc.length!==1?"s":""}</div>
            </Card>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:S[4],alignItems:"start"}}>
        {STAGES.map(st=>{
          const sc=clients.filter(c=>c.status===st.id);
          return(
            <div key={st.id}>
              <div style={{display:"flex",alignItems:"center",gap:S[2],marginBottom:S[3]}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:st.color,boxShadow:`0 0 8px ${st.color}`}}/>
                <span style={{fontSize:F.sm,fontWeight:F.bold,color:C.textPrimary}}>{st.label}</span>
                <span style={{fontSize:10,fontWeight:F.bold,background:`${st.color}18`,color:st.color,
                  borderRadius:R.full,padding:"1px 7px",border:`1px solid ${st.color}30`}}>{sc.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
                {sc.length===0?(
                  <div style={{...glass(0.04,8),borderRadius:R.lg,border:`1px dashed ${C.glassBorder}`,
                    padding:`${S[6]}px ${S[4]}px`,textAlign:"center",fontSize:F.xs,color:C.textMuted}}>No clients here</div>
                ):sc.map(c=>{
                  const p=pctPaid(c.paid,c.value);
                  return(
                    <Card key={c.id} style={{padding:`${S[3]}px ${S[4]}px`,display:"flex",flexDirection:"column",gap:S[2]}}>
                      <div style={{display:"flex",alignItems:"center",gap:S[2]}}>
                        <Avt name={c.name} idx={c.avatarIdx||0} size={30}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                          <div style={{fontSize:F.xs,color:C.textMuted}}>{c.company}</div>
                        </div>
                      </div>
                      <div style={{fontSize:F.xs,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📁 {c.project}</div>
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
                          <span style={{fontSize:9,color:C.textMuted}}>{p}%</span>
                          <span style={{fontSize:F.xs,fontWeight:F.bold,color:C.textPrimary}}>{fmt$(c.value)}</span>
                        </div>
                        <Progress pct={p}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:10,color:C.textMuted}}>{c.stage||"—"}</span>
                        <button onClick={()=>onAI(c)}
                          style={{fontSize:10,fontWeight:F.bold,padding:"2px 8px",borderRadius:R.full,
                            background:"rgba(129,140,248,0.15)",color:C.brand,border:`1px solid rgba(129,140,248,0.3)`,
                            cursor:"pointer",fontFamily:F.family}}>✨ AI</button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PHASES=[
  {emoji:"🎯",title:"Week 1–2: Validate & Set Up",color:C.brand,steps:[
    {icon:"1",head:"Deploy your stack (zero upfront cost)",body:"Push to Vercel (free, 3 minutes). Register a domain on Namecheap (~$10/yr). Set up Lemon Squeezy for subscriptions — zero monthly fee, only 5% per transaction. Total Day 1 cost: ~$10."},
    {icon:"2",head:"Define your ICP precisely",body:"Solo freelancers (designers, devs, copywriters) with 5–15 active clients, earning $3K–$15K/month, tracking everything in Notion or spreadsheets. Find them on Twitter/X, Reddit (r/freelance, r/webdev), and LinkedIn."},
    {icon:"3",head:"Post in 5 communities for 50 beta users",body:"Post in r/freelance, r/webdev, r/graphic_design: 'I built a free AI CRM for freelancers — looking for 50 beta testers.' Ask for feedback, not sales. Aim for 50 signups in Week 1."},
    {icon:"4",head:"DM 30 freelancers on LinkedIn",body:"Search 'freelance designer' or 'freelance developer'. Message: 'Hey [Name] — I built a CRM with AI email drafting. Would you try it free and give me 10 min of feedback?'"},
  ]},
  {emoji:"💰",title:"Week 3–4: First Revenue",color:C.green,steps:[
    {icon:"5",head:"Convert beta → paid with urgency",body:"Email beta users Day 7: 'The beta closes Friday. Lock in 50% off Pro forever as a founding member.' Expect 10–20% conversion = $200–$500 MRR immediately."},
    {icon:"6",head:"Connect Lemon Squeezy",body:"Replace the demo checkout URLs in PLANS config with your real Lemon Squeezy variant IDs. This makes payments go directly to your bank account via Stripe (which Lemon Squeezy uses under the hood)."},
    {icon:"7",head:"Launch on Product Hunt (Thursday)",body:"Schedule for Thursday 12:01 AM PST. Prepare a 60-sec GIF, 5 screenshots, sharp tagline. Brief beta users to upvote. Top 5 = 500–2,000 signups in 24 hours."},
    {icon:"8",head:"Start a daily Twitter/X content flywheel",body:"Post every weekday: client tips, invoice templates, follow-up scripts, MRR updates (#BuildInPublic). 500 followers → 50 warm leads/month."},
  ]},
  {emoji:"📈",title:"Month 2–3: Scale to $5K MRR",color:C.purple,steps:[
    {icon:"9",head:"Add Supabase for real persistence",body:"Replace localStorage auth with Supabase. This makes data persist server-side, enables real multi-device sync, and lets you add team features. Free tier handles 50K monthly active users."},
    {icon:"10",head:"Launch a referral program",body:"In-app: 'Give 1 month free — get 1 month free.' Use ReferralHero ($49/mo). Each user brings 1.2 more on average. This is the highest-ROI growth channel at this stage."},
    {icon:"11",head:"YouTube Shorts / TikTok tutorials",body:"'How I follow up with 20 clients in 10 minutes using AI' — 3-min screen share. Freelancer content gets 5K–100K views organically."},
    {icon:"12",head:"Partner with freelance educators",body:"Find 5 coaches on YouTube/Twitter with 10K+ followers. Offer 30% recurring commission via Lemon Squeezy affiliates. One partner can bring 50–200 paid users."},
  ]},
  {emoji:"🚀",title:"Month 4–6: $10K+ MRR",color:C.amber,steps:[
    {icon:"★",head:"SEO content machine",body:"20 posts targeting 'crm for freelancers', 'freelance invoice template', 'client management software'. Each brings 50–500 monthly visitors. Compounds into your largest traffic source by month 6."},
    {icon:"★",head:"Move upmarket: agency plan",body:"Agencies manage 20–100 clients and pay $149–$299/mo. Add shared workspace, role permissions, team AI credits, client portal. One agency = 5–8× solo user revenue."},
    {icon:"★",head:"AppSumo marketplace deal",body:"Apply at appsumo.com/sell. 300 sales = $6K–$12K in one week + 300 vocal advocates. Fastest path to $10K MRR."},
    {icon:"★",head:"Hire a part-time support person",body:"At $5K+ MRR you can afford $500–$800/mo for async support. This frees you to build features instead of answering the same questions. Use Crisp.chat or Intercom."},
  ]},
];

function LaunchGuidePage(){
  const[open,setOpen]=useState(0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[6]}}>
      <div style={{background:`linear-gradient(135deg,rgba(15,10,40,0.9),rgba(30,15,70,0.85))`,
        backdropFilter:"blur(20px)",borderRadius:R.xxl,padding:S[8],color:C.textPrimary,
        border:`1px solid ${C.glassBorder}`,boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
        <div style={{fontSize:F.xs,fontWeight:F.bold,textTransform:"uppercase",letterSpacing:"0.1em",color:C.textMuted,marginBottom:S[3]}}>Your step-by-step playbook</div>
        <div style={{fontSize:36,fontWeight:F.black,letterSpacing:"-0.03em",lineHeight:1.05,marginBottom:S[4],textShadow:`0 0 40px ${C.brandGlow}`}}>
          From $0 to $10K MRR<br/>in 6 months.
        </div>
        <div style={{fontSize:F.base,color:C.textSec,lineHeight:1.7,maxWidth:560}}>
          Realistic, no-fluff launch roadmap built specifically for ClientPulse.{" "}
          <strong style={{color:C.brand}}>Get 10 paying customers before you think about scaling.</strong>
        </div>
      </div>

      {PHASES.map((phase,pi)=>(
        <Card key={pi} style={{overflow:"hidden"}}>
          <button onClick={()=>setOpen(open===pi?-1:pi)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:S[4],
              padding:`${S[4]}px ${S[6]}px`,background:"none",border:"none",cursor:"pointer",fontFamily:F.family,textAlign:"left"}}>
            <span style={{fontSize:22}}>{phase.emoji}</span>
            <div style={{flex:1,fontSize:F.md,fontWeight:F.bold,color:C.textPrimary}}>{phase.title}</div>
            <div style={{width:28,height:28,borderRadius:"50%",background:`${phase.color}18`,color:phase.color,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:F.md,fontWeight:F.bold,
              flexShrink:0,border:`1px solid ${phase.color}30`}}>
              {open===pi?"−":"+"}
            </div>
          </button>
          {open===pi&&(
            <div style={{borderTop:`1px solid ${C.glassBorder}`,padding:`${S[5]}px ${S[6]}px`,display:"flex",flexDirection:"column",gap:S[5]}}>
              {phase.steps.map((step,si)=>(
                <div key={si} style={{display:"flex",gap:S[4]}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:`${phase.color}15`,color:phase.color,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:F.sm,fontWeight:F.black,
                    flexShrink:0,marginTop:2,border:`1px solid ${phase.color}30`}}>{step.icon}</div>
                  <div>
                    <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[1]}}>{step.head}</div>
                    <div style={{fontSize:F.base,color:C.textSec,lineHeight:1.7}}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════
function AppRoot({auth,onLogout}){
  const{s,act,derived}=useStore(auth.id,auth.plan);
  const{page,aiClient,pricing}=s.ui;
  const{clients,invoices,tasks,activity}=s;
  const totalAlerts=derived.badges.overdueClients+derived.badges.overdueInvoices;
  const upgrade=()=>act.setPricing(true);
  const logout=()=>{saveAuth(null);onLogout();};

  const handleSimulatePlan=(plan)=>{
    act.setPlan(plan);
    const users=loadUsers();
    if(users[auth.email]){users[auth.email].plan=plan;saveUsers(users);}
    // In production: only set plan after verifying Lemon Squeezy webhook
  };

  return(
    <div style={{display:"flex",minHeight:"100vh",
      background:"linear-gradient(135deg,#05031e 0%,#0d0826 40%,#0a1628 100%)",
      fontFamily:F.family,position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:-200,left:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-300,right:-100,width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,132,252,0.08) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"40%",right:"20%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,0.05) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,display:"flex",width:"100%"}}>
        <Sidebar page={page} onNav={act.setPage} badges={derived.badges}
          plan={s.plan} onUpgrade={upgrade} onLogout={logout}
          userName={auth.name||auth.email}/>

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <Topbar page={page} alerts={totalAlerts} plan={s.plan} onUpgrade={upgrade}/>
          <main style={{flex:1,overflowY:"auto",padding:S[6]}}>
            {page==="dashboard"&&<DashboardPage clients={clients} invoices={invoices} tasks={tasks} activity={activity} derived={derived} onAI={act.setAI} onUpgrade={upgrade} onAddClient={()=>act.setPage("clients")}/>}
            {page==="clients"  &&<ClientsPage   clients={clients} act={act} onAI={act.setAI} derived={derived} onUpgrade={upgrade}/>}
            {page==="invoices" &&<InvoicesPage  invoices={invoices} clients={clients} act={act} derived={derived} onUpgrade={upgrade}/>}
            {page==="tasks"    &&<TasksPage     tasks={tasks} clients={clients} act={act}/>}
            {page==="pipeline" &&<PipelinePage  clients={clients} onAI={act.setAI} plan={s.plan} onUpgrade={upgrade}/>}
            {page==="launch"   &&<LaunchGuidePage/>}
          </main>
        </div>
      </div>

      {aiClient&&(
        <AIPanel client={aiClient} onClose={()=>act.setAI(null)}
          canUseAI={derived.canUseAI} aiLeft={derived.aiLeft}
          onUpgrade={()=>{act.setAI(null);upgrade();}}
          onUsed={act.aiUsed}/>
      )}

      {pricing&&(
        <PricingModal currentPlan={s.plan} onClose={()=>act.setPricing(false)} onSimulate={handleSimulatePlan}/>
      )}
    </div>
  );
}

export default function ClientPulse(){
  const[auth,setAuth]=useState(()=>loadAuth());
  if(!auth) return <AuthScreen onAuth={setAuth}/>;
  return <AppRoot auth={auth} onLogout={()=>setAuth(null)}/>;
}
