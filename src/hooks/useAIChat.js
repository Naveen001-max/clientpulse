import { useState, useCallback, useRef } from "react";
import { sendMessage } from "../services/aiService.js";
import { buildAISystemPrompt } from "../utils/index.js";

/**
 * Custom hook — manages the full AI chat lifecycle for a given client.
 * Components that use this hook know nothing about the API.
 */
export function useAIChat(client) {
  const [messages,  setMessages]  = useState([]);
  const [status,    setStatus]    = useState("idle"); // idle | loading | error
  const [error,     setError]     = useState(null);

  const systemPrompt = useRef(buildAISystemPrompt(client));
  // Rebuild if client changes (e.g., notes updated)
  systemPrompt.current = buildAISystemPrompt(client);

  const send = useCallback(async (userText) => {
    if (!userText.trim() || status === "loading") return;

    const userMsg = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setStatus("loading");
    setError(null);

    try {
      // Pass prior messages minus the one we just added (API receives it via userMessage arg)
      const reply = await sendMessage(
        systemPrompt.current,
        messages, // history before this turn
        userText
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setStatus("idle");
    } catch (err) {
      setError(err.message);
      setStatus("error");
      // Remove the user message we optimistically added so they can retry
      setMessages((prev) => prev.slice(0, -1));
    }
  }, [messages, status]);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setError(null);
  }, []);

  return { messages, status, error, send, reset };
}
