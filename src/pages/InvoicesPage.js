import { useState } from "react";
import { COLOR, FONT, SPACE, RADIUS, SHADOW } from "../constants/tokens.js";
import { INVOICE_STATUS } from "../constants/domain.js";
import { formatCurrency } from "../utils/index.js";
import { StatCard, Badge, Button, FilterTab, Modal, EmptyState, Select, Input, Card } from "../components/ui/index.js";

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

export function InvoicesPage({ invoices, clients, actions }) {
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
