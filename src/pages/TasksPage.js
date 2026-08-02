import { useState } from "react";
import { COLOR, FONT, SPACE, RADIUS } from "../constants/tokens.js";
import { PRIORITY } from "../constants/domain.js";
import { StatCard, Button, FilterTab, Modal, EmptyState, Select, Input, Card } from "../components/ui/index.js";

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

export function TasksPage({ tasks, clients, actions }) {
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
