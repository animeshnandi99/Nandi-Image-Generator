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

    await saveChatMessage(userMsg);
    queryClient.invalidateQueries({ queryKey: LOCAL_CHAT_QUERY_KEY });

    try {
      const currentHistory = (history ?? []).map((m) => ({
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

      if (!response.ok) throw new Error("Failed to send message");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                currentText += data.content;
                setStreamedContent(currentText);
              }
              if (data.done) {
                break;
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
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
      toast({ variant: "destructive", description: "Connection error." });
      console.error(error);
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NandiAi" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
          <div>
            <h1 className="text-xl font-bold gradient-text">NandiAi Assistant</h1>
            <p className="text-muted-foreground text-xs font-light mt-0.5">Your creative AI companion</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!history?.length || isStreaming}
          className="text-[11px] font-medium text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-full px-3 gap-1.5 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mb-5 pr-2 space-y-5 scroll-smooth"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
            Connecting...
          </div>
        ) : (!history || history.length === 0) && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <img src={logoImg} alt="NandiAi" className="w-16 h-16 rounded-2xl object-cover shadow-xl glow" />
            <div>
              <p className="font-semibold text-lg text-foreground/80 mb-1">How can I help you today?</p>
              <p className="text-muted-foreground text-sm">Ask me anything about your creative projects.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {history?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "shrink-0 w-8 h-8 flex items-center justify-center rounded-xl shadow-md",
                  msg.role === "user"
                    ? "btn-gradient"
                    : "glass border border-white/10"
                )}>
                  {msg.role === "user"
                    ? <User className="w-4 h-4 text-white" />
                    : <img src={logoImg} alt="NandiAi" className="w-4 h-4 rounded object-cover" />
                  }
                </div>

                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "btn-gradient text-white rounded-tr-sm shadow-lg"
                    : "glass border border-white/8 text-foreground/90 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl glass border border-white/10">
                  <img src={logoImg} alt="NandiAi" className="w-4 h-4 rounded object-cover" />
                </div>
                <div className="glass border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {streamedContent || (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                  {streamedContent && (
                    <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-pulse align-middle rounded-full" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0">
        <div className={cn(
          "glass rounded-2xl border border-white/10 p-2 transition-all duration-200",
          "focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/10"
        )}>
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message NandiAi..."
              className="min-h-[52px] max-h-36 border-none shadow-none resize-none focus-visible:ring-0 rounded-xl bg-transparent placeholder:text-muted-foreground/40 text-sm"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className={cn(
                "h-10 w-10 rounded-xl shrink-0 mb-1 mr-1 flex items-center justify-center transition-all duration-200",
                input.trim() && !isStreaming
                  ? "btn-gradient text-white hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
        <p className="text-center mt-2 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
          Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
