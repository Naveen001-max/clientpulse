import { COLOR, FONT, SPACE, SHADOW } from "../../constants/tokens.js";

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

export function Topbar({ page, alerts = 0 }) {
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
