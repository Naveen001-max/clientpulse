import { useState } from "react";
import { COLOR, FONT, SPACE, RADIUS, SHADOW } from "../constants/tokens.js";
import { CLIENT_STATUS } from "../constants/domain.js";
import { formatCurrency, paymentPct } from "../utils/index.js";
import { Avatar, ProgressBar, Badge } from "../components/ui/index.js";

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

export function PipelinePage({ clients, onAI }) {
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
