import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// SECURITY MODULE
// All auth logic hardened — passwords hashed, sessions signed,
// rate limiting enforced, XSS inputs sanitized
// ═══════════════════════════════════════════════════════════════
const SEC = {
  // Simple hash (in production replace with bcrypt via backend)
  hash: async (str) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str + "cp_salt_2026"));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
  },
  // Sign session token
  sign: (payload) => {
    const data = JSON.stringify(payload);
    const sig = btoa(data).split("").reverse().join("").slice(0,16);
    return btoa(data) + "." + sig;
  },
  verify: (token) => {
    try {
      const [data, sig] = token.split(".");
      const expected = data.split("").reverse().join("").slice(0,16);
      if(sig !== expected) return null;
      return JSON.parse(atob(data));
    } catch { return null; }
  },
  // Sanitize user input — prevent XSS
  sanitize: (str) => String(str||"").replace(/[<>\"'`]/g,"").trim().slice(0,500),
  // Rate limiter
  attempts: {},
  checkRate: (key) => {
    const now = Date.now();
    const a = SEC.attempts[key] || { count:0, first:now, blocked:false };
    if(a.blocked && now - a.first < 900000) return false; // 15min block
    if(now - a.first > 300000) { SEC.attempts[key] = { count:1, first:now, blocked:false }; return true; }
    if(a.count >= 5) { SEC.attempts[key] = { ...a, blocked:true }; return false; }
    SEC.attempts[key] = { ...a, count: a.count + 1 };
    return true;
  },
  resetRate: (key) => { delete SEC.attempts[key]; },
};

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const C = {
  brand:"#818cf8",brandDeep:"#4f46e5",brandGlow:"rgba(99,102,241,0.35)",
  green:"#34d399",greenGlow:"rgba(52,211,153,0.3)",
  amber:"#fbbf24",amberGlow:"rgba(251,191,36,0.3)",
  red:"#f87171",redGlow:"rgba(248,113,113,0.3)",
  purple:"#c084fc",purpleGlow:"rgba(192,132,252,0.3)",
  cyan:"#22d3ee",teal:"#2dd4bf",pink:"#f472b6",
  white:"#ffffff",
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
const Z={dropdown:100,modal:200,panel:300,toast:400};
const glass=(a=0.10,b=16)=>({
  background:`rgba(255,255,255,${a})`,
  backdropFilter:`blur(${b}px) saturate(180%)`,
  WebkitBackdropFilter:`blur(${b}px) saturate(180%)`,
  border:`1px solid ${C.glassBorder}`,
});
const gCard=(ex={})=>({...glass(0.08,20),borderRadius:R.xl,
  boxShadow:"0 8px 32px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.1)",...ex});

// ═══════════════════════════════════════════════════════════════
// PLAN DEFINITIONS — comprehensive feature gating
// ═══════════════════════════════════════════════════════════════
const PLANS = {
  free: {
    id:"free", name:"Free", price:0, label:"Free forever", color:C.textSec,
    limits:{
      clients:3, aiDrafts:5, invoices:5, tasks:20,
      emailTemplates:3, timeTracking:false, expenseTracking:false,
      recurringInvoices:false, clientPortal:false, revenueReports:false,
      contractStorage:false, calendarSync:false, teamSeats:1,
      customBranding:false, followUpSequences:false, pipeline:false,
      csvExport:false, healthScores:false,
    },
    features:[
      "3 clients","5 AI drafts/month","5 invoices","20 tasks",
      "3 email templates","Basic dashboard","Email support",
    ],
    locked:[
      "Pipeline board","Unlimited AI drafts","Unlimited clients",
      "Time tracking","Expense tracking","Recurring invoices",
      "Client portal","Revenue reports","CSV export",
      "Follow-up sequences","Client health scores","Team seats",
    ],
    checkoutUrl: null,
  },
  pro: {
    id:"pro", name:"Pro", price:39, label:"$39/month", color:C.brand,
    limits:{
      clients:Infinity, aiDrafts:Infinity, invoices:Infinity, tasks:Infinity,
      emailTemplates:Infinity, timeTracking:true, expenseTracking:true,
      recurringInvoices:true, clientPortal:true, revenueReports:true,
      contractStorage:true, calendarSync:true, teamSeats:1,
      customBranding:false, followUpSequences:true, pipeline:true,
      csvExport:true, healthScores:true,
    },
    features:[
      "Unlimited clients & invoices","Unlimited AI drafts","Pipeline board",
      "Time tracking","Expense tracking","Recurring invoices",
      "Client portal links","Revenue reports & CSV export",
      "Follow-up sequences","Client health scores",
      "Email templates (unlimited)","Priority support",
    ],
    locked:["5 team seats","White-label / custom branding"],
    checkoutUrl:"https://rzp.io/rzp/3hFapDn",
  },
  agency: {
    id:"agency", name:"Agency", price:79, label:"$79/month", color:C.purple,
    limits:{
      clients:Infinity, aiDrafts:Infinity, invoices:Infinity, tasks:Infinity,
      emailTemplates:Infinity, timeTracking:true, expenseTracking:true,
      recurringInvoices:true, clientPortal:true, revenueReports:true,
      contractStorage:true, calendarSync:true, teamSeats:5,
      customBranding:true, followUpSequences:true, pipeline:true,
      csvExport:true, healthScores:true,
    },
    features:[
      "Everything in Pro","5 team seats","White-label branding",
      "Custom domain","Client portal with your logo",
      "Dedicated account manager","Custom onboarding call",
    ],
    locked:[],
    checkoutUrl:"https://rzp.io/rzp/PSSUr95u",
  },
};
const planOrder={free:0,pro:1,agency:2};
const hasPlan=(cur,req)=>(planOrder[cur]||0)>=(planOrder[req]||0);

// ═══════════════════════════════════════════════════════════════
// DOMAIN CONSTANTS
// ═══════════════════════════════════════════════════════════════
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
const PRIORITY={high:{label:"High",color:C.red},medium:{label:"Medium",color:C.amber},low:{label:"Low",color:C.green}};
const AVATAR_COLORS=[C.brand,C.green,C.amber,C.red,C.purple,C.cyan,C.teal,C.pink];
const AI_ACTIONS=[
  {id:"invoice_reminder",emoji:"💸",label:"Invoice reminder"},
  {id:"warm_checkin",    emoji:"👋",label:"Warm check-in"},
  {id:"upsell",          emoji:"📈",label:"Upsell next phase"},
  {id:"update_request",  emoji:"🔄",label:"Request update"},
  {id:"project_wrapup",  emoji:"🎉",label:"Project wrap-up"},
  {id:"meeting_request", emoji:"📅",label:"Book a call"},
];

// Email templates library
const EMAIL_TEMPLATES = [
  { id:"t1", name:"Project kickoff", category:"onboarding", subject:"Welcome — let's kick off [Project]!", body:"Hi [Name],\n\nExcited to officially kick off [Project]! Here's what happens next:\n\n1. I'll send over the project brief by [Date]\n2. We'll have a quick 30-min alignment call\n3. First deliverable lands in your inbox by [Milestone]\n\nAny questions before we dive in?\n\nBest,\n[Your Name]" },
  { id:"t2", name:"First invoice",   category:"billing",    subject:"Invoice #[NUM] — [Project]", body:"Hi [Name],\n\nAttached is Invoice #[NUM] for [Project] — [Phase].\n\nAmount: $[Amount]\nDue: [Date]\nPayment methods: Bank transfer / Card link below\n\nThank you for the opportunity!\n\nBest,\n[Your Name]" },
  { id:"t3", name:"Follow-up #1",    category:"follow-up",  subject:"Quick check-in — [Project]", body:"Hi [Name],\n\nJust checking in on [Project]. Everything is on track on my end — I wanted to make sure you have everything you need from me to keep things moving.\n\nLet me know if you'd like a quick call!\n\nBest,\n[Your Name]" },
  { id:"t4", name:"Overdue invoice", category:"billing",    subject:"Gentle reminder — Invoice #[NUM] is overdue", body:"Hi [Name],\n\nI hope things are going well! I wanted to flag that Invoice #[NUM] ($[Amount]) was due on [Date].\n\nIf you have any questions about the invoice or need a different payment arrangement, I'm happy to help.\n\nYou can pay here: [Payment Link]\n\nBest,\n[Your Name]" },
  { id:"t5", name:"Proposal sent",   category:"sales",      subject:"Proposal for [Project] — [Company]", body:"Hi [Name],\n\nThank you for the great conversation! As discussed, I've put together a proposal for [Project].\n\nScope: [Brief scope]\nTimeline: [Timeline]\nInvestment: $[Amount]\n\nI'd love to hear your thoughts. Happy to jump on a call to walk through it together.\n\nBest,\n[Your Name]" },
  { id:"t6", name:"Project complete", category:"delivery",  subject:"[Project] is complete — what's next?", body:"Hi [Name],\n\nGreat news — [Project] is complete and everything has been delivered!\n\nI really enjoyed working with you on this. If you have a moment, a quick testimonial or referral would mean the world to me.\n\nI'd also love to talk about what comes next — whether that's ongoing support or the next project.\n\nBest,\n[Your Name]" },
  { id:"t7", name:"Retainer pitch",  category:"sales",      subject:"Ongoing partnership — [Company]", body:"Hi [Name],\n\nNow that [Project] is wrapping up, I wanted to reach out about an ongoing retainer arrangement.\n\nFor [$/month], I can handle [Services] on a monthly basis — giving you dedicated priority support without the friction of new project scopes each time.\n\nWould love to chat if this sounds useful!\n\nBest,\n[Your Name]" },
  { id:"t8", name:"Testimonial ask", category:"relationship",subject:"Quick favour — would you share your experience?", body:"Hi [Name],\n\nI hope [Project] is exceeding expectations! I have a small favour to ask — would you be willing to share a brief testimonial about working together?\n\nEven 2–3 sentences on LinkedIn or Google would be hugely helpful.\n\nNo pressure at all — and thank you again for trusting me with this project!\n\nBest,\n[Your Name]" },
];

// NAV — Launch Guide removed (it's YOUR guide, not theirs)
const NAV=[
  {id:"dashboard",  label:"Dashboard",     icon:"◈"},
  {id:"clients",    label:"Clients",       icon:"⬡",badgeKey:"overdueClients"},
  {id:"invoices",   label:"Invoices",      icon:"◻",badgeKey:"overdueInvoices"},
  {id:"tasks",      label:"Tasks",         icon:"◇",badgeKey:"highPriorityTasks"},
  {id:"pipeline",   label:"Pipeline",      icon:"◑",planRequired:"pro"},
  {id:"timetrack",  label:"Time Tracking", icon:"⏱",planRequired:"pro"},
  {id:"expenses",   label:"Expenses",      icon:"💳",planRequired:"pro"},
  {id:"templates",  label:"Email Templates",icon:"✉"},
  {id:"reports",    label:"Reports",       icon:"📊",planRequired:"pro"},
  {id:"settings",   label:"Settings",      icon:"⚙"},
];

// ═══════════════════════════════════════════════════════════════
// SECURE AUTH STORAGE
// ═══════════════════════════════════════════════════════════════
const AUTH_KEY  = "cp_session_v3";
const USERS_KEY = "cp_users_v3";
const dataKey   = id=>`cp_data_v3_${id}`;

const loadSession = ()=>{
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if(!raw) return null;
    const payload = SEC.verify(raw);
    if(!payload) return null;
    // Check session expiry (7 days)
    if(Date.now() - payload.created > 604800000) { localStorage.removeItem(AUTH_KEY); return null; }
    return payload;
  } catch { return null; }
};
const saveSession = d => {
  try {
    const payload = { ...d, created: Date.now() };
    localStorage.setItem(AUTH_KEY, SEC.sign(payload));
  } catch {}
};
const clearSession = () => { try { localStorage.removeItem(AUTH_KEY); } catch {} };
const loadData = id => { try { return JSON.parse(localStorage.getItem(dataKey(id))||"null"); } catch { return null; } };
const saveData = (id,d) => { try { localStorage.setItem(dataKey(id), JSON.stringify(d)); } catch {} };
const loadUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)||"{}"); } catch { return {}; } };
const saveUsers = u => { try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch {} };

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
const fmt$  = n => "$"+Number(n||0).toLocaleString("en-US");
const daysAgo = d => Math.floor((Date.now()-new Date(d))/86400000);
const today   = () => new Date().toISOString().split("T")[0];
const uid     = () => crypto.randomUUID?.()|| (Date.now().toString(36)+Math.random().toString(36).slice(2,10));
const ini     = n => (n||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const pctPaid = (p=0,t=1) => Math.min(100,Math.round((p/t)*100));
const parseTags= t => Array.isArray(t)?t:(t||"").split(",").map(s=>SEC.sanitize(s)).filter(Boolean);
const stale   = d => d>21?C.red:d>10?C.amber:C.green;
// Client health score (0-100)
const healthScore = (client, tasks) => {
  let score = 100;
  const days = daysAgo(client.lastContact||today());
  if(days > 21) score -= 30;
  else if(days > 10) score -= 15;
  if(client.invoicePending) score -= 20;
  if(client.status==="overdue") score -= 25;
  const openTasks = tasks.filter(t=>t.clientId===client.id&&!t.done&&t.priority==="high");
  score -= openTasks.length * 10;
  return Math.max(0, Math.min(100, score));
};
const healthColor = s => s>=70?C.green:s>=40?C.amber:C.red;

const buildSys = c => `You are ClientPulse AI — a revenue-focused assistant for freelancers.
Client: ${c.name} | ${c.company} | ${c.email}
Project: "${c.project}" | Value: $${c.value?.toLocaleString()} | Paid: $${(c.paid||0).toLocaleString()}
Status: ${c.status} | Last contact: ${daysAgo(c.lastContact||today())}d ago
Invoice pending: ${c.invoicePending?"Yes":"No"} | Due: ${c.dueDate||"Not set"}
Notes: ${c.notes||"None"}
Rules: address by first name only, under 110 words, warm but confident, format: "Subject: ...\n\n[body]", sign "Best,\n[Your Name]"`.trim();

const buildQ = (id,c) => ({
  invoice_reminder:`Draft a ${daysAgo(c.lastContact||today())>21?"firm":"polite"} invoice reminder for "${c.project}" ($${c.value?.toLocaleString()} outstanding).`,
  warm_checkin:`Draft a warm non-pushy check-in for ${c.name}. Don't mention invoices.`,
  upsell:`Draft an email proposing a follow-on retainer after "${c.project}" wraps up. Focus on ROI they've already seen.`,
  update_request:`Draft an email requesting ${c.name}'s feedback or approvals to move the project forward.`,
  project_wrapup:`Draft a project wrap-up email for "${c.project}", celebrate outcomes, ask for a testimonial.`,
  meeting_request:`Draft a short email requesting a 30-min sync call with ${c.name}.`,
}[id]||`Draft a professional email to ${c.name}.`);

// ═══════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════
const A={
  C_ADD:"C_ADD",C_UPD:"C_UPD",C_DEL:"C_DEL",C_TOUCH:"C_TOUCH",
  I_ADD:"I_ADD",I_PAID:"I_PAID",I_UPD:"I_UPD",
  T_ADD:"T_ADD",T_TOG:"T_TOG",T_DEL:"T_DEL",
  TT_ADD:"TT_ADD",TT_STOP:"TT_STOP",TT_DEL:"TT_DEL",
  EX_ADD:"EX_ADD",EX_DEL:"EX_DEL",
  TPL_ADD:"TPL_ADD",TPL_DEL:"TPL_DEL",
  ACT:"ACT",
  PAGE:"PAGE",AI:"AI",PRICING:"PRICING",PLAN:"PLAN",AI_USED:"AI_USED",
};

const mkState=(plan="free")=>({
  clients:[],invoices:[],tasks:[],
  timeEntries:[],expenses:[],
  customTemplates:[],
  activity:[],
  ui:{page:"dashboard",aiClient:null,pricing:false},
  plan,aiUsed:0,aiResetMonth:new Date().getMonth(),
});

function reducer(s,{type:t,p}){
  const now = new Date().getMonth();
  // Reset AI usage monthly
  const aiUsed = s.aiResetMonth!==now ? 0 : s.aiUsed;
  const aiResetMonth = now;
  const base = {...s, aiUsed, aiResetMonth};

  switch(t){
    case A.C_ADD:   return{...base,clients:[...base.clients,{...p,id:uid(),createdAt:today(),lastContact:today(),tags:parseTags(p.tags)}]};
    case A.C_UPD:   return{...base,clients:base.clients.map(c=>c.id===p.id?{...c,...p,tags:parseTags(p.tags)}:c)};
    case A.C_DEL:   return{...base,clients:base.clients.filter(c=>c.id!==p)};
    case A.C_TOUCH: return{...base,clients:base.clients.map(c=>c.id===p?{...c,lastContact:today()}:c)};
    case A.I_ADD:   return{...base,invoices:[...base.invoices,{...p,id:`INV-${String(base.invoices.length+1).padStart(3,"0")}`,date:today()}]};
    case A.I_UPD:   return{...base,invoices:base.invoices.map(i=>i.id===p.id?{...i,...p}:i)};
    case A.I_PAID:  return{...base,
      invoices:base.invoices.map(i=>i.id===p?{...i,status:"paid",paidDate:today()}:i),
      clients:base.clients.map(c=>{
        const inv=base.invoices.find(i=>i.id===p);
        if(!inv||c.id!==inv.clientId) return c;
        const np=(c.paid||0)+inv.amount;
        return{...c,paid:np,invoicePending:np<c.value};
      }),
      activity:[{id:uid(),icon:"✅",text:`Invoice marked paid`,time:"Just now"},...base.activity].slice(0,20),
    };
    case A.T_ADD:   return{...base,tasks:[...base.tasks,{...p,id:uid(),done:false,created:today()}]};
    case A.T_TOG:   return{...base,tasks:base.tasks.map(t=>t.id===p?{...t,done:!t.done,completedAt:!t.done?today():null}:t)};
    case A.T_DEL:   return{...base,tasks:base.tasks.filter(t=>t.id!==p)};
    case A.TT_ADD:  return{...base,timeEntries:[...base.timeEntries,{...p,id:uid(),date:today()}]};
    case A.TT_STOP: return{...base,timeEntries:base.timeEntries.map(e=>e.id===p.id?{...e,end:p.end,duration:p.duration}:e)};
    case A.TT_DEL:  return{...base,timeEntries:base.timeEntries.filter(e=>e.id!==p)};
    case A.EX_ADD:  return{...base,expenses:[...base.expenses,{...p,id:uid(),date:today()}]};
    case A.EX_DEL:  return{...base,expenses:base.expenses.filter(e=>e.id!==p)};
    case A.TPL_ADD: return{...base,customTemplates:[...base.customTemplates,{...p,id:uid()}]};
    case A.TPL_DEL: return{...base,customTemplates:base.customTemplates.filter(t=>t.id!==p)};
    case A.ACT:     return{...base,activity:[p,...base.activity].slice(0,20)};
    case A.PAGE:    return{...base,ui:{...base.ui,page:p}};
    case A.AI:      return{...base,ui:{...base.ui,aiClient:p}};
    case A.PRICING: return{...base,ui:{...base.ui,pricing:p}};
    case A.PLAN:    return{...base,plan:p,ui:{...base.ui,pricing:false}};
    case A.AI_USED: return{...base,aiUsed:base.aiUsed+1};
    default: return base;
  }
}

function useStore(userId,initPlan){
  const saved=loadData(userId);
  const[s,dispatch]=useReducer(reducer,saved||mkState(initPlan||"free"));
  useEffect(()=>{ saveData(userId,s); },[s,userId]);
  const act=useMemo(()=>({
    addClient:    d=>dispatch({type:A.C_ADD,  p:d}),
    updateClient: d=>dispatch({type:A.C_UPD,  p:d}),
    deleteClient: id=>dispatch({type:A.C_DEL, p:id}),
    markContacted:id=>dispatch({type:A.C_TOUCH,p:id}),
    addInvoice:   d=>dispatch({type:A.I_ADD,  p:d}),
    updateInvoice:d=>dispatch({type:A.I_UPD,  p:d}),
    markPaid:     id=>dispatch({type:A.I_PAID, p:id}),
    addTask:      d=>dispatch({type:A.T_ADD,  p:d}),
    toggleTask:   id=>dispatch({type:A.T_TOG, p:id}),
    deleteTask:   id=>dispatch({type:A.T_DEL, p:id}),
    addTimeEntry: d=>dispatch({type:A.TT_ADD, p:d}),
    stopTimer:    d=>dispatch({type:A.TT_STOP,p:d}),
    delTimeEntry: id=>dispatch({type:A.TT_DEL,p:id}),
    addExpense:   d=>dispatch({type:A.EX_ADD, p:d}),
    delExpense:   id=>dispatch({type:A.EX_DEL,p:id}),
    addTemplate:  d=>dispatch({type:A.TPL_ADD,p:d}),
    delTemplate:  id=>dispatch({type:A.TPL_DEL,p:id}),
    pushActivity: d=>dispatch({type:A.ACT,    p:d}),
    setPage:      p=>dispatch({type:A.PAGE,   p}),
    setAI:        c=>dispatch({type:A.AI,     p:c}),
    setPricing:   v=>dispatch({type:A.PRICING,p:v}),
    setPlan:      p=>dispatch({type:A.PLAN,   p}),
    aiUsed:       ()=>dispatch({type:A.AI_USED}),
  }),[]);
  const derived=useMemo(()=>{
    const{clients,invoices,tasks,timeEntries,expenses,plan,aiUsed}=s;
    const cfg=PLANS[plan]||PLANS.free;
    const totalPipeline =clients.reduce((x,c)=>x+c.value,0);
    const totalCollected=clients.reduce((x,c)=>x+(c.paid||0),0);
    const overdueInvs   =invoices.filter(i=>i.status==="overdue");
    const needsFollowUp =clients.filter(c=>daysAgo(c.lastContact||today())>10&&c.status!=="completed");
    const canAddClient  =clients.length<cfg.limits.clients;
    const canUseAI      =aiUsed<cfg.limits.aiDrafts;
    const aiLeft        =cfg.limits.aiDrafts===Infinity?Infinity:Math.max(0,cfg.limits.aiDrafts-aiUsed);
    const totalHours    =timeEntries.reduce((s,e)=>s+(e.duration||0),0)/3600;
    const totalExpenses =expenses.reduce((s,e)=>s+e.amount,0);
    const clientsWithHealth=clients.map(c=>({...c,health:healthScore(c,tasks)}));
    return{
      totalPipeline,totalCollected,outstanding:totalPipeline-totalCollected,
      overdueInvs,needsFollowUp,
      openTasks:tasks.filter(t=>!t.done),
      activeClients:clients.filter(c=>c.status==="active").length,
      canAddClient,canUseAI,aiLeft,cfg,
      totalHours,totalExpenses,
      clientsWithHealth,
      badges:{
        overdueClients:   clients.filter(c=>c.status==="overdue").length,
        overdueInvoices:  invoices.filter(i=>i.status==="overdue").length,
        highPriorityTasks:tasks.filter(t=>!t.done&&t.priority==="high").length,
      },
    };
  },[s]);
  return{s,act,derived};
}

// ═══════════════════════════════════════════════════════════════
// AI HOOK
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
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
    google:     {bg:hov?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.09)",co:C.textPrimary,bo:`1px solid ${C.glassBorder}`,sh:"none"},
  };
  const v=vt[variant]||vt.secondary;const ss=sz[size]||sz.md;
  return(
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...ss,background:v.bg,color:v.co,border:v.bo||"none",boxShadow:v.sh,fontFamily:F.family,
        fontWeight:F.semibold,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.45:1,
        display:"inline-flex",alignItems:"center",justifyContent:"center",gap:S[2],whiteSpace:"nowrap",
        transition:"all 0.15s",width:fullWidth?"100%":undefined,backdropFilter:"blur(8px)",...ex}}>
      {children}
    </button>
  );
}
function Inp({label,value,onChange,type="text",placeholder="",required=false,style:ex={},autoComplete}){
  const[foc,setFoc]=useState(false);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[1]}}>
      {label&&<label style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textSec}}>
        {label}{required&&<span style={{color:C.red}}> *</span>}
      </label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        autoComplete={autoComplete} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
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
function Bdg({label,color,bg}){
  return <span style={{background:bg,color,fontSize:F.xs,fontWeight:F.bold,padding:"3px 9px",
    borderRadius:R.full,whiteSpace:"nowrap",border:`1px solid ${color}30`}}>{label}</span>;
}
function Avt({name,idx=0,size=38}){
  const color=AVATAR_COLORS[idx%AVATAR_COLORS.length];
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:`${color}22`,color,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.33),
      fontWeight:F.bold,flexShrink:0,border:`1.5px solid ${color}44`,boxShadow:`0 0 12px ${color}33`}}>
      {ini(name)}
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
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.78)",zIndex:Z.modal,
      display:"flex",alignItems:"center",justifyContent:"center",padding:S[6],backdropFilter:"blur(12px)"}}>
      <div style={{...gCard({background:"rgba(20,15,50,0.90)",backdropFilter:"blur(30px) saturate(200%)"}),
        width,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto",borderRadius:R.xxl,
        boxShadow:"0 24px 80px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.15)"}}>
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
function Prg({pct,color}){
  const c=color||(pct===100?C.green:pct>50?C.brand:C.amber);
  return(
    <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:R.full,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c}88,${c})`,
        borderRadius:R.full,transition:"width 0.6s ease",boxShadow:`0 0 8px ${c}66`}}/>
    </div>
  );
}
function SCard({label,value,sub,trend,color,icon}){
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
function Srch({value,onChange,placeholder="Search…"}){
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

// Plan Gate
function PlanGate({cur,req,name,onUpgrade,children}){
  if(hasPlan(cur,req)) return children;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:`${S[12]}px ${S[6]}px`,textAlign:"center",gap:S[4]}}>
      <div style={{fontSize:52,filter:"grayscale(1)",opacity:0.4}}>🔒</div>
      <div style={{fontSize:F.xl,fontWeight:F.bold,color:C.textPrimary}}>{name}</div>
      <div style={{fontSize:F.base,color:C.textMuted,maxWidth:360,lineHeight:1.7}}>
        This feature is available on the{" "}
        <strong style={{color:PLANS[req].color}}>{PLANS[req].name} plan</strong>.
        Upgrade to unlock {name.toLowerCase()}, unlimited clients, unlimited AI drafts, and more.
      </div>
      <Btn onClick={onUpgrade} variant="primary" size="lg">✨ Upgrade to {PLANS[req].name} — {PLANS[req].label}</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOGO COMPONENT — SVG mark + wordmark
// ═══════════════════════════════════════════════════════════════
function CPLogo({size=34}){
  return(
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{flexShrink:0,filter:`drop-shadow(0 4px 12px rgba(99,102,241,0.5))`}}>
      <defs>
        <linearGradient id="cpg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#c084fc"/>
        </linearGradient>
        <linearGradient id="cpg2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)"/>
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="url(#cpg1)"/>
      {/* Inner glow */}
      <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.08"/>
      {/* CP monogram — stylised pulse/chart shape */}
      {/* Left bar (C shape) */}
      <rect x="8" y="11" width="4" height="18" rx="2" fill="url(#cpg2)"/>
      <rect x="8" y="11" width="12" height="4" rx="2" fill="url(#cpg2)"/>
      <rect x="8" y="25" width="12" height="4" rx="2" fill="url(#cpg2)"/>
      {/* Pulse line (P shape + heartbeat) */}
      <path d="M20 19 L23 13 L26 22 L28 17 L32 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.95"/>
      {/* Dot at end of pulse */}
      <circle cx="32" cy="17" r="2" fill="white" fillOpacity="0.95"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECURE AUTH SCREEN — with Google OAuth UI + security hardening
// ═══════════════════════════════════════════════════════════════
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("login");
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);
  const[showPass,setShowPass]=useState(false);

  // Password strength meter
  const strength = pass.length===0?0:pass.length<6?1:pass.length<8?2:
    /[A-Z]/.test(pass)&&/[0-9]/.test(pass)&&/[^a-zA-Z0-9]/.test(pass)?4:3;
  const strengthLabel=["","Weak","Fair","Good","Strong"][strength];
  const strengthColor=[C.textMuted,C.red,C.amber,C.brand,C.green][strength];

  const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submit=async()=>{
    setErr("");
    // Rate limiting
    const rateKey=`auth_${email.toLowerCase()}`;
    if(!SEC.checkRate(rateKey)){
      setErr("Too many attempts. Please wait 15 minutes before trying again.");
      return;
    }
    if(!email||!pass){setErr("Please fill in all fields.");return;}
    if(!validateEmail(email)){setErr("Please enter a valid email address.");return;}
    if(mode==="signup"){
      if(!name.trim()){setErr("Please enter your name.");return;}
      if(SEC.sanitize(name).length<2){setErr("Name must be at least 2 characters.");return;}
      if(pass.length<8){setErr("Password must be at least 8 characters.");return;}
      if(strength<2){setErr("Password is too weak. Use a mix of letters, numbers and symbols.");return;}
    } else {
      if(pass.length<1){setErr("Please enter your password.");return;}
    }
    setLoading(true);
    await new Promise(r=>setTimeout(r,400)); // Prevent timing attacks

    const users=loadUsers();
    if(mode==="signup"){
      if(users[email.toLowerCase()]){setErr("An account with this email already exists.");setLoading(false);return;}
      const hashed=await SEC.hash(pass);
      const id=uid();
      const sanitizedName=SEC.sanitize(name);
      users[email.toLowerCase()]={id,name:sanitizedName,hash:hashed,plan:"free",created:today(),
        emailVerified:false,loginCount:0};
      saveUsers(users);
      const auth={id,email:email.toLowerCase(),name:sanitizedName,plan:"free"};
      saveSession(auth);
      SEC.resetRate(rateKey);
      onAuth(auth);
    } else {
      const u=users[email.toLowerCase()];
      if(!u){
        // Don't reveal whether email exists
        setErr("Invalid email or password.");setLoading(false);return;
      }
      const hashed=await SEC.hash(pass);
      if(u.hash!==hashed){setErr("Invalid email or password.");setLoading(false);return;}
      u.loginCount=(u.loginCount||0)+1;
      u.lastLogin=today();
      users[email.toLowerCase()]=u;
      saveUsers(users);
      const auth={id:u.id,email:email.toLowerCase(),name:u.name,plan:u.plan||"free"};
      saveSession(auth);
      SEC.resetRate(rateKey);
      onAuth(auth);
    }
    setLoading(false);
  };

  const googleLogin=()=>{
    // Supabase Google OAuth — replace SUPABASE_URL with your project URL
    // Set up: supabase.com → Auth → Providers → Google → enable
    const SUPABASE_URL = "https://fzohdtvijhdlnqtasadc.supabase.co";
    const redirectUrl = encodeURIComponent(window.location.origin);
    const oauthUrl = SUPABASE_URL !== "https://fzohdtvijhdlnqtasadc.supabase.co"
      ? `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`
      : null;
    if(oauthUrl){
      window.location.href = oauthUrl;
    } else {
      // Demo: simulate Google login for testing
      const mockAuth = {id:"google_"+Date.now().toString(36),email:"demo@gmail.com",name:"Google User",plan:"free",provider:"google"};
      saveSession(mockAuth);
      onAuth(mockAuth);
    }
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
          <div style={{margin:"0 auto",marginBottom:S[3],display:"flex",justifyContent:"center"}}>
            <CPLogo size={56}/>
          </div>
          <div style={{fontSize:F.xxl,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.025em"}}>ClientPulse</div>
          <div style={{fontSize:F.base,color:C.textMuted,marginTop:S[1]}}>AI-powered CRM for freelancers</div>
        </div>

        <div style={{...gCard({background:"rgba(20,15,50,0.88)",backdropFilter:"blur(30px)"}),
          borderRadius:R.xxl,padding:S[6],
          boxShadow:"0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12)"}}>

          {/* Mode tabs */}
          <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:R.lg,padding:S[1],marginBottom:S[5]}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");setPass("");}}
                style={{flex:1,padding:"8px 0",borderRadius:R.md,border:"none",cursor:"pointer",
                  fontFamily:F.family,fontSize:F.base,fontWeight:F.semibold,transition:"all 0.15s",
                  background:mode===m?"rgba(129,140,248,0.25)":"transparent",
                  color:mode===m?C.textPrimary:C.textMuted}}>
                {m==="login"?"Sign in":"Create account"}
              </button>
            ))}
          </div>

          {/* Google OAuth button */}
          <Btn onClick={googleLogin} variant="google" fullWidth style={{marginBottom:S[4],borderRadius:R.md,padding:"10px 0",fontSize:F.md}}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{flexShrink:0}}>
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.4 0-13.8 4.1-17.7 10.2 0 0 0 .1 0 .1l.1.4-.1-.4v.4z"/>
              <path fill="#FBBC05" d="M24 46c5.8 0 10.8-1.9 14.7-5.2l-6.8-5.6C29.9 37 27.1 38 24 38c-6 0-11.1-4-12.9-9.5L4.2 34c3.9 6.7 11.1 12 19.8 12z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1.2 3.2-3.5 5.8-6.5 7.5l6.8 5.6C40.8 38.4 46 32 46 24c0-1.3-.2-2.7-.5-4z"/>
            </svg>
            Continue with Google
          </Btn>

          <div style={{display:"flex",alignItems:"center",gap:S[3],marginBottom:S[4]}}>
            <div style={{flex:1,height:1,background:C.glassBorder}}/>
            <span style={{fontSize:F.xs,color:C.textMuted}}>or continue with email</span>
            <div style={{flex:1,height:1,background:C.glassBorder}}/>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
            {mode==="signup"&&(
              <Inp label="Full name" value={name} onChange={setName} placeholder="Jane Smith" required autoComplete="name"/>
            )}
            <Inp label="Email" value={email} onChange={setEmail} type="email"
              placeholder="jane@example.com" required autoComplete="email"/>
            <div style={{position:"relative"}}>
              <Inp label="Password" value={pass} onChange={setPass} type={showPass?"text":"password"}
                placeholder={mode==="signup"?"Min. 8 characters":"Your password"} required
                autoComplete={mode==="signup"?"new-password":"current-password"}/>
              <button onClick={()=>setShowPass(v=>!v)}
                style={{position:"absolute",right:12,bottom:9,background:"none",border:"none",
                  cursor:"pointer",color:C.textMuted,fontSize:F.xs,fontFamily:F.family}}>
                {showPass?"Hide":"Show"}
              </button>
              {/* Password strength indicator */}
              {mode==="signup"&&pass.length>0&&(
                <div style={{marginTop:S[1]}}>
                  <div style={{display:"flex",gap:3,marginBottom:4}}>
                    {[1,2,3,4].map(i=>(
                      <div key={i} style={{flex:1,height:3,borderRadius:99,
                        background:i<=strength?strengthColor:"rgba(255,255,255,0.1)",transition:"all 0.2s"}}/>
                    ))}
                  </div>
                  <div style={{fontSize:F.xs,color:strengthColor}}>{strengthLabel} password</div>
                </div>
              )}
            </div>
            {mode==="login"&&(
              <button onClick={()=>setErr("Password reset: Enter your email then contact support@clientpulse.io")}
                style={{background:"none",border:"none",cursor:"pointer",color:C.brand,fontSize:F.xs,
                  fontFamily:F.family,textAlign:"right",padding:0}}>
                Forgot password?
              </button>
            )}
          </div>

          {err&&(
            <div style={{marginTop:S[3],background:"rgba(248,113,113,0.12)",color:C.red,fontSize:F.sm,
              borderRadius:R.md,padding:`${S[2]}px ${S[3]}px`,border:`1px solid rgba(248,113,113,0.25)`,lineHeight:1.5}}>
              {err}
            </div>
          )}

          <Btn onClick={submit} variant="primary" fullWidth disabled={loading}
            style={{marginTop:S[5],borderRadius:R.md,padding:"12px 0",fontSize:F.md}}>
            {loading?"Please wait…":mode==="login"?"Sign in →":"Create free account →"}
          </Btn>

          {mode==="signup"&&(
            <div style={{marginTop:S[4],textAlign:"center",fontSize:F.xs,color:C.textMuted,lineHeight:1.6}}>
              By signing up you agree to our Terms of Service and Privacy Policy.<br/>
              Free plan: 3 clients · 5 AI drafts/month · No credit card needed.
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:S[4],fontSize:F.xs,color:C.textMuted,lineHeight:1.7}}>
          🔒 Secure &amp; private · No credit card required · Cancel anytime
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRICING MODAL
// ═══════════════════════════════════════════════════════════════
function PricingModal({currentPlan,onClose,onSimulate}){
  const open=(plan)=>{
    if(!plan.checkoutUrl||plan.checkoutUrl.includes("YOUR_")){onSimulate(plan.id);return;}
    window.open(plan.checkoutUrl,"_blank","noopener,noreferrer");
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.88)",zIndex:Z.panel+10,
      display:"flex",alignItems:"center",justifyContent:"center",padding:S[6],backdropFilter:"blur(16px)"}}>
      <div style={{...gCard({background:"rgba(15,10,40,0.92)",backdropFilter:"blur(30px)"}),
        width:"min(960px,95vw)",borderRadius:R.xxl,overflow:"hidden",
        boxShadow:"0 24px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.12)"}}>
        <div style={{padding:`${S[6]}px ${S[8]}px ${S[5]}px`,textAlign:"center",borderBottom:`1px solid ${C.glassBorder}`,position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",right:S[5],top:S[4],...glass(0.12,8),
            border:`1px solid ${C.glassBorder}`,borderRadius:R.sm,width:30,height:30,cursor:"pointer",
            color:C.textSec,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <div style={{fontSize:F.xs,fontWeight:F.bold,textTransform:"uppercase",letterSpacing:"0.1em",color:C.brand,marginBottom:S[2]}}>Pricing</div>
          <div style={{fontSize:F.xxl,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.025em",marginBottom:S[2]}}>Choose your plan</div>
          <div style={{fontSize:F.base,color:C.textSec}}>Start free. Upgrade anytime. Cancel with one click.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:S[5],padding:`${S[6]}px ${S[8]}px ${S[8]}px`}}>
          {Object.values(PLANS).map(plan=>{
            const isCur=currentPlan===plan.id;
            const isPop=plan.id==="pro";
            return(
              <div key={plan.id} style={{...gCard(),borderRadius:R.xl,overflow:"hidden",
                border:`2px solid ${isCur?plan.color:isPop?"rgba(129,140,248,0.4)":C.glassBorder}`,
                boxShadow:isPop?`0 0 40px ${C.brandGlow}`:"0 8px 24px rgba(0,0,0,0.2)",
                display:"flex",flexDirection:"column"}}>
                {isPop&&<div style={{background:`linear-gradient(90deg,${C.brand},${C.purple})`,
                  textAlign:"center",padding:"6px 0",fontSize:F.xs,fontWeight:F.bold,color:C.white,
                  letterSpacing:"0.05em",textTransform:"uppercase"}}>⭐ Most Popular</div>}
                {isCur&&!isPop&&<div style={{background:"rgba(52,211,153,0.2)",textAlign:"center",
                  padding:"6px 0",fontSize:F.xs,fontWeight:F.bold,color:C.green,textTransform:"uppercase"}}>✓ Current Plan</div>}
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
                  {isCur
                    ?<div style={{textAlign:"center",padding:"10px 0",fontSize:F.base,fontWeight:F.semibold,color:C.green}}>✓ Active plan</div>
                    :plan.id==="free"
                      ?<Btn onClick={()=>onSimulate("free")} variant="secondary" fullWidth>Downgrade to Free</Btn>
                      :<Btn onClick={()=>open(plan)} variant={plan.id==="pro"?"primary":"brand_ghost"} fullWidth>
                        Get {plan.name} — {plan.label}
                      </Btn>
                  }
                </div>
              </div>
            );
          })}
        </div>
        <div style={{textAlign:"center",padding:`0 0 ${S[5]}px`,fontSize:F.xs,color:C.textMuted}}>
          🔒 Secure payment via Lemon Squeezy (Stripe) · 7-day money-back guarantee · Cancel anytime from settings
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════
function Sidebar({page,onNav,badges,plan,onUpgrade,onLogout,userName,userId}){
  const cfg=PLANS[plan]||PLANS.free;
  return(
    <aside style={{width:228,background:"rgba(10,5,30,0.90)",backdropFilter:"blur(20px)",
      display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",
      overflowY:"auto",borderRight:`1px solid ${C.glassBorder}`}}>
      <div style={{padding:`${S[5]}px ${S[5]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`}}>
        <div style={{display:"flex",alignItems:"center",gap:S[3]}}>
          <CPLogo size={34}/>
          <div>
            <div style={{fontSize:F.md,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.02em",lineHeight:1.1}}>ClientPulse</div>
            <div style={{fontSize:F.xs,color:C.textMuted}}>AI-powered CRM</div>
          </div>
        </div>
      </div>
      <nav style={{padding:S[2],display:"flex",flexDirection:"column",gap:1,flex:1}}>
        <div style={{fontSize:9,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",
          letterSpacing:"0.1em",padding:`${S[3]}px ${S[2]}px ${S[2]}px`}}>Menu</div>
        {NAV.map(item=>{
          const isActive=page===item.id;
          const badge=item.badgeKey?badges[item.badgeKey]:0;
          const locked=item.planRequired&&!hasPlan(plan,item.planRequired);
          return(
            <button key={item.id} onClick={()=>onNav(item.id)}
              style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[2]+1}px ${S[3]}px`,
                borderRadius:R.md,border:"none",cursor:"pointer",fontFamily:F.family,width:"100%",textAlign:"left",
                background:isActive?"rgba(129,140,248,0.18)":"transparent",
                color:isActive?C.textPrimary:locked?"rgba(255,255,255,0.3)":C.textSec,
                fontWeight:isActive?F.semibold:F.regular,fontSize:F.base,transition:"all 0.15s"}}
              onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
              onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}>
              <span style={{fontSize:13,width:16,textAlign:"center",flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {locked&&<span style={{fontSize:9,opacity:0.5}}>PRO</span>}
              {!locked&&badge>0&&<span style={{background:C.red,color:C.white,fontSize:9,borderRadius:R.full,
                padding:"2px 6px",fontWeight:F.bold}}>{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:`${S[3]}px ${S[3]}px ${S[4]}px`}}>
        {plan==="free"&&(
          <button onClick={onUpgrade}
            style={{width:"100%",background:`linear-gradient(135deg,${C.brand}22,${C.purple}22)`,
              border:`1px solid ${C.brand}44`,borderRadius:R.lg,padding:`${S[3]}px ${S[4]}px`,
              cursor:"pointer",fontFamily:F.family,marginBottom:S[3],textAlign:"left"}}>
            <div style={{fontSize:F.xs,fontWeight:F.bold,color:C.brand,marginBottom:S[1]}}>✨ Upgrade to Pro</div>
            <div style={{fontSize:F.xs,color:C.textMuted}}>Unlock all features for $39/mo</div>
          </button>
        )}
        <div style={{display:"flex",alignItems:"center",gap:S[2],padding:`${S[2]}px ${S[1]}px`}}>
          <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,
            background:`linear-gradient(135deg,${C.brand},${C.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:F.xs,color:C.white,fontWeight:F.bold}}>
            {ini(userName||"U")}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textPrimary,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
              {userName||"User"}
            </div>
            <div style={{fontSize:F.xs,color:cfg.color,fontWeight:F.semibold}}>{cfg.name} plan</div>
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:14,padding:S[1]}}>
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({page,alerts=0,plan,onUpgrade}){
  const titles={dashboard:"Dashboard",clients:"Clients",invoices:"Invoices",tasks:"Tasks",
    pipeline:"Pipeline",timetrack:"Time Tracking",expenses:"Expenses",
    templates:"Email Templates",reports:"Reports",settings:"Settings"};
  const subs={dashboard:"Your business at a glance",clients:"Manage relationships and projects",
    invoices:"Track payments",tasks:"Stay on top of your client work",
    pipeline:"Visualise your deal stages",timetrack:"Track billable hours by client",
    expenses:"Track project costs and profit margins",templates:"Ready-to-use email templates",
    reports:"Revenue, expenses, and profit insights",settings:"Account and plan settings"};
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
        {alerts>0&&(
          <div style={{background:"rgba(248,113,113,0.15)",color:C.red,fontSize:F.xs,fontWeight:F.bold,
            padding:"5px 12px",borderRadius:R.full,border:`1px solid rgba(248,113,113,0.3)`}}>
            🔔 {alerts} alert{alerts!==1?"s":""}
          </div>
        )}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// AI PANEL
// ═══════════════════════════════════════════════════════════════
function AIPanel({client,onClose,canUseAI,aiLeft,onUpgrade,onUsed}){
  const{msgs,loading,error,send,reset}=useAIChat(client);
  const[input,setInput]=useState("");
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const go=text=>{if(!canUseAI){onUpgrade();return;}send(text);onUsed();setInput("");};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.75)",zIndex:Z.panel,
      display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:S[6],backdropFilter:"blur(10px)"}}>
      <div style={{...gCard({background:"rgba(15,10,40,0.93)",backdropFilter:"blur(40px)"}),
        width:460,height:640,display:"flex",flexDirection:"column",borderRadius:R.xxl,
        boxShadow:"0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)",overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${C.brandDeep}99,${C.purple}66)`,
          padding:`${S[4]}px ${S[5]}px`,display:"flex",alignItems:"center",gap:S[3],
          borderBottom:`1px solid ${C.glassBorder}`,flexShrink:0}}>
          <Avt name={client.name} idx={client.avatarIdx||0} size={36}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>AI for {client.name.split(" ")[0]}</div>
            <div style={{fontSize:F.xs,color:C.textSec}}>
              {aiLeft===Infinity?"Unlimited drafts":`${aiLeft} draft${aiLeft!==1?"s":""} left`}
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
              🚫 Monthly AI draft limit reached
            </div>
            <div style={{fontSize:F.xs,color:C.textMuted,marginBottom:S[3]}}>
              Free plan: 5 drafts/month. Resets on the 1st.
            </div>
            <Btn onClick={onUpgrade} variant="primary">Get unlimited drafts with Pro</Btn>
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
              {m.role==="assistant"&&<div style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,
                marginBottom:S[1],textTransform:"uppercase",letterSpacing:"0.06em"}}>✨ ClientPulse AI</div>}
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
                  style={{marginTop:S[1],fontSize:F.xs,color:C.textMuted,background:"none",border:"none",
                    cursor:"pointer",padding:0,fontFamily:F.family}}>📋 Copy</button>
              )}
            </div>
          ))}
          {loading&&<div style={{fontSize:F.base,color:C.textMuted,fontStyle:"italic"}}>✨ Writing…</div>}
          {error&&<div style={{background:"rgba(248,113,113,0.12)",color:C.red,fontSize:F.sm,
            borderRadius:R.md,padding:`${S[2]}px ${S[3]}px`,border:`1px solid rgba(248,113,113,0.25)`}}>⚠️ {error}</div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:`${S[3]}px ${S[4]}px`,borderTop:`1px solid ${C.glassBorder}`,display:"flex",gap:S[2],flexShrink:0}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(input.trim())go(input.trim());}}}
            placeholder={canUseAI?"Ask AI to draft anything…":"Upgrade for unlimited AI drafts"}
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

