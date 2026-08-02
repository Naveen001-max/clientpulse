import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from "react";


// ────────────────────────────────────────────────────────────
// src/constants/tokens.js
// ────────────────────────────────────────────────────────────

/**
 * Design tokens — single source of truth.
 * Every color, spacing, radius, shadow, and typography decision
 * flows from here. No magic strings anywhere else in the codebase.
 */

const COLOR = {
  // Brand
  brand50:  "#eef2ff",
  brand100: "#e0e7ff",
  brand200: "#c7d2fe",
  brand400: "#818cf8",
  brand500: "#6366f1",
  brand600: "#4f46e5",
  brand700: "#4338ca",

  // Semantic
  success50:  "#f0fdf4",
  success100: "#dcfce7",
  success500: "#22c55e",
  success600: "#16a34a",

  warning50:  "#fffbeb",
  warning100: "#fef3c7",
  warning500: "#f59e0b",
  warning600: "#d97706",

  danger50:  "#fef2f2",
  danger100: "#fee2e2",
  danger500: "#ef4444",
  danger600: "#dc2626",

  purple500: "#a855f7",
  purple600: "#9333ea",
  cyan500:   "#06b6d4",

  // Neutral (slate)
  white:    "#ffffff",
  slate50:  "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  black:    "#000000",
};

const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

const SHADOW = {
  xs:  "0 1px 2px rgba(0,0,0,.05)",
  sm:  "0 1px 4px rgba(0,0,0,.08)",
  md:  "0 4px 12px rgba(0,0,0,.10)",
  lg:  "0 8px 24px rgba(0,0,0,.12)",
  xl:  "0 20px 60px rgba(0,0,0,.18)",
  brand: `0 4px 14px rgba(99,102,241,.35)`,
};

const FONT = {
  family: "'Inter', system-ui, -apple-system, sans-serif",
  mono:   "'JetBrains Mono', 'Fira Code', monospace",

  size: {
    xs:   10,
    sm:   11,
    base: 13,
    md:   14,
    lg:   16,
    xl:   20,
    xxl:  26,
    hero: 32,
  },

  weight: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },

  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

const SPACE = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
};

const TRANSITION = {
  fast:   "all 0.1s ease",
  base:   "all 0.18s ease",
  slow:   "all 0.3s ease",
  bounce: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
};

const BREAKPOINT = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const ZINDEX = {
  dropdown: 100,
  modal:    200,
  panel:    300,
  toast:    400,
};

// ────────────────────────────────────────────────────────────
// src/constants/domain.js
// ────────────────────────────────────────────────────────────

const CLIENT_STATUS = {
  active:    { label: "Active",    color: COLOR.success600, bg: COLOR.success100 },
  overdue:   { label: "Overdue",   color: COLOR.danger600,  bg: COLOR.danger100  },
  prospect:  { label: "Prospect",  color: COLOR.warning600, bg: COLOR.warning100 },
  completed: { label: "Completed", color: COLOR.slate500,   bg: COLOR.slate100   },
};

const INVOICE_STATUS = {
  draft:   { label: "Draft",   color: COLOR.slate500,   bg: COLOR.slate100   },
  sent:    { label: "Sent",    color: COLOR.brand600,   bg: COLOR.brand50    },
  paid:    { label: "Paid",    color: COLOR.success600, bg: COLOR.success100 },
  overdue: { label: "Overdue", color: COLOR.danger600,  bg: COLOR.danger100  },
};

const PRIORITY = {
  high:   { label: "High",   color: COLOR.danger500  },
  medium: { label: "Medium", color: COLOR.warning500 },
  low:    { label: "Low",    color: COLOR.success500 },
};

const AVATAR_PALETTE = [
  { bg: COLOR.brand500,   text: "#fff" },
  { bg: COLOR.success500, text: "#fff" },
  { bg: COLOR.warning500, text: "#fff" },
  { bg: COLOR.danger500,  text: "#fff" },
  { bg: COLOR.purple500,  text: "#fff" },
  { bg: COLOR.cyan500,    text: "#fff" },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",    icon: "◈",  badgeKey: null          },
  { id: "clients",   label: "Clients",      icon: "⬡",  badgeKey: "overdueClients" },
  { id: "invoices",  label: "Invoices",     icon: "◻",  badgeKey: "overdueInvoices" },
  { id: "tasks",     label: "Tasks",        icon: "◇",  badgeKey: "highPriorityTasks" },
  { id: "pipeline",  label: "Pipeline",     icon: "◑",  badgeKey: null          },
  { id: "launch",    label: "Launch Guide", icon: "↗",  badgeKey: null          },
];

const AI_QUICK_ACTIONS = [
  { id: "invoice_reminder",  emoji: "💸", label: "Invoice reminder",    promptKey: "invoice_reminder"  },
  { id: "warm_checkin",      emoji: "👋", label: "Warm check-in",       promptKey: "warm_checkin"      },
  { id: "upsell",            emoji: "📈", label: "Upsell next phase",   promptKey: "upsell"            },
  { id: "update_request",    emoji: "🔄", label: "Request update",      promptKey: "update_request"    },
  { id: "project_wrapup",    emoji: "🎉", label: "Project wrap-up",     promptKey: "project_wrapup"    },
  { id: "meeting_request",   emoji: "📅", label: "Book a call",         promptKey: "meeting_request"   },
];

// ────────────────────────────────────────────────────────────
// src/constants/seed.js
// ────────────────────────────────────────────────────────────

/**
 * Seed data — realistic demo state.
 * In production this would be fetched from your API/DB.
 * Keeping it here isolates it from business logic.
 */

const SEED_CLIENTS = [
  {
    id: "c1",
    name: "Aria Okonkwo",
    company: "Nova Media",
    email: "aria@novamedia.io",
    phone: "+1 415 555 0101",
    project: "Brand Identity Redesign",
    value: 4200,
    paid: 2100,
    status: "active",
    stage: "In Progress",
    lastContact: "2026-07-10",
    dueDate: "2026-08-15",
    invoicePending: true,
    tags: ["design", "branding"],
    notes: "Waiting on final logo approval. Client prefers async updates via email.",
    avatarIndex: 0,
    createdAt: "2026-05-01",
  },
  {
    id: "c2",
    name: "James Tran",
    company: "Tran Ventures",
    email: "james@tranventures.com",
    phone: "+1 646 555 0202",
    project: "E-commerce Site Build",
    value: 7800,
    paid: 0,
    status: "overdue",
    stage: "Review",
    lastContact: "2026-06-28",
    dueDate: "2026-07-20",
    invoicePending: true,
    tags: ["dev", "ecommerce"],
    notes: "Invoice #INV-003 sent 30 days ago. No response. Follow up urgently.",
    avatarIndex: 3,
    createdAt: "2026-04-15",
  },
  {
    id: "c3",
    name: "Priya Mehta",
    company: "LearnSpark",
    email: "priya@learnspark.co",
    phone: "+1 512 555 0303",
    project: "LMS Dashboard UI",
    value: 3100,
    paid: 3100,
    status: "active",
    stage: "Phase 2",
    lastContact: "2026-07-22",
    dueDate: "2026-09-01",
    invoicePending: false,
    tags: ["dev", "edtech"],
    notes: "Phase 1 delivered and approved. Phase 2 scoped. Great communicator.",
    avatarIndex: 1,
    createdAt: "2026-06-01",
  },
  {
    id: "c4",
    name: "Carlos Ruiz",
    company: "Ruiz Real Estate",
    email: "carlos@ruizestate.com",
    phone: "+1 305 555 0404",
    project: "SEO Content Package",
    value: 1800,
    paid: 1800,
    status: "completed",
    stage: "Delivered",
    lastContact: "2026-07-05",
    dueDate: "2026-07-01",
    invoicePending: false,
    tags: ["content", "seo"],
    notes: "All deliverables signed off. Strong candidate for a Q3 retainer.",
    avatarIndex: 2,
    createdAt: "2026-05-10",
  },
  {
    id: "c5",
    name: "Yuki Tanaka",
    company: "Tanaka Studio",
    email: "yuki@tanakastudio.jp",
    phone: "+81 3 555 0505",
    project: "Mobile App UI Kit",
    value: 5500,
    paid: 1500,
    status: "prospect",
    stage: "Proposal Sent",
    lastContact: "2026-07-18",
    dueDate: "2026-08-30",
    invoicePending: false,
    tags: ["design", "mobile"],
    notes: "Sent proposal 9 days ago. Very interested, awaiting board approval.",
    avatarIndex: 4,
    createdAt: "2026-07-01",
  },
];

const SEED_INVOICES = [
  { id: "INV-001", clientId: "c1", client: "Aria Okonkwo",  amount: 2100, status: "paid",    date: "2026-06-15", due: "2026-06-30", desc: "Brand Identity – Phase 1 (50% deposit)" },
  { id: "INV-002", clientId: "c1", client: "Aria Okonkwo",  amount: 2100, status: "sent",    date: "2026-07-10", due: "2026-07-25", desc: "Brand Identity – Phase 2 (final balance)" },
  { id: "INV-003", clientId: "c2", client: "James Tran",    amount: 7800, status: "overdue", date: "2026-06-28", due: "2026-07-20", desc: "E-commerce Site Build – Full Project" },
  { id: "INV-004", clientId: "c3", client: "Priya Mehta",   amount: 3100, status: "paid",    date: "2026-07-01", due: "2026-07-15", desc: "LMS Dashboard – Phase 1" },
  { id: "INV-005", clientId: "c4", client: "Carlos Ruiz",   amount: 1800, status: "paid",    date: "2026-06-20", due: "2026-07-01", desc: "SEO Content Package – Delivery" },
  { id: "INV-006", clientId: "c5", client: "Yuki Tanaka",   amount: 1500, status: "paid",    date: "2026-07-05", due: "2026-07-15", desc: "Mobile App UI Kit – Kickoff deposit" },
];

const SEED_TASKS = [
  { id: "t1", clientId: "c2", client: "James Tran",   text: "Send third invoice follow-up for INV-003",          done: false, due: "2026-07-29", priority: "high"   },
  { id: "t2", clientId: "c1", client: "Aria Okonkwo", text: "Share revised logo concepts (v3)",                  done: false, due: "2026-07-30", priority: "medium" },
  { id: "t3", clientId: "c5", client: "Yuki Tanaka",  text: "Follow up on proposal — decision expected this week", done: false, due: "2026-07-31", priority: "high"   },
  { id: "t4", clientId: "c3", client: "Priya Mehta",  text: "Schedule Phase 2 kickoff call",                     done: true,  due: "2026-07-22", priority: "medium" },
  { id: "t5", clientId: "c4", client: "Carlos Ruiz",  text: "Pitch Q3 content retainer package",                 done: false, due: "2026-08-05", priority: "low"    },
];

const SEED_ACTIVITY = [
  { id: "a1", type: "alert",  icon: "🚨", text: "INV-003 from James Tran is 8 days overdue",        time: "Just now",  color: "#ef4444" },
  { id: "a2", type: "alert",  icon: "⚠️", text: "James Tran: 30 days without contact",              time: "Alert",     color: "#ef4444" },
  { id: "a3", type: "ai",     icon: "✨", text: "AI drafted check-in email for Yuki Tanaka",        time: "2h ago",    color: "#6366f1" },
  { id: "a4", type: "paid",   icon: "✅", text: "Priya Mehta paid INV-004 · $3,100 collected",      time: "3 days ago", color: "#22c55e" },
  { id: "a5", type: "update", icon: "📝", text: "Updated project notes for Aria Okonkwo",           time: "5 days ago", color: "#94a3b8" },
  { id: "a6", type: "new",    icon: "🎉", text: "New client added: Yuki Tanaka · $5,500 project",   time: "3 wks ago",  color: "#a855f7" },
];

// ────────────────────────────────────────────────────────────
// src/utils/index.js
// ────────────────────────────────────────────────────────────

/**
 * Pure utility functions — no side effects, fully testable.
 * Nothing in here should know about React or the DOM.
 */

/** Format a number as a USD currency string */
const formatCurrency = (n) =>
  "$" + Number(n || 0).toLocaleString("en-US");

/** Format a number as a compact currency (e.g. $4.2K) */
const formatCurrencyCompact = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
};

