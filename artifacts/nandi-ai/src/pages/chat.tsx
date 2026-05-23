import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetChatHistory, getGetChatHistoryQueryKey, useClearChatHistory } from "@workspace/api-client-react";
import { Send, Trash2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default function Chat() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: history, isLoading } = useGetChatHistory({ query: { queryKey: getGetChatHistoryQueryKey() } });
  const clearMutation = useClearChatHistory();

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
        toast({ description: "Conversation history cleared." });
      }
    });
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

    // Optimistically update cache to show user message immediately
    queryClient.setQueryData(getGetChatHistoryQueryKey(), (old: Message[] | undefined) => {
      const msgs = old || [];
      return [...msgs, {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userMessage,
        createdAt: new Date().toISOString()
      }];
    });

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
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
      
      // Done streaming
      queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
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
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-3xl font-serif">NandiAi Assistant</h1>
          <p className="text-muted-foreground text-sm font-light mt-1">A conversational interface for creative thought.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClear}
          disabled={!history?.length || isStreaming || clearMutation.isPending}
          className="rounded-none border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3 h-3 mr-2" />
          Clear Chat
        </Button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto mb-6 pr-4 space-y-8 scroll-smooth"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-serif italic">
            Connecting...
          </div>
        ) : (!history || history.length === 0) && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 border border-border flex items-center justify-center bg-white">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-serif text-lg text-muted-foreground">How can I assist your creative process?</p>
          </div>
        ) : (
          <div className="space-y-8 pb-4">
            {history?.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "shrink-0 w-8 h-8 flex items-center justify-center border",
                  msg.role === "user" ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground"
                )}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-4 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user" ? "bg-white border border-border text-foreground" : "font-serif text-base"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Streaming Message Bubble */}
            {isStreaming && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 flex items-center justify-center border border-border bg-white text-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 text-base font-serif leading-relaxed whitespace-pre-wrap">
                  {streamedContent}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 bg-white border border-border p-2 focus-within:ring-1 focus-within:ring-primary transition-shadow">
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
            placeholder="Type your message..."
            className="min-h-[52px] max-h-32 border-none shadow-none resize-none focus-visible:ring-0 rounded-none bg-transparent"
            disabled={isStreaming}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isStreaming}
            className="rounded-none h-10 w-10 shrink-0 bg-foreground text-background hover:bg-foreground/90 mb-1 mr-1"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
      <div className="text-center mt-2">
         <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Shift+Enter for newline</span>
      </div>
    </div>
  );
}