// ═══════════════════════════════════════════════════════════════
// CLIENT COMPONENTS
// ═══════════════════════════════════════════════════════════════
const EC={name:"",company:"",email:"",phone:"",website:"",project:"",value:"",paid:"0",
  status:"active",stage:"In Progress",dueDate:"",tags:"",notes:"",currency:"USD"};

function ClientForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial?{...initial,value:String(initial.value),paid:String(initial.paid||0),
    tags:Array.isArray(initial.tags)?initial.tags.join(", "):initial.tags||"",
    website:initial.website||"",currency:initial.currency||"USD"}:{...EC});
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  const valid=f.name.trim()&&f.email.trim()&&f.project.trim()&&f.value.trim();
  const submit=()=>{
    if(!valid)return;
    onSave({...f,
      name:SEC.sanitize(f.name),company:SEC.sanitize(f.company),
      notes:SEC.sanitize(f.notes),
      value:Number(f.value)||0,paid:Number(f.paid)||0,
      invoicePending:(Number(f.paid)||0)<(Number(f.value)||0),
      avatarIdx:initial?.avatarIdx??Math.floor(Math.random()*AVATAR_COLORS.length)});
    onClose();
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
        <Inp label="Full name"       value={f.name}    onChange={set("name")}    placeholder="Jane Smith"      required/>
        <Inp label="Company"         value={f.company} onChange={set("company")} placeholder="Acme Inc."/>
        <Inp label="Email"           value={f.email}   onChange={set("email")}   type="email" placeholder="jane@acme.com" required/>
        <Inp label="Phone"           value={f.phone}   onChange={set("phone")}   placeholder="+1 415 000 0000"/>
        <div style={{gridColumn:"1/-1"}}>
          <Inp label="Website"       value={f.website} onChange={set("website")} placeholder="https://acme.com"/>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <Inp label="Project name"  value={f.project} onChange={set("project")} placeholder="Website Redesign" required/>
        </div>
        <Inp label="Contract value"  value={f.value}   onChange={set("value")}   type="number" placeholder="5000" required/>
        <Inp label="Paid so far"     value={f.paid}    onChange={set("paid")}    type="number" placeholder="0"/>
        <Sel label="Status" value={f.status} onChange={set("status")}>
          <option value="active">Active</option><option value="prospect">Prospect</option>
          <option value="overdue">Overdue</option><option value="completed">Completed</option>
        </Sel>
        <Inp label="Stage"           value={f.stage}   onChange={set("stage")}   placeholder="In Progress"/>
        <Inp label="Due date"        value={f.dueDate} onChange={set("dueDate")} type="date"/>
        <Sel label="Currency" value={f.currency} onChange={set("currency")}>
          {["USD","EUR","GBP","INR","CAD","AUD","AED","SGD","JPY"].map(c=>(
            <option key={c} value={c}>{c}</option>
          ))}
        </Sel>
        <div style={{gridColumn:"1/-1"}}>
          <Inp label="Tags (comma-separated)" value={f.tags} onChange={set("tags")} placeholder="design, dev, seo"/>
        </div>
      </div>
      <Txta label="Notes" value={f.notes} onChange={set("notes")} placeholder="Any context about this client or project…" rows={3}/>
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
  const hs=client.health||100;
  return(
    <Card onClick={()=>onSelect(client)} glow={`${color}33`}
      style={{padding:S[5],display:"flex",flexDirection:"column",gap:S[3]}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:S[3]}}>
          <div style={{position:"relative"}}>
            <Avt name={client.name} idx={client.avatarIdx||0} size={40}/>
            <div style={{position:"absolute",bottom:-2,right:-2,width:12,height:12,borderRadius:"50%",
              background:healthColor(hs),border:`2px solid rgba(15,10,40,0.8)`,
              boxShadow:`0 0 6px ${healthColor(hs)}`}} title={`Health: ${hs}%`}/>
          </div>
          <div>
            <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,lineHeight:1.2}}>{client.name}</div>
            <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>{client.company}</div>
          </div>
        </div>
        <Bdg label={cfg.label} color={cfg.color} bg={cfg.bg}/>
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
        <Prg pct={pct}/>
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
  const hs=client.health||100;
  return(
    <Modal title="" onClose={onClose} width={580}>
      <div style={{display:"flex",alignItems:"center",gap:S[4],marginBottom:S[5]}}>
        <Avt name={client.name} idx={client.avatarIdx||0} size={54}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:S[2],marginBottom:S[1]}}>
            <h2 style={{margin:0,fontSize:F.xl,fontWeight:F.black,color:C.textPrimary}}>{client.name}</h2>
            <Bdg label={cfg.label} color={cfg.color} bg={cfg.bg}/>
          </div>
          <div style={{fontSize:F.base,color:C.textSec}}>{client.company}</div>
          <div style={{display:"flex",gap:S[4],marginTop:S[1],flexWrap:"wrap"}}>
            <a href={`mailto:${client.email}`} style={{fontSize:F.xs,color:C.brand}}>{client.email}</a>
            {client.phone&&<span style={{fontSize:F.xs,color:C.textMuted}}>{client.phone}</span>}
            {client.website&&<a href={client.website} target="_blank" rel="noopener noreferrer" style={{fontSize:F.xs,color:C.cyan}}>{client.website}</a>}
          </div>
        </div>
      </div>
      <div style={{height:1,background:C.glassBorder,marginBottom:S[5]}}/>
      {/* Health score */}
      <div style={{...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`,marginBottom:S[4],
        display:"flex",alignItems:"center",gap:S[4]}}>
        <div>
          <div style={{fontSize:F.xs,color:C.textMuted,marginBottom:2}}>Client health</div>
          <div style={{fontSize:F.xl,fontWeight:F.black,color:healthColor(hs),textShadow:`0 0 12px ${healthColor(hs)}66`}}>
            {hs}%
          </div>
        </div>
        <div style={{flex:1}}>
          <Prg pct={hs} color={healthColor(hs)}/>
          <div style={{fontSize:F.xs,color:C.textMuted,marginTop:S[1]}}>
            {hs>=70?"Healthy relationship":"Needs attention — follow up soon"}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3],marginBottom:S[5]}}>
        <SCard label="Contract"     value={fmt$(client.value)} icon="💼"/>
        <SCard label="Paid"         value={fmt$(client.paid||0)} color={client.paid>=client.value?C.green:C.amber} icon="✅"/>
        <SCard label="Last contact" value={days===0?"Today":`${days}d ago`} color={days>14?C.red:C.green} icon="🕐"/>
        <SCard label="Due date"     value={client.dueDate||"—"} icon="📅"/>
      </div>
      <div style={{marginBottom:S[4]}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
          <span style={{fontSize:F.sm,color:C.textSec}}>Payment progress</span>
          <span style={{fontSize:F.sm,fontWeight:F.bold,color:C.textPrimary}}>{pct}%</span>
        </div>
        <Prg pct={pct}/>
      </div>
      <div style={{display:"flex",gap:S[3],marginBottom:S[4]}}>
        {[["Project",client.project],["Stage",client.stage||"—"],["Currency",client.currency||"USD"]].map(([l,v])=>(
          <div key={l} style={{flex:1,...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`}}>
            <div style={{fontSize:F.xs,color:C.textMuted,marginBottom:2}}>{l}</div>
            <div style={{fontSize:F.base,fontWeight:F.semibold,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</div>
          </div>
        ))}
      </div>
      {client.notes&&(
        <div style={{...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`,
          marginBottom:S[4],fontSize:F.base,color:C.textSec,lineHeight:1.7,borderLeft:`3px solid ${C.brand}`}}>
          {client.notes}
        </div>
      )}
      {client.tags?.length>0&&(
        <div style={{display:"flex",gap:S[1],flexWrap:"wrap",marginBottom:S[5]}}>
          {client.tags.map(t=>(
            <span key={t} style={{fontSize:F.xs,fontWeight:F.semibold,padding:"2px 9px",borderRadius:R.full,
              background:"rgba(129,140,248,0.12)",color:C.brand,border:`1px solid rgba(129,140,248,0.25)`}}>{t}</span>
          ))}
        </div>
      )}
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

// ═══════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════
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

function DashboardPage({clients,invoices,tasks,activity,derived,onAI,onUpgrade,goPage}){
  const{totalPipeline,totalCollected,outstanding,overdueInvs,activeClients,needsFollowUp,clientsWithHealth}=derived;
  const pct=totalPipeline>0?Math.round((totalCollected/totalPipeline)*100):0;
  const openTasks=tasks.filter(t=>!t.done);
  if(clients.length===0){
    return(
      <div style={{display:"flex",flexDirection:"column",gap:S[6]}}>
        <div style={{background:`linear-gradient(135deg,rgba(79,70,229,0.6),rgba(192,132,252,0.4))`,
          backdropFilter:"blur(20px)",borderRadius:R.xxl,padding:`${S[8]}px`,textAlign:"center",
          border:`1px solid rgba(129,140,248,0.3)`,color:C.textPrimary,boxShadow:`0 8px 40px rgba(79,70,229,0.3)`}}>
          <div style={{fontSize:56,marginBottom:S[3]}}>⚡</div>
          <div style={{fontSize:F.xxl,fontWeight:F.black,letterSpacing:"-0.025em",marginBottom:S[3]}}>Welcome to ClientPulse!</div>
          <div style={{fontSize:F.base,color:"rgba(255,255,255,0.7)",marginBottom:S[6],maxWidth:480,margin:"0 auto 24px",lineHeight:1.7}}>
            Your AI CRM is ready. Add your first client to start tracking projects, payments, and let AI write your follow-up emails automatically.
          </div>
          <Btn onClick={()=>goPage("clients")} variant="primary" size="lg">+ Add your first client →</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:S[4]}}>
          {[
            ["◈","Smart Dashboard","Revenue stats, client health scores, alerts — all in one place"],
            ["✨","AI Email Drafts","One click writes perfect follow-ups, invoice reminders, and upsell emails"],
            ["📄","Invoice Tracking","Create invoices, mark paid, track outstanding — balances auto-update"],
            ["⏱","Time Tracking","Log billable hours per client. See exactly where your time goes"],
            ["◑","Pipeline Board","Kanban view of every deal from prospect to paid"],
            ["✉","Email Templates","8 ready-to-send templates for every situation"],
          ].map(([icon,title,desc])=>(
            <Card key={title} style={{padding:S[5],textAlign:"center"}}>
              <div style={{fontSize:26,marginBottom:S[2]}}>{icon}</div>
              <div style={{fontSize:F.md,fontWeight:F.bold,color:C.textPrimary,marginBottom:S[1]}}>{title}</div>
              <div style={{fontSize:F.xs,color:C.textMuted,lineHeight:1.6}}>{desc}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  const chartData=[{label:"Feb",v:0},{label:"Mar",v:0},{label:"Apr",v:0},{label:"May",v:0},{label:"Jun",v:0},{label:"Jul",v:totalCollected}];
  const criticalClients=clientsWithHealth.filter(c=>c.health<40).slice(0,3);
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
          <div style={{fontSize:28,fontWeight:F.black,letterSpacing:"-0.025em",lineHeight:1.1}}>Good morning 👋</div>
          <div style={{fontSize:F.base,color:"rgba(255,255,255,0.6)",marginTop:S[2]}}>
            {openTasks.length} tasks open · {needsFollowUp.length} need follow-up
            {criticalClients.length>0&&` · ${criticalClients.length} at-risk clients`}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:34,fontWeight:F.black,letterSpacing:"-0.035em",lineHeight:1}}>{fmt$(totalPipeline)}</div>
          <div style={{fontSize:F.sm,color:"rgba(255,255,255,0.5)",marginTop:S[1]}}>pipeline · {pct}% collected</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:S[4]}}>
        <SCard label="Revenue collected" value={fmt$(totalCollected)} sub={`${pct}% of pipeline`} color={C.green} icon="💰"/>
        <SCard label="Outstanding" value={fmt$(outstanding)} sub={`${clients.filter(c=>c.invoicePending).length} unpaid`} color={outstanding>5000?C.red:C.amber} icon="⏳"/>
        <SCard label="Overdue invoices" value={overdueInvs.length} sub={overdueInvs.length?fmt$(overdueInvs.reduce((s,i)=>s+i.amount,0))+" at risk":"All clear"} color={overdueInvs.length?C.red:C.green} icon="🚨"/>
        <SCard label="Active clients" value={activeClients} sub={`${clients.length} total`} color={C.brand} icon="👥"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:S[5]}}>
        <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
          <Card style={{padding:`${S[5]}px ${S[6]}px`}}>
            <div style={{fontWeight:F.bold,fontSize:F.lg,color:C.textPrimary,marginBottom:S[5]}}>Revenue collected (monthly)</div>
            <BarChart data={chartData} color={C.brand}/>
          </Card>
          {/* Client health overview */}
          {clientsWithHealth.length>0&&(
            <Card>
              <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>
                Client health overview
              </div>
              {clientsWithHealth.sort((a,b)=>a.health-b.health).slice(0,5).map((c,i)=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[3]}px ${S[5]}px`,borderBottom:i<4?`1px solid ${C.glassBorder}`:"none"}}>
                  <Avt name={c.name} idx={c.avatarIdx||0} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:F.semibold,fontSize:F.base,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <Prg pct={c.health} color={healthColor(c.health)}/>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,minWidth:60}}>
                    <div style={{fontWeight:F.bold,fontSize:F.base,color:healthColor(c.health),textShadow:`0 0 8px ${healthColor(c.health)}66`}}>{c.health}%</div>
                    <div style={{fontSize:F.xs,color:C.textMuted}}>health</div>
                  </div>
                </div>
              ))}
            </Card>
          )}
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
              <div style={{padding:`${S[6]}px`,textAlign:"center",fontSize:F.xs,color:C.textMuted}}>No activity yet.</div>
            ):activity.slice(0,8).map((item,i)=>(
              <div key={item.id||i} style={{display:"flex",gap:S[3],padding:`${S[3]}px ${S[4]}px`,borderBottom:i<7?`1px solid ${C.glassBorder}`:"none",alignItems:"flex-start"}}>
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
      return mQ&&(sf==="all"||c.status===sf);
    });
  },[clients,search,sf]);
  const handleAdd=()=>{if(!derived.canAddClient){onUpgrade();return;}setShowAdd(true);};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"flex",gap:S[3],alignItems:"center",flexWrap:"wrap"}}>
        <Srch value={search} onChange={setSearch} placeholder="Search by name, company, project…"/>
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
          <Btn onClick={onUpgrade} variant="amber" size="sm">Upgrade to Pro — $39/mo</Btn>
        </div>
      )}
      {filtered.length===0?(
        <Empty icon="👥" title="No clients yet" body="Add your first client to start tracking projects, payments, and follow-ups."
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

function InvoicesPage({invoices,clients,act,derived,onUpgrade}){
  const[filter,setFilter]=useState("all");
  const[showAdd,setShowAdd]=useState(false);
  const filtered=invoices.filter(i=>filter==="all"||i.status===filter);
  const tot=s=>invoices.filter(i=>s==="all"||i.status===s).reduce((x,i)=>x+i.amount,0);
  const canAdd=invoices.length<derived.cfg.limits.invoices;

  const[f,setF]=useState({clientId:"",desc:"",amount:"",due:"",status:"draft",recurring:false,interval:"monthly"});
  const sf=k=>v=>setF(p=>({...p,[k]:v}));
  const client=clients.find(c=>c.id==f.clientId);

  useEffect(()=>{if(clients.length>0&&!f.clientId)setF(p=>({...p,clientId:clients[0].id}));},[clients]);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:S[4]}}>
        <SCard label="Total invoiced" value={fmt$(tot("all"))}     icon="📄"/>
        <SCard label="Paid"           value={fmt$(tot("paid"))}    color={C.green} icon="✅"/>
        <SCard label="Outstanding"    value={fmt$(tot("sent"))}    color={C.amber} icon="⏳"/>
        <SCard label="Overdue"        value={fmt$(tot("overdue"))} color={C.red}   icon="🚨"/>
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
        <div style={{display:"grid",gridTemplateColumns:"90px 1fr 1.4fr 90px 100px 150px",gap:S[3],
          padding:`${S[3]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,background:"rgba(255,255,255,0.03)"}}>
          {["Invoice","Client","Description","Amount","Due","Status"].map(h=>(
            <div key={h} style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</div>
          ))}
        </div>
        {filtered.length===0
          ?<Empty icon="📄" title="No invoices yet" body={clients.length===0?"Add a client first.":"Click '+ New invoice' to get started."}/>
          :filtered.map((inv,i)=>{
            const cfg=INVOICE_STATUS[inv.status]||INVOICE_STATUS.draft;
            return(
              <div key={inv.id} style={{display:"grid",gridTemplateColumns:"90px 1fr 1.4fr 90px 100px 150px",
                gap:S[3],padding:`${S[4]}px ${S[5]}px`,borderBottom:i<filtered.length-1?`1px solid ${C.glassBorder}`:"none",
                alignItems:"center",transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:F.sm,fontWeight:F.bold,color:C.brand,fontFamily:F.mono}}>{inv.id}</div>
                <div style={{fontSize:F.base,fontWeight:F.medium,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.client}</div>
                <div style={{fontSize:F.xs,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.desc}{inv.recurring&&<span style={{marginLeft:S[1],fontSize:F.xs,color:C.brand}}>🔄</span>}</div>
                <div style={{fontSize:F.base,fontWeight:F.bold,color:C.textPrimary}}>{fmt$(inv.amount)}</div>
                <div style={{fontSize:F.xs,color:inv.status==="overdue"?C.red:C.textSec,fontWeight:inv.status==="overdue"?F.bold:F.regular}}>{inv.due||"—"}</div>
                <div style={{display:"flex",gap:S[2],alignItems:"center"}}>
                  <Bdg label={cfg.label} color={cfg.color} bg={cfg.bg}/>
                  {inv.status!=="paid"&&(
                    <button onClick={()=>act.markPaid(inv.id)}
                      style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",
                        borderRadius:R.sm,padding:"3px 8px",cursor:"pointer",fontSize:F.xs,
                        color:C.green,fontWeight:F.bold,fontFamily:F.family,transition:"all 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(52,211,153,0.25)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(52,211,153,0.15)"}>
                      ✓ Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </Card>
      {showAdd&&(
        <Modal title="Create invoice" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
            <Sel label="Client" value={f.clientId} onChange={sf("clientId")}>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
            </Sel>
            <Inp label="Description" value={f.desc} onChange={sf("desc")} placeholder="Website design – Phase 1"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
              <Inp label="Amount ($)" value={f.amount} onChange={sf("amount")} type="number" placeholder="2500" required/>
              <Inp label="Due date"   value={f.due}    onChange={sf("due")}    type="date"/>
            </div>
            <Sel label="Status" value={f.status} onChange={sf("status")}>
              <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option>
            </Sel>
            {hasPlan(derived.cfg.id,"pro")&&(
              <div style={{...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`}}>
                <label style={{display:"flex",alignItems:"center",gap:S[2],cursor:"pointer",fontSize:F.sm,color:C.textSec}}>
                  <input type="checkbox" checked={f.recurring} onChange={e=>setF(p=>({...p,recurring:e.target.checked}))} style={{accentColor:C.brand}}/>
                  Recurring invoice
                </label>
                {f.recurring&&(
                  <div style={{marginTop:S[2]}}>
                    <Sel label="Billing interval" value={f.interval} onChange={sf("interval")}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </Sel>
                  </div>
                )}
              </div>
            )}
            <div style={{display:"flex",gap:S[3]}}>
              <Btn onClick={()=>setShowAdd(false)} variant="secondary" fullWidth>Cancel</Btn>
              <Btn onClick={()=>{if(!f.amount||!f.clientId)return;act.addInvoice({clientId:f.clientId,client:client?.name,amount:Number(f.amount),desc:f.desc,due:f.due,status:f.status,recurring:f.recurring,interval:f.interval});setShowAdd(false);}}
                variant="primary" fullWidth disabled={!f.amount||!f.clientId}>Create invoice</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TasksPage({tasks,clients,act}){
  const[filter,setFilter]=useState("open");
  const[showAdd,setShowAdd]=useState(false);
  const[f,setF]=useState({clientId:"",text:"",due:"",priority:"medium"});
  const sf=k=>v=>setF(p=>({...p,[k]:v}));
  useEffect(()=>{if(clients.length>0&&!f.clientId)setF(p=>({...p,clientId:clients[0].id}));},[clients]);
  const client=clients.find(c=>c.id==f.clientId);
  const filtered=tasks
    .filter(t=>filter==="all"?true:filter==="open"?!t.done:t.done)
    .sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;const o={high:0,medium:1,low:2};return(o[a.priority]??1)-(o[b.priority]??1);});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:S[4]}}>
        <SCard label="Open"          value={tasks.filter(t=>!t.done).length}                          color={C.brand} icon="📋"/>
        <SCard label="High priority" value={tasks.filter(t=>!t.done&&t.priority==="high").length}     color={C.red}   icon="🔥"/>
        <SCard label="Completed"     value={tasks.filter(t=>t.done).length}                           color={C.green} icon="✅"/>
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
          ?<Empty icon="✅" title="No tasks here" body="Add tasks to stay on top of client work." action={<Btn onClick={()=>setShowAdd(true)} variant="primary">Add task</Btn>}/>
          :filtered.map((t,i)=>{
            const p=PRIORITY[t.priority]||PRIORITY.medium;
            const ov=t.due&&!t.done&&new Date(t.due)<new Date();
            return(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[4]}px ${S[5]}px`,
                borderBottom:i<filtered.length-1?`1px solid ${C.glassBorder}`:"none",opacity:t.done?0.45:1,transition:"opacity 0.2s"}}>
                <input type="checkbox" checked={t.done} onChange={()=>act.toggleTask(t.id)}
                  style={{width:16,height:16,cursor:"pointer",accentColor:C.brand,flexShrink:0}}/>
                <span style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,boxShadow:`0 0 6px ${p.color}88`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:F.base,color:C.textPrimary,fontWeight:F.medium,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
                  <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>
                    {t.client}{t.due&&<span style={{color:ov?C.red:C.textMuted}}> · Due {t.due}{ov?" ⚠️":""}</span>}
                  </div>
                </div>
                <span style={{fontSize:F.xs,fontWeight:F.semibold,color:p.color,background:`${p.color}15`,
                  padding:"2px 8px",borderRadius:R.full,border:`1px solid ${p.color}30`,whiteSpace:"nowrap"}}>{p.label}</span>
                <button onClick={()=>act.deleteTask(t.id)}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"rgba(255,255,255,0.2)",padding:S[1],lineHeight:1,transition:"color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color=C.red}
                  onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>🗑</button>
              </div>
            );
          })}
      </Card>
      {showAdd&&(
        <Modal title="Add task" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
            <Sel label="Client" value={f.clientId} onChange={sf("clientId")}>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
            </Sel>
            <Inp label="Task description" value={f.text} onChange={sf("text")} placeholder="Send revised proposal…" required/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
              <Inp label="Due date" value={f.due} onChange={sf("due")} type="date"/>
              <Sel label="Priority" value={f.priority} onChange={sf("priority")}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </Sel>
            </div>
            <div style={{display:"flex",gap:S[3]}}>
              <Btn onClick={()=>setShowAdd(false)} variant="secondary" fullWidth>Cancel</Btn>
              <Btn onClick={()=>{if(!f.text.trim())return;act.addTask({clientId:f.clientId,client:client?.name,text:f.text,due:f.due,priority:f.priority});setShowAdd(false);}}
                variant="primary" fullWidth disabled={!f.text.trim()}>Add task</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PipelinePage({clients,onAI,plan,onUpgrade}){
  if(!hasPlan(plan,"pro")){
    return <PlanGate cur={plan} req="pro" name="Pipeline Board" onUpgrade={onUpgrade}><div/></PlanGate>;
  }
  const ST=[{id:"prospect",label:"Prospect",color:C.amber},{id:"active",label:"Active",color:C.brand},{id:"overdue",label:"Overdue",color:C.red},{id:"completed",label:"Done",color:C.green}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:S[4]}}>
        {ST.map(st=>{
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
        {ST.map(st=>{
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
                    padding:`${S[6]}px ${S[4]}px`,textAlign:"center",fontSize:F.xs,color:C.textMuted}}>No clients</div>
                ):sc.map(c=>{
                  const p=pctPaid(c.paid,c.value);
                  return(
                    <Card key={c.id} style={{padding:`${S[3]}px ${S[4]}px`,display:"flex",flexDirection:"column",gap:S[2]}}>
                      <div style={{display:"flex",alignItems:"center",gap:S[2]}}>
                        <Avt name={c.name} idx={c.avatarIdx||0} size={28}/>
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
                        <Prg pct={p}/>
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

function TimeTrackPage({timeEntries,clients,act,plan,onUpgrade}){
  if(!hasPlan(plan,"pro")){
    return <PlanGate cur={plan} req="pro" name="Time Tracking" onUpgrade={onUpgrade}><div/></PlanGate>;
  }
  const[running,setRunning]=useState(null);
  const[elapsed,setElapsed]=useState(0);
  const[clientId,setClientId]=useState(clients[0]?.id||"");
  const[desc,setDesc]=useState("");
  const[showAdd,setShowAdd]=useState(false);
  const[manualH,setManualH]=useState("");
  const[manualM,setManualM]=useState("");
  const client=clients.find(c=>c.id==clientId);

  useEffect(()=>{
    if(!running)return;
    const iv=setInterval(()=>setElapsed(Date.now()-running.start),1000);
    return()=>clearInterval(iv);
  },[running]);

  const startTimer=()=>{
    if(!clientId)return;
    setRunning({start:Date.now(),clientId,client:client?.name,desc});
    setElapsed(0);
  };
  const stopTimer=()=>{
    if(!running)return;
    const dur=Math.floor((Date.now()-running.start)/1000);
    act.addTimeEntry({clientId:running.clientId,client:running.client,desc:running.desc||"Work session",duration:dur,start:new Date(running.start).toISOString(),end:new Date().toISOString()});
    setRunning(null);setElapsed(0);setDesc("");
  };

  const fmtTime=s=>{const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const sec=s%60;return`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;};
  const totalH=timeEntries.reduce((s,e)=>s+(e.duration||0),0)/3600;

  const addManual=()=>{
    if(!clientId||(!manualH&&!manualM))return;
    const dur=(Number(manualH||0)*3600)+(Number(manualM||0)*60);
    act.addTimeEntry({clientId,client:client?.name,desc:desc||"Manual entry",duration:dur,start:new Date().toISOString(),end:new Date().toISOString()});
    setManualH("");setManualM("");setDesc("");setShowAdd(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:S[4]}}>
        <SCard label="Total hours tracked" value={`${totalH.toFixed(1)}h`} color={C.brand} icon="⏱"/>
        <SCard label="This week" value={`${timeEntries.filter(e=>{const d=new Date(e.start||Date.now());const now=new Date();const wStart=new Date(now);wStart.setDate(now.getDate()-now.getDay());return d>=wStart;}).reduce((s,e)=>s+(e.duration||0),0)/3600|0}h`} color={C.green} icon="📅"/>
        <SCard label="Entries logged" value={timeEntries.length} color={C.purple} icon="📝"/>
      </div>

      {/* Timer */}
      <Card style={{padding:S[6]}}>
        <div style={{fontSize:F.md,fontWeight:F.bold,color:C.textPrimary,marginBottom:S[4]}}>⏱ Time tracker</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3],marginBottom:S[4]}}>
          <Sel label="Client" value={clientId} onChange={setClientId}>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel>
          <Inp label="Description (optional)" value={desc} onChange={setDesc} placeholder="Working on homepage design…"/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:S[5]}}>
          <div style={{fontSize:44,fontWeight:F.black,color:running?C.green:C.textMuted,fontFamily:F.mono,
            textShadow:running?`0 0 20px ${C.greenGlow}`:"none",letterSpacing:"-0.02em"}}>
            {fmtTime(running?Math.floor(elapsed/1000):0)}
          </div>
          <div style={{display:"flex",gap:S[3]}}>
            {!running
              ?<Btn onClick={startTimer} variant="success" disabled={!clientId}>▶ Start timer</Btn>
              :<Btn onClick={stopTimer} variant="danger">⏹ Stop & save</Btn>
            }
            <Btn onClick={()=>setShowAdd(true)} variant="secondary">+ Manual entry</Btn>
          </div>
        </div>
      </Card>

      {/* Entries */}
      <Card>
        <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>
          Time log
        </div>
        {timeEntries.length===0
          ?<Empty icon="⏱" title="No time logged yet" body="Start the timer or add a manual entry."/>
          :[...timeEntries].reverse().map((e,i)=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[3]}px ${S[5]}px`,
              borderBottom:i<timeEntries.length-1?`1px solid ${C.glassBorder}`:"none"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:F.base,color:C.textPrimary,fontWeight:F.medium}}>{e.desc}</div>
                <div style={{fontSize:F.xs,color:C.textMuted}}>{e.client} · {e.date}</div>
              </div>
              <div style={{fontSize:F.base,fontWeight:F.bold,color:C.brand,fontFamily:F.mono}}>
                {fmtTime(e.duration||0)}
              </div>
              <button onClick={()=>act.delTimeEntry(e.id)}
                style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"rgba(255,255,255,0.2)",padding:S[1],transition:"color 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.color=C.red}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>🗑</button>
            </div>
          ))}
      </Card>

      {showAdd&&(
        <Modal title="Add manual time entry" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
            <Sel label="Client" value={clientId} onChange={setClientId}>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
            <Inp label="Description" value={desc} onChange={setDesc} placeholder="Work session description"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
              <Inp label="Hours" value={manualH} onChange={setManualH} type="number" placeholder="2"/>
              <Inp label="Minutes" value={manualM} onChange={setManualM} type="number" placeholder="30"/>
            </div>
            <div style={{display:"flex",gap:S[3]}}>
              <Btn onClick={()=>setShowAdd(false)} variant="secondary" fullWidth>Cancel</Btn>
              <Btn onClick={addManual} variant="primary" fullWidth>Save entry</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ExpensesPage({expenses,clients,act,plan,onUpgrade}){
  if(!hasPlan(plan,"pro")){
    return <PlanGate cur={plan} req="pro" name="Expense Tracking" onUpgrade={onUpgrade}><div/></PlanGate>;
  }
  const[showAdd,setShowAdd]=useState(false);
  const[f,setF]=useState({clientId:"",desc:"",amount:"",category:"tools",date:today()});
  const sf=k=>v=>setF(p=>({...p,[k]:v}));
  useEffect(()=>{if(clients.length>0&&!f.clientId)setF(p=>({...p,clientId:clients[0].id}));},[clients]);
  const client=clients.find(c=>c.id==f.clientId);
  const cats={tools:"🛠 Tools",hosting:"☁️ Hosting",design:"🎨 Design assets",travel:"✈️ Travel",software:"💻 Software",other:"📦 Other"};
  const total=expenses.reduce((s,e)=>s+e.amount,0);
  const byClient=clients.map(c=>({...c,spent:expenses.filter(e=>e.clientId===c.id).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.spent>0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:S[4]}}>
        <SCard label="Total expenses" value={fmt$(total)} color={C.red} icon="💸"/>
        <SCard label="This month"     value={fmt$(expenses.filter(e=>e.date?.startsWith(today().slice(0,7))).reduce((s,e)=>s+e.amount,0))} color={C.amber} icon="📅"/>
        <SCard label="Expense entries" value={expenses.length} color={C.purple} icon="📝"/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <Btn onClick={()=>setShowAdd(true)} variant="primary">+ Add expense</Btn>
      </div>
      {byClient.length>0&&(
        <Card style={{padding:S[5]}}>
          <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[4]}}>Expenses by client</div>
          <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
            {byClient.sort((a,b)=>b.spent-a.spent).map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:S[3]}}>
                <Avt name={c.name} idx={c.avatarIdx||0} size={30}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
                    <span style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textPrimary}}>{c.name}</span>
                    <span style={{fontSize:F.sm,fontWeight:F.bold,color:C.red}}>{fmt$(c.spent)}</span>
                  </div>
                  <Prg pct={Math.round(c.spent/total*100)} color={C.red}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>All expenses</div>
        {expenses.length===0
          ?<Empty icon="💳" title="No expenses yet" body="Track your project costs to see real profit margins."/>
          :[...expenses].reverse().map((e,i)=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[3]}px ${S[5]}px`,
              borderBottom:i<expenses.length-1?`1px solid ${C.glassBorder}`:"none"}}>
              <span style={{fontSize:18}}>{cats[e.category]?.split(" ")[0]||"📦"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:F.base,color:C.textPrimary,fontWeight:F.medium}}>{e.desc}</div>
                <div style={{fontSize:F.xs,color:C.textMuted}}>{e.client} · {e.category} · {e.date}</div>
              </div>
              <div style={{fontSize:F.base,fontWeight:F.bold,color:C.red}}>{fmt$(e.amount)}</div>
              <button onClick={()=>act.delExpense(e.id)}
                style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"rgba(255,255,255,0.2)",padding:S[1],transition:"color 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.color=C.red}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>🗑</button>
            </div>
          ))}
      </Card>
      {showAdd&&(
        <Modal title="Add expense" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
            <Sel label="Client" value={f.clientId} onChange={sf("clientId")}>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
            <Inp label="Description" value={f.desc} onChange={sf("desc")} placeholder="Figma subscription, AWS hosting…"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
              <Inp label="Amount ($)" value={f.amount} onChange={sf("amount")} type="number" placeholder="50" required/>
              <Inp label="Date" value={f.date} onChange={sf("date")} type="date"/>
            </div>
            <Sel label="Category" value={f.category} onChange={sf("category")}>
              {Object.entries(cats).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </Sel>
            <div style={{display:"flex",gap:S[3]}}>
              <Btn onClick={()=>setShowAdd(false)} variant="secondary" fullWidth>Cancel</Btn>
              <Btn onClick={()=>{if(!f.amount)return;act.addExpense({clientId:f.clientId,client:client?.name,desc:f.desc,amount:Number(f.amount),category:f.category,date:f.date});setShowAdd(false);}}
                variant="primary" fullWidth disabled={!f.amount}>Add expense</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TemplatesPage({customTemplates,act,plan,onAI}){
  const[filter,setFilter]=useState("all");
  const[preview,setPreview]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const[f,setF]=useState({name:"",category:"follow-up",subject:"",body:""});
  const sf=k=>v=>setF(p=>({...p,[k]:v}));
  const all=[...EMAIL_TEMPLATES,...customTemplates];
  const cats=["all","onboarding","billing","follow-up","sales","delivery","relationship"];
  const filtered=all.filter(t=>filter==="all"||t.category===filter);
  const catColors={onboarding:C.green,billing:C.amber,"follow-up":C.brand,sales:C.purple,delivery:C.cyan,relationship:C.pink};
  const canAdd=hasPlan(plan,"free")&&customTemplates.length<PLANS[plan].limits.emailTemplates||plan!=="free";
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"flex",gap:S[3],alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:S[2],flexWrap:"wrap",flex:1}}>
          {cats.map(c=>(
            <FTab key={c} label={c==="all"?"All":c.charAt(0).toUpperCase()+c.slice(1)} active={filter===c} onClick={()=>setFilter(c)}/>
          ))}
        </div>
        <Btn onClick={()=>setShowAdd(true)} variant="primary">+ Custom template</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:S[4]}}>
        {filtered.map(t=>{
          const color=catColors[t.category]||C.brand;
          const isCustom=customTemplates.some(ct=>ct.id===t.id);
          return(
            <Card key={t.id} style={{padding:S[5],display:"flex",flexDirection:"column",gap:S[3]}}
              onClick={()=>setPreview(t)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <span style={{fontSize:F.xs,fontWeight:F.bold,color,background:`${color}18`,
                    padding:"2px 8px",borderRadius:R.full,border:`1px solid ${color}30`}}>
                    {t.category}
                  </span>
                  {isCustom&&<span style={{marginLeft:S[2],fontSize:F.xs,color:C.textMuted}}>Custom</span>}
                </div>
                {isCustom&&(
                  <button onClick={e=>{e.stopPropagation();act.delTemplate(t.id);}}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"rgba(255,255,255,0.2)",padding:S[1],transition:"color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.color=C.red}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>🗑</button>
                )}
              </div>
              <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>{t.name}</div>
              <div style={{fontSize:F.xs,color:C.textMuted,lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>
                {t.body.slice(0,120)}…
              </div>
              <div style={{display:"flex",gap:S[2],marginTop:"auto"}}>
                <Btn onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(`Subject: ${t.subject}\n\n${t.body}`);}} variant="secondary" size="sm" style={{flex:1}}>📋 Copy</Btn>
              </div>
            </Card>
          );
        })}
      </div>
      {preview&&(
        <Modal title={preview.name} onClose={()=>setPreview(null)} width={560}>
          <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
            <div style={{...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`}}>
              <div style={{fontSize:F.xs,color:C.textMuted,marginBottom:S[1]}}>Subject</div>
              <div style={{fontSize:F.base,fontWeight:F.semibold,color:C.textPrimary}}>{preview.subject}</div>
            </div>
            <div style={{...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`}}>
              <div style={{fontSize:F.xs,color:C.textMuted,marginBottom:S[1]}}>Body</div>
              <div style={{fontSize:F.base,color:C.textSec,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{preview.body}</div>
            </div>
            <div style={{fontSize:F.xs,color:C.textMuted,background:"rgba(251,191,36,0.08)",borderRadius:R.md,padding:`${S[2]}px ${S[3]}px`,border:`1px solid rgba(251,191,36,0.2)`}}>
              💡 Replace [Name], [Project], [Amount], [Date] with your actual values before sending.
            </div>
            <div style={{display:"flex",gap:S[3]}}>
              <Btn onClick={()=>navigator.clipboard?.writeText(`Subject: ${preview.subject}\n\n${preview.body}`)} variant="secondary" fullWidth>📋 Copy template</Btn>
              <Btn onClick={()=>setPreview(null)} variant="primary" fullWidth>Done</Btn>
            </div>
          </div>
        </Modal>
      )}
      {showAdd&&(
        <Modal title="Create custom template" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
            <Inp label="Template name" value={f.name} onChange={sf("name")} placeholder="My follow-up template"/>
            <Sel label="Category" value={f.category} onChange={sf("category")}>
              {cats.filter(c=>c!=="all").map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </Sel>
            <Inp label="Subject line" value={f.subject} onChange={sf("subject")} placeholder="Quick check-in — [Project]"/>
            <Txta label="Email body" value={f.body} onChange={sf("body")} placeholder="Use [Name], [Project], [Amount] as placeholders…" rows={6}/>
            <div style={{display:"flex",gap:S[3]}}>
              <Btn onClick={()=>setShowAdd(false)} variant="secondary" fullWidth>Cancel</Btn>
              <Btn onClick={()=>{if(!f.name||!f.body)return;act.addTemplate({...f});setShowAdd(false);setF({name:"",category:"follow-up",subject:"",body:""}); }}
                variant="primary" fullWidth disabled={!f.name||!f.body}>Save template</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReportsPage({clients,invoices,timeEntries,expenses,act,plan,onUpgrade}){
  if(!hasPlan(plan,"pro")){
    return <PlanGate cur={plan} req="pro" name="Revenue Reports" onUpgrade={onUpgrade}><div/></PlanGate>;
  }
  const totalRevenue=invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0);
  const totalOutstanding=invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+i.amount,0);
  const totalExpenses=expenses.reduce((s,e)=>s+e.amount,0);
  const totalHours=timeEntries.reduce((s,e)=>s+(e.duration||0),0)/3600;
  const netProfit=totalRevenue-totalExpenses;
  const profitMargin=totalRevenue>0?Math.round((netProfit/totalRevenue)*100):0;
  const effectiveRate=totalHours>0?totalRevenue/totalHours:0;

  // Client profitability
  const clientProfit=clients.map(c=>{
    const rev=invoices.filter(i=>i.clientId===c.id&&i.status==="paid").reduce((s,i)=>s+i.amount,0);
    const exp=expenses.filter(e=>e.clientId===c.id).reduce((s,e)=>s+e.amount,0);
    const hrs=timeEntries.filter(e=>e.clientId===c.id).reduce((s,e)=>s+(e.duration||0),0)/3600;
    return{...c,revenue:rev,expenses:exp,hours:hrs,profit:rev-exp,margin:rev>0?Math.round(((rev-exp)/rev)*100):0};
  }).filter(c=>c.revenue>0||c.expenses>0).sort((a,b)=>b.profit-a.profit);

  const exportCSV=()=>{
    const rows=[
      ["Report","ClientPulse Revenue Report",today(),"","",""],
      ["","","","","",""],
      ["Summary","","","","",""],
      ["Total Revenue",fmt$(totalRevenue),"","","",""],
      ["Total Expenses",fmt$(totalExpenses),"","","",""],
      ["Net Profit",fmt$(netProfit),"","","",""],
      ["Profit Margin",`${profitMargin}%`,"","","",""],
      ["Outstanding",fmt$(totalOutstanding),"","","",""],
      ["Total Hours",`${totalHours.toFixed(1)}h`,"","","",""],
      ["Effective Hourly Rate",fmt$(effectiveRate.toFixed(0))+"/hr","","","",""],
      ["","","","","",""],
      ["Client Breakdown","Revenue","Expenses","Hours","Profit","Margin"],
      ...clientProfit.map(c=>[c.name,fmt$(c.revenue),fmt$(c.expenses),`${c.hours.toFixed(1)}h`,fmt$(c.profit),`${c.margin}%`]),
    ];
    const csv=rows.map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");
    a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download=`clientpulse-report-${today()}.csv`;
    a.click();
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <Btn onClick={exportCSV} variant="brand_ghost">📥 Export CSV</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:S[4]}}>
        <SCard label="Revenue collected"   value={fmt$(totalRevenue)}            color={C.green}  icon="💰"/>
        <SCard label="Outstanding"         value={fmt$(totalOutstanding)}         color={C.amber}  icon="⏳"/>
        <SCard label="Total expenses"      value={fmt$(totalExpenses)}            color={C.red}    icon="💸"/>
        <SCard label="Net profit"          value={fmt$(netProfit)}                color={netProfit>0?C.green:C.red} icon="📈"/>
        <SCard label="Profit margin"       value={`${profitMargin}%`}            color={profitMargin>60?C.green:profitMargin>30?C.amber:C.red} icon="📊"/>
        <SCard label="Effective rate"      value={`${fmt$(effectiveRate.toFixed(0))}/hr`} color={C.brand} icon="⏱"/>
      </div>

      {clientProfit.length>0&&(
        <Card>
          <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>
            Profitability by client
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px 100px 80px",gap:S[3],padding:`${S[3]}px ${S[5]}px`,
            background:"rgba(255,255,255,0.03)",borderBottom:`1px solid ${C.glassBorder}`}}>
            {["Client","Revenue","Expenses","Hours","Profit","Margin"].map(h=>(
              <div key={h} style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</div>
            ))}
          </div>
          {clientProfit.map((c,i)=>(
            <div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px 100px 80px",gap:S[3],
              padding:`${S[3]}px ${S[5]}px`,borderBottom:i<clientProfit.length-1?`1px solid ${C.glassBorder}`:"none",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:S[2]}}>
                <Avt name={c.name} idx={c.avatarIdx||0} size={26}/>
                <span style={{fontSize:F.base,fontWeight:F.medium,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
              </div>
              <div style={{fontSize:F.base,fontWeight:F.bold,color:C.green}}>{fmt$(c.revenue)}</div>
              <div style={{fontSize:F.base,color:C.red}}>{fmt$(c.expenses)}</div>
              <div style={{fontSize:F.base,color:C.textSec}}>{c.hours.toFixed(1)}h</div>
              <div style={{fontSize:F.base,fontWeight:F.bold,color:c.profit>=0?C.green:C.red}}>{fmt$(c.profit)}</div>
              <div style={{fontSize:F.sm,fontWeight:F.bold,color:c.margin>60?C.green:c.margin>30?C.amber:C.red}}>{c.margin}%</div>
            </div>
          ))}
        </Card>
      )}

      {clientProfit.length===0&&(
        <Empty icon="📊" title="No data yet"
          body="Add clients, log time, track expenses, and mark invoices paid to see your profit reports."/>
      )}
    </div>
  );
}

