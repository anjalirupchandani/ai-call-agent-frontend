import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

export default function TranscriptPanel({ messages, live = false }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (live) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, live]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {messages.map((m, i) => {
        const isAI = m.speaker === "ai";
        return (
          <div key={i} className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"} animate-fade-up`}>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isAI ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "bg-[var(--color-surface-sunk)] text-[var(--color-ink-soft)]"
              }`}
            >
              {isAI ? <Bot size={15} /> : <User size={15} />}
            </span>
            <div className={`max-w-[75%] ${isAI ? "" : "text-right"}`}>
              <p className="mb-1 text-xs font-medium text-[var(--color-ink-muted)]">
                {isAI ? "AI Agent" : "Customer"}
              </p>
              <div
                className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isAI
                    ? "rounded-tl-sm bg-[var(--color-surface-sunk)] text-[var(--color-ink)]"
                    : "rounded-tr-sm bg-[var(--color-accent)] text-white"
                }`}
              >
                {m.text}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
