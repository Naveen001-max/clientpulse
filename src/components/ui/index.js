/**
 * UI Primitive Components
 *
 * These are the atoms of the design system.
 * They know nothing about business logic — only visual tokens.
 * Every prop is intentional; no magic defaults.
 */

import { useState, useEffect, useRef } from "react";
import { COLOR, RADIUS, SHADOW, FONT, SPACE, TRANSITION, ZINDEX } from "../../constants/tokens.js";

// ─── Button ───────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: {
    background: COLOR.brand500,
    color: COLOR.white,
    border: "none",
    boxShadow: SHADOW.brand,
    hoverBg: COLOR.brand600,
  },
  secondary: {
    background: COLOR.white,
    color: COLOR.slate700,
    border: `1.5px solid ${COLOR.slate200}`,
    boxShadow: SHADOW.xs,
    hoverBg: COLOR.slate50,
  },
  ghost: {
    background: "transparent",
    color: COLOR.slate600,
    border: "none",
    boxShadow: "none",
    hoverBg: COLOR.slate100,
  },
  danger: {
    background: COLOR.danger500,
    color: COLOR.white,
    border: "none",
    boxShadow: `0 2px 8px ${COLOR.danger500}33`,
    hoverBg: COLOR.danger600,
  },
  success: {
    background: COLOR.success500,
    color: COLOR.white,
    border: "none",
    boxShadow: `0 2px 8px ${COLOR.success500}33`,
    hoverBg: COLOR.success600,
  },
  brand_ghost: {
    background: COLOR.brand50,
    color: COLOR.brand600,
    border: `1.5px solid ${COLOR.brand200}`,
    boxShadow: "none",
    hoverBg: COLOR.brand100,
  },
};

const BTN_SIZES = {
  xs:  { fontSize: FONT.size.xs,   padding: "4px 10px",  borderRadius: RADIUS.sm },
  sm:  { fontSize: FONT.size.sm,   padding: "6px 13px",  borderRadius: RADIUS.md },
  md:  { fontSize: FONT.size.base, padding: "9px 18px",  borderRadius: RADIUS.md },
  lg:  { fontSize: FONT.size.md,   padding: "12px 24px", borderRadius: RADIUS.lg },
};

