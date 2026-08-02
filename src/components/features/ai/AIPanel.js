import { useState, useRef, useEffect } from "react";
import { COLOR, FONT, SPACE, RADIUS, SHADOW, ZINDEX, TRANSITION } from "../../../constants/tokens.js";
import { AI_QUICK_ACTIONS } from "../../../constants/domain.js";
import { buildQuickActionPrompt } from "../../../utils/index.js";
import { useAIChat } from "../../../hooks/useAIChat.js";
import { Avatar, Button } from "../../ui/index.js";

export function AIPanel({ client, onClose }) {
  const { messages, status, error, send, reset } = useAIChat(client);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuickAction = (action) => {
    const prompt = buildQuickActionPrompt(action.id, client);
    send(prompt);
  };

  const handleSend = () => {
    if (!input.trim() || status === "loading") return;
    send(input.trim());
    setInput("");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      background:     "rgba(15,23,42,0.6)",
      zIndex:         ZINDEX.panel,
      display:        "flex",
      alignItems:     "flex-end",
      justifyContent: "flex-end",
      padding:        SPACE[6],
      backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background:   COLOR.white,
        borderRadius: RADIUS.xxl,
        width:        460,
        height:       640,
        display:      "flex",
        flexDirection: "column",
        boxShadow:    SHADOW.xl,
        overflow:     "hidden",
      }}>

        {/* Header */}
        <div style={{
          background:  `linear-gradient(135deg, ${COLOR.brand500} 0%, ${COLOR.purple500} 100%)`,
          padding:     `${SPACE[4]}px ${SPACE[5]}px`,
          display:     "flex",
          alignItems:  "center",
          gap:         SPACE[3],
          flexShrink:  0,
        }}>
          <Avatar name={client.name} avatarIndex={client.avatarIndex} size={36} />
          <div style={{ flex: 1, color: COLOR.white }}>
            <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.md }}>
              AI for {client.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: FONT.size.xs, opacity: 0.75 }}>{client.project}</div>
          </div>
          {messages.length > 0 && (
            <button onClick={reset} style={{
              background: "rgba(255,255,255,.15)", border: "none", borderRadius: RADIUS.sm,
              padding: "4px 10px", cursor: "pointer", color: COLOR.white, fontSize: FONT.size.xs,
              fontFamily: FONT.family, fontWeight: FONT.weight.medium,
            }}>
              New chat
            </button>
          )}
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.2)", border: "none", borderRadius: RADIUS.sm,
            width: 28, height: 28, cursor: "pointer", color: COLOR.white, fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            ×
          </button>
        </div>

        {/* Quick actions — shown only before first message */}
        {messages.length === 0 && (
          <div style={{
            padding:      `${SPACE[4]}px ${SPACE[5]}px`,
            borderBottom: `1px solid ${COLOR.slate100}`,
            flexShrink:   0,
          }}>
            <div style={{
              fontSize:      FONT.size.xs,
              fontWeight:    FONT.weight.bold,
              color:         COLOR.slate400,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom:  SPACE[3],
            }}>
              Quick actions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[2] }}>
              {AI_QUICK_ACTIONS.map((action) => (
                <QuickActionButton key={action.id} action={action} onClick={handleQuickAction} />
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex:       1,
          overflowY:  "auto",
          padding:    `${SPACE[4]}px ${SPACE[5]}px`,
          display:    "flex",
          flexDirection: "column",
          gap:        SPACE[4],
        }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onCopy={copyToClipboard} />
          ))}
          {status === "loading" && (
            <div style={{ fontSize: FONT.size.base, color: COLOR.slate400, fontStyle: "italic" }}>
              ✨ Writing…
            </div>
          )}
          {error && (
            <div style={{
              background:   COLOR.danger50,
              color:        COLOR.danger600,
              fontSize:     FONT.size.sm,
              borderRadius: RADIUS.md,
              padding:      `${SPACE[2]}px ${SPACE[3]}px`,
              border:       `1px solid ${COLOR.danger100}`,
            }}>
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding:     `${SPACE[3]}px ${SPACE[4]}px`,
          borderTop:   `1px solid ${COLOR.slate100}`,
          display:     "flex",
          gap:         SPACE[2],
          flexShrink:  0,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask AI to draft anything…"
            style={{
              flex:         1,
              fontSize:     FONT.size.base,
              padding:      "9px 13px",
              borderRadius: RADIUS.md,
              border:       `1.5px solid ${COLOR.slate200}`,
              fontFamily:   FONT.family,
              outline:      "none",
              color:        COLOR.slate900,
            }}
          />
          <Button
            onClick={handleSend}
            variant="primary"
            disabled={status === "loading" || !input.trim()}
          >
            ↗
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ action, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(action)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? COLOR.brand50 : COLOR.slate50,
        border:       `1.5px solid ${hovered ? COLOR.brand200 : COLOR.slate200}`,
        borderRadius: RADIUS.md,
        padding:      `${SPACE[2]}px ${SPACE[3]}px`,
        fontSize:     FONT.size.xs,
        cursor:       "pointer",
        textAlign:    "left",
        color:        hovered ? COLOR.brand700 : COLOR.slate700,
        fontFamily:   FONT.family,
        fontWeight:   FONT.weight.medium,
        display:      "flex",
        gap:          SPACE[2],
        alignItems:   "center",
        transition:   TRANSITION.fast,
      }}
    >
      <span>{action.emoji}</span>
      {action.label}
    </button>
  );
}

function MessageBubble({ msg, onCopy }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={{
          fontSize:      FONT.size.xs,
          fontWeight:    FONT.weight.bold,
          color:         COLOR.slate400,
          marginBottom:  SPACE[1],
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>
          ✨ ClientPulse AI
        </div>
      )}
      <div style={{
        maxWidth:     "90%",
        background:   isUser
          ? `linear-gradient(135deg, ${COLOR.brand500}, ${COLOR.purple500})`
          : COLOR.slate50,
        color:        isUser ? COLOR.white : COLOR.slate800,
        borderRadius: isUser ? `${RADIUS.xl}px ${RADIUS.xl}px ${RADIUS.sm}px ${RADIUS.xl}px` : `${RADIUS.sm}px ${RADIUS.xl}px ${RADIUS.xl}px ${RADIUS.xl}px`,
        padding:      `${SPACE[3]}px ${SPACE[4]}px`,
        fontSize:     FONT.size.base,
        lineHeight:   FONT.lineHeight.relaxed,
        whiteSpace:   "pre-wrap",
        border:       isUser ? "none" : `1px solid ${COLOR.slate200}`,
      }}>
        {msg.content}
      </div>
      {!isUser && (
        <button
          onClick={() => onCopy(msg.content)}
          style={{
            marginTop:  SPACE[1],
            fontSize:   FONT.size.xs,
            color:      COLOR.slate400,
            background: "none",
            border:     "none",
            cursor:     "pointer",
            padding:    0,
            fontFamily: FONT.family,
          }}
        >
          📋 Copy to clipboard
        </button>
      )}
    </div>
  );
}