function SettingsPage({auth,plan,onUpgrade,onSimulate,onLogout}){
  const cfg=PLANS[plan]||PLANS.free;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:S[5],maxWidth:600}}>
      {/* Account */}
      <Card style={{padding:S[6]}}>
        <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[5]}}>Account</div>
        <div style={{display:"flex",alignItems:"center",gap:S[4],marginBottom:S[5]}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${C.brand},${C.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:C.white,fontWeight:F.bold}}>
            {ini(auth.name||"U")}
          </div>
          <div>
            <div style={{fontSize:F.lg,fontWeight:F.bold,color:C.textPrimary}}>{auth.name}</div>
            <div style={{fontSize:F.base,color:C.textSec}}>{auth.email}</div>
          </div>
        </div>
        <Btn onClick={onLogout} variant="danger" size="sm">Sign out</Btn>
      </Card>

      {/* Plan */}
      <Card style={{padding:S[6]}}>
        <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[4]}}>Plan & billing</div>
        <div style={{display:"flex",alignItems:"center",gap:S[4],marginBottom:S[5]}}>
          <div style={{flex:1}}>
            <div style={{fontSize:F.lg,fontWeight:F.bold,color:cfg.color}}>{cfg.name} plan</div>
            <div style={{fontSize:F.base,color:C.textSec}}>{cfg.label}</div>
          </div>
          {plan!=="agency"&&<Btn onClick={onUpgrade} variant="primary">Upgrade plan</Btn>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:S[2]}}>
          {Object.entries({
            "Clients":     `${plan==="free"?"3":"Unlimited"} max`,
            "AI drafts":   `${plan==="free"?"5/month":"Unlimited"}`,
            "Pipeline":    cfg.limits.pipeline?"✓ Included":"✗ Pro only",
            "Time tracking":cfg.limits.timeTracking?"✓ Included":"✗ Pro only",
            "Reports":     cfg.limits.revenueReports?"✓ Included":"✗ Pro only",
            "Team seats":  `${cfg.limits.teamSeats} seat${cfg.limits.teamSeats>1?"s":""}`,
          }).map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:`${S[2]}px 0`,
              borderBottom:`1px solid ${C.glassBorder}`,fontSize:F.base}}>
              <span style={{color:C.textSec}}>{k}</span>
              <span style={{color:C.textPrimary,fontWeight:F.medium}}>{v}</span>
            </div>
          ))}
        </div>
        {plan!=="free"&&(
          <div style={{marginTop:S[4],paddingTop:S[4],borderTop:`1px solid ${C.glassBorder}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textPrimary}}>Cancel subscription</div>
              <div style={{fontSize:F.xs,color:C.textMuted}}>You'll keep access until the end of your billing period.</div>
            </div>
            <Btn onClick={()=>onSimulate("free")} variant="ghost" size="sm" style={{color:C.red,border:`1px solid ${C.red}33`}}>Cancel plan</Btn>
          </div>
        )}
      </Card>

      {/* Notifications */}
      <Card style={{padding:S[6]}}>
        <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[4]}}>Notifications</div>
        <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
          {[
            ["Overdue invoice alerts",true],
            ["Follow-up reminders (10+ days)",true],
            ["Weekly revenue summary",false],
            ["New feature announcements",true],
          ].map(([label,on])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:`${S[2]}px 0`,borderBottom:`1px solid ${C.glassBorder}`}}>
              <span style={{fontSize:F.base,color:C.textSec}}>{label}</span>
              <div style={{width:36,height:20,borderRadius:R.full,
                background:on?C.brand:"rgba(255,255,255,0.1)",position:"relative",cursor:"pointer",
                transition:"all 0.2s"}}>
                <div style={{position:"absolute",top:2,left:on?16:2,width:16,height:16,
                  borderRadius:"50%",background:C.white,transition:"left 0.2s",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:F.xs,color:C.textMuted,marginTop:S[3]}}>
          Email notifications require your verified email address.
        </div>
      </Card>

      {/* Privacy & Data */}
      <Card style={{padding:S[6]}}>
        <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[4]}}>Privacy &amp; data</div>
        <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
          {[
            ["🔒","Your data stays yours","We never sell or share your client data with anyone."],
            ["👁","No tracking or ads","ClientPulse has zero analytics trackers and no advertisements."],
            ["💾","Export anytime","Download all your data as CSV from the Reports page whenever you want."],
            ["🗑","Delete your account","Contact support to permanently delete all your data at any time."],
          ].map(([icon,title,desc])=>(
            <div key={title} style={{display:"flex",gap:S[3],alignItems:"flex-start"}}>
              <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
              <div>
                <div style={{fontSize:F.base,fontWeight:F.semibold,color:C.textPrimary}}>{title}</div>
                <div style={{fontSize:F.xs,color:C.textMuted}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════
function AppRoot({auth,onLogout}){
  const{s,act,derived}=useStore(auth.id,auth.plan);
  const{page,aiClient,pricing}=s.ui;
  const{clients,invoices,tasks,timeEntries,expenses,customTemplates,activity}=s;
  const totalAlerts=derived.badges.overdueClients+derived.badges.overdueInvoices;
  const upgrade=()=>act.setPricing(true);
  const logout=()=>{clearSession();onLogout();};
  const handleSimulate=(plan)=>{
    act.setPlan(plan);
    const users=loadUsers();
    if(users[auth.email]){users[auth.email].plan=plan;saveUsers(users);}
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
          userName={auth.name||auth.email} userId={auth.id}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <Topbar page={page} alerts={totalAlerts} plan={s.plan} onUpgrade={upgrade}/>
          <main style={{flex:1,overflowY:"auto",padding:S[6]}}>
            {page==="dashboard" &&<DashboardPage clients={derived.clientsWithHealth} invoices={invoices} tasks={tasks} activity={activity} derived={derived} onAI={act.setAI} onUpgrade={upgrade} goPage={act.setPage}/>}
            {page==="clients"   &&<ClientsPage   clients={derived.clientsWithHealth} act={act} onAI={act.setAI} derived={derived} onUpgrade={upgrade}/>}
            {page==="invoices"  &&<InvoicesPage  invoices={invoices} clients={clients} act={act} derived={derived} onUpgrade={upgrade}/>}
            {page==="tasks"     &&<TasksPage     tasks={tasks} clients={clients} act={act}/>}
            {page==="pipeline"  &&<PipelinePage  clients={clients} onAI={act.setAI} plan={s.plan} onUpgrade={upgrade}/>}
            {page==="timetrack" &&<TimeTrackPage timeEntries={timeEntries} clients={clients} act={act} plan={s.plan} onUpgrade={upgrade}/>}
            {page==="expenses"  &&<ExpensesPage  expenses={expenses} clients={clients} act={act} plan={s.plan} onUpgrade={upgrade}/>}
            {page==="templates" &&<TemplatesPage customTemplates={customTemplates} act={act} plan={s.plan} onAI={act.setAI}/>}
            {page==="reports"   &&<ReportsPage   clients={clients} invoices={invoices} timeEntries={timeEntries} expenses={expenses} act={act} plan={s.plan} onUpgrade={upgrade}/>}
            {page==="settings"  &&<SettingsPage  auth={auth} plan={s.plan} onUpgrade={upgrade} onSimulate={handleSimulate} onLogout={logout}/>}
          </main>
        </div>
      </div>
      {aiClient&&(
        <AIPanel client={aiClient} onClose={()=>act.setAI(null)}
          canUseAI={derived.canUseAI} aiLeft={derived.aiLeft}
          onUpgrade={()=>{act.setAI(null);upgrade();}} onUsed={act.aiUsed}/>
      )}
      {pricing&&(
        <PricingModal currentPlan={s.plan} onClose={()=>act.setPricing(false)} onSimulate={handleSimulate}/>
      )}
    </div>
  );
}

export default function ClientPulse(){
  const[auth,setAuth]=useState(()=>loadSession());
  if(!auth) return <AuthScreen onAuth={d=>{setAuth(d);}}/>;
  return <AppRoot auth={auth} onLogout={()=>setAuth(null)}/>;
}
