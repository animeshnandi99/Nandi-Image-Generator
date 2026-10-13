import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import logoImg from "@assets/nandi-ai-1777879067042_1779626685766.png";
import {
  getAllChatMessages,
  saveChatMessage,
  clearChatMessages,
  LOCAL_CHAT_QUERY_KEY,
  type LocalChatMessage,
} from "@workspace/local-store";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: history, isLoading } = useQuery({
    queryKey: LOCAL_CHAT_QUERY_KEY,
    queryFn: getAllChatMessages,
  });

  const handleClear = async () => {
    await clearChatMessages();
    queryClient.invalidateQueries({ queryKey: LOCAL_CHAT_QUERY_KEY });
    toast({ description: "Conversation history cleared." });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, streamedContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamedContent("");

    const userMsg: LocalChatMessage = {
      id: generateId(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveChatMessage(userMsg);
      queryClient.invalidateQueries({ queryKey: LOCAL_CHAT_QUERY_KEY });

      const savedHistory = await getAllChatMessages();
      const currentHistory = savedHistory
        .filter((message) => message.id !== userMsg.id)
        .slice(-20)
        .map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: currentHistory,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          typeof errorBody?.error === "string"
            ? errorBody.error
            : "Failed to send message.",
        );
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentText = "";
      let buffer = "";
      let receivedDoneEvent = false;

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        buffer = buffer.replace(/\r\n/g, "\n");
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const data = event
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart())
            .join("\n");
          if (!data || data === "[DONE]") continue;

          let payload: { content?: string; done?: boolean; error?: string };
          try {
            payload = JSON.parse(data);
          } catch {
            throw new Error("Received an invalid response from the assistant.");
          }

          if (payload.error) {
            throw new Error(payload.error);
          }
          if (payload.content) {
            currentText += payload.content;
            setStreamedContent(currentText);
          }
          if (payload.done) {
            receivedDoneEvent = true;
          }
        }

        if (done) break;
        if (receivedDoneEvent) {
          await reader.cancel();
          break;
        }
      }

      if (!currentText.trim()) {
        throw new Error("The assistant returned an empty response. Please try again.");
      }

      const assistantMsg: LocalChatMessage = {
        id: generateId(),
        role: "assistant",
        content: currentText,
        createdAt: new Date().toISOString(),
      };
      await saveChatMessage(assistantMsg);
      queryClient.invalidateQueries({ queryKey: LOCAL_CHAT_QUERY_KEY });
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Connection error.";
      toast({ variant: "destructive", description });
      console.error(error);
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
    }
  };

  return (
      <div className="flex flex-col h-[calc(100dvh-12rem)] md:h-[calc(100vh-6rem)] max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NandiAi" className="w-10 h-10 rounded-sm object-cover" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">NandiAi Assistant</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Separate chat. Messages do not create or change images.</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!history?.length || isStreaming}
          className="rounded-sm px-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mb-5 pr-2 space-y-5"
      >
        {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm" role="status">
              Loading saved chat...
          </div>
        ) : (!history || history.length === 0) && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <img src={logoImg} alt="NandiAi" className="w-16 h-16 rounded-sm object-cover" />
            <div>
              <p className="font-semibold text-lg text-foreground mb-1">Ask a question or brainstorm.</p>
              <p className="text-muted-foreground text-sm">This chat will not generate or change images.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {history?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "shrink-0 w-8 h-8 flex items-center justify-center rounded-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass border border-border"
                )}>
                  {msg.role === "user"
                    ? <User className="w-4 h-4 text-white" />
                    : <img src={logoImg} alt="NandiAi" className="w-4 h-4 rounded object-cover" />
                  }
                </div>

                <div className={cn(
                  "rounded-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "glass border border-border text-foreground rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-sm glass border border-border">
                  <img src={logoImg} alt="NandiAi" className="w-4 h-4 rounded object-cover" />
                </div>
                <div className="glass border border-border rounded-md rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {streamedContent || <span className="text-muted-foreground">Assistant is responding...</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0">
        <div className={cn(
          "glass rounded-sm border border-border p-2",
          "focus-within:border-primary"
        )}>
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              aria-label="Message NandiAi"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message NandiAi..."
              className="min-h-[52px] max-h-36 border-none shadow-none resize-none focus-visible:ring-0 rounded-sm bg-transparent placeholder:text-muted-foreground text-sm"
              disabled={isStreaming}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isStreaming}
              className={cn(
                "h-10 w-10 rounded-sm shrink-0 mb-1 mr-1 flex items-center justify-center",
                input.trim() && !isStreaming
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
        <p className="text-center mt-2 text-xs text-muted-foreground">
          Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
