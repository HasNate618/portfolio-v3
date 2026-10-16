"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { splitStreamBuffer, parseFollowupsRaw } from "@/lib/tts/stream-delimiters";

type Message = { role: "user" | "assistant"; content: string };
type Status = "idle" | "loading" | "rate-limited" | "error";

/**
 * The only client component on the site. Everything it knows is also reachable
 * without JavaScript: the shell, the disclaimer and the starters are all
 * server-rendered, and the answer text is public at /llms.txt.
 */
export function ChatPanel({ starters }: { starters: string[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [followups, setFollowups] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const busy = status === "loading";

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy) return;

    // History is everything already settled; the in-flight turn is appended after.
    const history = messages
      .filter((message) => message.content.length > 0)
      .map((message) => ({ role: message.role, content: message.content }));

    setInput("");
    setFollowups([]);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setStatus("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    const replaceLast = (content: string) =>
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content };
        return next;
      });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        setMessages((prev) => prev.slice(0, -1));
        setStatus("rate-limited");
        return;
      }

      if (!response.ok || !response.body) {
        setMessages((prev) => prev.slice(0, -1));
        setStatus("error");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        // The followups block arrives behind a delimiter inside the same stream,
        // so the body is re-derived on every tick rather than shown then removed.
        replaceLast(splitStreamBuffer(raw).body);
      }

      const { body, followupsRaw } = splitStreamBuffer(raw);
      replaceLast(body);
      setFollowups(followupsRaw ? parseFollowupsRaw(followupsRaw) : []);
      setStatus("idle");
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setMessages((prev) => prev.slice(0, -1));
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }

  return (
    <div className="mt-8">
      {messages.length === 0 ? (
        <div>
          <p className="text-sm text-muted">Try one:</p>
          <ul className="mt-3 flex flex-col gap-2">
            {starters.map((starter) => (
              <li key={starter}>
                <button
                  type="button"
                  onClick={() => void send(starter)}
                  disabled={busy}
                  className="rounded border border-rule px-3 py-2 text-left text-sm text-fg hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {starter}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            No messages yet. Pick a question above or type your own.
          </p>
        </div>
      ) : (
        <ol aria-live="polite" className="flex flex-col gap-6">
          {messages.map((message, index) => (
            <li key={index}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">
                {message.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="mt-2 max-w-[68ch] whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </li>
          ))}
        </ol>
      )}

      {busy ? <p className="mt-6 text-sm text-muted">Searching Nathan&rsquo;s notes&hellip;</p> : null}

      {status === "rate-limited" ? (
        <p className="mt-6 text-sm text-muted" role="alert">
          Too many questions in a short time. Wait a minute and try again.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-6 text-sm text-muted" role="alert">
          Something went wrong and I couldn&rsquo;t answer. Try again, or read the{" "}
          <Link href="/projects" className="text-accent underline hover:text-fg">
            projects
          </Link>{" "}
          and{" "}
          <Link href="/resume" className="text-accent underline hover:text-fg">
            resume
          </Link>{" "}
          pages.
        </p>
      ) : null}

      {followups.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-2">
          {followups.map((followup) => (
            <li key={followup}>
              <button
                type="button"
                onClick={() => void send(followup)}
                disabled={busy}
                className="rounded border border-rule px-3 py-2 text-left text-sm text-fg hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {followup}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask about Campus, TeraGo, or anything else
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            id="chat-input"
            rows={2}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask about Campus, TeraGo, or anything else"
            className="w-full rounded border border-rule bg-transparent px-3 py-2 text-fg placeholder:text-muted focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || input.trim().length === 0}
            className="shrink-0 rounded border border-rule px-4 py-2 text-sm font-medium text-fg hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Enter to send, Shift+Enter for a new line.</p>
      </form>
    </div>
  );
}
