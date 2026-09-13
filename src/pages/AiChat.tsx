import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, ArrowLeft } from "lucide-react";
import { useCopy } from "../utils/copy";
import { useAppStore } from "../store/useAppStore";
import { useOnline } from "../hooks/useOnline";
import { fetchJson } from "../utils/requests";
import {
  CANONICAL_RULES,
  normalizeEcodes,
} from "../utils/canonicalKnowledgeBase";
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  local?: boolean;
};
export function AiChat() {
  const c = useCopy();
  const online = useOnline();
  const language = useAppStore((s) => s.language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;
    setMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), role: "user", text: query },
    ]);
    setInput("");
    setLoading(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      let text = "";
      let local = false;
      if (online) {
        try {
          const data = await fetchJson(
            "/api/chat",
            {
              method: "POST",
              body: JSON.stringify({ query, language }),
              signal: controller.signal,
            },
            15000,
          );
          text = typeof data.text === "string" ? data.text : "";
        } catch {}
      }
      if (!text) {
        local = true;
        const normalized = normalizeEcodes(query);
        const terms = normalized
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length > 2);
        const matching = CANONICAL_RULES.map((rule) => ({
          rule,
          score:
            [...rule.e_numbers, ...rule.keywords].reduce(
              (n, term) =>
                n + (normalized.includes(normalizeEcodes(term)) ? 4 : 0),
              0,
            ) +
            terms.filter((term) => rule.title.toLowerCase().includes(term))
              .length,
        }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        text = matching.length
          ? matching
              .map(
                ({ rule }) =>
                  rule.title +
                  "\n" +
                  rule.reason +
                  "\nSource: " +
                  rule.id +
                  " · " +
                  rule.source,
              )
              .join("\n\n")
          : c("noRules");
      }
      if (!controller.signal.aborted)
        setMessages((items) => [
          ...items,
          { id: crypto.randomUUID(), role: "assistant", text, local },
        ]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };
  return (
    <div className="page page-narrow">
      <Link to="/knowledge" className="btn btn-quiet">
        <ArrowLeft size={18} />
        {c("guide")}
      </Link>
      <div className="page-heading spaced">
        <h1>{c("chatTitle")}</h1>
        <p>{c("chatHelp")}</p>
      </div>
      <p className="notice">{c("ruleScope")}</p>
      <div
        className="chat-log"
        role="log"
        aria-live="polite"
        aria-label={c("chatTitle")}
      >
        {messages.map((message) => (
          <div key={message.id} className={"chat-message " + message.role}>
            {message.local && <p className="small muted">{c("localRules")}</p>}
            <p lang={message.role === "assistant" ? "en" : undefined}>
              {message.text}
            </p>
          </div>
        ))}
        {loading && <p role="status">{c("checking")}</p>}
      </div>
      <form onSubmit={(e) => void send(e)} className="chat-form">
        <input
          className="input"
          maxLength={2000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label={c("question")}
          placeholder={c("question")}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading || !input.trim()}
          aria-label={c("send")}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
