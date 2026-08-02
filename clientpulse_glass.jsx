import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from "react";

// ════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ════════════════════════════════════════════════════════════════
const C = {
  brand:      "#818cf8",
  brandDeep:  "#4f46e5",
  brandGlow:  "rgba(99,102,241,0.35)",
  green:      "#34d399",
  greenGlow:  "rgba(52,211,153,0.3)",
  amber:      "#fbbf24",
  amberGlow:  "rgba(251,191,36,0.3)",
  red:        "#f87171",
  redGlow:    "rgba(248,113,113,0.3)",
  purple:     "#c084fc",
  purpleGlow: "rgba(192,132,252,0.3)",
  cyan:       "#22d3ee",
  white:      "#ffffff",
  // Glass surfaces
  glass:      "rgba(255,255,255,0.08)",
  glassMid:   "rgba(255,255,255,0.12)",
  glassHigh:  "rgba(255,255,255,0.18)",
  glassBorder:"rgba(255,255,255,0.15)",
  glassBorderHover:"rgba(255,255,255,0.30)",
  // Text
  textPrimary:"rgba(255,255,255,0.95)",
  textSec:    "rgba(255,255,255,0.60)",
  textMuted:  "rgba(255,255,255,0.35)",
  // Backgrounds (for modals/cards on dark bg)
  darkSurface:"rgba(15,10,40,0.85)",
  darkBorder: "rgba(255,255,255,0.10)",
};

const R = { sm:6, md:10, lg:14, xl:18, xxl:24, full:9999 };
const F = {
  family: "'Inter',system-ui,sans-serif",
  mono:   "'JetBrains Mono','Fira Code',monospace",
  xs:10, sm:11, base:13, md:14, lg:16, xl:20, xxl:26, hero:34,
  regular:400, medium:500, semibold:600, bold:700, black:800,
};
const S = { 1:4,2:8,3:12,4:16,5:20,6:24,8:32,10:40,12:48 };
const Z = { dropdown:100, modal:200, panel:300, toast:400 };

// Glass style helpers
const glass = (alpha = 0.10, blur = 16) => ({
  background:   `rgba(255,255,255,${alpha})`,
  backdropFilter:`blur(${blur}px) saturate(180%)`,
  WebkitBackdropFilter:`blur(${blur}px) saturate(180%)`,
  border:       `1px solid ${C.glassBorder}`,
});

const glassCard = (extra = {}) => ({
  ...glass(0.08, 20),
  borderRadius: R.xl,
  boxShadow:    "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
  ...extra,
});

// ════════════════════════════════════════════════════════════════
// CONSTANTS / DOMAIN
// ════════════════════════════════════════════════════════════════
const CLIENT_STATUS = {
  active:    { label:"Active",    color:C.green,  bg:"rgba(52,211,153,0.18)"  },
  overdue:   { label:"Overdue",   color:C.red,    bg:"rgba(248,113,113,0.18)" },
  prospect:  { label:"Prospect",  color:C.amber,  bg:"rgba(251,191,36,0.18)"  },
  completed: { label:"Completed", color:C.textSec,bg:"rgba(255,255,255,0.10)" },
};

const INVOICE_STATUS = {
  draft:   { label:"Draft",   color:C.textSec, bg:"rgba(255,255,255,0.10)" },
  sent:    { label:"Sent",    color:C.brand,   bg:"rgba(129,140,248,0.18)" },
  paid:    { label:"Paid",    color:C.green,   bg:"rgba(52,211,153,0.18)"  },
  overdue: { label:"Overdue", color:C.red,     bg:"rgba(248,113,113,0.18)" },
};

const PRIORITY = {
  high:   { label:"High",   color:C.red    },
  medium: { label:"Medium", color:C.amber  },
  low:    { label:"Low",    color:C.green  },
};

const AVATAR_COLORS = [C.brand,C.green,C.amber,C.red,C.purple,C.cyan];

const NAV = [
  { id:"dashboard", label:"Dashboard",   icon:"◈" },
  { id:"clients",   label:"Clients",     icon:"⬡", badgeKey:"overdueClients"    },
  { id:"invoices",  label:"Invoices",    icon:"◻", badgeKey:"overdueInvoices"   },
  { id:"tasks",     label:"Tasks",       icon:"◇", badgeKey:"highPriorityTasks" },
  { id:"pipeline",  label:"Pipeline",    icon:"◑" },
  { id:"launch",    label:"Launch Guide",icon:"↗" },
];

const AI_ACTIONS = [
  { id:"invoice_reminder", emoji:"💸", label:"Invoice reminder"  },
  { id:"warm_checkin",     emoji:"👋", label:"Warm check-in"     },
  { id:"upsell",           emoji:"📈", label:"Upsell next phase" },
  { id:"update_request",   emoji:"🔄", label:"Request update"    },
  { id:"project_wrapup",   emoji:"🎉", label:"Project wrap-up"   },
  { id:"meeting_request",  emoji:"📅", label:"Book a call"       },
];

// ════════════════════════════════════════════════════════════════
// SEED DATA
// ════════════════════════════════════════════════════════════════
const SEED_CLIENTS = [
  { id:"c1", name:"Aria Okonkwo",  company:"Nova Media",        email:"aria@novamedia.io",      phone:"+1 415 555 0101", project:"Brand Identity Redesign",  value:4200, paid:2100, status:"active",    stage:"In Progress",    lastContact:"2026-07-10", dueDate:"2026-08-15", invoicePending:true,  tags:["design","branding"], notes:"Waiting on final logo approval. Client prefers async updates via email.", avatarIdx:0 },
  { id:"c2", name:"James Tran",    company:"Tran Ventures",     email:"james@tranventures.com", phone:"+1 646 555 0202", project:"E-commerce Site Build",     value:7800, paid:0,    status:"overdue",   stage:"Review",         lastContact:"2026-06-28", dueDate:"2026-07-20", invoicePending:true,  tags:["dev","ecommerce"],  notes:"Invoice #INV-003 sent 30 days ago. No response. Follow up urgently.",    avatarIdx:3 },
  { id:"c3", name:"Priya Mehta",   company:"LearnSpark",        email:"priya@learnspark.co",    phone:"+1 512 555 0303", project:"LMS Dashboard UI",          value:3100, paid:3100, status:"active",    stage:"Phase 2",        lastContact:"2026-07-22", dueDate:"2026-09-01", invoicePending:false, tags:["dev","edtech"],     notes:"Phase 1 delivered and approved. Phase 2 scoped. Great communicator.",    avatarIdx:1 },
  { id:"c4", name:"Carlos Ruiz",   company:"Ruiz Real Estate",  email:"carlos@ruizestate.com",  phone:"+1 305 555 0404", project:"SEO Content Package",       value:1800, paid:1800, status:"completed", stage:"Delivered",      lastContact:"2026-07-05", dueDate:"2026-07-01", invoicePending:false, tags:["content","seo"],    notes:"All deliverables signed off. Strong candidate for a Q3 retainer.",       avatarIdx:2 },
  { id:"c5", name:"Yuki Tanaka",   company:"Tanaka Studio",     email:"yuki@tanakastudio.jp",   phone:"+81 3 555 0505",  project:"Mobile App UI Kit",         value:5500, paid:1500, status:"prospect",  stage:"Proposal Sent",  lastContact:"2026-07-18", dueDate:"2026-08-30", invoicePending:false, tags:["design","mobile"],  notes:"Sent proposal 9 days ago. Very interested, awaiting board approval.",    avatarIdx:4 },
];

const SEED_INVOICES = [
  { id:"INV-001", clientId:"c1", client:"Aria Okonkwo", amount:2100, status:"paid",    date:"2026-06-15", due:"2026-06-30", desc:"Brand Identity – Phase 1" },
  { id:"INV-002", clientId:"c1", client:"Aria Okonkwo", amount:2100, status:"sent",    date:"2026-07-10", due:"2026-07-25", desc:"Brand Identity – Phase 2" },
  { id:"INV-003", clientId:"c2", client:"James Tran",   amount:7800, status:"overdue", date:"2026-06-28", due:"2026-07-20", desc:"E-commerce Site – Full Build" },
  { id:"INV-004", clientId:"c3", client:"Priya Mehta",  amount:3100, status:"paid",    date:"2026-07-01", due:"2026-07-15", desc:"LMS Dashboard – Phase 1" },
  { id:"INV-005", clientId:"c4", client:"Carlos Ruiz",  amount:1800, status:"paid",    date:"2026-06-20", due:"2026-07-01", desc:"SEO Content Package" },
  { id:"INV-006", clientId:"c5", client:"Yuki Tanaka",  amount:1500, status:"paid",    date:"2026-07-05", due:"2026-07-15", desc:"Mobile App UI Kit – Deposit" },
];

const SEED_TASKS = [
  { id:"t1", clientId:"c2", client:"James Tran",   text:"Send third invoice follow-up for INV-003",          done:false, due:"2026-07-29", priority:"high"   },
  { id:"t2", clientId:"c1", client:"Aria Okonkwo", text:"Share revised logo concepts (v3)",                  done:false, due:"2026-07-30", priority:"medium" },
  { id:"t3", clientId:"c5", client:"Yuki Tanaka",  text:"Follow up on proposal — decision expected this week",done:false, due:"2026-07-31", priority:"high"   },
  { id:"t4", clientId:"c3", client:"Priya Mehta",  text:"Schedule Phase 2 kickoff call",                     done:true,  due:"2026-07-22", priority:"medium" },
  { id:"t5", clientId:"c4", client:"Carlos Ruiz",  text:"Pitch Q3 content retainer package",                 done:false, due:"2026-08-05", priority:"low"    },
];

