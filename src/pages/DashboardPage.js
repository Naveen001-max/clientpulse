import { COLOR, FONT, SPACE, RADIUS, SHADOW } from "../constants/tokens.js";
import { formatCurrency, daysAgo, paymentPct } from "../utils/index.js";
import { StatCard, Card, Avatar, Badge, ProgressBar } from "../components/ui/index.js";
import { CLIENT_STATUS } from "../constants/domain.js";

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

export function DashboardPage({ clients, invoices, tasks, activity, derived, onAI }) {
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
