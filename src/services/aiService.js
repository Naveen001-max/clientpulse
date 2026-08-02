/**
 * AI Service — isolates all Anthropic API communication.
 * If you swap the model or endpoint in future, change it here only.
 */

const API_URL   = "https://api.anthropic.com/v1/messages";
const MODEL     = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

/**
 * Send a chat turn to the Anthropic API.
 * @param {string}   systemPrompt  - Full system context
 * @param {Array}    history       - Prior { role, content } turns
 * @param {string}   userMessage   - Latest user message
 * @returns {Promise<string>}      - Assistant reply text
 */
export async function sendMessage(systemPrompt, history, userMessage) {
  const messages = [...history, { role: "user", content: userMessage }];

  const response = await fetch(API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  if (!text) throw new Error("Empty response from AI");
  return text;
}
