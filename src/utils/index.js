/**
 * Pure utility functions — no side effects, fully testable.
 * Nothing in here should know about React or the DOM.
 */

/** Format a number as a USD currency string */
export const formatCurrency = (n) =>
  "$" + Number(n || 0).toLocaleString("en-US");

/** Format a number as a compact currency (e.g. $4.2K) */
export const formatCurrencyCompact = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
};

/** Return days elapsed since a date string (YYYY-MM-DD) */
export const daysAgo = (dateStr) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);

/** Return today as YYYY-MM-DD */
export const today = () => new Date().toISOString().split("T")[0];

/** Human-readable elapsed time label */
export const timeAgoLabel = (dateStr) => {
  const days = daysAgo(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

/** Extract up to 2 initials from a full name */
export const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/** Generate a short unique-enough ID */
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Clamp a number between min and max */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Percentage (0–100) of paid vs total */
export const paymentPct = (paid = 0, total = 1) =>
  clamp(Math.round((paid / total) * 100), 0, 100);

/** Derive contact staleness severity from days */
export const staleness = (days) => {
  if (days > 21) return "critical";
  if (days > 10) return "warning";
  return "ok";
};

/** Build the AI system prompt for a given client */
export const buildAISystemPrompt = (client) => `
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
export const buildQuickActionPrompt = (actionId, client) => {
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
export const parseTags = (tagsInput) => {
  if (Array.isArray(tagsInput)) return tagsInput;
  return (tagsInput || "").split(",").map((t) => t.trim()).filter(Boolean);
};

/** Derive revenue metrics from clients and invoices arrays */
export const deriveMetrics = (clients, invoices) => {
  const totalPipeline  = clients.reduce((s, c) => s + (c.value || 0), 0);
  const totalCollected = clients.reduce((s, c) => s + (c.paid  || 0), 0);
  const outstanding    = totalPipeline - totalCollected;
  const overdueInvs    = invoices.filter((i) => i.status === "overdue");
  const overdueAmount  = overdueInvs.reduce((s, i) => s + i.amount, 0);
  const activeClients  = clients.filter((c) => c.status === "active").length;
  return { totalPipeline, totalCollected, outstanding, overdueInvs, overdueAmount, activeClients };
};
