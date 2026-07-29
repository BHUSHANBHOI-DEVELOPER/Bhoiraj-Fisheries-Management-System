import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Assistant | Bhoiraj Matsya Sanstha" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const initialMessages: UIMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      parts: [{
        type: "text",
        text: lang === "hi"
          ? "नमस्ते! मैं भोईराज मत्स्य व्यवसायिक सहकारी संस्था मर्यादित, पिंपळगाव बु. का AI सहायक हूँ। दस्तावेज़, बांध ऑडिट, सदस्यता या योजनाओं के बारे में कुछ भी पूछें।"
          : lang === "mr"
          ? "नमस्कार! मी भोईराज मत्स्य व्यवसायिक सहकारी संस्था मर्यादितचा AI सहाय्यक आहे. कागदपत्रे, धरण लेखापरीक्षण, सदस्यत्व किंवा योजनांबद्दल काहीही विचारा."
          : "Hello! I'm the AI assistant for Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk.. Ask me anything about documents, dam audits, membership, or government schemes.",
      }],
    },
  ];

  const { messages, sendMessage, status } = useChat({
    id: `chat-${user?.id ?? "guest"}`,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => console.error("Chat error:", err),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-hero-gradient text-primary-foreground shadow-elev">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.chat")}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-saffron" /> Powered by Lovable AI
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-6">
        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isUser ? "bg-saffron text-saffron-foreground" : "bg-primary text-primary-foreground"}`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e); }
          }}
          placeholder={lang === "hi" ? "अपना प्रश्न लिखें..." : lang === "mr" ? "आपला प्रश्न लिहा..." : "Type your question..."}
          rows={1}
          className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-elev transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