/** Return days elapsed since a date string (YYYY-MM-DD) */
const daysAgo = (dateStr) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);

/** Return today as YYYY-MM-DD */
const today = () => new Date().toISOString().split("T")[0];

/** Human-readable elapsed time label */
const timeAgoLabel = (dateStr) => {
  const days = daysAgo(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

/** Extract up to 2 initials from a full name */
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/** Generate a short unique-enough ID */
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Clamp a number between min and max */
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Percentage (0–100) of paid vs total */
const paymentPct = (paid = 0, total = 1) =>
  clamp(Math.round((paid / total) * 100), 0, 100);

/** Derive contact staleness severity from days */
const staleness = (days) => {
  if (days > 21) return "critical";
  if (days > 10) return "warning";
  return "ok";
};

/** Build the AI system prompt for a given client */
const buildAISystemPrompt = (client) => `
You are ClientPulse AI — a revenue-focused communication assistant for freelancers and consultants. Your job is to draft concise, professional, and strategically timed client emails.

Current client context:
- Name: ${client.name} | Company: ${client.company} | Email: ${client.email}
- Project: "${client.project}"
- Contract value: $${client.value?.toLocaleString()} | Amount paid: $${client.paid?.toLocaleString() || 0}
- Status: ${client.status} | Stage: ${client.stage || "—"}
- Last contacted: ${client.lastContact} (${daysAgo(client.lastContact)} days ago)
- Invoice pending: ${client.invoicePending ? "Yes" : "No"} | Due: ${client.dueDate}
- Notes: ${client.notes}

Rules:
1. Address the client by first name only — never full name
2. Keep emails under 110 words unless explicitly asked for longer
3. Tone: warm and confident — never needy, never aggressive
4. Always include a clear subject line before the body (format: "Subject: ...")
5. Sign off: "Best,\n[Your Name]"
6. If the invoice is overdue, be firm but professional — not apologetic
7. Never invent specific details not provided above
`.trim();

/** Build a quick-action prompt for the AI */
const buildQuickActionPrompt = (actionId, client) => {
  const days = daysAgo(client.lastContact);
  const prompts = {
    invoice_reminder:  `Draft a ${days > 21 ? "firm" : "polite"} invoice reminder for the "${client.project}" project (${formatCurrency(client.value)} outstanding).`,
    warm_checkin:      `Draft a warm, non-pushy check-in email for ${client.name}. Don't mention invoices — just maintain the relationship and see if there's anything they need.`,
    upsell:            `Draft a short, compelling email proposing a follow-on retainer or next phase after "${client.project}" wraps up. Focus on outcomes they've already seen.`,
    update_request:    `Draft an email to ${client.name} requesting their feedback, pending approvals, or any content needed to move the project forward.`,
    project_wrapup:    `Draft a project wrap-up email for "${client.project}" — celebrate outcomes, summarize what was delivered, and ask for a brief testimonial or referral.`,
    meeting_request:   `Draft a short email to ${client.name} requesting a 30-minute sync call to discuss project status and any next steps.`,
  };
  return prompts[actionId] || `Draft a professional email to ${client.name}.`;
};

/** Parse comma-separated tag string into array */
const parseTags = (tagsInput) => {
  if (Array.isArray(tagsInput)) return tagsInput;
  return (tagsInput || "").split(",").map((t) => t.trim()).filter(Boolean);
};

/** Derive revenue metrics from clients and invoices arrays */
const deriveMetrics = (clients, invoices) => {
  const totalPipeline  = clients.reduce((s, c) => s + (c.value || 0), 0);
  const totalCollected = clients.reduce((s, c) => s + (c.paid  || 0), 0);
  const outstanding    = totalPipeline - totalCollected;
  const overdueInvs    = invoices.filter((i) => i.status === "overdue");
  const overdueAmount  = overdueInvs.reduce((s, i) => s + i.amount, 0);
  const activeClients  = clients.filter((c) => c.status === "active").length;
  return { totalPipeline, totalCollected, outstanding, overdueInvs, overdueAmount, activeClients };
};

// ────────────────────────────────────────────────────────────
// src/services/aiService.js
// ────────────────────────────────────────────────────────────

/**
 * AI Service — isolates all Anthropic API communication.
 * If you swap the model or endpoint in future, change it here only.
 */

const API_URL   = "https://api.anthropic.com/v1/messages";
const MODEL     = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

/**
 * Send a chat turn to the Anthropic API.
 * @param {string}   systemPrompt  - Full system context
 * @param {Array}    history       - Prior { role, content } turns
 * @param {string}   userMessage   - Latest user message
 * @returns {Promise<string>}      - Assistant reply text
 */
export async function sendMessage(systemPrompt, history, userMessage) {
  const messages = [...history, { role: "user", content: userMessage }];

  const response = await fetch(API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  if (!text) throw new Error("Empty response from AI");
  return text;
}

// ────────────────────────────────────────────────────────────
// src/hooks/useAIChat.js
// ────────────────────────────────────────────────────────────

/**
 * Custom hook — manages the full AI chat lifecycle for a given client.
 * Components that use this hook know nothing about the API.
 */
function useAIChat(client) {
  const [messages,  setMessages]  = useState([]);
  const [status,    setStatus]    = useState("idle"); // idle | loading | error
  const [error,     setError]     = useState(null);

  const systemPrompt = useRef(buildAISystemPrompt(client));
  // Rebuild if client changes (e.g., notes updated)
  systemPrompt.current = buildAISystemPrompt(client);

  const send = useCallback(async (userText) => {
    if (!userText.trim() || status === "loading") return;

    const userMsg = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setStatus("loading");
    setError(null);

    try {
      // Pass prior messages minus the one we just added (API receives it via userMessage arg)
      const reply = await sendMessage(
        systemPrompt.current,
        messages, // history before this turn
        userText
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setStatus("idle");
    } catch (err) {
      setError(err.message);
      setStatus("error");
      // Remove the user message we optimistically added so they can retry
      setMessages((prev) => prev.slice(0, -1));
    }
  }, [messages, status]);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setError(null);
  }, []);

  return { messages, status, error, send, reset };
}

// ────────────────────────────────────────────────────────────
// src/hooks/useFilter.js
// ────────────────────────────────────────────────────────────

/**
 * Generic search + filter hook.
 * Decouples filtering logic from any specific page component.
 *
 * @param {Array}    items        - Source array
 * @param {Array}    searchKeys   - Object keys to search against
 * @param {string}   statusKey    - Key used for status filter (e.g. "status")
 * @returns {{ filtered, search, setSearch, statusFilter, setStatusFilter }}
 */
function useFilter(items, searchKeys = [], statusKey = "status") {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q || searchKeys.some((key) => String(item[key] || "").toLowerCase().includes(q));
      const matchStatus =
        statusFilter === "all" || item[statusKey] === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter, searchKeys, statusKey]);

  return { filtered, search, setSearch, statusFilter, setStatusFilter };
}

// ────────────────────────────────────────────────────────────
// src/store/useAppStore.js
// ────────────────────────────────────────────────────────────

// ─── Action types ─────────────────────────────────────────────────────────
const ACTION = {
  // Clients
  CLIENT_ADD:           "CLIENT_ADD",
  CLIENT_UPDATE:        "CLIENT_UPDATE",
  CLIENT_DELETE:        "CLIENT_DELETE",
  CLIENT_MARK_CONTACTED:"CLIENT_MARK_CONTACTED",

  // Invoices
  INVOICE_ADD:          "INVOICE_ADD",
  INVOICE_UPDATE:       "INVOICE_UPDATE",
  INVOICE_MARK_PAID:    "INVOICE_MARK_PAID",

  // Tasks
  TASK_ADD:             "TASK_ADD",
  TASK_TOGGLE:          "TASK_TOGGLE",
  TASK_DELETE:          "TASK_DELETE",

  // Activity
  ACTIVITY_PUSH:        "ACTIVITY_PUSH",

  // UI
  UI_SET_PAGE:          "UI_SET_PAGE",
  UI_SET_AI_CLIENT:     "UI_SET_AI_CLIENT",
};

// ─── Initial state ────────────────────────────────────────────────────────
const initialState = {
  clients:   SEED_CLIENTS,
  invoices:  SEED_INVOICES,
  tasks:     SEED_TASKS,
  activity:  SEED_ACTIVITY,
  ui: {
    page:     "dashboard",
    aiClient: null,
  },
};

// ─── Reducer ──────────────────────────────────────────────────────────────
function reducer(state, { type, payload }) {
  switch (type) {
    // ── Clients ──────────────────────────────────────────────────────────
    case ACTION.CLIENT_ADD:
      return {
        ...state,
        clients: [...state.clients, {
          ...payload,
          id:          uid(),
          createdAt:   today(),
          lastContact: today(),
          tags:        parseTags(payload.tags),
        }],
      };

    case ACTION.CLIENT_UPDATE:
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === payload.id ? { ...c, ...payload, tags: parseTags(payload.tags) } : c
        ),
      };

    case ACTION.CLIENT_DELETE:
      return { ...state, clients: state.clients.filter((c) => c.id !== payload.id) };

    case ACTION.CLIENT_MARK_CONTACTED:
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === payload.id ? { ...c, lastContact: today() } : c
        ),
      };

    // ── Invoices ─────────────────────────────────────────────────────────
    case ACTION.INVOICE_ADD:
      return {
        ...state,
        invoices: [...state.invoices, {
          ...payload,
          id:   `INV-${String(state.invoices.length + 1).padStart(3, "0")}`,
          date: today(),
        }],
      };

    case ACTION.INVOICE_UPDATE:
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === payload.id ? { ...i, ...payload } : i
        ),
      };

    case ACTION.INVOICE_MARK_PAID:
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === payload.id ? { ...i, status: "paid" } : i
        ),
        // Also update client's paid amount
        clients: state.clients.map((c) => {
          const inv = state.invoices.find((i) => i.id === payload.id);
          if (!inv || c.id !== inv.clientId) return c;
          const newPaid = (c.paid || 0) + inv.amount;
          return { ...c, paid: newPaid, invoicePending: newPaid < c.value };
        }),
      };

    // ── Tasks ─────────────────────────────────────────────────────────────
    case ACTION.TASK_ADD:
      return {
        ...state,
        tasks: [...state.tasks, { ...payload, id: uid(), done: false }],
      };

    case ACTION.TASK_TOGGLE:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === payload.id ? { ...t, done: !t.done } : t
        ),
      };

    case ACTION.TASK_DELETE:
      return { ...state, tasks: state.tasks.filter((t) => t.id !== payload.id) };

    // ── Activity ──────────────────────────────────────────────────────────
    case ACTION.ACTIVITY_PUSH:
      return {
        ...state,
        activity: [payload, ...state.activity].slice(0, 20),
      };

    // ── UI ────────────────────────────────────────────────────────────────
    case ACTION.UI_SET_PAGE:
      return { ...state, ui: { ...state.ui, page: payload } };

    case ACTION.UI_SET_AI_CLIENT:
      return { ...state, ui: { ...state.ui, aiClient: payload } };

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────
function useAppStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Dispatchers ──────────────────────────────────────────────────────────
  const actions = useMemo(() => ({
    addClient:       (data)  => dispatch({ type: ACTION.CLIENT_ADD,            payload: data }),
    updateClient:    (data)  => dispatch({ type: ACTION.CLIENT_UPDATE,         payload: data }),
    deleteClient:    (id)    => dispatch({ type: ACTION.CLIENT_DELETE,         payload: { id } }),
    markContacted:   (id)    => dispatch({ type: ACTION.CLIENT_MARK_CONTACTED, payload: { id } }),

    addInvoice:      (data)  => dispatch({ type: ACTION.INVOICE_ADD,       payload: data }),
    updateInvoice:   (data)  => dispatch({ type: ACTION.INVOICE_UPDATE,    payload: data }),
    markInvoicePaid: (id)    => dispatch({ type: ACTION.INVOICE_MARK_PAID, payload: { id } }),

    addTask:         (data)  => dispatch({ type: ACTION.TASK_ADD,    payload: data }),
    toggleTask:      (id)    => dispatch({ type: ACTION.TASK_TOGGLE, payload: { id } }),
    deleteTask:      (id)    => dispatch({ type: ACTION.TASK_DELETE, payload: { id } }),

    pushActivity:    (item)  => dispatch({ type: ACTION.ACTIVITY_PUSH,     payload: item }),
    setPage:         (page)  => dispatch({ type: ACTION.UI_SET_PAGE,       payload: page }),
    setAiClient:     (client)=> dispatch({ type: ACTION.UI_SET_AI_CLIENT,  payload: client }),
  }), []);

  // ── Derived / computed ───────────────────────────────────────────────────
  const derived = useMemo(() => {
    const metrics = deriveMetrics(state.clients, state.invoices);
    return {
      ...metrics,
      needsFollowUp:     state.clients.filter((c) => {
        const days = Math.floor((Date.now() - new Date(c.lastContact)) / 86_400_000);
        return days > 10 && c.status !== "completed";
      }),
      overdueClientList:    state.clients.filter((c) => c.status === "overdue"),
      openTasks:         state.tasks.filter((t) => !t.done),
      highPriorityTasks: state.tasks.filter((t) => !t.done && t.priority === "high"),
      badges: {
        overdueClients:    state.clients.filter((c) => c.status === "overdue").length,
        overdueInvoices:   state.invoices.filter((i) => i.status === "overdue").length,
        highPriorityTasks: state.tasks.filter((t) => !t.done && t.priority === "high").length,
      },
    };
  }, [state.clients, state.invoices, state.tasks]);

  return { state, actions, derived };
}

