import { COLOR, FONT, SPACE, RADIUS } from "../../../constants/tokens.js";
import { CLIENT_STATUS } from "../../../constants/domain.js";
import { daysAgo, paymentPct, timeAgoLabel } from "../../../utils/index.js";
import { Avatar, Badge, TagPill, ProgressBar, StatCard, Button, Modal, Divider } from "../../ui/index.js";

export function ClientDetail({ client, onClose, onEdit, onDelete, onAI, onMarkContacted }) {
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
