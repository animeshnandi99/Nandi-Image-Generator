import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Download, Wand2 } from "lucide-react";
import {
  useGenerateImage,
  useEnhancePrompt,
} from "@workspace/api-client-react";
import { saveImage, LOCAL_IMAGES_QUERY_KEY, LOCAL_STATS_QUERY_KEY } from "@workspace/local-store";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        onSuccess: async (data) => {
          setGeneratedImage({
            b64_json: data.b64_json,
            prompt: data.prompt,
            size: data.size,
          });
          await saveImage({
            id: String(data.id),
            prompt: data.prompt,
            b64_json: data.b64_json,
            size: data.size,
            style: data.style ?? null,
            createdAt: data.createdAt,
          });
          queryClient.invalidateQueries({ queryKey: LOCAL_IMAGES_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: LOCAL_STATS_QUERY_KEY });
          toast({
            title: "Artwork Generated",
            description: "Your vision is ready.",
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: (error as any)?.error || "We encountered an error. Please try again.",
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
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-stretch min-h-[calc(100vh-8rem)] pt-6">
      {/* Input Side */}
      <div className="w-full lg:w-[45%] flex flex-col shrink-0">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Bring ideas to{" "}
            <span className="gradient-text">visual life.</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-md leading-relaxed">
            Describe your vision, choose your canvas, and let AI do the rest.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7 flex-1 flex flex-col">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Prompt</label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEnhance}
                  disabled={isEnhancing || isGenerating}
                  className="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 rounded-full px-3"
                  data-testid="button-enhance-prompt"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1.5" />
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
                        placeholder="A lone astronaut floating through a nebula of violet and gold, cinematic, ultra-detailed..."
                        className={cn(
                          "min-h-[160px] resize-none text-base glass rounded-xl border-white/10",
                          "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/40",
                          "placeholder:text-muted-foreground/50 transition-all duration-200",
                          isEnhancing && "animate-pulse"
                        )}
                        {...field}
                      />
                    </FormControl>
                    {showEnhancedBadge && (
                      <div className="absolute -top-2.5 -right-2.5 btn-gradient text-white text-[10px] uppercase tracking-widest font-mono py-1 px-2.5 rounded-full animate-in zoom-in fade-in duration-300 pointer-events-none shadow-lg">
                        Enhanced ✓
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Dimensions</label>
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "1024x1024", label: "Square", shape: "w-7 h-7" },
                          { value: "1536x1024", label: "Landscape", shape: "w-10 h-6" },
                          { value: "1024x1536", label: "Portrait", shape: "w-6 h-10" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 h-24",
                              field.value === opt.value
                                ? "border-primary/60 bg-primary/15 text-primary glow-sm"
                                : "glass border-white/8 text-muted-foreground hover:border-white/20 hover:text-foreground"
                            )}
                            data-testid={`btn-size-${opt.label.toLowerCase()}`}
                          >
                            <div className={cn("border-2 border-current mb-2 rounded-sm", opt.shape)} />
                            <span className="text-xs font-medium">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Style</label>
              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)} value={field.value || "__none__"}>
                      <FormControl>
                        <SelectTrigger className="glass rounded-xl border-white/10 h-11 focus:ring-2 focus:ring-primary/60 focus:border-primary/40 transition-all duration-200">
                          <SelectValue placeholder="No style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass border-white/10 bg-[hsl(var(--background)/0.92)] backdrop-blur-xl rounded-xl">
                        <SelectItem value="__none__" className="text-muted-foreground focus:bg-white/8">No style</SelectItem>
                        {STYLES.map(style => (
                          <SelectItem key={style} value={style} className="focus:bg-white/8">{style}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 pb-4">
              <button
                type="submit"
                disabled={isGenerating}
                className={cn(
                  "w-full h-16 rounded-xl text-white font-semibold text-base transition-all duration-300",
                  "flex items-center justify-center gap-3",
                  isGenerating
                    ? "bg-primary/50 cursor-not-allowed"
                    : "btn-gradient hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]"
                )}
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    Generate Artwork <Wand2 className="h-5 w-5" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </Form>
      </div>

      {/* Output Side */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center glass rounded-2xl p-8 lg:p-12 min-h-[500px] mb-4 transition-all duration-500",
        generatedImage && "glow"
      )}>
        {generatedImage ? (
          <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-700">
            <div className="relative group rounded-xl overflow-hidden border border-white/10">
              <img
                src={`data:image/png;base64,${generatedImage.b64_json}`}
                alt="Generated artwork"
                className="w-full object-contain"
              />
            </div>
            
            <div className="mt-5 glass rounded-xl p-4 space-y-4">
              <p className="text-sm leading-relaxed text-foreground/70 italic border-l-2 border-primary/60 pl-4">
                "{generatedImage.prompt}"
              </p>
              <div className="flex items-center justify-between border-t border-white/8 pt-3">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{generatedImage.size}</span>
                <a
                  href={`data:image/png;base64,${generatedImage.b64_json}`}
                  download={`nandi-${Date.now()}.png`}
                  className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  data-testid="button-download"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-8 animate-in fade-in duration-500 text-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="w-28 h-28 rounded-full border-2 border-primary border-t-transparent border-l-transparent animate-spin absolute inset-0" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full btn-gradient flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold tracking-widest uppercase gradient-text animate-pulse">Generating Your Vision</div>
              <div className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">Processing your prompt and rendering the final image...</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-20 h-20 rounded-2xl border border-current flex items-center justify-center mb-6">
              <Wand2 className="w-9 h-9" />
            </div>
            <p className="font-medium text-sm uppercase tracking-widest max-w-[200px] leading-relaxed">
              Your artwork will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
