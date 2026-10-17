"use client";

import MarkdownIt from "markdown-it";
import { MARKDOWN_OPTIONS } from "@/lib/markdown-options";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { splitStreamBuffer, parseFollowupsRaw } from "@/lib/tts/stream-delimiters";

type Message = { role: "user" | "assistant"; content: string };
type Status = "idle" | "loading" | "rate-limited" | "error";

const md = new MarkdownIt(MARKDOWN_OPTIONS);

/**
 * The only client component on the site. Everything it knows is also reachable
 * without JavaScript: the shell, the disclaimer and the starters are all
 * server-rendered, and the answer text is public at /llms.txt.
 */
export function ChatPanel({ starters, introHtml }: { starters: string[]; introHtml: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [followups, setFollowups] = useState<string[]>([]);
  /*
   * The stream carries the answer and then the follow-up questions behind a
   * delimiter. The server now sends that delimiter the moment the answer is
   * written, before it waits on the questions, so this is what lets the answer
   * stop looking like it is still arriving while the questions are still being
   * written. Without it the fade stayed on the finished answer for as long as
   * the second model call took.
   */
  const [answerDone, setAnswerDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const busy = status === "loading";
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep the newest turn in view inside the transcript pane. Instant rather
  // than smooth: the stream updates many times a second.
  useEffect(() => {
    const pane = scrollRef.current;
    if (!pane) return;
    pane.scrollTop = pane.scrollHeight;
  }, [messages, status, followups]);

  // Grow the composer with the draft up to a ceiling, then let it scroll.
  useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
  }, [input]);

  /*
   * The composer shows a focus ring for keyboard users only. `:focus-visible`
   * cannot do that job on its own, because browsers match it for text fields
   * even on a click, so the input modality is tracked explicitly: Tab turns the
   * ring on, a pointer press turns it off.
   */
  const [keyboardFocus, setKeyboardFocus] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") setKeyboardFocus(true);
    };
    const onPointerDown = () => setKeyboardFocus(false);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy) return;

    // History is everything already settled; the in-flight turn is appended after.
    const history = messages
      .filter((message) => message.content.length > 0)
      .map((message) => ({ role: message.role, content: message.content }));

    setInput("");
    setFollowups([]);
    setAnswerDone(false);
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
        // The delimiter alone is enough to call the answer finished.
        const segments = splitStreamBuffer(raw);
        replaceLast(segments.body);
        // Set once, not on every tick: this only ever flips one way, and a state
        // call per chunk would re-render the transcript for nothing.
        if (segments.followupsRaw !== null) setAnswerDone(true);
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
    /*
     * A fixed-height column: the transcript fills what the composer does not
     * use. Without a fixed height the block grew with every message, so the
     * page itself kept getting longer as an answer streamed in.
     */
    <div className="chat-region mt-6 flex min-h-[20rem] flex-col">
      {/*
       * The transcript scrolls on its own but carries no chrome: no card, no
       * border, no fill. The conversation reads as part of the page rather than
       * as a widget in a pane. The top padding lifts the first message clear
       * of the fade; the bottom one keeps suggestions off the composer.
       */}
      <div ref={scrollRef} className="scroll-pane scroll-fade-top flex-1 overflow-y-auto pt-6 pb-4">
        <ol aria-live="polite" className="flex flex-col gap-4">
          {/*
           * The page's intro is content, not chrome: it arrives the way every
           * other answer does, as the assistant's first message. The HTML is
           * rendered on the server so the copy stays in content/chat.md.
           */}
          <li className="chat-message">
            <div className="bubble-assistant mr-auto w-fit max-w-[92%] border border-rule bg-bubble px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Assistant</p>
              <div
                className="markdown mt-1.5 max-w-[68ch] leading-relaxed text-fg"
                // pi-lens-ignore: dangerously-set-inner-html
                dangerouslySetInnerHTML={{ __html: introHtml }}
              />
            </div>
          </li>

          {messages.map((message, index) => {
            const streaming =
              busy && !answerDone && index === messages.length - 1 && message.role === "assistant";

            /*
             * An answer with no text yet renders nothing: an empty bubble was
             * just a pill with a label in it. The status line below carries the
             * "working" signal until the first chunk lands.
             */
            if (streaming && message.content.length === 0) return null;

            return (
              <li key={index} className="chat-message">
                {message.role === "user" ? (
                  <div className="bubble-user ml-auto w-fit max-w-[85%] border border-rule bg-bubble px-4 py-2.5">
                    <p className="sr-only">You</p>
                    <p className="whitespace-pre-wrap leading-relaxed text-fg">{message.content}</p>
                  </div>
                ) : (
                  <div className="bubble-assistant mr-auto w-fit max-w-[92%] border border-rule bg-bubble px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Assistant
                    </p>
                    {/*
                     * Safe by construction: `md` is markdown-it with
                     * `html: false`, so raw HTML in the answer is escaped rather
                     * than parsed, and its default link validator drops
                     * `javascript:` and other unsafe schemes. Only escaped
                     * markup reaches the DOM.
                     */}
                    <div
                      className={`markdown mt-1.5 max-w-[68ch] leading-relaxed text-fg ${
                        streaming ? "streaming-text" : ""
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: message.content ? md.render(message.content) : "",
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/*
         * Opening questions wear the user's bubble, because they are exactly
         * what the reader might have typed; pressing one sends it. They retire
         * once the conversation starts, so the transcript stays uncluttered.
         */}
        {messages.length === 0 ? (
          <ul aria-label="Suggested questions" className="mt-4 flex flex-col items-end gap-2">
            {starters.map((starter) => (
              <li key={starter}>
                <button
                  type="button"
                  onClick={() => void send(starter)}
                  disabled={busy}
                  className="bubble-user border border-rule bg-bubble px-4 py-2.5 text-left text-sm text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {starter}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {busy && !answerDone ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted" role="status">
            <span className="chat-spinner" aria-hidden="true" />
            Searching Nathan&rsquo;s notes&hellip;
          </p>
        ) : null}

        {status === "rate-limited" ? (
          <p className="mt-5 text-sm text-muted" role="alert">
            Too many questions in a short time. Wait a minute and try again.
          </p>
        ) : null}

        {status === "error" ? (
          <p className="mt-5 text-sm text-muted" role="alert">
            Something went wrong and the assistant couldn&rsquo;t answer. Try again, or read the{" "}
            <Link href="/projects" className="text-accent hover:text-fg">
              projects
            </Link>{" "}
            and{" "}
            <Link href="/resume" className="text-accent hover:text-fg">
              resume
            </Link>{" "}
            pages.
          </p>
        ) : null}

        {followups.length > 0 ? (
          <ul
            aria-label="Suggested follow-up questions"
            className="mt-5 flex flex-col items-end gap-2"
          >
            {followups.map((followup) => (
              <li key={followup}>
                <button
                  type="button"
                  onClick={() => void send(followup)}
                  disabled={busy}
                  className="bubble-user border border-rule bg-bubble px-4 py-2.5 text-left text-sm text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {followup}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/*
       * Composer: a single rounded control ending the column, flush against the
       * transcript so the last message meets it. The field keeps no outline of
       * its own, so the shell can show a ring for keyboard focus and nothing at
       * all for a pointer click.
       */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask about Nathan&rsquo;s work
        </label>
        <div
          className={`flex items-center gap-2 rounded-3xl border border-rule bg-surface p-2 ${
            keyboardFocus ? "focus-within:ring-2 focus-within:ring-accent/40" : ""
          }`}
        >
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask about Nathan's work"
            className="composer-field max-h-40 w-full resize-none bg-transparent px-2 py-2 leading-relaxed text-fg placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={busy || input.trim().length === 0}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