export function Button({
  children, onClick, variant = "secondary", size = "md",
  disabled = false, fullWidth = false, style: extraStyle = {},
}) {
  const [hovered, setHovered] = useState(false);
  const v = BTN_VARIANTS[variant];
  const s = BTN_SIZES[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s,
        background:  (hovered && !disabled) ? v.hoverBg : v.background,
        color:        v.color,
        border:       v.border || "none",
        boxShadow:    v.boxShadow,
        fontFamily:   FONT.family,
        fontWeight:   FONT.weight.semibold,
        cursor:       disabled ? "not-allowed" : "pointer",
        opacity:      disabled ? 0.5 : 1,
        display:      "inline-flex",
        alignItems:   "center",
        justifyContent: "center",
        gap:          SPACE[2],
        whiteSpace:   "nowrap",
        transition:   TRANSITION.fast,
        width:        fullWidth ? "100%" : undefined,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────
export function Input({
  label, value, onChange, type = "text",
  placeholder = "", required = false, style: extraStyle = {},
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[1] }}>
      {label && (
        <label style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.slate600 }}>
          {label}
          {required && <span style={{ color: COLOR.danger500, marginLeft: 2 }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding:      "9px 13px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${focused ? COLOR.brand500 : COLOR.slate200}`,
          fontSize:     FONT.size.base,
          color:        COLOR.slate900,
          background:   COLOR.white,
          fontFamily:   FONT.family,
          outline:      "none",
          transition:   TRANSITION.fast,
          boxShadow:    focused ? `0 0 0 3px ${COLOR.brand500}18` : "none",
          ...extraStyle,
        }}
      />
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder = "", rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[1] }}>
      {label && (
        <label style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.slate600 }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding:      "9px 13px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${focused ? COLOR.brand500 : COLOR.slate200}`,
          fontSize:     FONT.size.base,
          color:        COLOR.slate900,
          background:   COLOR.white,
          fontFamily:   FONT.family,
          outline:      "none",
          resize:       "vertical",
          transition:   TRANSITION.fast,
          boxShadow:    focused ? `0 0 0 3px ${COLOR.brand500}18` : "none",
        }}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[1] }}>
      {label && (
        <label style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.slate600 }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding:      "9px 13px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${COLOR.slate200}`,
          fontSize:     FONT.size.base,
          color:        COLOR.slate900,
          background:   COLOR.white,
          fontFamily:   FONT.family,
          outline:      "none",
          cursor:       "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────
export function Badge({ label, color, bg }) {
  return (
    <span style={{
      background:   bg,
      color,
      fontSize:     FONT.size.xs,
      fontWeight:   FONT.weight.bold,
      padding:      "3px 9px",
      borderRadius: RADIUS.full,
      whiteSpace:   "nowrap",
      letterSpacing: "0.01em",
    }}>
      {label}
    </span>
  );
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────
export function TagPill({ label }) {
  return (
    <span style={{
      fontSize:     FONT.size.xs,
      fontWeight:   FONT.weight.semibold,
      padding:      "2px 9px",
      borderRadius: RADIUS.full,
      background:   COLOR.brand50,
      color:        COLOR.brand700,
      border:       `1px solid ${COLOR.brand200}`,
    }}>
      {label}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────
import { AVATAR_PALETTE } from "../../constants/domain.js";
import { getInitials } from "../../utils/index.js";

export function Avatar({ name, avatarIndex = 0, size = 38 }) {
  const palette = AVATAR_PALETTE[avatarIndex % AVATAR_PALETTE.length];
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   "50%",
      background:     palette.bg,
      color:          palette.text,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       Math.round(size * 0.33),
      fontWeight:     FONT.weight.bold,
      flexShrink:     0,
      letterSpacing:  "0.02em",
    }}>
      {getInitials(name)}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────
export function Card({ children, style: extraStyle = {}, onClick, hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background:   COLOR.white,
        borderRadius: RADIUS.xl,
        border:       `1.5px solid ${hovered ? COLOR.brand400 : COLOR.slate200}`,
        boxShadow:    hovered ? SHADOW.md : SHADOW.xs,
        transition:   TRANSITION.base,
        cursor:       onClick ? "pointer" : undefined,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 520 }) {
  // Trap Escape key
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      background:     "rgba(15,23,42,0.55)",
      zIndex:         ZINDEX.modal,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        SPACE[6],
      backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background:   COLOR.white,
        borderRadius: RADIUS.xxl,
        width,
        maxWidth:     "100%",
        maxHeight:    "90vh",
        overflowY:    "auto",
        boxShadow:    SHADOW.xl,
      }}>
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          padding:        `${SPACE[5]}px ${SPACE[6]}px`,
          borderBottom:   `1px solid ${COLOR.slate100}`,
        }}>
          <h2 style={{ margin: 0, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background:   COLOR.slate100,
              border:       "none",
              borderRadius: RADIUS.sm,
              width:        28, height: 28,
              cursor:       "pointer",
              fontSize:     18,
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              color:        COLOR.slate500,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: `${SPACE[5]}px ${SPACE[6]}px` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────
export function Divider({ style: s = {} }) {
  return <div style={{ height: 1, background: COLOR.slate100, ...s }} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────
export function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        `${SPACE[12]}px ${SPACE[6]}px`,
      textAlign:      "center",
      gap:            SPACE[3],
    }}>
      {icon && <div style={{ fontSize: 36, opacity: 0.4 }}>{icon}</div>}
      <div style={{ fontSize: FONT.size.md, fontWeight: FONT.weight.semibold, color: COLOR.slate700 }}>{title}</div>
      {body && <div style={{ fontSize: FONT.size.base, color: COLOR.slate400, maxWidth: 320, lineHeight: FONT.lineHeight.relaxed }}>{body}</div>}
      {action}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────
export function ProgressBar({ pct, color }) {
  const c = color || (pct === 100 ? COLOR.success500 : pct > 50 ? COLOR.brand500 : COLOR.warning500);
  return (
    <div style={{ height: 5, background: COLOR.slate100, borderRadius: RADIUS.full, overflow: "hidden" }}>
      <div style={{
        height:       "100%",
        width:        `${pct}%`,
        background:   c,
        borderRadius: RADIUS.full,
        transition:   "width 0.6s ease",
      }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, trend, color, icon }) {
  return (
    <Card style={{ padding: `${SPACE[5]}px ${SPACE[5]}px` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACE[2] }}>
        <span style={{ fontSize: FONT.size.sm, color: COLOR.slate500, fontWeight: FONT.weight.medium }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 18, opacity: 0.55 }}>{icon}</span>}
      </div>
      <div style={{
        fontSize:      FONT.size.xxl,
        fontWeight:    FONT.weight.extrabold,
        color:         color || COLOR.slate900,
        letterSpacing: "-0.025em",
        lineHeight:    1.1,
        marginBottom:  SPACE[1],
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: FONT.size.xs, color: COLOR.slate400 }}>{sub}</div>
      )}
      {trend !== undefined && (
        <div style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.semibold, color: trend >= 0 ? COLOR.success600 : COLOR.danger600, marginTop: SPACE[1] }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
        </div>
      )}
    </Card>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE[4] }}>
      <h2 style={{ margin: 0, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>
        {title}
      </h2>
      {action}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────
export function FilterTab({ label, active, onClick, badge }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize:     FONT.size.sm,
        fontWeight:   active ? FONT.weight.bold : FONT.weight.regular,
        padding:      "7px 15px",
        borderRadius: RADIUS.full,
        border:       `1.5px solid ${active ? COLOR.brand500 : hovered ? COLOR.slate300 : COLOR.slate200}`,
        background:   active ? COLOR.brand50 : hovered ? COLOR.slate50 : COLOR.white,
        color:        active ? COLOR.brand700 : COLOR.slate600,
        cursor:       "pointer",
        fontFamily:   FONT.family,
        display:      "inline-flex",
        alignItems:   "center",
        gap:          SPACE[1],
        transition:   TRANSITION.fast,
        whiteSpace:   "nowrap",
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          background:   COLOR.danger500,
          color:        COLOR.white,
          fontSize:     9,
          fontWeight:   FONT.weight.bold,
          borderRadius: RADIUS.full,
          padding:      "1px 5px",
          minWidth:     14,
          textAlign:    "center",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <span style={{
        position:  "absolute",
        left:      12,
        top:       "50%",
        transform: "translateY(-50%)",
        fontSize:  14,
        color:     COLOR.slate400,
        pointerEvents: "none",
      }}>
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:        "100%",
          padding:      "9px 13px 9px 34px",
          borderRadius: RADIUS.md,
          border:       `1.5px solid ${focused ? COLOR.brand500 : COLOR.slate200}`,
          fontSize:     FONT.size.base,
          fontFamily:   FONT.family,
          color:        COLOR.slate900,
          background:   COLOR.white,
          outline:      "none",
          boxSizing:    "border-box",
          transition:   TRANSITION.fast,
          boxShadow:    focused ? `0 0 0 3px ${COLOR.brand500}18` : SHADOW.xs,
        }}
      />
    </div>
  );
}
