import { COLOR, FONT, SPACE, RADIUS, SHADOW, TRANSITION } from "../../../constants/tokens.js";
import { CLIENT_STATUS } from "../../../constants/domain.js";
import { daysAgo, paymentPct } from "../../../utils/index.js";
import { Avatar, Badge, TagPill, ProgressBar } from "../../ui/index.js";
import { useState } from "react";

export function ClientCard({ client, onSelect, onAI }) {
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