// ────────────────────────────────────────────────────────────
// src/components/ui/index.js
// ────────────────────────────────────────────────────────────

/**
 * UI Primitive Components
 *
 * These are the atoms of the design system.
 * They know nothing about business logic — only visual tokens.
 * Every prop is intentional; no magic defaults.
 */



// ─── Button ───────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: {
    background: COLOR.brand500,
    color: COLOR.white,
    border: "none",
    boxShadow: SHADOW.brand,
    hoverBg: COLOR.brand600,
  },
  secondary: {
    background: COLOR.white,
    color: COLOR.slate700,
    border: `1.5px solid ${COLOR.slate200}`,
    boxShadow: SHADOW.xs,
    hoverBg: COLOR.slate50,
  },
  ghost: {
    background: "transparent",
    color: COLOR.slate600,
    border: "none",
    boxShadow: "none",
    hoverBg: COLOR.slate100,
  },
  danger: {
    background: COLOR.danger500,
    color: COLOR.white,
    border: "none",
    boxShadow: `0 2px 8px ${COLOR.danger500}33`,
    hoverBg: COLOR.danger600,
  },
  success: {
    background: COLOR.success500,
    color: COLOR.white,
    border: "none",
    boxShadow: `0 2px 8px ${COLOR.success500}33`,
    hoverBg: COLOR.success600,
  },
  brand_ghost: {
    background: COLOR.brand50,
    color: COLOR.brand600,
    border: `1.5px solid ${COLOR.brand200}`,
    boxShadow: "none",
    hoverBg: COLOR.brand100,
  },
};

const BTN_SIZES = {
  xs:  { fontSize: FONT.size.xs,   padding: "4px 10px",  borderRadius: RADIUS.sm },
  sm:  { fontSize: FONT.size.sm,   padding: "6px 13px",  borderRadius: RADIUS.md },
  md:  { fontSize: FONT.size.base, padding: "9px 18px",  borderRadius: RADIUS.md },
  lg:  { fontSize: FONT.size.md,   padding: "12px 24px", borderRadius: RADIUS.lg },
};

