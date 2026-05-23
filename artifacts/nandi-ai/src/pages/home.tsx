import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Download, Wand2 } from "lucide-react";
import { 
  useGenerateImage, 
  useEnhancePrompt, 
  getGetImageHistoryQueryKey 
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const generateSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(1000),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]),
  style: z.string().optional(),
});

type GenerateValues = z.infer<typeof generateSchema>;

const STYLES = ["Cinematic", "Watercolor", "Anime", "Neon", "Oil Painting", "Sketch", "Photorealistic"];

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const generateMutation = useGenerateImage();
  const enhanceMutation = useEnhancePrompt();
  
  const [generatedImage, setGeneratedImage] = useState<{
    b64_json: string;
    prompt: string;
    size: string;
  } | null>(null);

  const [showEnhancedBadge, setShowEnhancedBadge] = useState(false);

  const form = useForm<GenerateValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      prompt: "",
      size: "1024x1024",
      style: "",
    },
  });

  const currentPrompt = form.watch("prompt");

  const onSubmit = (values: GenerateValues) => {
    setGeneratedImage(null);
    generateMutation.mutate(
      {
        data: {
          prompt: values.prompt,
          size: values.size,
          style: values.style || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setGeneratedImage({
            b64_json: data.b64_json,
            prompt: data.prompt,
            size: data.size,
          });
          queryClient.invalidateQueries({ queryKey: getGetImageHistoryQueryKey() });
          toast({
            title: "Artwork Generated",
            description: "Your vision is ready.",
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: error?.error || "We encountered an error. Please try again.",
          });
        },
      }
    );
  };

  const handleEnhance = () => {
    if (!currentPrompt || currentPrompt.length < 3) {
      toast({ description: "Please enter a basic prompt first to enhance it." });
      return;
    }
    
    enhanceMutation.mutate(
      { data: { prompt: currentPrompt } },
      {
        onSuccess: (res) => {
          form.setValue("prompt", res.enhancedPrompt);
          setShowEnhancedBadge(true);
          setTimeout(() => setShowEnhancedBadge(false), 2000);
        },
        onError: () => {
          toast({ variant: "destructive", description: "Failed to enhance prompt." });
        }
      }
    );
  };

  const isGenerating = generateMutation.isPending;
  const isEnhancing = enhanceMutation.isPending;

  return (
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch min-h-[calc(100vh-8rem)] pt-6">
      {/* Input Side */}
      <div className="w-full lg:w-[45%] flex flex-col shrink-0">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight">Bring ideas to <br/><span className="text-primary italic">visual life.</span></h1>
          <p className="text-muted-foreground text-lg font-light tracking-wide max-w-md">
            Describe your subject, define the dimensions, and select a mood. Our synthesis engine handles the rest.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1 flex flex-col">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium uppercase tracking-wider text-foreground">Prompt</label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEnhance}
                  disabled={isEnhancing || isGenerating}
                  className="h-8 text-xs font-mono text-primary hover:text-primary hover:bg-primary/10"
                  data-testid="button-enhance-prompt"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-2" />
                  )}
                  Enhance with AI
                </Button>
              </div>
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormControl>
                      <Textarea
                        placeholder="A lone figure standing on a desolate black sand beach, cinematic lighting, dramatic clouds..."
                        className={cn(
                          "min-h-[160px] resize-none text-lg bg-white rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-sm transition-all",
                          isEnhancing && "animate-pulse"
                        )}
                        {...field}
                      />
                    </FormControl>
                    {showEnhancedBadge && (
                      <div className="absolute -top-3 -right-3 bg-primary text-white text-[10px] uppercase tracking-widest font-mono py-1 px-2 animate-in zoom-in fade-in duration-300 pointer-events-none">
                        Enhanced
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium uppercase tracking-wider text-foreground">Dimensions</label>
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("1024x1024")}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 border transition-all h-24 bg-white",
                            field.value === "1024x1024" ? "border-primary text-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                          )}
                          data-testid="btn-size-square"
                        >
                          <div className="w-6 h-6 border-2 border-current mb-2" />
                          <span className="text-xs font-mono uppercase">Square</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("1536x1024")}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 border transition-all h-24 bg-white",
                            field.value === "1536x1024" ? "border-primary text-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                          )}
                          data-testid="btn-size-landscape"
                        >
                          <div className="w-8 h-5 border-2 border-current mb-2" />
                          <span className="text-xs font-mono uppercase">Landscape</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("1024x1536")}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 border transition-all h-24 bg-white",
                            field.value === "1024x1536" ? "border-primary text-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                          )}
                          data-testid="btn-size-portrait"
                        >
                          <div className="w-5 h-8 border-2 border-current mb-2" />
                          <span className="text-xs font-mono uppercase">Portrait</span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium uppercase tracking-wider text-foreground">Style</label>
              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="e.g. 35mm photograph, minimalist, brutalist"
                        className="bg-white rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {STYLES.map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => field.onChange(style)}
                          className="text-xs py-1 px-3 border border-border bg-white text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 pb-12">
              <Button
                type="submit"
                size="lg"
                disabled={isGenerating}
                className="w-full text-lg h-16 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-all uppercase tracking-widest font-mono"
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-3 animate-pulse">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Synthesizing...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    Generate Artifact <Wand2 className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Output Side */}
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary/50 border border-border p-8 lg:p-12 min-h-[500px] mb-12">
        {generatedImage ? (
          <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-700">
            <div className="relative group bg-white p-4 shadow-sm border border-border">
              <img
                src={`data:image/png;base64,${generatedImage.b64_json}`}
                alt="Generated artwork"
                className="w-full object-contain"
              />
              
              <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm leading-relaxed font-serif text-foreground/80 italic border-l-2 border-primary pl-4">
                  "{generatedImage.prompt}"
                </p>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs font-mono text-muted-foreground uppercase">{generatedImage.size}</span>
                  <a
                    href={`data:image/png;base64,${generatedImage.b64_json}`}
                    download={`nandi-${Date.now()}.png`}
                    className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider hover:text-primary transition-colors"
                    data-testid="button-download"
                  >
                    Download <Download className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-8 animate-in fade-in duration-500 text-center">
            <div className="relative">
              <div className="w-32 h-32 border border-foreground/10 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
              <div className="w-32 h-32 border border-primary border-t-transparent border-l-transparent rounded-full animate-spin absolute inset-0" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-mono tracking-widest uppercase text-foreground animate-pulse">Running Synthesis</div>
              <div className="text-xs text-muted-foreground max-w-xs mx-auto">Allocating compute resources and refining visual semantics...</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 border border-current flex items-center justify-center mb-6">
              <div className="w-8 h-8 border border-current" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest max-w-[200px] leading-relaxed">
              Waiting for input parameters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
