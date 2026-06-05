import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Send,
  Loader2,
  Bot,
  Sparkles,
  Plus,
  MessageSquare,
  FileText,
  Settings,
  Github,
  Zap,
  Library,
  Search,
  HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Microsoft Annual 2025 Report RAG Chatbot" },
      { name: "description", content: "RAG-powered chatbot for the Microsoft Annual 2025 Report." },
    ],
  }),
  component: Index,
});

const API_URL = (import.meta.env.VITE_CHAT_API_URL ?? "").replace(/\/+$/, "");

type Source = {
  page: number | string | null;
  type: string | null;
  content: string | null;
};

type Message = {
  id: string;
  role: "user" | "bot" | "error";
  content: string;
  sources?: Source[];
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  { icon: Zap, label: "Summarize Microsoft's FY2025 revenue highlights" },
  { icon: Library, label: "What are the key risks mentioned in the report?" },
  { icon: Search, label: "How did Azure and cloud services perform?" },
  { icon: HelpCircle, label: "Explain Microsoft's AI strategy for 2025" },
];

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (question: string) => {
    if (!question || loading) return;

    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: question, timestamp: new Date() },
    ]);
    setInput("");
    setLoading(true);

    try {
      if (!API_URL) {
        throw new Error("Backend URL not configured yet. Set VITE_CHAT_API_URL to your new endpoint.");
      }
      const res = await fetch(`${API_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Request failed: ${res.status} — ${errBody}`);
      }
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: data.answer ?? "No answer returned.",
          sources: data.sources ?? [],
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "error",
          content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    void send(input.trim());
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Animated backdrop */}
      <div className="pointer-events-none absolute inset-0 aurora-bg" />
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-60" />

      {/* SIDEBAR */}
      <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/70 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-lg shadow-primary/40">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-[13px] font-semibold tracking-tight">MSFT · RAG</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Annual 2025</p>
          </div>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => setMessages([])}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] hover:shadow-primary/50"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>
        </div>

        <div className="px-3 pb-2 pt-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recent
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {messages.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground/70">No conversations yet.</p>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-left text-xs text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary-glow" />
              <span className="truncate">Current session</span>
            </button>
          )}
        </nav>

        <div className="border-t border-border/60 p-3">
          <div className="space-y-1">
            <SidebarItem icon={FileText} label="Source document" />
            <SidebarItem icon={Settings} label="Settings" />
            <SidebarItem icon={Github} label="GitHub" />
          </div>
          <p className="mt-3 px-2 text-[10px] text-muted-foreground/60">
            Built by <span className="font-medium text-foreground/80">Hamza</span>
          </p>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border/60 bg-background/40 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-md shadow-primary/30">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold tracking-tight sm:text-base">
                Microsoft Annual 2025 Report
              </h1>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>RAG Chatbot</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </span>
                <span>Online</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 rounded-md border border-border/70 bg-card/60 px-3 py-1.5 text-[11px] font-medium text-foreground/90 transition-all hover:border-primary/60 hover:text-foreground md:hidden"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </header>

        {/* Chat area */}
        <main className="relative flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 md:py-10">
              {messages.length === 0 && (
                <EmptyState onPick={(p) => void send(p)} />
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}

              {loading && (
                <div className="flex items-end gap-3 animate-fade-in-up">
                  <Avatar role="bot" />
                  <div className="rounded-2xl rounded-bl-md border border-border bg-card/80 px-4 py-3.5 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-glow animate-bounce-dot" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-glow animate-bounce-dot [animation-delay:0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-glow animate-bounce-dot [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-border/60 bg-background/40 backdrop-blur-xl">
            <form onSubmit={handleSend} className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
              <div className="group relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about the 2025 report..."
                  disabled={loading}
                  className="w-full rounded-xl border border-border bg-card/80 px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/70 focus:shadow-[0_0_0_4px_oklch(0.55_0.22_270/0.15)] disabled:opacity-50"
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                  ⏎
                </kbd>
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="group flex h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-glow px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/50 hover:animate-pulse-glow disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <p className="pb-3 text-center text-[10px] text-muted-foreground/60">
              Grounded answers from Microsoft's 2025 annual report · Built by{" "}
              <span className="font-medium text-foreground/80">Hamza</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label }: { icon: typeof Bot; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="mt-10 flex flex-col items-center text-center md:mt-20">
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_50px_oklch(0.55_0.22_270/0.55)] animate-pulse-glow">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
        Microsoft Annual 2025
      </h2>
      <p className="mt-1 text-sm font-medium text-primary-glow">RAG Chatbot</p>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Ask anything about Microsoft's 2025 annual report. I'll search the document and give you
        grounded answers — with markdown formatting and code support.
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onPick(p.label)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card/60 p-3.5 text-left text-xs text-foreground/90 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card hover:shadow-[0_8px_24px_-12px_oklch(0.55_0.22_270/0.6)]"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary-glow ring-1 ring-primary/30 transition-colors group-hover:bg-primary/25">
              <p.icon className="h-3.5 w-3.5" />
            </span>
            <span className="leading-snug">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "user" | "bot" }) {
  if (role === "bot") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-md shadow-primary/40">
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card font-mono text-[11px] font-semibold text-foreground">
      YOU
    </div>
  );
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-muted-foreground hover:text-foreground"
      >
        <span>
          <span className="font-semibold text-primary-glow">#{index + 1}</span>{" "}
          Page {source.page ?? "?"}
          {source.type ? <span className="ml-1.5 opacity-60">· {source.type}</span> : null}
        </span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <pre className="max-h-40 overflow-y-auto border-t border-border/40 px-3 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
          {source.content ?? "—"}
        </pre>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  return (
    <div className={`flex flex-col gap-1 animate-fade-in-up ${isUser ? "items-end" : "items-start"}`}>
      <div className={`flex w-full items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <Avatar role={isUser ? "user" : "bot"} />
        <div
          className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/25"
              : isError
                ? "rounded-tl-sm border border-destructive/40 bg-destructive/10 text-destructive"
                : "rounded-tl-sm border border-border bg-card/80 text-foreground backdrop-blur-sm"
          }`}
        >
          {isUser || isError ? (
            <p className="whitespace-pre-wrap font-sans">{message.content}</p>
          ) : (
            <div className="md-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      {!isUser && !isError && message.sources && message.sources.length > 0 && (
        <div className="ml-11 mt-1.5 flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Sources ({message.sources.length})
          </p>
          {message.sources.map((s, i) => (
            <SourceCard key={i} source={s} index={i} />
          ))}
        </div>
      )}
      <span className={`px-11 font-mono text-[10px] text-muted-foreground/60 ${isUser ? "text-right" : "text-left"}`}>
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}
