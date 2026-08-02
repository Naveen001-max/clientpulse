import { useAppStore } from "../store/useAppStore.js";
import { Sidebar }  from "../components/layout/Sidebar.js";
import { Topbar }   from "../components/layout/Topbar.js";
import { AIPanel }  from "../components/features/ai/AIPanel.js";

import { DashboardPage } from "../pages/DashboardPage.js";
import { ClientsPage }   from "../pages/ClientsPage.js";
import { InvoicesPage }  from "../pages/InvoicesPage.js";
import { TasksPage }     from "../pages/TasksPage.js";
import { PipelinePage }  from "../pages/PipelinePage.js";
import { LaunchGuidePage } from "../pages/LaunchGuidePage.js";

import { COLOR, FONT } from "../constants/tokens.js";

export function App() {
  const { state, actions, derived } = useAppStore();
  const { page, aiClient } = state.ui;
  const { clients, invoices, tasks, activity } = state;

  const totalAlerts = derived.badges.overdueClients + derived.badges.overdueInvoices;

  return (
    <div style={{
      display:    "flex",
      minHeight:  "100vh",
      background: COLOR.slate50,
      fontFamily: FONT.family,
    }}>
      {/* ── Sidebar ── */}
      <Sidebar
        page={page}
        onNavigate={actions.setPage}
        badges={derived.badges}
      />

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar page={page} alerts={totalAlerts} />

        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {page === "dashboard" && (
            <DashboardPage
              clients={clients}
              invoices={invoices}
              tasks={tasks}
              activity={activity}
              derived={derived}
              onAI={actions.setAiClient}
            />
          )}

          {page === "clients" && (
            <ClientsPage
              clients={clients}
              actions={actions}
              onAI={actions.setAiClient}
            />
          )}

          {page === "invoices" && (
            <InvoicesPage
              invoices={invoices}
              clients={clients}
              actions={actions}
            />
          )}

          {page === "tasks" && (
            <TasksPage
              tasks={tasks}
              clients={clients}
              actions={actions}
            />
          )}

          {page === "pipeline" && (
            <PipelinePage
              clients={clients}
              onAI={actions.setAiClient}
            />
          )}

          {page === "launch" && (
            <LaunchGuidePage />
          )}
        </main>
      </div>

      {/* ── AI Panel (global overlay) ── */}
      {aiClient && (
        <AIPanel
          client={aiClient}
          onClose={() => actions.setAiClient(null)}
        />
      )}
    </div>
  );
}
