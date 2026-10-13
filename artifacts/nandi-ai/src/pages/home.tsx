import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Image as ImageIcon } from "lucide-react";
import {
  useGenerateImage,
  useEnhancePrompt,
} from "@workspace/api-client-react";
import {
  saveImage,
  getImageMimeType,
  LOCAL_IMAGES_QUERY_KEY,
  LOCAL_STATS_QUERY_KEY,
} from "@workspace/local-store";

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

const STYLES = ["Watercolor", "Anime", "Oil Painting", "Sketch", "Photorealistic"];

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const generateMutation = useGenerateImage();
  const enhanceMutation = useEnhancePrompt();
  
  const [generatedImage, setGeneratedImage] = useState<{
    b64_json: string;
    mime_type: string;
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
            mime_type: data.mime_type,
            prompt: data.prompt,
            size: data.size,
          });
          await saveImage({
            id: String(data.id),
            prompt: data.prompt,
            b64_json: data.b64_json,
            mime_type: data.mime_type,
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
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-stretch lg:min-h-[calc(100vh-8rem)] pt-2 lg:pt-6">
      {/* Input Side */}
      <div className="w-full lg:w-[45%] flex flex-col shrink-0">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4 leading-tight">
            Create an image from a written prompt
          </h1>
          <p className="text-muted-foreground text-base max-w-md leading-relaxed">
            Enter a prompt, select dimensions and style, then generate an image.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 lg:space-y-7 flex-1 flex flex-col">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="image-prompt" className="text-sm font-medium text-foreground">Prompt</label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleEnhance}
                  disabled={isEnhancing || isGenerating}
                  className="h-8 rounded-sm px-3 text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
                  data-testid="button-enhance-prompt"
                >
                  {isEnhancing ? "Improving..." : "Improve prompt"}
                </Button>
              </div>
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormControl>
                      <Textarea
                        id="image-prompt"
                        placeholder="For example: a golden retriever sitting beside a sunny window."
                        className={cn(
                          "min-h-[120px] md:min-h-[160px] resize-none text-base glass rounded-sm border-border",
                          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
                          "placeholder:text-muted-foreground"
                        )}
                        {...field}
                      />
                    </FormControl>
                    {showEnhancedBadge && (
                      <div className="absolute right-2 top-2 border border-border bg-secondary px-2 py-1 text-xs text-foreground">
                        Prompt updated
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
                <p className="text-sm font-medium text-foreground" id="dimensions-label">Dimensions</p>
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="dimensions-label">
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
                              "flex flex-col items-center justify-center p-3 md:p-4 rounded-sm border h-20 md:h-24",
                              field.value === opt.value
                                ? "border-primary bg-accent text-primary"
                                : "glass border-border text-muted-foreground hover:border-primary"
                            )}
                            aria-pressed={field.value === opt.value}
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
                <p className="text-sm font-medium text-foreground">Style</p>
              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)} value={field.value || "__none__"}>
                      <FormControl>
                        <SelectTrigger aria-label="Image style" className="glass rounded-sm border-border h-11 focus:ring-2 focus:ring-primary focus:border-primary">
                          <SelectValue placeholder="No style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass border-border bg-card rounded-sm">
                        <SelectItem value="__none__" className="text-muted-foreground">No style</SelectItem>
                        {STYLES.map(style => (
                          <SelectItem key={style} value={style}>{style}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-0 pb-2 lg:pt-2 lg:pb-4">
              <button
                type="submit"
                disabled={isGenerating}
                className={cn(
                  "w-full h-14 rounded-sm border border-primary font-semibold text-base transition-colors",
                  "flex items-center justify-center gap-3",
                  isGenerating
                    ? "bg-primary/70 text-primary-foreground cursor-wait"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                data-testid="button-generate"
              >
                {isGenerating ? (
                    <span role="status">Generating image...</span>
                ) : (
                    <span>Generate image</span>
                )}
              </button>
            </div>
          </form>
        </Form>
      </div>

      {/* Output Side */}
      <div className="flex-1 flex flex-col items-center justify-center glass rounded-sm p-6 lg:p-10 min-h-[360px] lg:min-h-[500px] mb-4">
        {generatedImage ? (
          <div className="w-full max-w-3xl">
            <div className="relative overflow-hidden border border-border">
              <img
                src={`data:${getImageMimeType(generatedImage)};base64,${generatedImage.b64_json}`}
                alt="Generated artwork"
                className="w-full object-contain"
              />
            </div>
            
            <div className="mt-4 glass rounded-sm p-4 space-y-4">
              <p className="text-sm leading-relaxed text-foreground border-l-2 border-primary pl-4">
                "{generatedImage.prompt}"
              </p>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs font-mono text-muted-foreground">{generatedImage.size}</span>
                <a
                  href={`data:${getImageMimeType(generatedImage)};base64,${generatedImage.b64_json}`}
                  download={`nandi-${Date.now()}.${getImageMimeType(generatedImage).split("/")[1] === "jpeg" ? "jpg" : getImageMimeType(generatedImage).split("/")[1]}`}
                  className="flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
                  data-testid="button-download"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="max-w-sm space-y-2 text-center" role="status">
            <ImageIcon className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <p className="font-medium">Generating image</p>
            <p className="text-sm text-muted-foreground">This may take a short time.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <ImageIcon className="mb-4 h-8 w-8" aria-hidden="true" />
            <p className="font-medium">Your generated image will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