const SEED_ACTIVITY = [
  { id:"a1", icon:"🚨", text:"INV-003 from James Tran is 8 days overdue",       time:"Just now"  },
  { id:"a2", icon:"⚠️", text:"James Tran: 30 days without contact",             time:"Alert"     },
  { id:"a3", icon:"✨", text:"AI drafted check-in email for Yuki Tanaka",       time:"2h ago"    },
  { id:"a4", icon:"✅", text:"Priya Mehta paid INV-004 · $3,100 collected",     time:"3 days ago"},
  { id:"a5", icon:"📝", text:"Updated project notes for Aria Okonkwo",          time:"5 days ago"},
];

// ════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════
const fmt$  = (n) => "$" + Number(n || 0).toLocaleString("en-US");
const daysAgo = (d) => Math.floor((Date.now() - new Date(d)) / 86400000);
const today   = () => new Date().toISOString().split("T")[0];
const uid     = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const initials= (n="") => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const pctPaid = (paid=0,total=1) => Math.min(100,Math.round((paid/total)*100));
const parseTags=(t)=> Array.isArray(t)?t:(t||"").split(",").map(s=>s.trim()).filter(Boolean);

const staleness = (days) => days > 21 ? C.red : days > 10 ? C.amber : C.green;

const buildAIPrompt = (client) => `You are ClientPulse AI — a revenue-focused assistant for freelancers.
Draft concise, professional client emails.
Client: ${client.name} | ${client.company} | ${client.email}
Project: "${client.project}" | Value: $${client.value?.toLocaleString()} | Paid: $${(client.paid||0).toLocaleString()}
Status: ${client.status} | Stage: ${client.stage||"—"} | Last contact: ${daysAgo(client.lastContact)}d ago
Invoice pending: ${client.invoicePending?"Yes":"No"} | Due: ${client.dueDate}
Notes: ${client.notes}
Rules: address by first name only, under 110 words, warm but confident, format: "Subject: ...\n\n[body]", sign "Best,\n[Your Name]"`.trim();

const buildQuickPrompt = (id, client) => {
  const days = daysAgo(client.lastContact);
  return {
    invoice_reminder: `Draft a ${days>21?"firm":"polite"} invoice reminder for "${client.project}" ($${client.value?.toLocaleString()} outstanding).`,
    warm_checkin:     `Draft a warm check-in for ${client.name}. Don't mention invoices. Just maintain the relationship.`,
    upsell:           `Draft a compelling email proposing a follow-on retainer after "${client.project}" wraps up.`,
    update_request:   `Draft an email requesting ${client.name}'s feedback or approvals to move the project forward.`,
    project_wrapup:   `Draft a project wrap-up email celebrating "${client.project}", summarising outcomes, asking for a testimonial.`,
    meeting_request:  `Draft a short email requesting a 30-min sync call with ${client.name} to discuss next steps.`,
  }[id] || `Draft a professional email to ${client.name}.`;
};

// ════════════════════════════════════════════════════════════════
// STORE
// ════════════════════════════════════════════════════════════════
const ACT = {
  CLIENT_ADD:"CLIENT_ADD", CLIENT_UPDATE:"CLIENT_UPDATE", CLIENT_DELETE:"CLIENT_DELETE",
  CLIENT_MARK_CONTACTED:"CLIENT_MARK_CONTACTED",
  INVOICE_ADD:"INVOICE_ADD", INVOICE_MARK_PAID:"INVOICE_MARK_PAID",
  TASK_ADD:"TASK_ADD", TASK_TOGGLE:"TASK_TOGGLE", TASK_DELETE:"TASK_DELETE",
  UI_PAGE:"UI_PAGE", UI_AI:"UI_AI",
};

const INIT = {
  clients: SEED_CLIENTS, invoices: SEED_INVOICES, tasks: SEED_TASKS, activity: SEED_ACTIVITY,
  ui: { page:"dashboard", aiClient:null },
};

function reducer(state, { type, payload }) {
  switch(type) {
    case ACT.CLIENT_ADD:
      return { ...state, clients:[...state.clients, { ...payload, id:uid(), createdAt:today(), lastContact:today(), tags:parseTags(payload.tags) }]};
    case ACT.CLIENT_UPDATE:
      return { ...state, clients:state.clients.map(c => c.id===payload.id ? {...c,...payload,tags:parseTags(payload.tags)} : c)};
    case ACT.CLIENT_DELETE:
      return { ...state, clients:state.clients.filter(c=>c.id!==payload)};
    case ACT.CLIENT_MARK_CONTACTED:
      return { ...state, clients:state.clients.map(c=>c.id===payload?{...c,lastContact:today()}:c)};
    case ACT.INVOICE_ADD:
      return { ...state, invoices:[...state.invoices, { ...payload, id:`INV-${String(state.invoices.length+1).padStart(3,"0")}`, date:today() }]};
    case ACT.INVOICE_MARK_PAID:
      return {
        ...state,
        invoices: state.invoices.map(i=>i.id===payload?{...i,status:"paid"}:i),
        clients:  state.clients.map(c=>{
          const inv = state.invoices.find(i=>i.id===payload);
          if(!inv || c.id!==inv.clientId) return c;
          const newPaid=(c.paid||0)+inv.amount;
          return {...c, paid:newPaid, invoicePending:newPaid<c.value};
        }),
      };
    case ACT.TASK_ADD:
      return { ...state, tasks:[...state.tasks,{...payload,id:uid(),done:false}]};
    case ACT.TASK_TOGGLE:
      return { ...state, tasks:state.tasks.map(t=>t.id===payload?{...t,done:!t.done}:t)};
    case ACT.TASK_DELETE:
      return { ...state, tasks:state.tasks.filter(t=>t.id!==payload)};
    case ACT.UI_PAGE:
      return { ...state, ui:{...state.ui,page:payload}};
    case ACT.UI_AI:
      return { ...state, ui:{...state.ui,aiClient:payload}};
    default: return state;
  }
}

function useStore() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const actions = useMemo(() => ({
    addClient:       (d) => dispatch({type:ACT.CLIENT_ADD,            payload:d}),
    updateClient:    (d) => dispatch({type:ACT.CLIENT_UPDATE,         payload:d}),
    deleteClient:    (id)=> dispatch({type:ACT.CLIENT_DELETE,         payload:id}),
    markContacted:   (id)=> dispatch({type:ACT.CLIENT_MARK_CONTACTED, payload:id}),
    addInvoice:      (d) => dispatch({type:ACT.INVOICE_ADD,           payload:d}),
    markInvoicePaid: (id)=> dispatch({type:ACT.INVOICE_MARK_PAID,     payload:id}),
    addTask:         (d) => dispatch({type:ACT.TASK_ADD,              payload:d}),
    toggleTask:      (id)=> dispatch({type:ACT.TASK_TOGGLE,           payload:id}),
    deleteTask:      (id)=> dispatch({type:ACT.TASK_DELETE,           payload:id}),
    setPage:         (p) => dispatch({type:ACT.UI_PAGE,               payload:p}),
    setAI:           (c) => dispatch({type:ACT.UI_AI,                 payload:c}),
  }), []);

  const derived = useMemo(() => {
    const { clients, invoices, tasks } = state;
    const totalPipeline  = clients.reduce((s,c)=>s+c.value,0);
    const totalCollected = clients.reduce((s,c)=>s+(c.paid||0),0);
    const overdueInvs    = invoices.filter(i=>i.status==="overdue");
    const needsFollowUp  = clients.filter(c=>daysAgo(c.lastContact)>10 && c.status!=="completed");
    return {
      totalPipeline, totalCollected,
      outstanding:     totalPipeline - totalCollected,
      overdueInvs,
      overdueAmount:   overdueInvs.reduce((s,i)=>s+i.amount,0),
      activeClients:   clients.filter(c=>c.status==="active").length,
      needsFollowUp,
      openTasks:       tasks.filter(t=>!t.done),
      badges: {
        overdueClients:    clients.filter(c=>c.status==="overdue").length,
        overdueInvoices:   invoices.filter(i=>i.status==="overdue").length,
        highPriorityTasks: tasks.filter(t=>!t.done&&t.priority==="high").length,
      },
    };
  }, [state.clients, state.invoices, state.tasks]);

  return { state, actions, derived };
}

// ════════════════════════════════════════════════════════════════
// AI SERVICE + HOOK
// ════════════════════════════════════════════════════════════════
async function callAI(system, history, userText) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-6", max_tokens:1024, system,
      messages:[...history,{role:"user",content:userText}],
    }),
  });
  if(!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message||`API ${res.status}`); }
  const d = await res.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}

function useAIChat(client) {
  const [msgs,    setMsgs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const sysRef = useRef("");
  sysRef.current = buildAIPrompt(client);

  const send = useCallback(async (text) => {
    if(!text.trim()||loading) return;
    const um = {role:"user",content:text};
    setMsgs(p=>[...p,um]);
    setLoading(true); setError(null);
    try {
      const reply = await callAI(sysRef.current, msgs, text);
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    } catch(e) {
      setError(e.message);
      setMsgs(p=>p.slice(0,-1)); // remove optimistic user msg
    }
    setLoading(false);
  }, [msgs, loading]);

  const reset = useCallback(()=>{setMsgs([]);setLoading(false);setError(null);},[]);
  return {msgs, loading, error, send, reset};
}

// ════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ════════════════════════════════════════════════════════════════
function GBtn({children,onClick,variant="secondary",size="md",disabled=false,fullWidth=false,style:ex={}}) {
  const [hov,setHov]=useState(false);
  const sizes = {sm:{fontSize:F.xs,padding:"5px 12px",borderRadius:R.md},md:{fontSize:F.base,padding:"9px 18px",borderRadius:R.md},lg:{fontSize:F.md,padding:"12px 24px",borderRadius:R.lg}};
  const variants = {
    primary:    {bg:`linear-gradient(135deg,${C.brand},${C.brandDeep})`,color:C.white,border:"none",shadow:`0 4px 20px ${C.brandGlow}`},
    secondary:  {bg:hov?C.glassMid:C.glass,color:C.textPrimary,border:`1px solid ${C.glassBorder}`,shadow:"none"},
    ghost:      {bg:hov?"rgba(255,255,255,0.08)":"transparent",color:C.textSec,border:"none",shadow:"none"},
    danger:     {bg:`linear-gradient(135deg,${C.red},#ef4444)`,color:C.white,border:"none",shadow:`0 4px 16px ${C.redGlow}`},
    success:    {bg:`linear-gradient(135deg,${C.green},#059669)`,color:C.white,border:"none",shadow:`0 4px 16px ${C.greenGlow}`},
    brand_ghost:{bg:hov?"rgba(129,140,248,0.18)":"rgba(129,140,248,0.10)",color:C.brand,border:`1px solid rgba(129,140,248,0.3)`,shadow:"none"},
  };
  const v=variants[variant]||variants.secondary;
  const s=sizes[size]||sizes.md;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...s,background:v.bg,color:v.color,border:v.border,boxShadow:v.shadow,
        fontFamily:F.family,fontWeight:F.semibold,cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.45:1,display:"inline-flex",alignItems:"center",justifyContent:"center",
        gap:S[2],whiteSpace:"nowrap",transition:"all 0.15s",width:fullWidth?"100%":undefined,
        backdropFilter:"blur(8px)", ...ex}}>
      {children}
    </button>
  );
}

