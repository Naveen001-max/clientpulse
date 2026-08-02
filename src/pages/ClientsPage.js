import { useState } from "react";
import { useFilter } from "../hooks/useFilter.js";
import { ClientCard } from "../components/features/clients/ClientCard.js";
import { ClientDetail } from "../components/features/clients/ClientDetail.js";
import { ClientForm } from "../components/features/clients/ClientForm.js";
import { Button, SearchInput, FilterTab, Modal, EmptyState } from "../components/ui/index.js";
import { SPACE } from "../constants/tokens.js";

const STATUS_FILTERS = ["all", "active", "overdue", "prospect", "completed"];

export function ClientsPage({ clients, actions, onAI }) {
  const [selected,    setSelected]    = useState(null);
  const [editing,     setEditing]     = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { filtered, search, setSearch, statusFilter, setStatusFilter } = useFilter(
    clients,
    ["name", "company", "project", "email"],
    "status"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: SPACE[3], alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, company, project…"
        />
        <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => (
            <FilterTab
              key={s}
              label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
        <Button onClick={() => setShowAddForm(true)} variant="primary">
          + Add client
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No clients found"
          body={search ? `No results for "${search}". Try a different search.` : "Add your first client to get started."}
          action={<Button onClick={() => setShowAddForm(true)} variant="primary">Add client</Button>}
        />
      ) : (
        <div style={{
          display:               "grid",
          gridTemplateColumns:   "repeat(auto-fill, minmax(300px, 1fr))",
          gap:                   SPACE[4],
        }}>
          {filtered.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              onSelect={setSelected}
              onAI={onAI}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selected && !editing && (
        <ClientDetail
          client={selected}
          onClose={() => setSelected(null)}
          onEdit={(c) => { setEditing(c); setSelected(null); }}
          onDelete={(id) => { actions.deleteClient(id); setSelected(null); }}
          onAI={onAI}
          onMarkContacted={actions.markContacted}
        />
      )}

      {editing && (
        <Modal title="Edit client" onClose={() => setEditing(null)}>
          <ClientForm
            initial={editing}
            onSave={actions.updateClient}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}

      {showAddForm && (
        <Modal title="Add new client" onClose={() => setShowAddForm(false)}>
          <ClientForm
            onSave={actions.addClient}
            onClose={() => setShowAddForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
