import { useState } from "react";
import { COLOR, SPACE, FONT } from "../../../constants/tokens.js";
import { Input, Textarea, Select, Button } from "../../ui/index.js";

const EMPTY = {
  name: "", company: "", email: "", phone: "",
  project: "", value: "", paid: "0",
  status: "active", stage: "In Progress",
  dueDate: "", tags: "", notes: "",
};

export function ClientForm({ initial, onSave, onClose }) {
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