function GInput({label,value,onChange,type="text",placeholder="",required=false,style:ex={}}) {
  const [foc,setFoc]=useState(false);
  return (
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
          backdropFilter:"blur(8px)",...ex}} />
    </div>
  );
}

function GTextarea({label,value,onChange,placeholder="",rows=3}) {
  const [foc,setFoc]=useState(false);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[1]}}>
      {label&&<label style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textSec}}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
        style={{padding:"9px 13px",borderRadius:R.md,fontSize:F.base,fontFamily:F.family,
          color:C.textPrimary,outline:"none",resize:"vertical",transition:"all 0.15s",
          background:foc?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",
          border:`1px solid ${foc?"rgba(129,140,248,0.6)":C.glassBorder}`,
          backdropFilter:"blur(8px)"}} />
    </div>
  );
}

function GSelect({label,value,onChange,children}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[1]}}>
      {label&&<label style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textSec}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{padding:"9px 13px",borderRadius:R.md,fontSize:F.base,fontFamily:F.family,
          color:C.textPrimary,outline:"none",cursor:"pointer",
          background:"rgba(15,10,40,0.8)",border:`1px solid ${C.glassBorder}`,
          backdropFilter:"blur(8px)"}}>
        {children}
      </select>
    </div>
  );
}

function GBadge({label,color,bg}) {
  return <span style={{background:bg,color,fontSize:F.xs,fontWeight:F.bold,padding:"3px 9px",borderRadius:R.full,whiteSpace:"nowrap",border:`1px solid ${color}30`}}>{label}</span>;
}

function GAvatar({name,avatarIdx=0,size=38}) {
  const color = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length];
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:`${color}22`,
      color,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:Math.round(size*0.33),fontWeight:F.bold,flexShrink:0,
      border:`1.5px solid ${color}44`,boxShadow:`0 0 12px ${color}33`}}>
      {initials(name)}
    </div>
  );
}

function GCard({children,style:ex={},onClick,glow}) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...glassCard(),
        border:`1px solid ${hov&&onClick?C.glassBorderHover:C.glassBorder}`,
        boxShadow:hov&&onClick?`0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 20px ${glow||C.brandGlow}`:"0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
        cursor:onClick?"pointer":undefined,transition:"all 0.2s",...ex}}>
      {children}
    </div>
  );
}

function GModal({title,onClose,children,width=520}) {
  useEffect(()=>{
    const h=(e)=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[onClose]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.7)",zIndex:Z.modal,
      display:"flex",alignItems:"center",justifyContent:"center",padding:S[6],
      backdropFilter:"blur(12px)"}}>
      <div style={{...glassCard({background:"rgba(20,15,50,0.85)",backdropFilter:"blur(30px) saturate(200%)"}),
        width,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto",borderRadius:R.xxl,
        boxShadow:"0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:`${S[5]}px ${S[6]}px`,borderBottom:`1px solid ${C.glassBorder}`}}>
          <h2 style={{margin:0,fontSize:F.lg,fontWeight:F.bold,color:C.textPrimary}}>{title}</h2>
          <button onClick={onClose} style={{...glass(0.12,8),border:`1px solid ${C.glassBorder}`,
            borderRadius:R.sm,width:28,height:28,cursor:"pointer",color:C.textSec,
            fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:`${S[5]}px ${S[6]}px`}}>{children}</div>
      </div>
    </div>
  );
}

function GProgress({pct,color}) {
  const c=color||(pct===100?C.green:pct>50?C.brand:C.amber);
  return (
    <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:R.full,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c}88,${c})`,
        borderRadius:R.full,transition:"width 0.6s ease",boxShadow:`0 0 8px ${c}66`}}/>
    </div>
  );
}

function StatCard({label,value,sub,trend,color,icon}) {
  return (
    <GCard style={{padding:`${S[5]}px ${S[5]}px`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:S[2]}}>
        <span style={{fontSize:F.sm,color:C.textSec,fontWeight:F.medium}}>{label}</span>
        {icon&&<span style={{fontSize:18,opacity:0.6}}>{icon}</span>}
      </div>
      <div style={{fontSize:F.xxl,fontWeight:F.black,color:color||C.textPrimary,letterSpacing:"-0.025em",lineHeight:1.1,marginBottom:S[1],textShadow:color?`0 0 20px ${color}66`:"none"}}>
        {value}
      </div>
      {sub&&<div style={{fontSize:F.xs,color:C.textMuted}}>{sub}</div>}
      {trend!==undefined&&<div style={{fontSize:F.xs,fontWeight:F.semibold,color:trend>=0?C.green:C.red,marginTop:S[1]}}>
        {trend>=0?"▲":"▼"} {Math.abs(trend)}% vs last month
      </div>}
    </GCard>
  );
}

function EmptyState({icon,title,body,action}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:`${S[12]}px ${S[6]}px`,textAlign:"center",gap:S[3]}}>
      {icon&&<div style={{fontSize:36,opacity:0.3}}>{icon}</div>}
      <div style={{fontSize:F.md,fontWeight:F.semibold,color:C.textSec}}>{title}</div>
      {body&&<div style={{fontSize:F.base,color:C.textMuted,maxWidth:320,lineHeight:1.7}}>{body}</div>}
      {action}
    </div>
  );
}

function FilterTab({label,active,onClick,badge}) {
  const [hov,setHov]=useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{fontSize:F.sm,fontWeight:active?F.bold:F.regular,padding:"7px 15px",borderRadius:R.full,
        border:`1px solid ${active?"rgba(129,140,248,0.6)":hov?"rgba(255,255,255,0.2)":C.glassBorder}`,
        background:active?"rgba(129,140,248,0.2)":hov?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)",
        color:active?C.brand:C.textSec,cursor:"pointer",fontFamily:F.family,
        display:"inline-flex",alignItems:"center",gap:S[1],transition:"all 0.15s",whiteSpace:"nowrap",
        backdropFilter:"blur(8px)"}}>
      {label}
      {badge>0&&<span style={{background:C.red,color:C.white,fontSize:9,fontWeight:F.bold,
        borderRadius:R.full,padding:"1px 5px",minWidth:14,textAlign:"center"}}>{badge}</span>}
    </button>
  );
}

function SearchInput({value,onChange,placeholder="Search…"}) {
  const [foc,setFoc]=useState(false);
  return (
    <div style={{position:"relative",flex:1,minWidth:200}}>
      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.textMuted,pointerEvents:"none"}}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
        style={{width:"100%",padding:"9px 13px 9px 34px",borderRadius:R.md,fontSize:F.base,
          fontFamily:F.family,color:C.textPrimary,outline:"none",boxSizing:"border-box",transition:"all 0.15s",
          background:foc?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",
          border:`1px solid ${foc?"rgba(129,140,248,0.6)":C.glassBorder}`,
          backdropFilter:"blur(12px)",boxShadow:foc?`0 0 0 3px rgba(129,140,248,0.15)`:"none"}} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LAYOUT
// ════════════════════════════════════════════════════════════════
function Sidebar({page,onNavigate,badges}) {
  return (
    <aside style={{width:220,background:"rgba(10,5,30,0.85)",backdropFilter:"blur(20px)",
      display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",
      overflowY:"auto",borderRight:`1px solid ${C.glassBorder}`}}>
      {/* Logo */}
      <div style={{padding:`${S[6]}px ${S[5]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`}}>
        <div style={{display:"flex",alignItems:"center",gap:S[3]}}>
          <div style={{width:34,height:34,borderRadius:R.md,
            background:`linear-gradient(135deg,${C.brand},${C.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,
            boxShadow:`0 4px 20px ${C.brandGlow}`}}>⚡</div>
          <div>
            <div style={{fontSize:F.md,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.02em",lineHeight:1.1}}>ClientPulse</div>
            <div style={{fontSize:F.xs,color:C.textMuted,fontWeight:F.medium}}>AI-powered CRM</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{padding:`${S[3]}px`,display:"flex",flexDirection:"column",gap:2,flex:1}}>
        <div style={{fontSize:9,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",
          letterSpacing:"0.1em",padding:`${S[3]}px ${S[2]}px ${S[2]}px`}}>Navigation</div>
        {NAV.map(item=>{
          const isActive=page===item.id;
          const badge=item.badgeKey?badges[item.badgeKey]:0;
          return <NavItem key={item.id} item={item} isActive={isActive} badge={badge} onClick={()=>onNavigate(item.id)}/>;
        })}
      </nav>

      {/* AI hint */}
      <div style={{padding:`${S[4]}px ${S[3]}px ${S[3]}px`}}>
        <div style={{...glass(0.08,12),borderRadius:R.lg,padding:`${S[3]}px ${S[4]}px`,marginBottom:S[3]}}>
          <div style={{fontSize:F.sm,fontWeight:F.bold,color:C.brand,marginBottom:S[1]}}>✨ AI Drafts</div>
          <div style={{fontSize:F.xs,color:C.textMuted,lineHeight:1.6}}>Open any client → AI Draft to auto-write follow-ups, reminders & upsells.</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:S[2],padding:`${S[1]}px`}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.brand},${C.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:F.xs,color:C.white,fontWeight:F.bold,
            boxShadow:`0 4px 12px ${C.brandGlow}`}}>YF</div>
          <div>
            <div style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textPrimary,lineHeight:1.2}}>Your Freelance Co.</div>
            <div style={{fontSize:F.xs,color:C.textMuted}}>Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({item,isActive,badge,onClick}) {
  const [hov,setHov]=useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:S[3],padding:`${S[2]+1}px ${S[3]}px`,
        borderRadius:R.md,border:"none",cursor:"pointer",fontFamily:F.family,width:"100%",textAlign:"left",
        background:isActive?"rgba(129,140,248,0.18)":hov?"rgba(255,255,255,0.06)":"transparent",
        color:isActive?C.textPrimary:hov?"rgba(255,255,255,0.7)":C.textSec,
        fontWeight:isActive?F.semibold:F.regular,fontSize:F.base,transition:"all 0.15s",
        boxShadow:isActive?`inset 0 0 0 1px rgba(129,140,248,0.3)`:"none"}}>
      <span style={{fontSize:15,width:16,textAlign:"center",flexShrink:0}}>{item.icon}</span>
      <span style={{flex:1}}>{item.label}</span>
      {badge>0&&<span style={{background:C.red,color:C.white,fontSize:9,borderRadius:R.full,
        padding:"2px 6px",fontWeight:F.bold,minWidth:16,textAlign:"center",
        boxShadow:`0 0 8px ${C.redGlow}`}}>{badge}</span>}
    </button>
  );
}

