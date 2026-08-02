import { useReducer, useCallback, useMemo } from "react";
import { SEED_CLIENTS, SEED_INVOICES, SEED_TASKS, SEED_ACTIVITY } from "../constants/seed.js";
import { today, uid, parseTags, deriveMetrics } from "../utils/index.js";

// ─── Action types ─────────────────────────────────────────────────────────
export const ACTION = {
  // Clients
  CLIENT_ADD:           "CLIENT_ADD",
  CLIENT_UPDATE:        "CLIENT_UPDATE",
  CLIENT_DELETE:        "CLIENT_DELETE",
  CLIENT_MARK_CONTACTED:"CLIENT_MARK_CONTACTED",

  // Invoices
  INVOICE_ADD:          "INVOICE_ADD",
  INVOICE_UPDATE:       "INVOICE_UPDATE",
  INVOICE_MARK_PAID:    "INVOICE_MARK_PAID",

  // Tasks
  TASK_ADD:             "TASK_ADD",
  TASK_TOGGLE:          "TASK_TOGGLE",
  TASK_DELETE:          "TASK_DELETE",

  // Activity
  ACTIVITY_PUSH:        "ACTIVITY_PUSH",

  // UI
  UI_SET_PAGE:          "UI_SET_PAGE",
  UI_SET_AI_CLIENT:     "UI_SET_AI_CLIENT",
};

// ─── Initial state ────────────────────────────────────────────────────────
const initialState = {
  clients:   SEED_CLIENTS,
  invoices:  SEED_INVOICES,
  tasks:     SEED_TASKS,
  activity:  SEED_ACTIVITY,
  ui: {
    page:     "dashboard",
    aiClient: null,
  },
};

// ─── Reducer ──────────────────────────────────────────────────────────────
function reducer(state, { type, payload }) {
  switch (type) {
    // ── Clients ──────────────────────────────────────────────────────────
    case ACTION.CLIENT_ADD:
      return {
        ...state,
        clients: [...state.clients, {
          ...payload,
          id:          uid(),
          createdAt:   today(),
          lastContact: today(),
          tags:        parseTags(payload.tags),
        }],
      };

    case ACTION.CLIENT_UPDATE:
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === payload.id ? { ...c, ...payload, tags: parseTags(payload.tags) } : c
        ),
      };

    case ACTION.CLIENT_DELETE:
      return { ...state, clients: state.clients.filter((c) => c.id !== payload.id) };

    case ACTION.CLIENT_MARK_CONTACTED:
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === payload.id ? { ...c, lastContact: today() } : c
        ),
      };

    // ── Invoices ─────────────────────────────────────────────────────────
    case ACTION.INVOICE_ADD:
      return {
        ...state,
        invoices: [...state.invoices, {
          ...payload,
          id:   `INV-${String(state.invoices.length + 1).padStart(3, "0")}`,
          date: today(),
        }],
      };

    case ACTION.INVOICE_UPDATE:
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === payload.id ? { ...i, ...payload } : i
        ),
      };

    case ACTION.INVOICE_MARK_PAID:
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === payload.id ? { ...i, status: "paid" } : i
        ),
        // Also update client's paid amount
        clients: state.clients.map((c) => {
          const inv = state.invoices.find((i) => i.id === payload.id);
          if (!inv || c.id !== inv.clientId) return c;
          const newPaid = (c.paid || 0) + inv.amount;
          return { ...c, paid: newPaid, invoicePending: newPaid < c.value };
        }),
      };

    // ── Tasks ─────────────────────────────────────────────────────────────
    case ACTION.TASK_ADD:
      return {
        ...state,
        tasks: [...state.tasks, { ...payload, id: uid(), done: false }],
      };

    case ACTION.TASK_TOGGLE:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === payload.id ? { ...t, done: !t.done } : t
        ),
      };

    case ACTION.TASK_DELETE:
      return { ...state, tasks: state.tasks.filter((t) => t.id !== payload.id) };

    // ── Activity ──────────────────────────────────────────────────────────
    case ACTION.ACTIVITY_PUSH:
      return {
        ...state,
        activity: [payload, ...state.activity].slice(0, 20),
      };

    // ── UI ────────────────────────────────────────────────────────────────
    case ACTION.UI_SET_PAGE:
      return { ...state, ui: { ...state.ui, page: payload } };

    case ACTION.UI_SET_AI_CLIENT:
      return { ...state, ui: { ...state.ui, aiClient: payload } };

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Dispatchers ──────────────────────────────────────────────────────────
  const actions = useMemo(() => ({
    addClient:       (data)  => dispatch({ type: ACTION.CLIENT_ADD,            payload: data }),
    updateClient:    (data)  => dispatch({ type: ACTION.CLIENT_UPDATE,         payload: data }),
    deleteClient:    (id)    => dispatch({ type: ACTION.CLIENT_DELETE,         payload: { id } }),
    markContacted:   (id)    => dispatch({ type: ACTION.CLIENT_MARK_CONTACTED, payload: { id } }),

    addInvoice:      (data)  => dispatch({ type: ACTION.INVOICE_ADD,       payload: data }),
    updateInvoice:   (data)  => dispatch({ type: ACTION.INVOICE_UPDATE,    payload: data }),
    markInvoicePaid: (id)    => dispatch({ type: ACTION.INVOICE_MARK_PAID, payload: { id } }),

    addTask:         (data)  => dispatch({ type: ACTION.TASK_ADD,    payload: data }),
    toggleTask:      (id)    => dispatch({ type: ACTION.TASK_TOGGLE, payload: { id } }),
    deleteTask:      (id)    => dispatch({ type: ACTION.TASK_DELETE, payload: { id } }),

    pushActivity:    (item)  => dispatch({ type: ACTION.ACTIVITY_PUSH,     payload: item }),
    setPage:         (page)  => dispatch({ type: ACTION.UI_SET_PAGE,       payload: page }),
    setAiClient:     (client)=> dispatch({ type: ACTION.UI_SET_AI_CLIENT,  payload: client }),
  }), []);

  // ── Derived / computed ───────────────────────────────────────────────────
  const derived = useMemo(() => {
    const metrics = deriveMetrics(state.clients, state.invoices);
    return {
      ...metrics,
      needsFollowUp:     state.clients.filter((c) => {
        const days = Math.floor((Date.now() - new Date(c.lastContact)) / 86_400_000);
        return days > 10 && c.status !== "completed";
      }),
      overdueClientList:    state.clients.filter((c) => c.status === "overdue"),
      openTasks:         state.tasks.filter((t) => !t.done),
      highPriorityTasks: state.tasks.filter((t) => !t.done && t.priority === "high"),
      badges: {
        overdueClients:    state.clients.filter((c) => c.status === "overdue").length,
        overdueInvoices:   state.invoices.filter((i) => i.status === "overdue").length,
        highPriorityTasks: state.tasks.filter((t) => !t.done && t.priority === "high").length,
      },
    };
  }, [state.clients, state.invoices, state.tasks]);

  return { state, actions, derived };
}
