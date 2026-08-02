import { COLOR } from "./tokens.js";

export const CLIENT_STATUS = {
  active:    { label: "Active",    color: COLOR.success600, bg: COLOR.success100 },
  overdue:   { label: "Overdue",   color: COLOR.danger600,  bg: COLOR.danger100  },
  prospect:  { label: "Prospect",  color: COLOR.warning600, bg: COLOR.warning100 },
  completed: { label: "Completed", color: COLOR.slate500,   bg: COLOR.slate100   },
};

export const INVOICE_STATUS = {
  draft:   { label: "Draft",   color: COLOR.slate500,   bg: COLOR.slate100   },
  sent:    { label: "Sent",    color: COLOR.brand600,   bg: COLOR.brand50    },
  paid:    { label: "Paid",    color: COLOR.success600, bg: COLOR.success100 },
  overdue: { label: "Overdue", color: COLOR.danger600,  bg: COLOR.danger100  },
};

export const PRIORITY = {
  high:   { label: "High",   color: COLOR.danger500  },
  medium: { label: "Medium", color: COLOR.warning500 },
  low:    { label: "Low",    color: COLOR.success500 },
};

export const AVATAR_PALETTE = [
  { bg: COLOR.brand500,   text: "#fff" },
  { bg: COLOR.success500, text: "#fff" },
  { bg: COLOR.warning500, text: "#fff" },
  { bg: COLOR.danger500,  text: "#fff" },
  { bg: COLOR.purple500,  text: "#fff" },
  { bg: COLOR.cyan500,    text: "#fff" },
];

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",    icon: "◈",  badgeKey: null          },
  { id: "clients",   label: "Clients",      icon: "⬡",  badgeKey: "overdueClients" },
  { id: "invoices",  label: "Invoices",     icon: "◻",  badgeKey: "overdueInvoices" },
  { id: "tasks",     label: "Tasks",        icon: "◇",  badgeKey: "highPriorityTasks" },
  { id: "pipeline",  label: "Pipeline",     icon: "◑",  badgeKey: null          },
  { id: "launch",    label: "Launch Guide", icon: "↗",  badgeKey: null          },
];

export const AI_QUICK_ACTIONS = [
  { id: "invoice_reminder",  emoji: "💸", label: "Invoice reminder",    promptKey: "invoice_reminder"  },
  { id: "warm_checkin",      emoji: "👋", label: "Warm check-in",       promptKey: "warm_checkin"      },
  { id: "upsell",            emoji: "📈", label: "Upsell next phase",   promptKey: "upsell"            },
  { id: "update_request",    emoji: "🔄", label: "Request update",      promptKey: "update_request"    },
  { id: "project_wrapup",    emoji: "🎉", label: "Project wrap-up",     promptKey: "project_wrapup"    },
  { id: "meeting_request",   emoji: "📅", label: "Book a call",         promptKey: "meeting_request"   },
];