function Topbar({page,alerts=0}) {
  const titles={dashboard:"Dashboard",clients:"Clients",invoices:"Invoices",tasks:"Tasks",pipeline:"Pipeline",launch:"Launch Guide"};
  const subs={dashboard:"Your business at a glance",clients:"Manage relationships and projects",
    invoices:"Track payments and outstanding balances",tasks:"Stay on top of your to-do list",
    pipeline:"Visualise your deal stages",launch:"Your step-by-step roadmap to $10K MRR"};
  const date=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  return (
    <header style={{...glass(0.06,20),borderBottom:`1px solid ${C.glassBorder}`,
      padding:`0 ${S[6]}px`,height:60,display:"flex",alignItems:"center",
      justifyContent:"space-between",flexShrink:0}}>
      <div>
        <h1 style={{margin:0,fontSize:F.lg,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.02em",lineHeight:1.1}}>
          {titles[page]||page}
        </h1>
        <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>{subs[page]}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:S[4]}}>
        <span style={{fontSize:F.xs,color:C.textMuted}}>{date}</span>
        {alerts>0&&<div style={{background:"rgba(248,113,113,0.15)",color:C.red,fontSize:F.xs,
          fontWeight:F.bold,padding:"5px 12px",borderRadius:R.full,
          border:`1px solid rgba(248,113,113,0.3)`,backdropFilter:"blur(8px)"}}>
          🔔 {alerts} alert{alerts!==1?"s":""}
        </div>}
      </div>
    </header>
  );
}