function Button({
  children, onClick, variant = "secondary", size = "md",
  disabled = false, fullWidth = false, style: extraStyle = {},
}) {
  const [hovered, setHovered] = useState(false);
  const v = BTN_VARIANTS[variant];
  const s = BTN_SIZES[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s,
        background:  (hovered && !disabled) ? v.hoverBg : v.background,
        color:        v.color,
        border:       v.border || "none",
        boxShadow:    v.boxShadow,
        fontFamily:   FONT.family,
        fontWeight:   FONT.weight.semibold,
        cursor:       disabled ? "not-allowed" : "pointer",
        opacity:      disabled ? 0.5 : 1,
        display:      "inline-flex",
        alignItems:   "center",
        justifyContent: "center",
        gap:          SPACE[2],
        whiteSpace:   "nowrap",
        transition:   TRANSITION.fast,
        width:        fullWidth ? "100%" : undefined,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────
function Input({
  label, value, onChange, type = "text",
  placeholder = "", required = false, style: extraStyle = {},
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[1] }}>
      {label && (
        <label style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.slate600 }}>
          {label}
          {required && <span style={{ color: COLOR.danger500, marginLeft: 2 }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding:      "9px 13px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${focused ? COLOR.brand500 : COLOR.slate200}`,
          fontSize:     FONT.size.base,
          color:        COLOR.slate900,
          background:   COLOR.white,
          fontFamily:   FONT.family,
          outline:      "none",
          transition:   TRANSITION.fast,
          boxShadow:    focused ? `0 0 0 3px ${COLOR.brand500}18` : "none",
          ...extraStyle,
        }}
      />
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────
function Textarea({ label, value, onChange, placeholder = "", rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[1] }}>
      {label && (
        <label style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.slate600 }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding:      "9px 13px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${focused ? COLOR.brand500 : COLOR.slate200}`,
          fontSize:     FONT.size.base,
          color:        COLOR.slate900,
          background:   COLOR.white,
          fontFamily:   FONT.family,
          outline:      "none",
          resize:       "vertical",
          transition:   TRANSITION.fast,
          boxShadow:    focused ? `0 0 0 3px ${COLOR.brand500}18` : "none",
        }}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────
function Select({ label, value, onChange, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[1] }}>
      {label && (
        <label style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.slate600 }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding:      "9px 13px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${COLOR.slate200}`,
          fontSize:     FONT.size.base,
          color:        COLOR.slate900,
          background:   COLOR.white,
          fontFamily:   FONT.family,
          outline:      "none",
          cursor:       "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return (
    <span style={{
      background:   bg,
      color,
      fontSize:     FONT.size.xs,
      fontWeight:   FONT.weight.bold,
      padding:      "3px 9px",
      borderRadius: RADIUS.full,
      whiteSpace:   "nowrap",
      letterSpacing: "0.01em",
    }}>
      {label}
    </span>
  );
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────
function TagPill({ label }) {
  return (
    <span style={{
      fontSize:     FONT.size.xs,
      fontWeight:   FONT.weight.semibold,
      padding:      "2px 9px",
      borderRadius: RADIUS.full,
      background:   COLOR.brand50,
      color:        COLOR.brand700,
      border:       `1px solid ${COLOR.brand200}`,
    }}>
      {label}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────


function Avatar({ name, avatarIndex = 0, size = 38 }) {
  const palette = AVATAR_PALETTE[avatarIndex % AVATAR_PALETTE.length];
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   "50%",
      background:     palette.bg,
      color:          palette.text,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       Math.round(size * 0.33),
      fontWeight:     FONT.weight.bold,
      flexShrink:     0,
      letterSpacing:  "0.02em",
    }}>
      {getInitials(name)}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────
function Card({ children, style: extraStyle = {}, onClick, hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background:   COLOR.white,
        borderRadius: RADIUS.xl,
        border:       `1.5px solid ${hovered ? COLOR.brand400 : COLOR.slate200}`,
        boxShadow:    hovered ? SHADOW.md : SHADOW.xs,
        transition:   TRANSITION.base,
        cursor:       onClick ? "pointer" : undefined,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 520 }) {
  // Trap Escape key
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      background:     "rgba(15,23,42,0.55)",
      zIndex:         ZINDEX.modal,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        SPACE[6],
      backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background:   COLOR.white,
        borderRadius: RADIUS.xxl,
        width,
        maxWidth:     "100%",
        maxHeight:    "90vh",
        overflowY:    "auto",
        boxShadow:    SHADOW.xl,
      }}>
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          padding:        `${SPACE[5]}px ${SPACE[6]}px`,
          borderBottom:   `1px solid ${COLOR.slate100}`,
        }}>
          <h2 style={{ margin: 0, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background:   COLOR.slate100,
              border:       "none",
              borderRadius: RADIUS.sm,
              width:        28, height: 28,
              cursor:       "pointer",
              fontSize:     18,
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              color:        COLOR.slate500,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: `${SPACE[5]}px ${SPACE[6]}px` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────
function Divider({ style: s = {} }) {
  return <div style={{ height: 1, background: COLOR.slate100, ...s }} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────
function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        `${SPACE[12]}px ${SPACE[6]}px`,
      textAlign:      "center",
      gap:            SPACE[3],
    }}>
      {icon && <div style={{ fontSize: 36, opacity: 0.4 }}>{icon}</div>}
      <div style={{ fontSize: FONT.size.md, fontWeight: FONT.weight.semibold, color: COLOR.slate700 }}>{title}</div>
      {body && <div style={{ fontSize: FONT.size.base, color: COLOR.slate400, maxWidth: 320, lineHeight: FONT.lineHeight.relaxed }}>{body}</div>}
      {action}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────
function ProgressBar({ pct, color }) {
  const c = color || (pct === 100 ? COLOR.success500 : pct > 50 ? COLOR.brand500 : COLOR.warning500);
  return (
    <div style={{ height: 5, background: COLOR.slate100, borderRadius: RADIUS.full, overflow: "hidden" }}>
      <div style={{
        height:       "100%",
        width:        `${pct}%`,
        background:   c,
        borderRadius: RADIUS.full,
        transition:   "width 0.6s ease",
      }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, color, icon }) {
  return (
    <Card style={{ padding: `${SPACE[5]}px ${SPACE[5]}px` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACE[2] }}>
        <span style={{ fontSize: FONT.size.sm, color: COLOR.slate500, fontWeight: FONT.weight.medium }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 18, opacity: 0.55 }}>{icon}</span>}
      </div>
      <div style={{
        fontSize:      FONT.size.xxl,
        fontWeight:    FONT.weight.extrabold,
        color:         color || COLOR.slate900,
        letterSpacing: "-0.025em",
        lineHeight:    1.1,
        marginBottom:  SPACE[1],
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400 }}>{sub}</div>
      )}
      {trend !== undefined && (
        <div style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.semibold, color: trend >= 0 ? COLOR.success600 : COLOR.danger600, marginTop: SPACE[1] }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
        </div>
      )}
    </Card>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE[4] }}>
      <h2 style={{ margin: 0, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>
        {title}
      </h2>
      {action}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────
function FilterTab({ label, active, onClick, badge }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize:     FONT.size.sm,
        fontWeight:   active ? FONT.weight.bold : FONT.weight.regular,
        padding:      "7px 15px",
        borderRadius: RADIUS.full,
        border:       `1.5px solid ${active ? COLOR.brand500 : hovered ? COLOR.slate300 : COLOR.slate200}`,
        background:   active ? COLOR.brand50 : hovered ? COLOR.slate50 : COLOR.white,
        color:        active ? COLOR.brand700 : COLOR.slate600,
        cursor:       "pointer",
        fontFamily:   FONT.family,
        display:      "inline-flex",
        alignItems:   "center",
        gap:          SPACE[1],
        transition:   TRANSITION.fast,
        whiteSpace:   "nowrap",
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          background:   COLOR.danger500,
          color:        COLOR.white,
          fontSize:     9,
          fontWeight:   FONT.weight.bold,
          borderRadius: RADIUS.full,
          padding:      "1px 5px",
          minWidth:     14,
          textAlign:    "center",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder = "Search…" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <span style={{
        position:  "absolute",
        left:      12,
        top:       "50%",
        transform: "translateY(-50%)",
        fontSize:  14,
        color:     COLOR.slate400,
        pointerEvents: "none",
      }}>
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:        "100%",
          padding:      "9px 13px 9px 34px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${focused ? COLOR.brand500 : COLOR.slate200}`,
          fontSize:     FONT.size.base,
          fontFamily:   FONT.family,
          color:        COLOR.slate900,
          background:   COLOR.white,
          outline:      "none",
          boxSizing:    "border-box",
          transition:   TRANSITION.fast,
          boxShadow:    focused ? `0 0 0 3px ${COLOR.brand500}18` : SHADOW.xs,
        }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/components/layout/Sidebar.js
// ────────────────────────────────────────────────────────────

function Sidebar({ page, onNavigate, badges }) {
  return (
    <aside style={{
      width:      220,
      background: COLOR.slate900,
      display:    "flex",
      flexDirection: "column",
      flexShrink: 0,
      position:   "sticky",
      top:        0,
      height:     "100vh",
      overflowY:  "auto",
    }}>
      {/* Logo */}
      <div style={{
        padding:      `${SPACE[6]}px ${SPACE[5]}px ${SPACE[4]}px`,
        borderBottom: `1px solid ${COLOR.slate800}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE[3] }}>
          <div style={{
            width:          34,
            height:         34,
            borderRadius:   RADIUS.md,
            background:     `linear-gradient(135deg, ${COLOR.brand500}, ${COLOR.purple500})`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       16,
            boxShadow:      `0 4px 12px ${COLOR.brand500}44`,
          }}>
            ⚡
          </div>
          <div>
            <div style={{
              fontSize:      FONT.size.md,
              fontWeight:    FONT.weight.extrabold,
              color:         COLOR.white,
              letterSpacing: "-0.02em",
              lineHeight:    1.1,
            }}>
              ClientPulse
            </div>
            <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500, fontWeight: FONT.weight.medium }}>
              AI-powered CRM
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: `${SPACE[3]}px ${SPACE[3]}px`, display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        <div style={{
          fontSize:      9,
          fontWeight:    FONT.weight.bold,
          color:         COLOR.slate600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding:       `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px`,
        }}>
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = page === item.id;
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavItem
              key={item.id}
              item={item}
              isActive={isActive}
              badge={badge}
              onClick={() => onNavigate(item.id)}
            />
          );
        })}
      </nav>

      {/* AI hint */}
      <div style={{ padding: `${SPACE[4]}px ${SPACE[3]}px ${SPACE[2]}px` }}>
        <div style={{
          background:   `${COLOR.brand500}12`,
          borderRadius: RADIUS.lg,
          padding:      `${SPACE[3]}px ${SPACE[4]}px`,
          border:       `1px solid ${COLOR.brand500}20`,
          marginBottom: SPACE[3],
        }}>
          <div style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: COLOR.brand400, marginBottom: SPACE[1] }}>
            ✨ AI Drafts
          </div>
          <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500, lineHeight: FONT.lineHeight.relaxed }}>
            Open any client → click "AI Draft" to auto-write follow-ups, reminders & upsells.
          </div>
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: SPACE[2], padding: `${SPACE[2]}px ${SPACE[1]}px` }}>
          <div style={{
            width:          30, height: 30,
            borderRadius:   "50%",
            background:     COLOR.brand500,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       FONT.size.xs,
            color:          COLOR.white,
            fontWeight:     FONT.weight.bold,
          }}>
            YF
          </div>
          <div>
            <div style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.white, lineHeight: 1.2 }}>
              Your Freelance Co.
            </div>
            <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500 }}>Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, isActive, badge, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          SPACE[3],
        padding:      `${SPACE[2] + 1}px ${SPACE[3]}px`,
        borderRadius: RADIUS.md,
        border:       "none",
        cursor:       "pointer",
        fontFamily:   FONT.family,
        width:        "100%",
        textAlign:    "left",
        background:   isActive ? `${COLOR.brand500}22` : hovered ? COLOR.slate800 : "transparent",
        color:        isActive ? COLOR.white : hovered ? COLOR.slate300 : COLOR.slate400,
        fontWeight:   isActive ? FONT.weight.semibold : FONT.weight.regular,
        fontSize:     FONT.size.base,
        transition:   TRANSITION.fast,
      }}
    >
      <span style={{ fontSize: 15, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {badge > 0 && (
        <span style={{
          background:   COLOR.danger500,
          color:        COLOR.white,
          fontSize:     9,
          borderRadius: "99px",
          padding:      "2px 6px",
          fontWeight:   FONT.weight.bold,
          minWidth:     16,
          textAlign:    "center",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// src/components/layout/Topbar.js
// ────────────────────────────────────────────────────────────

const PAGE_TITLES = {
  dashboard: "Dashboard",
  clients:   "Clients",
  invoices:  "Invoices",
  tasks:     "Tasks",
  pipeline:  "Pipeline",
  launch:    "Launch Guide",
};

const PAGE_SUBS = {
  dashboard: "Your business at a glance",
  clients:   "Manage relationships and projects",
  invoices:  "Track payments and outstanding balances",
  tasks:     "Stay on top of your to-do list",
  pipeline:  "Visualize your deal stages",
  launch:    "Your step-by-step roadmap to $10K MRR",
};

function Topbar({ page, alerts = 0 }) {
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header style={{
      background:   COLOR.white,
      borderBottom: `1px solid ${COLOR.slate200}`,
      padding:      `0 ${SPACE[6]}px`,
      height:       60,
      display:      "flex",
      alignItems:   "center",
      justifyContent: "space-between",
      flexShrink:   0,
      boxShadow:    SHADOW.xs,
    }}>
      <div>
        <h1 style={{
          margin:        0,
          fontSize:      FONT.size.lg,
          fontWeight:    FONT.weight.extrabold,
          color:         COLOR.slate900,
          letterSpacing: "-0.02em",
          lineHeight:    1.1,
        }}>
          {PAGE_TITLES[page] || page}
        </h1>
        <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginTop: 2 }}>
          {PAGE_SUBS[page]}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: SPACE[4] }}>
        <span style={{ fontSize: FONT.size.xs, color: COLOR.slate400, fontWeight: FONT.weight.medium }}>
          {dateStr}
        </span>

        {alerts > 0 && (
          <div style={{
            background:   COLOR.danger50,
            color:        COLOR.danger600,
            fontSize:     FONT.size.xs,
            fontWeight:   FONT.weight.bold,
            padding:      "5px 12px",
            borderRadius: "99px",
            border:       `1px solid ${COLOR.danger100}`,
            display:      "flex",
            alignItems:   "center",
            gap:          SPACE[1],
          }}>
            🔔 {alerts} alert{alerts !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────
// src/components/features/ai/AIPanel.js
// ────────────────────────────────────────────────────────────

function AIPanel({ client, onClose }) {
  const { messages, status, error, send, reset } = useAIChat(client);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuickAction = (action) => {
    const prompt = buildQuickActionPrompt(action.id, client);
    send(prompt);
  };

  const handleSend = () => {
    if (!input.trim() || status === "loading") return;
    send(input.trim());
    setInput("");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      background:     "rgba(15,23,42,0.6)",
      zIndex:         ZINDEX.panel,
      display:        "flex",
      alignItems:     "flex-end",
      justifyContent: "flex-end",
      padding:        SPACE[6],
      backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background:   COLOR.white,
        borderRadius: RADIUS.xxl,
        width:        460,
        height:       640,
        display:      "flex",
        flexDirection: "column",
        boxShadow:    SHADOW.xl,
        overflow:     "hidden",
      }}>

        {/* Header */}
        <div style={{
          background:  `linear-gradient(135deg, ${COLOR.brand500} 0%, ${COLOR.purple500} 100%)`,
          padding:     `${SPACE[4]}px ${SPACE[5]}px`,
          display:     "flex",
          alignItems:  "center",
          gap:         SPACE[3],
          flexShrink:  0,
        }}>
          <Avatar name={client.name} avatarIndex={client.avatarIndex} size={36} />
          <div style={{ flex: 1, color: COLOR.white }}>
            <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.md }}>
              AI for {client.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: FONT.size.xs, opacity: 0.75 }}>{client.project}</div>
          </div>
          {messages.length > 0 && (
            <button onClick={reset} style={{
              background: "rgba(255,255,255,.15)", border: "none", borderRadius: RADIUS.sm,
              padding: "4px 10px", cursor: "pointer", color: COLOR.white, fontSize: FONT.size.xs,
              fontFamily: FONT.family, fontWeight: FONT.weight.medium,
            }}>
              New chat
            </button>
          )}
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.2)", border: "none", borderRadius: RADIUS.sm,
            width: 28, height: 28, cursor: "pointer", color: COLOR.white, fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            ×
          </button>
        </div>

        {/* Quick actions — shown only before first message */}
        {messages.length === 0 && (
          <div style={{
            padding:      `${SPACE[4]}px ${SPACE[5]}px`,
            borderBottom: `1px solid ${COLOR.slate100}`,
            flexShrink:   0,
          }}>
            <div style={{
              fontSize:      FONT.size.xs,
              fontWeight:    FONT.weight.bold,
              color:         COLOR.slate400,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom:  SPACE[3],
            }}>
              Quick actions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[2] }}>
              {AI_QUICK_ACTIONS.map((action) => (
                <QuickActionButton key={action.id} action={action} onClick={handleQuickAction} />
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex:       1,
          overflowY:  "auto",
          padding:    `${SPACE[4]}px ${SPACE[5]}px`,
          display:    "flex",
          flexDirection: "column",
          gap:        SPACE[4],
        }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onCopy={copyToClipboard} />
          ))}
          {status === "loading" && (
            <div style={{ fontSize: FONT.size.base, color: COLOR.slate400, fontStyle: "italic" }}>
              ✨ Writing…
            </div>
          )}
          {error && (
            <div style={{
              background:   COLOR.danger50,
              color:        COLOR.danger600,
              fontSize:     FONT.size.sm,
              borderRadius: RADIUS.md,
              padding:      `${SPACE[2]}px ${SPACE[3]}px`,
              border:       `1px solid ${COLOR.danger100}`,
            }}>
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding:     `${SPACE[3]}px ${SPACE[4]}px`,
          borderTop:   `1px solid ${COLOR.slate100}`,
          display:     "flex",
          gap:         SPACE[2],
          flexShrink:  0,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask AI to draft anything…"
            style={{
              flex:         1,
              fontSize:     FONT.size.base,
              padding:      "9px 13px",
              borderRadius: RADIUS.md,
              border:       `1.5px solid ${COLOR.slate200}`,
              fontFamily:   FONT.family,
              outline:      "none",
              color:        COLOR.slate900,
            }}
          />
          <Button
            onClick={handleSend}
            variant="primary"
            disabled={status === "loading" || !input.trim()}
          >
            ↗
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ action, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(action)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? COLOR.brand50 : COLOR.slate50,
        border:       `1.5px solid ${hovered ? COLOR.brand200 : COLOR.slate200}`,
        borderRadius: RADIUS.md,
        padding:      `${SPACE[2]}px ${SPACE[3]}px`,
        fontSize:     FONT.size.xs,
        cursor:       "pointer",
        textAlign:    "left",
        color:        hovered ? COLOR.brand700 : COLOR.slate700,
        fontFamily:   FONT.family,
        fontWeight:   FONT.weight.medium,
        display:      "flex",
        gap:          SPACE[2],
        alignItems:   "center",
        transition:   TRANSITION.fast,
      }}
    >
      <span>{action.emoji}</span>
      {action.label}
    </button>
  );
}

function MessageBubble({ msg, onCopy }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={{
          fontSize:      FONT.size.xs,
          fontWeight:    FONT.weight.bold,
          color:         COLOR.slate400,
          marginBottom:  SPACE[1],
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>
          ✨ ClientPulse AI
        </div>
      )}
      <div style={{
        maxWidth:     "90%",
        background:   isUser
          ? `linear-gradient(135deg, ${COLOR.brand500}, ${COLOR.purple500})`
          : COLOR.slate50,
        color:        isUser ? COLOR.white : COLOR.slate800,
        borderRadius: isUser ? `${RADIUS.xl}px ${RADIUS.xl}px ${RADIUS.sm}px ${RADIUS.xl}px` : `${RADIUS.sm}px ${RADIUS.xl}px ${RADIUS.xl}px ${RADIUS.xl}px`,
        padding:      `${SPACE[3]}px ${SPACE[4]}px`,
        fontSize:     FONT.size.base,
        lineHeight:   FONT.lineHeight.relaxed,
        whiteSpace:   "pre-wrap",
        border:       isUser ? "none" : `1px solid ${COLOR.slate200}`,
      }}>
        {msg.content}
      </div>
      {!isUser && (
        <button
          onClick={() => onCopy(msg.content)}
          style={{
            marginTop:  SPACE[1],
            fontSize:   FONT.size.xs,
            color:      COLOR.slate400,
            background: "none",
            border:     "none",
            cursor:     "pointer",
            padding:    0,
            fontFamily: FONT.family,
          }}
        >
          📋 Copy to clipboard
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/components/features/clients/ClientForm.js
// ────────────────────────────────────────────────────────────

const EMPTY = {
  name: "", company: "", email: "", phone: "",
  project: "", value: "", paid: "0",
  status: "active", stage: "In Progress",
  dueDate: "", tags: "", notes: "",
};

function ClientForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial ? {
    ...initial,
    value: String(initial.value),
    paid:  String(initial.paid || 0),
    tags:  Array.isArray(initial.tags) ? initial.tags.join(", ") : initial.tags || "",
  } : EMPTY);

  const set = (key) => (val) => setF((p) => ({ ...p, [key]: val }));
  const isValid = f.name.trim() && f.email.trim() && f.project.trim() && f.value.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      ...f,
      value: Number(f.value) || 0,
      paid:  Number(f.paid)  || 0,
      invoicePending: (Number(f.paid) || 0) < (Number(f.value) || 0),
    });
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4] }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[3] }}>
        <Input label="Full name"    value={f.name}    onChange={set("name")}    placeholder="Jane Smith"       required />
        <Input label="Company"      value={f.company} onChange={set("company")} placeholder="Acme Inc." />
        <Input label="Email"        value={f.email}   onChange={set("email")}   placeholder="jane@acme.com"    required type="email" />
        <Input label="Phone"        value={f.phone}   onChange={set("phone")}   placeholder="+1 415 000 0000" />

        <div style={{ gridColumn: "1 / -1" }}>
          <Input label="Project name" value={f.project} onChange={set("project")} placeholder="Website Redesign" required />
        </div>

        <Input label="Contract value ($)" value={f.value} onChange={set("value")} type="number" placeholder="5000" required />
        <Input label="Amount paid ($)"    value={f.paid}  onChange={set("paid")}  type="number" placeholder="0" />

        <Select label="Status" value={f.status} onChange={set("status")}>
          <option value="active">Active</option>
          <option value="prospect">Prospect</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </Select>

        <Input label="Stage"           value={f.stage}   onChange={set("stage")}   placeholder="In Progress" />
        <Input label="Due date"        value={f.dueDate} onChange={set("dueDate")} type="date" />
        <Input label="Tags (comma-separated)" value={f.tags} onChange={set("tags")} placeholder="design, dev, seo" />
      </div>

      <Textarea label="Notes" value={f.notes} onChange={set("notes")} placeholder="Any context about this client or project…" rows={3} />

      {!isValid && f.name && (
        <div style={{ fontSize: FONT.size.xs, color: COLOR.danger500 }}>
          Please fill in all required fields (name, email, project, value).
        </div>
      )}

      <div style={{ display: "flex", gap: SPACE[3], marginTop: SPACE[1] }}>
        <Button onClick={onClose}      variant="secondary" fullWidth>Cancel</Button>
        <Button onClick={handleSubmit} variant="primary"   fullWidth disabled={!isValid}>
          {initial ? "Save changes" : "Add client"}
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/components/features/clients/ClientCard.js
// ────────────────────────────────────────────────────────────

function ClientCard({ client, onSelect, onAI }) {
  const [hovered, setHovered] = useState(false);
  const statusCfg  = CLIENT_STATUS[client.status] || CLIENT_STATUS.active;
  const days       = daysAgo(client.lastContact);
  const pct        = paymentPct(client.paid, client.value);
  const contactColor = days > 21 ? COLOR.danger500 : days > 10 ? COLOR.warning500 : COLOR.success500;

  return (
    <div
      onClick={() => onSelect(client)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   COLOR.white,
        borderRadius: RADIUS.xl,
        border:       `1.5px solid ${hovered ? COLOR.brand400 : COLOR.slate200}`,
        padding:      `${SPACE[5]}px`,
        cursor:       "pointer",
        transition:   TRANSITION.base,
        boxShadow:    hovered ? SHADOW.md : SHADOW.xs,
        display:      "flex",
        flexDirection: "column",
        gap:          SPACE[3],
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE[3] }}>
          <Avatar name={client.name} avatarIndex={client.avatarIndex} size={40} />
          <div>
            <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900, lineHeight: 1.2 }}>
              {client.name}
            </div>
            <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginTop: 2 }}>
              {client.company}
            </div>
          </div>
        </div>
        <Badge label={statusCfg.label} color={statusCfg.color} bg={statusCfg.bg} />
      </div>

      {/* Project */}
      <div style={{
        fontSize:     FONT.size.xs,
        color:        COLOR.slate600,
        overflow:     "hidden",
        textOverflow: "ellipsis",
        whiteSpace:   "nowrap",
        display:      "flex",
        alignItems:   "center",
        gap:          SPACE[1],
      }}>
        <span style={{ opacity: 0.5 }}>📁</span> {client.project}
      </div>

      {/* Payment progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: SPACE[1] }}>
          <span style={{ fontSize: FONT.size.xs, color: COLOR.slate400 }}>
            Payment ({pct}%)
          </span>
          <span style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: COLOR.slate800 }}>
            ${(client.paid || 0).toLocaleString()} / ${client.value.toLocaleString()}
          </span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: FONT.size.xs, color: contactColor, fontWeight: FONT.weight.semibold }}>
          🕐 {days === 0 ? "Today" : `${days}d ago`}
        </span>

        <div style={{ display: "flex", gap: SPACE[1], alignItems: "center" }}>
          {client.tags?.slice(0, 2).map((tag) => <TagPill key={tag} label={tag} />)}
          <button
            onClick={(e) => { e.stopPropagation(); onAI(client); }}
            style={{
              fontSize:     FONT.size.xs,
              fontWeight:   FONT.weight.semibold,
              padding:      "3px 10px",
              borderRadius: RADIUS.full,
              background:   COLOR.brand50,
              color:        COLOR.brand600,
              border:       `1px solid ${COLOR.brand200}`,
              cursor:       "pointer",
              fontFamily:   FONT.family,
              transition:   TRANSITION.fast,
            }}
          >
            ✨ AI
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/components/features/clients/ClientDetail.js
// ────────────────────────────────────────────────────────────

function ClientDetail({ client, onClose, onEdit, onDelete, onAI, onMarkContacted }) {
  const statusCfg = CLIENT_STATUS[client.status] || CLIENT_STATUS.active;
  const days      = daysAgo(client.lastContact);
  const pct       = paymentPct(client.paid, client.value);

  return (
    <Modal title="" onClose={onClose} width={560}>
      {/* Client header */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE[4], marginBottom: SPACE[5] }}>
        <Avatar name={client.name} avatarIndex={client.avatarIndex} size={54} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: SPACE[2], marginBottom: SPACE[1] }}>
            <h2 style={{ margin: 0, fontSize: FONT.size.xl, fontWeight: FONT.weight.extrabold, color: COLOR.slate900 }}>
              {client.name}
            </h2>
            <Badge label={statusCfg.label} color={statusCfg.color} bg={statusCfg.bg} />
          </div>
          <div style={{ fontSize: FONT.size.base, color: COLOR.slate500 }}>{client.company}</div>
          <div style={{ display: "flex", gap: SPACE[4], marginTop: SPACE[1] }}>
            <a href={`mailto:${client.email}`} style={{ fontSize: FONT.size.xs, color: COLOR.brand500 }}>{client.email}</a>
            {client.phone && <span style={{ fontSize: FONT.size.xs, color: COLOR.slate400 }}>{client.phone}</span>}
          </div>
        </div>
      </div>

      <Divider style={{ marginBottom: SPACE[5] }} />

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[3], marginBottom: SPACE[5] }}>
        <StatCard label="Contract value"  value={`$${client.value.toLocaleString()}`} icon="💼" />
        <StatCard label="Amount paid"     value={`$${(client.paid || 0).toLocaleString()}`} color={client.paid >= client.value ? COLOR.success600 : COLOR.warning600} icon="✅" />
        <StatCard label="Last contacted"  value={timeAgoLabel(client.lastContact)} color={days > 14 ? COLOR.danger500 : COLOR.success600} icon="🕐" />
        <StatCard label="Due date"        value={client.dueDate || "—"} icon="📅" />
      </div>

      {/* Progress */}
      <div style={{ marginBottom: SPACE[4] }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: SPACE[1] }}>
          <span style={{ fontSize: FONT.size.sm, color: COLOR.slate600, fontWeight: FONT.weight.medium }}>
            Payment progress
          </span>
          <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: COLOR.slate800 }}>
            {pct}%
          </span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      {/* Project & stage */}
      <div style={{ display: "flex", gap: SPACE[3], marginBottom: SPACE[4] }}>
        <div style={{ flex: 1, background: COLOR.slate50, borderRadius: RADIUS.md, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
          <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginBottom: 2 }}>Project</div>
          <div style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.semibold, color: COLOR.slate900 }}>{client.project}</div>
        </div>
        <div style={{ flex: 1, background: COLOR.slate50, borderRadius: RADIUS.md, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
          <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginBottom: 2 }}>Stage</div>
          <div style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.semibold, color: COLOR.slate900 }}>{client.stage || "—"}</div>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div style={{
          background:   COLOR.slate50,
          borderRadius: RADIUS.md,
          padding:      `${SPACE[3]}px ${SPACE[4]}px`,
          marginBottom: SPACE[4],
          fontSize:     FONT.size.base,
          color:        COLOR.slate700,
          lineHeight:   FONT.lineHeight.relaxed,
          borderLeft:   `3px solid ${COLOR.brand400}`,
        }}>
          {client.notes}
        </div>
      )}

      {/* Tags */}
      {client.tags?.length > 0 && (
        <div style={{ display: "flex", gap: SPACE[1], flexWrap: "wrap", marginBottom: SPACE[5] }}>
          {client.tags.map((t) => <TagPill key={t} label={t} />)}
        </div>
      )}

      <Divider style={{ marginBottom: SPACE[4] }} />

      {/* Actions */}
      <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
        <Button onClick={() => { onMarkContacted(client.id); onClose(); }} variant="success">
          ✅ Mark contacted
        </Button>
        <Button onClick={() => { onAI(client); onClose(); }} variant="brand_ghost">
          ✨ AI Draft
        </Button>
        <Button onClick={() => onEdit(client)} variant="secondary">
          ✏️ Edit
        </Button>
        <Button onClick={() => { onDelete(client.id); onClose(); }} variant="danger">
          🗑 Delete
        </Button>
      </div>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
// src/pages/DashboardPage.js
// ────────────────────────────────────────────────────────────

// Mini bar chart — pure display, no library needed
function BarChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: SPACE[1] + 2, height: 56 }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[1] }}>
            <div style={{
              width:        "100%",
              height:       Math.max((d.v / max) * 44, 3),
              background:   color,
              borderRadius: `${RADIUS.xs}px ${RADIUS.xs}px 0 0`,
              opacity:      isLast ? 1 : 0.3 + (i / data.length) * 0.5,
              transition:   "height 0.6s ease",
            }} />
            <span style={{ fontSize: 9, color: COLOR.slate400, fontWeight: isLast ? FONT.weight.bold : FONT.weight.regular }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardPage({ clients, invoices, tasks, activity, derived, onAI }) {
  const {
    totalPipeline, totalCollected, outstanding,
    overdueInvs, activeClients, needsFollowUp,
  } = derived;

  const collectedPct = totalPipeline > 0 ? Math.round((totalCollected / totalPipeline) * 100) : 0;

  const chartData = [
    { label: "Feb", v: 3200 },
    { label: "Mar", v: 4100 },
    { label: "Apr", v: 3800 },
    { label: "May", v: 5200 },
    { label: "Jun", v: 6100 },
    { label: "Jul", v: totalCollected },
  ];

  const openTasks     = tasks.filter((t) => !t.done);
  const highPriority  = openTasks.filter((t) => t.priority === "high");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[6] }}>

      {/* Hero banner */}
      <div style={{
        background:   `linear-gradient(135deg, ${COLOR.brand500} 0%, ${COLOR.purple500} 100%)`,
        borderRadius: RADIUS.xxl,
        padding:      `${SPACE[6]}px ${SPACE[8]}px`,
        color:        COLOR.white,
        display:      "flex",
        justifyContent: "space-between",
        alignItems:   "center",
        boxShadow:    `0 8px 32px ${COLOR.brand500}40`,
      }}>
        <div>
          <div style={{ fontSize: FONT.size.sm, opacity: 0.75, marginBottom: SPACE[1] }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div style={{ fontSize: FONT.size.hero - 4, fontWeight: FONT.weight.extrabold, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Good morning 👋
          </div>
          <div style={{ fontSize: FONT.size.base, opacity: 0.75, marginTop: SPACE[2], lineHeight: FONT.lineHeight.relaxed }}>
            {openTasks.length} tasks pending · {needsFollowUp.length} clients need a follow-up
            {highPriority.length > 0 && ` · ${highPriority.length} high-priority`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: FONT.size.hero + 6, fontWeight: FONT.weight.extrabold, letterSpacing: "-0.035em", lineHeight: 1 }}>
            {formatCurrency(totalPipeline)}
          </div>
          <div style={{ fontSize: FONT.size.sm, opacity: 0.65, marginTop: SPACE[1] }}>total pipeline</div>
          <div style={{ fontSize: FONT.size.xs, opacity: 0.55, marginTop: 2 }}>
            {collectedPct}% collected
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: SPACE[4] }}>
        <StatCard label="Revenue collected"  value={formatCurrency(totalCollected)}  sub={`${collectedPct}% of pipeline`}    trend={12}  color={COLOR.success600}  icon="💰" />
        <StatCard label="Outstanding"        value={formatCurrency(outstanding)}      sub={`${clients.filter((c) => c.invoicePending).length} unpaid`}      color={outstanding > 5000 ? COLOR.danger500 : COLOR.warning500} icon="⏳" />
        <StatCard label="Overdue invoices"   value={overdueInvs.length}              sub={overdueInvs.length ? formatCurrency(overdueInvs.reduce((s, i) => s + i.amount, 0)) + " at risk" : "All clear"} color={overdueInvs.length ? COLOR.danger500 : COLOR.success600} icon="🚨" />
        <StatCard label="Active clients"     value={activeClients}                   sub={`${clients.length} total`}           color={COLOR.brand500}            icon="👥" />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: SPACE[5] }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>

          {/* Revenue chart */}
          <Card style={{ padding: `${SPACE[5]}px ${SPACE[6]}px` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE[5] }}>
              <div>
                <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.lg, color: COLOR.slate900 }}>Revenue collected</div>
                <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginTop: 2 }}>Monthly trend</div>
              </div>
              <span style={{ fontSize: FONT.size.xs, color: COLOR.success600, fontWeight: FONT.weight.bold }}>
                ▲ 12% vs Jun
              </span>
            </div>
            <BarChart data={chartData} color={COLOR.brand500} />
          </Card>

          {/* Top clients */}
          <Card>
            <div style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, borderBottom: `1px solid ${COLOR.slate100}`, fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900 }}>
              Top clients by contract value
            </div>
            {[...clients]
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map((c, i) => {
                const pct = paymentPct(c.paid, c.value);
                const cfg = CLIENT_STATUS[c.status];
                return (
                  <div key={c.id} style={{
                    display:     "flex",
                    alignItems:  "center",
                    gap:         SPACE[3],
                    padding:     `${SPACE[3]}px ${SPACE[5]}px`,
                    borderBottom: i < 4 ? `1px solid ${COLOR.slate100}` : "none",
                  }}>
                    <Avatar name={c.name} avatarIndex={c.avatarIndex} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: FONT.weight.semibold, fontSize: FONT.size.base, color: COLOR.slate900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginTop: 2 }}>{c.project}</div>
                      <div style={{ marginTop: SPACE[1] }}>
                        <ProgressBar pct={pct} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.base, color: COLOR.slate900 }}>
                        {formatCurrency(c.value)}
                      </div>
                      {cfg && <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />}
                    </div>
                  </div>
                );
              })}
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4] }}>

          {/* Alerts panel */}
          {(needsFollowUp.length > 0 || overdueInvs.length > 0) && (
            <Card>
              <div style={{ padding: `${SPACE[3]}px ${SPACE[4]}px`, borderBottom: `1px solid ${COLOR.slate100}`, display: "flex", alignItems: "center", gap: SPACE[2] }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR.danger500, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.base, color: COLOR.slate900 }}>
                  Needs attention
                </span>
              </div>
              {[
                ...overdueInvs.slice(0, 2).map((inv) => ({
                  text:   `${inv.client}: ${formatCurrency(inv.amount)} invoice overdue`,
                  color:  COLOR.danger500,
                  client: clients.find((c) => c.id === inv.clientId),
                })),
                ...needsFollowUp.slice(0, 3).map((c) => ({
                  text:   `${c.name}: ${daysAgo(c.lastContact)}d no contact`,
                  color:  COLOR.warning500,
                  client: c,
                })),
              ].slice(0, 5).map((alert, i) => (
                <div key={i} style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         SPACE[2],
                  padding:     `${SPACE[3]}px ${SPACE[4]}px`,
                  borderBottom: `1px solid ${COLOR.slate100}`,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: alert.color, flexShrink: 0 }} />
                  <span style={{ fontSize: FONT.size.xs, color: COLOR.slate700, flex: 1, lineHeight: FONT.lineHeight.normal }}>
                    {alert.text}
                  </span>
                  {alert.client && (
                    <button
                      onClick={() => onAI(alert.client)}
                      style={{
                        fontSize:   FONT.size.xs, fontWeight: FONT.weight.bold,
                        padding:    "3px 9px", borderRadius: RADIUS.full,
                        background: COLOR.brand50, color: COLOR.brand600,
                        border:     `1px solid ${COLOR.brand200}`,
                        cursor:     "pointer", fontFamily: FONT.family, whiteSpace: "nowrap",
                      }}
                    >
                      AI ✨
                    </button>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Activity feed */}
          <Card style={{ flex: 1 }}>
            <div style={{ padding: `${SPACE[3]}px ${SPACE[4]}px`, borderBottom: `1px solid ${COLOR.slate100}`, fontWeight: FONT.weight.bold, fontSize: FONT.size.base, color: COLOR.slate900 }}>
              Recent activity
            </div>
            {activity.map((item, i) => (
              <div key={item.id} style={{
                display:     "flex",
                gap:         SPACE[3],
                padding:     `${SPACE[3]}px ${SPACE[4]}px`,
                borderBottom: i < activity.length - 1 ? `1px solid ${COLOR.slate100}` : "none",
                alignItems:  "flex-start",
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: FONT.size.xs, color: COLOR.slate700, lineHeight: FONT.lineHeight.normal }}>{item.text}</div>
                  <div style={{ fontSize: 10, color: COLOR.slate400, marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/pages/ClientsPage.js
// ────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["all", "active", "overdue", "prospect", "completed"];

function ClientsPage({ clients, actions, onAI }) {
  const [selected,    setSelected]    = useState(null);
  const [editing,     setEditing]     = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { filtered, search, setSearch, statusFilter, setStatusFilter } = useFilter(
    clients,
    ["name", "company", "project", "email"],
    "status"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: SPACE[3], alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, company, project…"
        />
        <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => (
            <FilterTab
              key={s}
              label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
        <Button onClick={() => setShowAddForm(true)} variant="primary">
          + Add client
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No clients found"
          body={search ? `No results for "${search}". Try a different search.` : "Add your first client to get started."}
          action={<Button onClick={() => setShowAddForm(true)} variant="primary">Add client</Button>}
        />
      ) : (
        <div style={{
          display:               "grid",
          gridTemplateColumns:   "repeat(auto-fill, minmax(300px, 1fr))",
          gap:                   SPACE[4],
        }}>
          {filtered.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              onSelect={setSelected}
              onAI={onAI}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selected && !editing && (
        <ClientDetail
          client={selected}
          onClose={() => setSelected(null)}
          onEdit={(c) => { setEditing(c); setSelected(null); }}
          onDelete={(id) => { actions.deleteClient(id); setSelected(null); }}
          onAI={onAI}
          onMarkContacted={actions.markContacted}
        />
      )}

      {editing && (
        <Modal title="Edit client" onClose={() => setEditing(null)}>
          <ClientForm
            initial={editing}
            onSave={actions.updateClient}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}

      {showAddForm && (
        <Modal title="Add new client" onClose={() => setShowAddForm(false)}>
          <ClientForm
            onSave={actions.addClient}
            onClose={() => setShowAddForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/pages/InvoicesPage.js
// ────────────────────────────────────────────────────────────

function InvoiceForm({ clients, onSave, onClose }) {
  const [f, setF] = useState({ clientId: clients[0]?.id || "", desc: "", amount: "", due: "", status: "draft" });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const client = clients.find((c) => c.id === f.clientId || c.id == f.clientId);
  const valid = f.amount && f.clientId;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4] }}>
      <Select label="Client" value={f.clientId} onChange={set("clientId")}>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
      </Select>
      <Input label="Description" value={f.desc} onChange={set("desc")} placeholder="Website design – Phase 1" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[3] }}>
        <Input label="Amount ($)" value={f.amount} onChange={set("amount")} type="number" placeholder="2500" required />
        <Input label="Due date"   value={f.due}    onChange={set("due")}    type="date" />
      </div>
      <Select label="Status" value={f.status} onChange={set("status")}>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
      </Select>
      <div style={{ display: "flex", gap: SPACE[3] }}>
        <Button onClick={onClose} variant="secondary" fullWidth>Cancel</Button>
        <Button onClick={() => { if (!valid) return; onSave({ clientId: f.clientId, client: client?.name, amount: Number(f.amount), desc: f.desc, due: f.due, status: f.status }); onClose(); }} variant="primary" fullWidth disabled={!valid}>
          Create invoice
        </Button>
      </div>
    </div>
  );
}

function InvoicesPage({ invoices, clients, actions }) {
  const [filter,   setFilter]   = useState("all");
  const [showAdd,  setShowAdd]  = useState(false);

  const filtered = invoices.filter((i) => filter === "all" || i.status === filter);
  const totalFor = (s) => invoices.filter((i) => s === "all" || i.status === s).reduce((x, i) => x + i.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: SPACE[4] }}>
        <StatCard label="Total invoiced"  value={formatCurrency(totalFor("all"))}     icon="📄" />
        <StatCard label="Paid"            value={formatCurrency(totalFor("paid"))}    color={COLOR.success600} icon="✅" />
        <StatCard label="Outstanding"     value={formatCurrency(totalFor("sent"))}    color={COLOR.warning500} icon="⏳" />
        <StatCard label="Overdue"         value={formatCurrency(totalFor("overdue"))} color={COLOR.danger500}  icon="🚨" />
      </div>

      <div style={{ display: "flex", gap: SPACE[3], alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: SPACE[2] }}>
          {["all","sent","paid","overdue","draft"].map((s) => (
            <FilterTab key={s} label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} active={filter === s} onClick={() => setFilter(s)} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button onClick={() => setShowAdd(true)} variant="primary">+ New invoice</Button>
      </div>

      <Card>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1.5fr 100px 120px 130px", gap: SPACE[3], padding: `${SPACE[3]}px ${SPACE[5]}px`, background: COLOR.slate50, borderBottom: `1px solid ${COLOR.slate200}` }}>
          {["Invoice","Client","Description","Amount","Due","Status"].map((h) => (
            <div key={h} style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: COLOR.slate400, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📄" title="No invoices" body="Create your first invoice to start tracking payments." />
        ) : (
          filtered.map((inv, i) => {
            const cfg = INVOICE_STATUS[inv.status] || INVOICE_STATUS.draft;
            return (
              <div key={inv.id} style={{
                display:     "grid",
                gridTemplateColumns: "100px 1fr 1.5fr 100px 120px 130px",
                gap:         SPACE[3],
                padding:     `${SPACE[4]}px ${SPACE[5]}px`,
                borderBottom: i < filtered.length - 1 ? `1px solid ${COLOR.slate100}` : "none",
                alignItems:  "center",
              }}>
                <div style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: COLOR.slate700, fontFamily: "'JetBrains Mono', monospace" }}>{inv.id}</div>
                <div style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.medium, color: COLOR.slate900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.client}</div>
                <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.desc}</div>
                <div style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>{formatCurrency(inv.amount)}</div>
                <div style={{ fontSize: FONT.size.xs, color: inv.status === "overdue" ? COLOR.danger500 : COLOR.slate500, fontWeight: inv.status === "overdue" ? FONT.weight.bold : FONT.weight.regular }}>{inv.due || "—"}</div>
                <div style={{ display: "flex", gap: SPACE[2], alignItems: "center" }}>
                  <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />
                  {inv.status !== "paid" && (
                    <button onClick={() => actions.markInvoicePaid(inv.id)} title="Mark as paid" style={{
                      background: COLOR.success100, border: "none", borderRadius: RADIUS.sm,
                      padding: "3px 8px", cursor: "pointer", fontSize: FONT.size.xs,
                      color: COLOR.success600, fontWeight: FONT.weight.bold, fontFamily: FONT.family,
                    }}>✓ Paid</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {showAdd && (
        <Modal title="Create invoice" onClose={() => setShowAdd(false)}>
          <InvoiceForm clients={clients} onSave={actions.addInvoice} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/pages/TasksPage.js
// ────────────────────────────────────────────────────────────

function TaskForm({ clients, onSave, onClose }) {
  const [f, setF] = useState({ clientId: clients[0]?.id || "", text: "", due: "", priority: "medium" });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const client = clients.find((c) => c.id === f.clientId || c.id == f.clientId);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4] }}>
      <Select label="Client" value={f.clientId} onChange={set("clientId")}>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
      </Select>
      <Input label="Task description" value={f.text} onChange={set("text")} placeholder="Send revised proposal…" required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[3] }}>
        <Input label="Due date" value={f.due} onChange={set("due")} type="date" />
        <Select label="Priority" value={f.priority} onChange={set("priority")}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
      </div>
      <div style={{ display: "flex", gap: SPACE[3] }}>
        <Button onClick={onClose} variant="secondary" fullWidth>Cancel</Button>
        <Button onClick={() => { if (!f.text.trim()) return; onSave({ clientId: f.clientId, client: client?.name, text: f.text, due: f.due, priority: f.priority }); onClose(); }} variant="primary" fullWidth disabled={!f.text.trim()}>
          Add task
        </Button>
      </div>
    </div>
  );
}

function TasksPage({ tasks, clients, actions }) {
  const [filter,  setFilter]  = useState("open");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "open" ? !t.done : t.done
  ).sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] || 1) - (order[b.priority] || 1);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: SPACE[4] }}>
        <StatCard label="Open tasks"    value={tasks.filter((t) => !t.done).length}                              color={COLOR.brand500}   icon="📋" />
        <StatCard label="High priority" value={tasks.filter((t) => !t.done && t.priority === "high").length}     color={COLOR.danger500}  icon="🔥" />
        <StatCard label="Completed"     value={tasks.filter((t) =>  t.done).length}                              color={COLOR.success600} icon="✅" />
      </div>

      <div style={{ display: "flex", gap: SPACE[3], alignItems: "center" }}>
        <div style={{ display: "flex", gap: SPACE[2] }}>
          {[["open","Open"],["done","Done"],["all","All"]].map(([v, l]) => (
            <FilterTab key={v} label={l} active={filter === v} onClick={() => setFilter(v)} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button onClick={() => setShowAdd(true)} variant="primary">+ Add task</Button>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="✅" title="Nothing here" body={filter === "done" ? "No completed tasks yet." : "All caught up! Add a new task to stay on top of things."} action={<Button onClick={() => setShowAdd(true)} variant="primary">Add task</Button>} />
        ) : filtered.map((t, i) => {
          const p = PRIORITY[t.priority] || PRIORITY.medium;
          const isOverdue = t.due && !t.done && new Date(t.due) < new Date();
          return (
            <div key={t.id} style={{
              display:     "flex",
              alignItems:  "center",
              gap:         SPACE[3],
              padding:     `${SPACE[4]}px ${SPACE[5]}px`,
              borderBottom: i < filtered.length - 1 ? `1px solid ${COLOR.slate100}` : "none",
              opacity:     t.done ? 0.5 : 1,
              transition:  "opacity 0.2s",
            }}>
              <input type="checkbox" checked={t.done} onChange={() => actions.toggleTask(t.id)}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: COLOR.brand500, flexShrink: 0 }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: FONT.size.base, color: COLOR.slate900, fontWeight: FONT.weight.medium, textDecoration: t.done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.text}
                </div>
                <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginTop: 2 }}>
                  {t.client}
                  {t.due && <span style={{ color: isOverdue ? COLOR.danger500 : COLOR.slate400 }}> · Due {t.due}</span>}
                </div>
              </div>
              <span style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.semibold, color: p.color, background: p.color + "15", padding: "2px 8px", borderRadius: RADIUS.full }}>
                {p.label}
              </span>
              <button onClick={() => actions.deleteTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: COLOR.slate300, padding: SPACE[1], lineHeight: 1 }}>🗑</button>
            </div>
          );
        })}
      </Card>

      {showAdd && (
        <Modal title="Add task" onClose={() => setShowAdd(false)}>
          <TaskForm clients={clients} onSave={actions.addTask} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/pages/PipelinePage.js
// ────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { id: "prospect",  label: "Prospect",    color: COLOR.warning500  },
  { id: "active",    label: "Active",      color: COLOR.brand500    },
  { id: "overdue",   label: "Overdue",     color: COLOR.danger500   },
  { id: "completed", label: "Completed",   color: COLOR.success600  },
];

function PipelineCard({ client, onAI }) {
  const [hovered, setHovered] = useState(false);
  const pct = paymentPct(client.paid, client.value);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   COLOR.white,
        borderRadius: RADIUS.lg,
        border:       `1.5px solid ${hovered ? COLOR.brand400 : COLOR.slate200}`,
        padding:      `${SPACE[3]}px ${SPACE[4]}px`,
        boxShadow:    hovered ? SHADOW.md : SHADOW.xs,
        transition:   "all 0.15s",
        display:      "flex",
        flexDirection:"column",
        gap:          SPACE[3],
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE[2] }}>
        <Avatar name={client.name} avatarIndex={client.avatarIndex} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.semibold, color: COLOR.slate900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {client.name}
          </div>
          <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400 }}>{client.company}</div>
        </div>
      </div>
      <div style={{ fontSize: FONT.size.xs, color: COLOR.slate600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        📁 {client.project}
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: SPACE[1] }}>
          <span style={{ fontSize: 10, color: COLOR.slate400 }}>{pct}% paid</span>
          <span style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: COLOR.slate800 }}>
            {formatCurrency(client.value)}
          </span>
        </div>
        <ProgressBar pct={pct} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: COLOR.slate400 }}>{client.stage || "—"}</span>
        <button
          onClick={() => onAI(client)}
          style={{
            fontSize: 10, fontWeight: FONT.weight.bold,
            padding: "3px 8px", borderRadius: RADIUS.full,
            background: COLOR.brand50, color: COLOR.brand600,
            border: `1px solid ${COLOR.brand200}`,
            cursor: "pointer", fontFamily: FONT.family,
          }}
        >
          ✨ AI
        </button>
      </div>
    </div>
  );
}

function PipelinePage({ clients, onAI }) {
  const totalByStage = PIPELINE_STAGES.reduce((acc, s) => {
    const stageClients = clients.filter((c) => c.status === s.id);
    acc[s.id] = {
      clients: stageClients,
      total: stageClients.reduce((sum, c) => sum + c.value, 0),
    };
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>
      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: SPACE[4] }}>
        {PIPELINE_STAGES.map((stage) => {
          const data = totalByStage[stage.id];
          return (
            <div key={stage.id} style={{
              background: COLOR.white, borderRadius: RADIUS.xl,
              border: `1.5px solid ${COLOR.slate200}`, padding: `${SPACE[4]}px ${SPACE[5]}px`,
              boxShadow: SHADOW.xs, borderTop: `3px solid ${stage.color}`,
            }}>
              <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500, fontWeight: FONT.weight.medium, marginBottom: SPACE[2] }}>
                {stage.label}
              </div>
              <div style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.extrabold, color: COLOR.slate900, letterSpacing: "-0.02em" }}>
                {formatCurrency(data.total)}
              </div>
              <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400, marginTop: SPACE[1] }}>
                {data.clients.length} client{data.clients.length !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: SPACE[4], alignItems: "start" }}>
        {PIPELINE_STAGES.map((stage) => {
          const data = totalByStage[stage.id];
          return (
            <div key={stage.id}>
              {/* Column header */}
              <div style={{
                display: "flex", alignItems: "center", gap: SPACE[2],
                marginBottom: SPACE[3], padding: `0 ${SPACE[1]}px`,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />
                <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: COLOR.slate700 }}>
                  {stage.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: FONT.weight.bold,
                  background: stage.color + "18", color: stage.color,
                  borderRadius: RADIUS.full, padding: "1px 7px",
                }}>
                  {data.clients.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: SPACE[3] }}>
                {data.clients.length === 0 ? (
                  <div style={{
                    background: COLOR.slate50, borderRadius: RADIUS.lg,
                    border: `1.5px dashed ${COLOR.slate200}`,
                    padding: `${SPACE[6]}px ${SPACE[4]}px`,
                    textAlign: "center", fontSize: FONT.size.xs, color: COLOR.slate400,
                  }}>
                    No clients here
                  </div>
                ) : (
                  data.clients.map((c) => (
                    <PipelineCard key={c.id} client={c} onAI={onAI} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/pages/LaunchGuidePage.js
// ────────────────────────────────────────────────────────────

const PHASES = [
  {
    emoji: "🎯", title: "Week 1–2: Validate & Set Up",
    color: COLOR.brand500,
    steps: [
      {
        icon: "1",
        head: "Deploy your stack (zero upfront cost)",
        body: "Push this app to Vercel (free tier — takes 3 minutes). Register a domain on Namecheap (~$10/yr). Set up Lemon Squeezy for subscriptions (no monthly fee — only 5% + $0.50 per transaction, so you pay nothing until you earn). Get your Anthropic API key at console.anthropic.com. Total Day 1 cost: ~$10.",
      },
      {
        icon: "2",
        head: "Define your ICP with surgical precision",
        body: "Your ideal customer: solo freelancers (web designers, developers, copywriters) with 5–15 active clients, earning $3K–$15K/month, who currently track everything in Notion or spreadsheets. They're in pain daily. Find them on Twitter/X (#freelance), Reddit (r/freelance, r/webdev), and LinkedIn. Do not try to serve everyone — serve this person only at first.",
      },
      {
        icon: "3",
        head: "Post in 5 communities for 50 beta users",
        body: "Post in r/freelance, r/webdev, r/graphic_design, r/forhire, and Indie Hackers. Framing: 'I built a free AI CRM for freelancers that drafts your follow-up emails automatically — looking for 50 beta testers for honest feedback.' Don't pitch. Ask for feedback. Aim for 50 signups in Week 1.",
      },
      {
        icon: "4",
        head: "DM 30 target freelancers on LinkedIn",
        body: "Search 'freelance designer' or 'freelance developer'. Send: 'Hey [Name] — I built a CRM for freelancers with AI email drafting built in. Would you try it free and give me 10 min of feedback?' Close 5–10 testers. These early conversations are worth more than any marketing campaign.",
      },
    ],
  },
  {
    emoji: "💰", title: "Week 3–4: First Revenue",
    color: COLOR.success600,
    steps: [
      {
        icon: "5",
        head: "Set your 3-tier pricing",
        body: "Free: 3 clients, no AI. Pro ($39/mo): unlimited clients + full AI drafts + invoice tracking. Agency ($79/mo): 3 team members + white-label. Offer your 50 beta users a permanent 50% discount ($19.50/mo) if they convert before your launch date. You need 26 Pro users to hit $1,000 MRR.",
      },
      {
        icon: "6",
        head: "Convert beta → paid with urgency",
        body: "Email all beta users on Day 7: 'The free beta closes Friday. You've [used X features] — lock in 50% off forever as a founding member.' Expect 10–20% conversion. 50 beta users → 5–10 paying = $200–$500 MRR from week one. Every founding member is also a testimonial source.",
      },
      {
        icon: "7",
        head: "Launch on Product Hunt (Thursday)",
        body: "Schedule for Thursday 12:01 AM EST. Prepare: a 60-second screen recording GIF, 5 high-quality screenshots, and a punchy tagline ('The AI CRM freelancers actually use'). Brief your 50 beta users to upvote at launch. Top 5 Product of the Day = 500–2,000 new signups in 24 hours. This alone can take you from $0 to $1K MRR.",
      },
      {
        icon: "8",
        head: "Start a daily Twitter/X content flywheel",
        body: "Post every weekday: client management tips, invoice email templates, follow-up scripts, MRR updates (#BuildInPublic). Consistency beats volume. 500 followers → 50 warm leads/month. Share your journey openly — 'We hit $500 MRR today' posts outperform any ad. This compounds over months.",
      },
    ],
  },
  {
    emoji: "📈", title: "Month 2–3: Scale to $5K MRR",
    color: COLOR.purple500,
    steps: [
      {
        icon: "9",
        head: "Launch a referral program",
        body: "Add in-app: 'Give a friend 1 month free — get 1 month free.' Each satisfied user brings 1.2 more on average. At 50 users this nets 60 referrals. Use ReferralHero ($49/mo) to automate tracking and reward delivery. This is the highest-ROI growth channel at this stage — don't skip it.",
      },
      {
        icon: "10",
        head: "Start YouTube Shorts / TikTok tutorials",
        body: "'How I follow up with 20 clients in 10 minutes using AI' — record a 3-min screen share. Post on YouTube Shorts and TikTok with #freelance #productivity hashtags. Freelancer content gets 5K–100K views organically. One viral video = 100–500 new signups. Batch-record 10 videos in one sitting.",
      },
      {
        icon: "11",
        head: "Partner with freelance educators",
        body: "Find 5 freelance coaches on YouTube/Twitter with 10K+ followers. Offer 30% recurring affiliate commission. One good partner can bring 50–200 paid users. Use Lemon Squeezy's built-in affiliate tracking — zero extra work. This is your biggest lever at this stage.",
      },
      {
        icon: "12",
        head: "Add real invoice sending + Stripe payments",
        body: "Integrate Stripe so users can send real invoices and collect payment inside ClientPulse. This is your biggest retention feature — users who collect money inside the tool have 3× lower churn. You can also charge a 0.5% platform fee on payments processed, creating a second revenue stream.",
      },
    ],
  },
  {
    emoji: "🚀", title: "Month 4–6: $10K+ MRR",
    color: COLOR.warning600,
    steps: [
      {
        icon: "★",
        head: "SEO content machine",
        body: "Write 20 blog posts targeting: 'crm for freelancers', 'how to follow up with clients', 'freelance invoice template', 'client management software'. Each post brings 50–500 free monthly visitors. Use Ahrefs (7-day free trial) to find keywords with low competition. SEO compounds — by month 6 it's your largest traffic source.",
      },
      {
        icon: "★",
        head: "Public changelog + user roadmap voting",
        body: "Users stay when they feel heard. Post every feature update publicly. Ask users to vote on what to build next via Canny.io (free plan). Users who submit feature requests have 4× lower churn. Ship one user-requested feature per week — post about it every time. This is community-building disguised as product work.",
      },
      {
        icon: "★",
        head: "Move upmarket: agency plan",
        body: "Small agencies manage 20–100 clients and pay $149–$299/month without blinking. Add: shared client workspace, role-based permissions, team AI credits, client portal (read-only view for clients). One agency = 5–8× the revenue of one solo user. Your first 3 agency customers take you from $5K to $8K MRR instantly.",
      },
      {
        icon: "★",
        head: "AppSumo marketplace deal",
        body: "Apply at appsumo.com/sell. AppSumo promotes you to their 1M+ buyer list. Typical deal: $69–$99 lifetime access, 30–40% goes to you. Target 300 sales = $6K–$12K in one week + 300 vocal advocates who spread your product. This is the fastest path to escaping the early trough and building momentum toward $10K MRR.",
      },
    ],
  },
];

const METRICS = [
  { month: "Month 1",  mrr: "$500",     users: "13 paid",  cac: "$0",   action: "Beta → paid conversion" },
  { month: "Month 2",  mrr: "$1,500",   users: "38 paid",  cac: "$12",  action: "Product Hunt + referrals" },
  { month: "Month 3",  mrr: "$3,500",   users: "90 paid",  cac: "$18",  action: "Content flywheel + affiliates" },
  { month: "Month 6",  mrr: "$10,000",  users: "256 paid", cac: "$25",  action: "SEO + agency plan" },
  { month: "Month 12", mrr: "$30,000+", users: "750+ paid", cac: "$30", action: "Self-serve + expansion revenue" },
];

const STACK = [
  { tool: "Vercel",       use: "Hosting",                 cost: "Free"           },
  { tool: "Supabase",     use: "Database + auth",         cost: "Free"           },
  { tool: "Anthropic API",use: "AI email drafts",         cost: "~$0.003/draft"  },
  { tool: "Lemon Squeezy",use: "Subscriptions",           cost: "5% fee only"    },
  { tool: "Resend",       use: "Transactional email",     cost: "Free to 3K/mo"  },
  { tool: "PostHog",      use: "Analytics",               cost: "Free to 1M/mo"  },
  { tool: "Canny",        use: "Feature roadmap",         cost: "Free"           },
  { tool: "ReferralHero", use: "Referral program",        cost: "$49/mo"         },
];

function LaunchGuidePage() {
  const [openPhase, setOpenPhase] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[6] }}>

      {/* Hero */}
      <div style={{
        background:   `linear-gradient(135deg, ${COLOR.slate900} 0%, #1e1b4b 100%)`,
        borderRadius: RADIUS.xxl,
        padding:      `${SPACE[8]}px`,
        color:        COLOR.white,
        boxShadow:    SHADOW.xl,
      }}>
        <div style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, marginBottom: SPACE[3] }}>
          Your step-by-step playbook
        </div>
        <div style={{ fontSize: FONT.size.hero + 4, fontWeight: FONT.weight.extrabold, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: SPACE[4] }}>
          From $0 to $10K MRR<br />in 6 months.
        </div>
        <div style={{ fontSize: FONT.size.base, opacity: 0.65, lineHeight: FONT.lineHeight.relaxed, maxWidth: 560 }}>
          A realistic, no-fluff launch roadmap built specifically for ClientPulse. Follow each phase in order.{" "}
          <strong style={{ color: COLOR.brand200 }}>
            The #1 mistake founders make is trying to scale before they have 10 paying customers.
          </strong>{" "}
          Don't skip ahead.
        </div>
      </div>

      {/* Phases */}
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE[3] }}>
        {PHASES.map((phase, pi) => (
          <Card key={pi} style={{ overflow: "hidden" }}>
            <button
              onClick={() => setOpenPhase(openPhase === pi ? -1 : pi)}
              style={{
                width:      "100%",
                display:    "flex",
                alignItems: "center",
                gap:        SPACE[4],
                padding:    `${SPACE[4]}px ${SPACE[6]}px`,
                background: "none",
                border:     "none",
                cursor:     "pointer",
                fontFamily: FONT.family,
                textAlign:  "left",
              }}
            >
              <span style={{ fontSize: 22 }}>{phase.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>
                  {phase.title}
                </div>
              </div>
              <div style={{
                width:          28, height: 28, borderRadius: "50%",
                background:     phase.color + "18",
                color:          phase.color,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       FONT.size.md,
                fontWeight:     FONT.weight.bold,
                flexShrink:     0,
              }}>
                {openPhase === pi ? "−" : "+"}
              </div>
            </button>

            {openPhase === pi && (
              <div style={{ borderTop: `1px solid ${COLOR.slate100}`, padding: `${SPACE[5]}px ${SPACE[6]}px`, display: "flex", flexDirection: "column", gap: SPACE[5] }}>
                {phase.steps.map((step, si) => (
                  <div key={si} style={{ display: "flex", gap: SPACE[4] }}>
                    <div style={{
                      width:          32, height: 32, borderRadius: "50%",
                      background:     phase.color + "15",
                      color:          phase.color,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      fontSize:       FONT.size.sm,
                      fontWeight:     FONT.weight.extrabold,
                      flexShrink:     0,
                      marginTop:      2,
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900, marginBottom: SPACE[1] }}>
                        {step.head}
                      </div>
                      <div style={{ fontSize: FONT.size.base, color: COLOR.slate600, lineHeight: FONT.lineHeight.relaxed }}>
                        {step.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Revenue projections */}
      <Card>
        <div style={{ padding: `${SPACE[4]}px ${SPACE[6]}px`, borderBottom: `1px solid ${COLOR.slate100}`, fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900 }}>
          📊 Realistic revenue projections
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLOR.slate50 }}>
                {["Month", "MRR Target", "Paid Users", "Avg CAC", "Key lever"].map((h) => (
                  <th key={h} style={{ padding: `${SPACE[3]}px ${SPACE[5]}px`, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: COLOR.slate400, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${COLOR.slate100}` }}>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>{r.month}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, fontWeight: FONT.weight.extrabold, color: COLOR.success600 }}>{r.mrr}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, color: COLOR.slate700 }}>{r.users}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, color: COLOR.slate500 }}>{r.cac}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.sm, color: COLOR.slate600 }}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tool stack */}
      <Card style={{ padding: `${SPACE[5]}px ${SPACE[6]}px` }}>
        <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900, marginBottom: SPACE[4] }}>
          🛠 Essential tool stack (mostly free)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: SPACE[3] }}>
          {STACK.map((t) => (
            <div key={t.tool} style={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              background:     COLOR.slate50,
              borderRadius:   RADIUS.md,
              padding:        `${SPACE[3]}px ${SPACE[4]}px`,
              border:         `1px solid ${COLOR.slate200}`,
            }}>
              <div>
                <div style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>{t.tool}</div>
                <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500 }}>{t.use}</div>
              </div>
              <span style={{
                fontSize:   FONT.size.xs, fontWeight: FONT.weight.bold,
                color:      COLOR.success600, background: COLOR.success100,
                padding:    "3px 9px", borderRadius: RADIUS.full,
              }}>
                {t.cost}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// src/App.js
// ────────────────────────────────────────────────────────────

function App() {
  const { state, actions, derived } = useAppStore();
  const { page, aiClient } = state.ui;
  const { clients, invoices, tasks, activity } = state;

  const totalAlerts = derived.badges.overdueClients + derived.badges.overdueInvoices;

  return (
    <div style={{
      display:    "flex",
      minHeight:  "100vh",
      background: COLOR.slate50,
      fontFamily: FONT.family,
    }}>
      {/* ── Sidebar ── */}
      <Sidebar
        page={page}
        onNavigate={actions.setPage}
        badges={derived.badges}
      />

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar page={page} alerts={totalAlerts} />

        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {page === "dashboard" && (
            <DashboardPage
              clients={clients}
              invoices={invoices}
              tasks={tasks}
              activity={activity}
              derived={derived}
              onAI={actions.setAiClient}
            />
          )}

          {page === "clients" && (
            <ClientsPage
              clients={clients}
              actions={actions}
              onAI={actions.setAiClient}
            />
          )}

          {page === "invoices" && (
            <InvoicesPage
              invoices={invoices}
              clients={clients}
              actions={actions}
            />
          )}

          {page === "tasks" && (
            <TasksPage
              tasks={tasks}
              clients={clients}
              actions={actions}
            />
          )}

          {page === "pipeline" && (
            <PipelinePage
              clients={clients}
              onAI={actions.setAiClient}
            />
          )}

          {page === "launch" && (
            <LaunchGuidePage />
          )}
        </main>
      </div>

      {/* ── AI Panel (global overlay) ── */}
      {aiClient && (
        <AIPanel
          client={aiClient}
          onClose={() => actions.setAiClient(null)}
        />
      )}
    </div>
  );
}

// ─── Entry point ─────────────────────────────────────────────
export default function ClientPulse() {
  return <App />;
}
