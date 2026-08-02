import { useState } from "react";
import { COLOR, FONT, SPACE, RADIUS, TRANSITION } from "../../constants/tokens.js";
import { NAV_ITEMS } from "../../constants/domain.js";

export function Sidebar({ page, onNavigate, badges }) {
  return (
    <aside style={{
      width:      220,
      background: COLOR.slate900,
      display:    "flex",
      flexDirection: "column",
      flexShrink: 0,
      position:   "sticky",
      top:        0,
      height:     "100vh",
      overflowY:  "auto",
    }}>
      {/* Logo */}
      <div style={{
        padding:      `${SPACE[6]}px ${SPACE[5]}px ${SPACE[4]}px`,
        borderBottom: `1px solid ${COLOR.slate800}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE[3] }}>
          <div style={{
            width:          34,
            height:         34,
            borderRadius:   RADIUS.md,
            background:     `linear-gradient(135deg, ${COLOR.brand500}, ${COLOR.purple500})`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       16,
            boxShadow:      `0 4px 12px ${COLOR.brand500}44`,
          }}>
            ⚡
          </div>
          <div>
            <div style={{
              fontSize:      FONT.size.md,
              fontWeight:    FONT.weight.extrabold,
              color:         COLOR.white,
              letterSpacing: "-0.02em",
              lineHeight:    1.1,
            }}>
              ClientPulse
            </div>
            <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500, fontWeight: FONT.weight.medium }}>
              AI-powered CRM
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: `${SPACE[3]}px ${SPACE[3]}px`, display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        <div style={{
          fontSize:      9,
          fontWeight:    FONT.weight.bold,
          color:         COLOR.slate600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding:       `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px`,
        }}>
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = page === item.id;
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavItem
              key={item.id}
              item={item}
              isActive={isActive}
              badge={badge}
              onClick={() => onNavigate(item.id)}
            />
          );
        })}
      </nav>

      {/* AI hint */}
      <div style={{ padding: `${SPACE[4]}px ${SPACE[3]}px ${SPACE[2]}px` }}>
        <div style={{
          background:   `${COLOR.brand500}12`,
          borderRadius: RADIUS.lg,
          padding:      `${SPACE[3]}px ${SPACE[4]}px`,
          border:       `1px solid ${COLOR.brand500}20`,
          marginBottom: SPACE[3],
        }}>
          <div style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: COLOR.brand400, marginBottom: SPACE[1] }}>
            ✨ AI Drafts
          </div>
          <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500, lineHeight: FONT.lineHeight.relaxed }}>
            Open any client → click "AI Draft" to auto-write follow-ups, reminders & upsells.
          </div>
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: SPACE[2], padding: `${SPACE[2]}px ${SPACE[1]}px` }}>
          <div style={{
            width:          30, height: 30,
            borderRadius:   "50%",
            background:     COLOR.brand500,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       FONT.size.xs,
            color:          COLOR.white,
            fontWeight:     FONT.weight.bold,
          }}>
            YF
          </div>
          <div>
            <div style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: COLOR.white, lineHeight: 1.2 }}>
              Your Freelance Co.
            </div>
            <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500 }}>Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, isActive, badge, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          SPACE[3],
        padding:      `${SPACE[2] + 1}px ${SPACE[3]}px`,
        borderRadius: RADIUS.md,
        border:       "none",
        cursor:       "pointer",
        fontFamily:   FONT.family,
        width:        "100%",
        textAlign:    "left",
        background:   isActive ? `${COLOR.brand500}22` : hovered ? COLOR.slate800 : "transparent",
        color:        isActive ? COLOR.white : hovered ? COLOR.slate300 : COLOR.slate400,
        fontWeight:   isActive ? FONT.weight.semibold : FONT.weight.regular,
        fontSize:     FONT.size.base,
        transition:   TRANSITION.fast,
      }}
    >
      <span style={{ fontSize: 15, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {badge > 0 && (
        <span style={{
          background:   COLOR.danger500,
          color:        COLOR.white,
          fontSize:     9,
          borderRadius: "99px",
          padding:      "2px 6px",
          fontWeight:   FONT.weight.bold,
          minWidth:     16,
          textAlign:    "center",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