// ════════════════════════════════════════════════════════════════
// AI PANEL
// ════════════════════════════════════════════════════════════════
function AIPanel({client,onClose}) {
  const {msgs,loading,error,send,reset}=useAIChat(client);
  const [input,setInput]=useState("");
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const handleSend=()=>{
    if(!input.trim()||loading)return;
    send(input.trim());
    setInput("");
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,20,0.75)",zIndex:Z.panel,
      display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:S[6],
      backdropFilter:"blur(10px)"}}>
      <div style={{...glassCard({background:"rgba(15,10,40,0.90)",backdropFilter:"blur(40px)"}),
        width:460,height:640,display:"flex",flexDirection:"column",borderRadius:R.xxl,
        boxShadow:"0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",overflow:"hidden"}}>

        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${C.brandDeep}99,${C.purple}66)`,
          backdropFilter:"blur(20px)",padding:`${S[4]}px ${S[5]}px`,
          display:"flex",alignItems:"center",gap:S[3],borderBottom:`1px solid ${C.glassBorder}`,flexShrink:0}}>
          <GAvatar name={client.name} avatarIdx={client.avatarIdx} size={36}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>AI for {client.name.split(" ")[0]}</div>
            <div style={{fontSize:F.xs,color:C.textSec}}>{client.project}</div>
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

        {/* Quick actions */}
        {msgs.length===0&&(
          <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,flexShrink:0}}>
            <div style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",
              letterSpacing:"0.07em",marginBottom:S[3]}}>Quick actions</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[2]}}>
              {AI_ACTIONS.map(a=>(
                <button key={a.id} onClick={()=>send(buildQuickPrompt(a.id,client))}
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

        {/* Messages */}
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
                border:`1px solid ${m.role==="user"?"transparent":C.glassBorder}`,
                backdropFilter:m.role==="assistant"?"blur(8px)":"none"}}>
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
            borderRadius:R.md,padding:`${S[2]}px ${S[3]}px`,border:`1px solid rgba(248,113,113,0.25)`}}>
            ⚠️ {error}
          </div>}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:`${S[3]}px ${S[4]}px`,borderTop:`1px solid ${C.glassBorder}`,
          display:"flex",gap:S[2],flexShrink:0}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="Ask AI to draft anything…"
            style={{flex:1,fontSize:F.base,padding:"9px 13px",borderRadius:R.md,fontFamily:F.family,
              color:C.textPrimary,outline:"none",transition:"all 0.15s",
              background:"rgba(255,255,255,0.06)",border:`1px solid ${C.glassBorder}`,
              backdropFilter:"blur(8px)"}}/>
          <GBtn onClick={handleSend} variant="primary" disabled={loading||!input.trim()} style={{borderRadius:R.md}}>↗</GBtn>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS
// ════════════════════════════════════════════════════════════════
const EMPTY_CLIENT = {name:"",company:"",email:"",phone:"",project:"",value:"",paid:"0",status:"active",stage:"In Progress",dueDate:"",tags:"",notes:""};

function ClientForm({initial,onSave,onClose}) {
  const [f,setF]=useState(initial?{...initial,value:String(initial.value),paid:String(initial.paid||0),
    tags:Array.isArray(initial.tags)?initial.tags.join(", "):initial.tags||""}:EMPTY_CLIENT);
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  const valid=f.name.trim()&&f.email.trim()&&f.project.trim()&&f.value.trim();
  const submit=()=>{
    if(!valid)return;
    onSave({...f,value:Number(f.value)||0,paid:Number(f.paid)||0,
      invoicePending:(Number(f.paid)||0)<(Number(f.value)||0),
      avatarIdx:initial?.avatarIdx??Math.floor(Math.random()*AVATAR_COLORS.length)});
    onClose();
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
        <GInput label="Full name"    value={f.name}    onChange={set("name")}    placeholder="Jane Smith"      required/>
        <GInput label="Company"      value={f.company} onChange={set("company")} placeholder="Acme Inc."/>
        <GInput label="Email"        value={f.email}   onChange={set("email")}   type="email" placeholder="jane@acme.com" required/>
        <GInput label="Phone"        value={f.phone}   onChange={set("phone")}   placeholder="+1 415 000 0000"/>
        <div style={{gridColumn:"1/-1"}}><GInput label="Project name" value={f.project} onChange={set("project")} placeholder="Website Redesign" required/></div>
        <GInput label="Contract value ($)" value={f.value} onChange={set("value")} type="number" placeholder="5000" required/>
        <GInput label="Amount paid ($)"    value={f.paid}  onChange={set("paid")}  type="number" placeholder="0"/>
        <GSelect label="Status" value={f.status} onChange={set("status")}>
          <option value="active">Active</option>
          <option value="prospect">Prospect</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </GSelect>
        <GInput label="Stage"    value={f.stage}   onChange={set("stage")}   placeholder="In Progress"/>
        <GInput label="Due date" value={f.dueDate} onChange={set("dueDate")} type="date"/>
        <GInput label="Tags (comma-separated)" value={f.tags} onChange={set("tags")} placeholder="design, dev, seo"/>
      </div>
      <GTextarea label="Notes" value={f.notes} onChange={set("notes")} placeholder="Any context about this client…" rows={3}/>
      {!valid&&f.name&&<div style={{fontSize:F.xs,color:C.red}}>Please fill in all required fields.</div>}
      <div style={{display:"flex",gap:S[3],marginTop:S[1]}}>
        <GBtn onClick={onClose} variant="secondary" fullWidth>Cancel</GBtn>
        <GBtn onClick={submit} variant="primary" fullWidth disabled={!valid}>{initial?"Save changes":"Add client"}</GBtn>
      </div>
    </div>
  );
}

function ClientCard({client,onSelect,onAI}) {
  const cfg=CLIENT_STATUS[client.status]||CLIENT_STATUS.active;
  const days=daysAgo(client.lastContact);
  const pct=pctPaid(client.paid,client.value);
  const color=AVATAR_COLORS[client.avatarIdx%AVATAR_COLORS.length];
  return (
    <GCard onClick={()=>onSelect(client)} glow={`${color}33`}
      style={{padding:`${S[5]}px`,display:"flex",flexDirection:"column",gap:S[3]}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:S[3]}}>
          <GAvatar name={client.name} avatarIdx={client.avatarIdx} size={40}/>
          <div>
            <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,lineHeight:1.2}}>{client.name}</div>
            <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>{client.company}</div>
          </div>
        </div>
        <GBadge label={cfg.label} color={cfg.color} bg={cfg.bg}/>
      </div>
      <div style={{fontSize:F.xs,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        📁 {client.project}
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
          <span style={{fontSize:F.xs,color:C.textMuted}}>Payment ({pct}%)</span>
          <span style={{fontSize:F.xs,fontWeight:F.bold,color:C.textPrimary}}>${(client.paid||0).toLocaleString()} / ${client.value.toLocaleString()}</span>
        </div>
        <GProgress pct={pct}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:F.xs,color:staleness(days),fontWeight:F.semibold,textShadow:`0 0 10px ${staleness(days)}66`}}>
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
              cursor:"pointer",fontFamily:F.family,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(129,140,248,0.28)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(129,140,248,0.15)";}}>✨ AI</button>
        </div>
      </div>
    </GCard>
  );
}

function ClientDetail({client,onClose,onEdit,onDelete,onAI,onMarkContacted}) {
  const cfg=CLIENT_STATUS[client.status]||CLIENT_STATUS.active;
  const days=daysAgo(client.lastContact);
  const pct=pctPaid(client.paid,client.value);
  return (
    <GModal title="" onClose={onClose} width={560}>
      <div style={{display:"flex",alignItems:"center",gap:S[4],marginBottom:S[5]}}>
        <GAvatar name={client.name} avatarIdx={client.avatarIdx} size={54}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:S[2],marginBottom:S[1]}}>
            <h2 style={{margin:0,fontSize:F.xl,fontWeight:F.black,color:C.textPrimary}}>{client.name}</h2>
            <GBadge label={cfg.label} color={cfg.color} bg={cfg.bg}/>
          </div>
          <div style={{fontSize:F.base,color:C.textSec}}>{client.company}</div>
          <div style={{display:"flex",gap:S[4],marginTop:S[1]}}>
            <a href={`mailto:${client.email}`} style={{fontSize:F.xs,color:C.brand}}>{client.email}</a>
            {client.phone&&<span style={{fontSize:F.xs,color:C.textMuted}}>{client.phone}</span>}
          </div>
        </div>
      </div>

      <div style={{height:1,background:C.glassBorder,marginBottom:S[5]}}/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3],marginBottom:S[5]}}>
        <StatCard label="Contract value" value={fmt$(client.value)} icon="💼"/>
        <StatCard label="Amount paid"    value={fmt$(client.paid||0)} color={client.paid>=client.value?C.green:C.amber} icon="✅"/>
        <StatCard label="Last contacted" value={days===0?"Today":`${days}d ago`} color={days>14?C.red:C.green} icon="🕐"/>
        <StatCard label="Due date"       value={client.dueDate||"—"} icon="📅"/>
      </div>

      <div style={{marginBottom:S[4]}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
          <span style={{fontSize:F.sm,color:C.textSec}}>Payment progress</span>
          <span style={{fontSize:F.sm,fontWeight:F.bold,color:C.textPrimary}}>{pct}%</span>
        </div>
        <GProgress pct={pct}/>
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
        marginBottom:S[4],fontSize:F.base,color:C.textSec,lineHeight:1.7,
        borderLeft:`3px solid ${C.brand}`}}>{client.notes}</div>}

      {client.tags?.length>0&&<div style={{display:"flex",gap:S[1],flexWrap:"wrap",marginBottom:S[5]}}>
        {client.tags.map(t=>(
          <span key={t} style={{fontSize:F.xs,fontWeight:F.semibold,padding:"2px 9px",borderRadius:R.full,
            background:"rgba(129,140,248,0.12)",color:C.brand,border:`1px solid rgba(129,140,248,0.25)`}}>{t}</span>
        ))}
      </div>}

      <div style={{height:1,background:C.glassBorder,marginBottom:S[4]}}/>
      <div style={{display:"flex",gap:S[2],flexWrap:"wrap"}}>
        <GBtn onClick={()=>{onMarkContacted(client.id);onClose();}} variant="success">✅ Mark contacted</GBtn>
        <GBtn onClick={()=>{onAI(client);onClose();}} variant="brand_ghost">✨ AI Draft</GBtn>
        <GBtn onClick={()=>onEdit(client)} variant="secondary">✏️ Edit</GBtn>
        <GBtn onClick={()=>{onDelete(client.id);onClose();}} variant="danger">🗑 Delete</GBtn>
      </div>
    </GModal>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGES
// ════════════════════════════════════════════════════════════════
function BarChart({data,color}) {
  const max=Math.max(...data.map(d=>d.v),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:60}}>
      {data.map((d,i)=>{
        const isLast=i===data.length-1;
        return (
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

function DashboardPage({clients,invoices,tasks,activity,derived,onAI}) {
  const {totalPipeline,totalCollected,outstanding,overdueInvs,activeClients,needsFollowUp}=derived;
  const pct=totalPipeline>0?Math.round((totalCollected/totalPipeline)*100):0;
  const openTasks=tasks.filter(t=>!t.done);
  const chartData=[{label:"Feb",v:3200},{label:"Mar",v:4100},{label:"Apr",v:3800},{label:"May",v:5200},{label:"Jun",v:6100},{label:"Jul",v:totalCollected}];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[6]}}>
      {/* Hero banner */}
      <div style={{background:`linear-gradient(135deg,rgba(79,70,229,0.6),rgba(192,132,252,0.4))`,
        backdropFilter:"blur(20px)",borderRadius:R.xxl,padding:`${S[6]}px ${S[8]}px`,
        border:`1px solid rgba(129,140,248,0.3)`,color:C.textPrimary,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        boxShadow:`0 8px 40px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.15)`}}>
        <div>
          <div style={{fontSize:F.sm,color:"rgba(255,255,255,0.6)",marginBottom:S[1]}}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </div>
          <div style={{fontSize:F.hero-4,fontWeight:F.black,letterSpacing:"-0.025em",lineHeight:1.1}}>Good morning 👋</div>
          <div style={{fontSize:F.base,color:"rgba(255,255,255,0.6)",marginTop:S[2],lineHeight:1.7}}>
            {openTasks.length} tasks pending · {needsFollowUp.length} clients need a follow-up
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:40,fontWeight:F.black,letterSpacing:"-0.035em",lineHeight:1,textShadow:`0 0 40px ${C.brandGlow}`}}>
            {fmt$(totalPipeline)}
          </div>
          <div style={{fontSize:F.sm,color:"rgba(255,255,255,0.5)",marginTop:S[1]}}>total pipeline · {pct}% collected</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:S[4]}}>
        <StatCard label="Revenue collected" value={fmt$(totalCollected)} sub={`${pct}% of pipeline`} trend={12} color={C.green} icon="💰"/>
        <StatCard label="Outstanding"       value={fmt$(outstanding)}    sub={`${clients.filter(c=>c.invoicePending).length} unpaid`} color={outstanding>5000?C.red:C.amber} icon="⏳"/>
        <StatCard label="Overdue invoices"  value={overdueInvs.length}   sub={overdueInvs.length?fmt$(overdueInvs.reduce((s,i)=>s+i.amount,0))+" at risk":"All clear"} color={overdueInvs.length?C.red:C.green} icon="🚨"/>
        <StatCard label="Active clients"    value={activeClients}        sub={`${clients.length} total`} color={C.brand} icon="👥"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:S[5]}}>
        <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
          {/* Chart */}
          <GCard style={{padding:`${S[5]}px ${S[6]}px`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:S[5]}}>
              <div>
                <div style={{fontWeight:F.bold,fontSize:F.lg,color:C.textPrimary}}>Revenue collected</div>
                <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>6-month trend</div>
              </div>
              <span style={{fontSize:F.xs,color:C.green,fontWeight:F.bold,textShadow:`0 0 10px ${C.greenGlow}`}}>▲ 12% vs Jun</span>
            </div>
            <BarChart data={chartData} color={C.brand}/>
          </GCard>

          {/* Top clients */}
          <GCard>
            <div style={{padding:`${S[4]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,
              fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>Top clients by value</div>
            {[...clients].sort((a,b)=>b.value-a.value).slice(0,5).map((c,i)=>{
              const pct=pctPaid(c.paid,c.value);
              const cfg=CLIENT_STATUS[c.status];
              return (
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:S[3],
                  padding:`${S[3]}px ${S[5]}px`,borderBottom:i<4?`1px solid ${C.glassBorder}`:"none"}}>
                  <GAvatar name={c.name} avatarIdx={c.avatarIdx} size={34}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:F.semibold,fontSize:F.base,color:C.textPrimary,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>{c.project}</div>
                    <div style={{marginTop:S[1]}}><GProgress pct={pct}/></div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:F.bold,fontSize:F.base,color:C.textPrimary}}>{fmt$(c.value)}</div>
                    {cfg&&<GBadge label={cfg.label} color={cfg.color} bg={cfg.bg}/>}
                  </div>
                </div>
              );
            })}
          </GCard>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
          {(needsFollowUp.length>0||overdueInvs.length>0)&&(
            <GCard>
              <div style={{padding:`${S[3]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`,
                display:"flex",alignItems:"center",gap:S[2]}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:C.red,display:"inline-block",boxShadow:`0 0 8px ${C.redGlow}`}}/>
                <span style={{fontWeight:F.bold,fontSize:F.base,color:C.textPrimary}}>Needs attention</span>
              </div>
              {[
                ...overdueInvs.slice(0,2).map(inv=>({text:`${inv.client}: ${fmt$(inv.amount)} overdue`,color:C.red,client:clients.find(c=>c.id===inv.clientId)})),
                ...needsFollowUp.slice(0,3).map(c=>({text:`${c.name}: ${daysAgo(c.lastContact)}d no contact`,color:C.amber,client:c})),
              ].slice(0,5).map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:S[2],
                  padding:`${S[3]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:a.color,flexShrink:0,boxShadow:`0 0 6px ${a.color}`}}/>
                  <span style={{fontSize:F.xs,color:C.textSec,flex:1,lineHeight:1.5}}>{a.text}</span>
                  {a.client&&<button onClick={()=>onAI(a.client)}
                    style={{fontSize:F.xs,fontWeight:F.bold,padding:"3px 9px",borderRadius:R.full,
                      background:"rgba(129,140,248,0.15)",color:C.brand,
                      border:`1px solid rgba(129,140,248,0.3)`,cursor:"pointer",fontFamily:F.family,whiteSpace:"nowrap"}}>
                    AI ✨
                  </button>}
                </div>
              ))}
            </GCard>
          )}

          <GCard style={{flex:1}}>
            <div style={{padding:`${S[3]}px ${S[4]}px`,borderBottom:`1px solid ${C.glassBorder}`,
              fontWeight:F.bold,fontSize:F.base,color:C.textPrimary}}>Recent activity</div>
            {activity.map((item,i)=>(
              <div key={item.id} style={{display:"flex",gap:S[3],padding:`${S[3]}px ${S[4]}px`,
                borderBottom:i<activity.length-1?`1px solid ${C.glassBorder}`:"none",alignItems:"flex-start"}}>
                <span style={{fontSize:14,flexShrink:0}}>{item.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:F.xs,color:C.textSec,lineHeight:1.5}}>{item.text}</div>
                  <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{item.time}</div>
                </div>
              </div>
            ))}
          </GCard>
        </div>
      </div>
    </div>
  );
}

function ClientsPage({clients,actions,onAI}) {
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return clients.filter(c=>{
      const matchQ=!q||["name","company","project","email"].some(k=>String(c[k]||"").toLowerCase().includes(q));
      const matchS=statusFilter==="all"||c.status===statusFilter;
      return matchQ&&matchS;
    });
  },[clients,search,statusFilter]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"flex",gap:S[3],alignItems:"center",flexWrap:"wrap"}}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, company, project…"/>
        <div style={{display:"flex",gap:S[2],flexWrap:"wrap"}}>
          {["all","active","overdue","prospect","completed"].map(s=>(
            <FilterTab key={s} label={s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}
              active={statusFilter===s} onClick={()=>setStatusFilter(s)}/>
          ))}
        </div>
        <GBtn onClick={()=>setShowAdd(true)} variant="primary">+ Add client</GBtn>
      </div>

      {filtered.length===0?(
        <EmptyState icon="👥" title="No clients found"
          body={search?`No results for "${search}".`:"Add your first client to get started."}
          action={<GBtn onClick={()=>setShowAdd(true)} variant="primary">Add client</GBtn>}/>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:S[4]}}>
          {filtered.map(c=><ClientCard key={c.id} client={c} onSelect={setSelected} onAI={onAI}/>)}
        </div>
      )}

      {selected&&!editing&&(
        <ClientDetail client={selected} onClose={()=>setSelected(null)}
          onEdit={c=>{setEditing(c);setSelected(null);}}
          onDelete={id=>{actions.deleteClient(id);setSelected(null);}}
          onAI={onAI} onMarkContacted={actions.markContacted}/>
      )}
      {editing&&(
        <GModal title="Edit client" onClose={()=>setEditing(null)}>
          <ClientForm initial={editing} onSave={actions.updateClient} onClose={()=>setEditing(null)}/>
        </GModal>
      )}
      {showAdd&&(
        <GModal title="Add new client" onClose={()=>setShowAdd(false)}>
          <ClientForm onSave={actions.addClient} onClose={()=>setShowAdd(false)}/>
        </GModal>
      )}
    </div>
  );
}

function InvoiceForm({clients,onSave,onClose}) {
  const [f,setF]=useState({clientId:clients[0]?.id||"",desc:"",amount:"",due:"",status:"draft"});
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  // FIX: use == for loose comparison since select value is always string
  const client=clients.find(c=>c.id==f.clientId);
  const valid=!!f.amount&&!!f.clientId;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
      <GSelect label="Client" value={f.clientId} onChange={set("clientId")}>
        {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
      </GSelect>
      <GInput label="Description" value={f.desc} onChange={set("desc")} placeholder="Website design – Phase 1"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
        <GInput label="Amount ($)" value={f.amount} onChange={set("amount")} type="number" placeholder="2500" required/>
        <GInput label="Due date"   value={f.due}    onChange={set("due")}    type="date"/>
      </div>
      <GSelect label="Status" value={f.status} onChange={set("status")}>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
      </GSelect>
      <div style={{display:"flex",gap:S[3]}}>
        <GBtn onClick={onClose} variant="secondary" fullWidth>Cancel</GBtn>
        <GBtn onClick={()=>{if(!valid)return;onSave({clientId:f.clientId,client:client?.name,amount:Number(f.amount),desc:f.desc,due:f.due,status:f.status});onClose();}}
          variant="primary" fullWidth disabled={!valid}>Create invoice</GBtn>
      </div>
    </div>
  );
}

function InvoicesPage({invoices,clients,actions}) {
  const [filter,setFilter]=useState("all");
  const [showAdd,setShowAdd]=useState(false);
  const filtered=invoices.filter(i=>filter==="all"||i.status===filter);
  const totalFor=s=>invoices.filter(i=>s==="all"||i.status===s).reduce((x,i)=>x+i.amount,0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:S[4]}}>
        <StatCard label="Total invoiced" value={fmt$(totalFor("all"))}     icon="📄"/>
        <StatCard label="Paid"           value={fmt$(totalFor("paid"))}    color={C.green} icon="✅"/>
        <StatCard label="Outstanding"    value={fmt$(totalFor("sent"))}    color={C.amber} icon="⏳"/>
        <StatCard label="Overdue"        value={fmt$(totalFor("overdue"))} color={C.red}   icon="🚨"/>
      </div>
      <div style={{display:"flex",gap:S[3],alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:S[2],flexWrap:"wrap"}}>
          {["all","sent","paid","overdue","draft"].map(s=>(
            <FilterTab key={s} label={s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)} active={filter===s} onClick={()=>setFilter(s)}/>
          ))}
        </div>
        <div style={{flex:1}}/>
        <GBtn onClick={()=>setShowAdd(true)} variant="primary">+ New invoice</GBtn>
      </div>
      <GCard>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 1.5fr 100px 110px 140px",gap:S[3],
          padding:`${S[3]}px ${S[5]}px`,borderBottom:`1px solid ${C.glassBorder}`,
          background:"rgba(255,255,255,0.04)"}}>
          {["Invoice","Client","Description","Amount","Due","Status"].map(h=>(
            <div key={h} style={{fontSize:F.xs,fontWeight:F.bold,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</div>
          ))}
        </div>
        {filtered.length===0?<EmptyState icon="📄" title="No invoices" body="Create your first invoice."/>:
          filtered.map((inv,i)=>{
            const cfg=INVOICE_STATUS[inv.status]||INVOICE_STATUS.draft;
            return (
              <div key={inv.id} style={{display:"grid",gridTemplateColumns:"100px 1fr 1.5fr 100px 110px 140px",
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
                  <GBadge label={cfg.label} color={cfg.color} bg={cfg.bg}/>
                  {inv.status!=="paid"&&(
                    <button onClick={()=>actions.markInvoicePaid(inv.id)}
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
      </GCard>
      {showAdd&&<GModal title="Create invoice" onClose={()=>setShowAdd(false)}>
        <InvoiceForm clients={clients} onSave={actions.addInvoice} onClose={()=>setShowAdd(false)}/>
      </GModal>}
    </div>
  );
}

function TaskForm({clients,onSave,onClose}) {
  const [f,setF]=useState({clientId:clients[0]?.id||"",text:"",due:"",priority:"medium"});
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  // FIX: loose comparison for string/id mismatch
  const client=clients.find(c=>c.id==f.clientId);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[4]}}>
      <GSelect label="Client" value={f.clientId} onChange={set("clientId")}>
        {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
      </GSelect>
      <GInput label="Task description" value={f.text} onChange={set("text")} placeholder="Send revised proposal…" required/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:S[3]}}>
        <GInput label="Due date" value={f.due} onChange={set("due")} type="date"/>
        <GSelect label="Priority" value={f.priority} onChange={set("priority")}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </GSelect>
      </div>
      <div style={{display:"flex",gap:S[3]}}>
        <GBtn onClick={onClose} variant="secondary" fullWidth>Cancel</GBtn>
        <GBtn onClick={()=>{if(!f.text.trim())return;onSave({clientId:f.clientId,client:client?.name,text:f.text,due:f.due,priority:f.priority});onClose();}}
          variant="primary" fullWidth disabled={!f.text.trim()}>Add task</GBtn>
      </div>
    </div>
  );
}

function TasksPage({tasks,clients,actions}) {
  const [filter,setFilter]=useState("open");
  const [showAdd,setShowAdd]=useState(false);
  const filtered=tasks.filter(t=>filter==="all"?true:filter==="open"?!t.done:t.done)
    .sort((a,b)=>{
      if(a.done!==b.done)return a.done?1:-1;
      const o={high:0,medium:1,low:2};
      return (o[a.priority]??1)-(o[b.priority]??1);
    });
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:S[4]}}>
        <StatCard label="Open tasks"    value={tasks.filter(t=>!t.done).length}                          color={C.brand} icon="📋"/>
        <StatCard label="High priority" value={tasks.filter(t=>!t.done&&t.priority==="high").length}     color={C.red}   icon="🔥"/>
        <StatCard label="Completed"     value={tasks.filter(t=>t.done).length}                           color={C.green} icon="✅"/>
      </div>
      <div style={{display:"flex",gap:S[3],alignItems:"center"}}>
        <div style={{display:"flex",gap:S[2]}}>
          {[["open","Open"],["done","Done"],["all","All"]].map(([v,l])=>(
            <FilterTab key={v} label={l} active={filter===v} onClick={()=>setFilter(v)}/>
          ))}
        </div>
        <div style={{flex:1}}/>
        <GBtn onClick={()=>setShowAdd(true)} variant="primary">+ Add task</GBtn>
      </div>
      <GCard>
        {filtered.length===0?<EmptyState icon="✅" title="Nothing here" body="All caught up!" action={<GBtn onClick={()=>setShowAdd(true)} variant="primary">Add task</GBtn>}/>:
          filtered.map((t,i)=>{
            const p=PRIORITY[t.priority]||PRIORITY.medium;
            const isOverdue=t.due&&!t.done&&new Date(t.due)<new Date();
            return (
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:S[3],
                padding:`${S[4]}px ${S[5]}px`,borderBottom:i<filtered.length-1?`1px solid ${C.glassBorder}`:"none",
                opacity:t.done?0.45:1,transition:"opacity 0.2s"}}>
                <input type="checkbox" checked={t.done} onChange={()=>actions.toggleTask(t.id)}
                  style={{width:16,height:16,cursor:"pointer",accentColor:C.brand,flexShrink:0}}/>
                <span style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,boxShadow:`0 0 6px ${p.color}88`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:F.base,color:C.textPrimary,fontWeight:F.medium,
                    textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
                  <div style={{fontSize:F.xs,color:C.textMuted,marginTop:2}}>
                    {t.client}{t.due&&<span style={{color:isOverdue?C.red:C.textMuted}}> · Due {t.due}</span>}
                  </div>
                </div>
                <span style={{fontSize:F.xs,fontWeight:F.semibold,color:p.color,
                  background:`${p.color}15`,padding:"2px 8px",borderRadius:R.full,
                  border:`1px solid ${p.color}30`,whiteSpace:"nowrap"}}>{p.label}</span>
                <button onClick={()=>actions.deleteTask(t.id)}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:14,
                    color:"rgba(255,255,255,0.2)",padding:S[1],lineHeight:1,transition:"color 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.red;}}
                  onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.2)";}}>🗑</button>
              </div>
            );
          })}
      </GCard>
      {showAdd&&<GModal title="Add task" onClose={()=>setShowAdd(false)}>
        <TaskForm clients={clients} onSave={actions.addTask} onClose={()=>setShowAdd(false)}/>
      </GModal>}
    </div>
  );
}

function PipelinePage({clients,onAI}) {
  const STAGES=[
    {id:"prospect",label:"Prospect",color:C.amber},
    {id:"active",  label:"Active",  color:C.brand},
    {id:"overdue", label:"Overdue", color:C.red  },
    {id:"completed",label:"Done",   color:C.green},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[5]}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:S[4]}}>
        {STAGES.map(stage=>{
          const sc=clients.filter(c=>c.status===stage.id);
          const total=sc.reduce((s,c)=>s+c.value,0);
          return (
            <GCard key={stage.id} style={{padding:`${S[4]}px ${S[5]}px`,borderTop:`3px solid ${stage.color}`,boxShadow:`0 8px 32px rgba(0,0,0,0.25), 0 0 20px ${stage.color}22`}}>
              <div style={{fontSize:F.xs,color:C.textSec,marginBottom:S[2]}}>{stage.label}</div>
              <div style={{fontSize:F.xxl,fontWeight:F.black,color:C.textPrimary,letterSpacing:"-0.02em",textShadow:`0 0 20px ${stage.color}55`}}>{fmt$(total)}</div>
              <div style={{fontSize:F.xs,color:C.textMuted,marginTop:S[1]}}>{sc.length} client{sc.length!==1?"s":""}</div>
            </GCard>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:S[4],alignItems:"start"}}>
        {STAGES.map(stage=>{
          const sc=clients.filter(c=>c.status===stage.id);
          return (
            <div key={stage.id}>
              <div style={{display:"flex",alignItems:"center",gap:S[2],marginBottom:S[3],padding:`0 ${S[1]}px`}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:stage.color,boxShadow:`0 0 8px ${stage.color}`}}/>
                <span style={{fontSize:F.sm,fontWeight:F.bold,color:C.textPrimary}}>{stage.label}</span>
                <span style={{fontSize:10,fontWeight:F.bold,background:`${stage.color}18`,color:stage.color,
                  borderRadius:R.full,padding:"1px 7px",border:`1px solid ${stage.color}30`}}>{sc.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
                {sc.length===0?(
                  <div style={{...glass(0.04,8),borderRadius:R.lg,border:`1px dashed ${C.glassBorder}`,
                    padding:`${S[6]}px ${S[4]}px`,textAlign:"center",fontSize:F.xs,color:C.textMuted}}>
                    No clients here
                  </div>
                ):sc.map(c=>{
                  const pct=pctPaid(c.paid,c.value);
                  return (
                    <GCard key={c.id} style={{padding:`${S[3]}px ${S[4]}px`,display:"flex",flexDirection:"column",gap:S[2]}}>
                      <div style={{display:"flex",alignItems:"center",gap:S[2]}}>
                        <GAvatar name={c.name} avatarIdx={c.avatarIdx} size={30}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:F.sm,fontWeight:F.semibold,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                          <div style={{fontSize:F.xs,color:C.textMuted}}>{c.company}</div>
                        </div>
                      </div>
                      <div style={{fontSize:F.xs,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📁 {c.project}</div>
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:S[1]}}>
                          <span style={{fontSize:9,color:C.textMuted}}>{pct}%</span>
                          <span style={{fontSize:F.xs,fontWeight:F.bold,color:C.textPrimary}}>{fmt$(c.value)}</span>
                        </div>
                        <GProgress pct={pct}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:10,color:C.textMuted}}>{c.stage||"—"}</span>
                        <button onClick={()=>onAI(c)}
                          style={{fontSize:10,fontWeight:F.bold,padding:"2px 8px",borderRadius:R.full,
                            background:"rgba(129,140,248,0.15)",color:C.brand,
                            border:`1px solid rgba(129,140,248,0.3)`,cursor:"pointer",fontFamily:F.family}}>✨ AI</button>
                      </div>
                    </GCard>
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
    {icon:"1",head:"Deploy your stack (zero upfront cost)",body:"Push to Vercel (free, 3 minutes). Register a domain on Namecheap (~$10/yr). Set up Lemon Squeezy for subscriptions — zero monthly fee, only 5% per transaction. Get your Anthropic API key at console.anthropic.com. Total Day 1 cost: ~$10."},
    {icon:"2",head:"Define your ICP precisely",body:"Solo freelancers (designers, devs, copywriters) with 5–15 active clients, earning $3K–$15K/month, tracking everything in Notion or spreadsheets. They're in pain daily. Find them on Twitter/X, Reddit (r/freelance, r/webdev), and LinkedIn."},
    {icon:"3",head:"Post in 5 communities for 50 beta users",body:"Post in r/freelance, r/webdev, r/graphic_design, r/forhire, Indie Hackers: 'I built a free AI CRM for freelancers — looking for 50 beta testers.' Don't pitch. Ask for feedback. Aim for 50 signups in Week 1."},
    {icon:"4",head:"DM 30 target freelancers on LinkedIn",body:"Search 'freelance designer' or 'freelance developer'. Send: 'Hey [Name] — I built a CRM with AI email drafting. Would you try it free and give me 10 min of feedback?' Close 5–10 testers."},
  ]},
  {emoji:"💰",title:"Week 3–4: First Revenue",color:C.green,steps:[
    {icon:"5",head:"Set your 3-tier pricing",body:"Free: 3 clients, no AI. Pro ($39/mo): unlimited clients + AI drafts + invoices. Agency ($79/mo): 3 team seats + white-label. Offer beta users permanent 50% off if they convert before launch. 26 Pro users = $1,000 MRR."},
    {icon:"6",head:"Convert beta → paid with urgency",body:"Email beta users Day 7: 'The free beta closes Friday — lock in 50% off forever as a founding member.' Expect 10–20% conversion. 50 beta users → 5–10 paying = $200–$500 MRR immediately."},
    {icon:"7",head:"Launch on Product Hunt (Thursday)",body:"Schedule for Thursday 12:01 AM EST. Prepare a 60-sec GIF, 5 screenshots, punchy tagline. Brief beta users to upvote at launch. Top 5 of the day = 500–2,000 new signups in 24 hours."},
    {icon:"8",head:"Start a daily Twitter/X content flywheel",body:"Post every weekday: client tips, invoice templates, follow-up scripts, MRR updates (#BuildInPublic). 500 followers → 50 warm leads/month. This compounds over months."},
  ]},
  {emoji:"📈",title:"Month 2–3: Scale to $5K MRR",color:C.purple,steps:[
    {icon:"9",head:"Launch a referral program",body:"In-app: 'Give 1 month free — get 1 month free.' Each user brings 1.2 more on average. Use ReferralHero ($49/mo) to automate tracking. This is the highest-ROI growth channel at this stage."},
    {icon:"10",head:"YouTube Shorts / TikTok tutorials",body:"'How I follow up with 20 clients in 10 minutes using AI' — record a 3-min screen share. Post on Shorts and TikTok. Freelancer content gets 5K–100K views organically. One video = 100–500 new signups."},
    {icon:"11",head:"Partner with freelance educators",body:"Find 5 coaches on YouTube/Twitter with 10K+ followers. Offer 30% recurring affiliate commission. One good partner can bring 50–200 paid users. Use Lemon Squeezy's built-in affiliate tracking."},
    {icon:"12",head:"Add Stripe payments + invoice sending",body:"Let users send real invoices and collect payment inside ClientPulse. Users who collect money inside the tool have 3× lower churn. Also charge a 0.5% platform fee — a second revenue stream."},
  ]},
  {emoji:"🚀",title:"Month 4–6: $10K+ MRR",color:C.amber,steps:[
    {icon:"★",head:"SEO content machine",body:"Write 20 posts targeting 'crm for freelancers', 'freelance invoice template', 'client management software'. Each brings 50–500 monthly visitors. SEO compounds — by month 6 it's your largest traffic source."},
    {icon:"★",head:"Public changelog + roadmap voting",body:"Post every feature update publicly. Ask users to vote on what to build next (Canny.io, free). Users who submit feature requests have 4× lower churn. Ship one user-requested feature per week."},
    {icon:"★",head:"Move upmarket: agency plan",body:"Agencies manage 20–100 clients and pay $149–$299/mo. Add shared workspace, role permissions, team AI credits, client portal. One agency = 5–8× the revenue of one solo user."},
    {icon:"★",head:"AppSumo marketplace deal",body:"Apply at appsumo.com/sell. 1M+ buyer list. Typical: $69–$99 lifetime, 30–40% to you. 300 sales = $6K–$12K in one week + 300 vocal advocates. Fastest path to $10K MRR."},
  ]},
];

const METRICS=[
  {month:"Month 1", mrr:"$500",    users:"13 paid",  cac:"$0",  action:"Beta → paid conversion"},
  {month:"Month 2", mrr:"$1,500",  users:"38 paid",  cac:"$12", action:"Product Hunt + referrals"},
  {month:"Month 3", mrr:"$3,500",  users:"90 paid",  cac:"$18", action:"Content flywheel + affiliates"},
  {month:"Month 6", mrr:"$10,000", users:"256 paid", cac:"$25", action:"SEO + agency plan"},
  {month:"Month 12",mrr:"$30,000+",users:"750+ paid",cac:"$30", action:"Self-serve + expansion"},
];

const STACK=[
  {tool:"Vercel",        use:"Hosting",              cost:"Free"         },
  {tool:"Supabase",      use:"Database + auth",      cost:"Free"         },
  {tool:"Anthropic API", use:"AI email drafts",      cost:"~$0.003/draft"},
  {tool:"Lemon Squeezy", use:"Subscriptions",        cost:"5% fee only"  },
  {tool:"Resend",        use:"Transactional email",  cost:"Free to 3K/mo"},
  {tool:"PostHog",       use:"Analytics",            cost:"Free to 1M/mo"},
  {tool:"Canny",         use:"Feature roadmap",      cost:"Free"         },
  {tool:"ReferralHero",  use:"Referral program",     cost:"$49/mo"       },
];

function LaunchGuidePage() {
  const [open,setOpen]=useState(0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:S[6]}}>
      <div style={{background:`linear-gradient(135deg,rgba(15,10,40,0.9),rgba(30,15,70,0.85))`,
        backdropFilter:"blur(20px)",borderRadius:R.xxl,padding:`${S[8]}px`,color:C.textPrimary,
        border:`1px solid ${C.glassBorder}`,boxShadow:"0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"}}>
        <div style={{fontSize:F.xs,fontWeight:F.bold,textTransform:"uppercase",letterSpacing:"0.1em",color:C.textMuted,marginBottom:S[3]}}>
          Your step-by-step playbook
        </div>
        <div style={{fontSize:40,fontWeight:F.black,letterSpacing:"-0.03em",lineHeight:1.05,marginBottom:S[4],textShadow:`0 0 40px ${C.brandGlow}`}}>
          From $0 to $10K MRR<br/>in 6 months.
        </div>
        <div style={{fontSize:F.base,color:C.textSec,lineHeight:1.7,maxWidth:560}}>
          A realistic, no-fluff roadmap built specifically for ClientPulse.{" "}
          <strong style={{color:C.brand}}>The #1 mistake founders make is trying to scale before 10 paying customers.</strong>{" "}
          Don't skip ahead.
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:S[3]}}>
        {PHASES.map((phase,pi)=>(
          <GCard key={pi} style={{overflow:"hidden"}}>
            <button onClick={()=>setOpen(open===pi?-1:pi)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:S[4],
                padding:`${S[4]}px ${S[6]}px`,background:"none",border:"none",cursor:"pointer",
                fontFamily:F.family,textAlign:"left"}}>
              <span style={{fontSize:22}}>{phase.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:F.md,fontWeight:F.bold,color:C.textPrimary}}>{phase.title}</div>
              </div>
              <div style={{width:28,height:28,borderRadius:"50%",background:`${phase.color}18`,color:phase.color,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:F.md,fontWeight:F.bold,
                flexShrink:0,boxShadow:`0 0 12px ${phase.color}33`}}>
                {open===pi?"−":"+"}
              </div>
            </button>
            {open===pi&&(
              <div style={{borderTop:`1px solid ${C.glassBorder}`,padding:`${S[5]}px ${S[6]}px`,
                display:"flex",flexDirection:"column",gap:S[5]}}>
                {phase.steps.map((step,si)=>(
                  <div key={si} style={{display:"flex",gap:S[4]}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:`${phase.color}15`,color:phase.color,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:F.sm,
                      fontWeight:F.black,flexShrink:0,marginTop:2,border:`1px solid ${phase.color}30`}}>{step.icon}</div>
                    <div>
                      <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[1]}}>{step.head}</div>
                      <div style={{fontSize:F.base,color:C.textSec,lineHeight:1.7}}>{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GCard>
        ))}
      </div>

      <GCard>
        <div style={{padding:`${S[4]}px ${S[6]}px`,borderBottom:`1px solid ${C.glassBorder}`,
          fontWeight:F.bold,fontSize:F.md,color:C.textPrimary}}>📊 Realistic revenue projections</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"rgba(255,255,255,0.03)"}}>
                {["Month","MRR Target","Paid Users","Avg CAC","Key lever"].map(h=>(
                  <th key={h} style={{padding:`${S[3]}px ${S[5]}px`,fontSize:F.xs,fontWeight:F.bold,
                    color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((r,i)=>(
                <tr key={i} style={{borderTop:`1px solid ${C.glassBorder}`}}>
                  <td style={{padding:`${S[4]}px ${S[5]}px`,fontSize:F.base,fontWeight:F.bold,color:C.textPrimary}}>{r.month}</td>
                  <td style={{padding:`${S[4]}px ${S[5]}px`,fontSize:F.base,fontWeight:F.black,color:C.green,textShadow:`0 0 10px ${C.greenGlow}`}}>{r.mrr}</td>
                  <td style={{padding:`${S[4]}px ${S[5]}px`,fontSize:F.base,color:C.textSec}}>{r.users}</td>
                  <td style={{padding:`${S[4]}px ${S[5]}px`,fontSize:F.base,color:C.textMuted}}>{r.cac}</td>
                  <td style={{padding:`${S[4]}px ${S[5]}px`,fontSize:F.sm,color:C.textSec}}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCard>

      <GCard style={{padding:`${S[5]}px ${S[6]}px`}}>
        <div style={{fontWeight:F.bold,fontSize:F.md,color:C.textPrimary,marginBottom:S[4]}}>🛠 Essential tool stack (mostly free)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:S[3]}}>
          {STACK.map(t=>(
            <div key={t.tool} style={{...glass(0.06,8),borderRadius:R.md,padding:`${S[3]}px ${S[4]}px`,
              display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${C.glassBorder}`}}>
              <div>
                <div style={{fontSize:F.base,fontWeight:F.bold,color:C.textPrimary}}>{t.tool}</div>
                <div style={{fontSize:F.xs,color:C.textMuted}}>{t.use}</div>
              </div>
              <span style={{fontSize:F.xs,fontWeight:F.bold,color:C.green,background:"rgba(52,211,153,0.12)",
                padding:"3px 9px",borderRadius:R.full,border:`1px solid rgba(52,211,153,0.25)`,whiteSpace:"nowrap"}}>{t.cost}</span>
            </div>
          ))}
        </div>
      </GCard>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════
