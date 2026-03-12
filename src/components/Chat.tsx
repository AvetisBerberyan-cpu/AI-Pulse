import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowUp, PanelLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UploadedDocument } from "../types/documents";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const suggestions = [
  "What documents are available?",
  "Summarize all documents briefly",
  "What are the key policies across all documents?",
  "Are there conflicting details between documents?",
];

type ChatProps = {
  documents: UploadedDocument[];
  onToggleSidebar: () => void;
};

function Chat({ documents, onToggleSidebar }: ChatProps) {
  const { documentId } = useParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const isDocumentChat = Boolean(documentId);
  const hasMessages = messages.length > 0;
  const currentDocument = useMemo(
    () => documents.find((doc) => doc.id === documentId),
    [documents, documentId],
  );
  const headerLabel = useMemo(
    () =>
      hasMessages
        ? isDocumentChat
          ? currentDocument?.name ?? "Document Chat"
          : "All Documents Chat"
        : isDocumentChat
          ? "Document Chat"
          : "All Documents Chat",
    [hasMessages, isDocumentChat, currentDocument?.name],
  );
  const badgeLabel = useMemo(
    () =>
      isDocumentChat
        ? `${currentDocument?.chunks ?? 0} ${
            (currentDocument?.chunks ?? 0) === 1 ? "chunk" : "chunks"
          }`
        : `${documents.length} ${
            documents.length === 1 ? "document" : "documents"
          }`,
    [documents.length, isDocumentChat, currentDocument?.chunks],
  );

  useEffect(() => {
    const loadChat = async () => {
      setIsLoadingHistory(true);
      try {
        const endpoint = isDocumentChat
          ? `/api/chat/document/${documentId}`
          : "/api/chat/general";
        const response = await fetch(endpoint);
        if (!response.ok) {
          setMessages([]);
          return;
        }
        const data = await response.json();
        const mapped = Array.isArray(data?.messages)
          ? data.messages.map((msg: any) => ({
              role: msg?.role === "assistant" ? "assistant" : "user",
              text: msg?.content ?? "",
            }))
          : [];
        setMessages(mapped);
      } catch (error) {
        console.error(error);
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChat();
  }, [documentId, isDocumentChat]);

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content) return;

    setMessages((prev) => [...prev, { role: "user", text: content }]);
    setInput("");
    setIsThinking(true);

    try {
      const endpoint = isDocumentChat ? "/api/chat" : "/api/chat/general";
      const payload = isDocumentChat
        ? { documentId, newMessage: content }
        : { newMessage: content };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Failed to send message";
        try {
          const data = await response.json();
          if (data?.error) errorMessage = data.error;
        } catch {
          // Ignore JSON parsing errors and use fallback message.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data?.assistantResponse) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.assistantResponse },
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <section className="flex h-screen max-h-screen flex-col bg-[#03070f]">
      <header className="flex h-11 items-center gap-2 border-b border-[#0f1f31] px-4 text-xs text-slate-400">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-[#0d2037] hover:text-slate-200 md:hidden"
          aria-label="Open sidebar"
        >
          <PanelLeft size={12} />
        </button>
        <span className="text-slate-300">{headerLabel}</span>
        <span className="rounded-md border border-[#1e2f44] bg-[#0d1522] px-1.5 py-0.5 text-[10px] text-slate-400">
          {badgeLabel}
        </span>
      </header>

      <div className="relative flex-1 overflow-y-auto px-4 py-5">
        {!hasMessages && !isLoadingHistory ? (
          <div className="mx-auto mt-20 max-w-xl text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a2d50] text-[#4ca1ff]">
              <Sparkles size={16} />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">
              Chat with all your documents
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
              Ask questions across{" "}
              <span className="text-slate-100">all uploaded documents.</span>
              <br />
              The AI will search through everything and cross-reference
              information for you.
            </p>

            <div className="mx-auto mt-5 grid max-w-[460px] grid-cols-1 gap-2 text-left sm:grid-cols-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendMessage(item)}
                  className="rounded-xl border border-[#1a2c41] bg-[#071021] px-3 py-2 text-xs text-slate-400 transition hover:border-[#28507e] hover:text-slate-300"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoadingHistory && (
              <div className="text-center text-xs text-slate-500">
                Loading chat…
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-3 py-2 text-lg ${
                    message.role === "user"
                      ? "bg-[#2a90ff] text-white"
                      : "bg-[#0d2037] text-slate-200"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-invert max-w-none text-slate-200 prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-pre:my-1 prose-code:text-[#b9d9ff]"
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b3259] text-[#4ca1ff]">
                  <Sparkles size={10} />
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-[#121f30] px-2 py-1 text-slate-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500 [animation-delay:180ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500 [animation-delay:320ms]" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#0f1f31] bg-[#040912] px-3 pb-2 pt-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2 rounded-xl border border-[#10253b] bg-[#030f1d] px-2 py-1.5"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            type="text"
            placeholder={
              isDocumentChat
                ? "Ask a question about this document..."
                : hasMessages
                  ? "Ask a question about this document..."
                  : "Ask a question across all your documents..."
            }
            className="h-8 flex-1 bg-transparent px-1 text-xs text-slate-200 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0c4d9b] text-[#b9d9ff] transition hover:bg-[#1366c7]"
          >
            <ArrowUp size={13} />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[12px] text-slate-600">
          AI responses are generated from uploaded documents. Always verify
          important information.
        </p>
      </div>
    </section>
  );
}

export default Chat;