function AppRoot() {
  const {state,actions,derived}=useStore();
  const {page,aiClient}=state.ui;
  const {clients,invoices,tasks,activity}=state;
  const totalAlerts=derived.badges.overdueClients+derived.badges.overdueInvoices;

  return (
    <div style={{display:"flex",minHeight:"100vh",
      background:"linear-gradient(135deg,#05031e 0%,#0d0826 40%,#0a1628 100%)",
      fontFamily:F.family,position:"relative",overflow:"hidden"}}>
      {/* Background orbs */}
      <div style={{position:"fixed",top:-200,left:-200,width:600,height:600,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-300,right:-100,width:700,height:700,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(192,132,252,0.08) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"40%",right:"20%",width:400,height:400,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(34,211,238,0.05) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,display:"flex",width:"100%"}}>
        <Sidebar page={page} onNavigate={actions.setPage} badges={derived.badges}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <Topbar page={page} alerts={totalAlerts}/>
          <main style={{flex:1,overflowY:"auto",padding:S[6]}}>
            {page==="dashboard"&&<DashboardPage clients={clients} invoices={invoices} tasks={tasks} activity={activity} derived={derived} onAI={actions.setAI}/>}
            {page==="clients"  &&<ClientsPage   clients={clients} actions={actions} onAI={actions.setAI}/>}
            {page==="invoices" &&<InvoicesPage  invoices={invoices} clients={clients} actions={actions}/>}
            {page==="tasks"    &&<TasksPage     tasks={tasks} clients={clients} actions={actions}/>}
            {page==="pipeline" &&<PipelinePage  clients={clients} onAI={actions.setAI}/>}
            {page==="launch"   &&<LaunchGuidePage/>}
          </main>
        </div>
      </div>
      {aiClient&&<AIPanel client={aiClient} onClose={()=>actions.setAI(null)}/>}
    </div>
  );
}

export default function ClientPulse() {
  return <AppRoot/>;
}
