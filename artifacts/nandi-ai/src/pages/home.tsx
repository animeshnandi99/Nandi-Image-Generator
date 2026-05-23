import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Wand2, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { useGenerateImage, getGetImageHistoryQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const generateSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(1000),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]),
  style: z.string().optional(),
});

type GenerateValues = z.infer<typeof generateSchema>;

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const generateMutation = useGenerateImage();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const form = useForm<GenerateValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      prompt: "",
      size: "1024x1024",
      style: "",
    },
  });

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
          setGeneratedImage(`data:image/png;base64,${data.b64_json}`);
          queryClient.invalidateQueries({ queryKey: getGetImageHistoryQueryKey() });
          toast({
            title: "Masterpiece created",
            description: "Your imagination has been brought to life.",
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Generation failed",
            description: error?.error || "Could not generate image. Try again.",
          });
        },
      }
    );
  };

  const isGenerating = generateMutation.isPending;

  return (
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-4rem)] items-stretch">
      {/* Configuration Sidebar */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 pt-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Create</h1>
          <p className="text-muted-foreground">Describe what you want to see, and watch it materialize.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem className="flex-1 min-h-[200px]">
                  <FormControl>
                    <Textarea
                      placeholder="A cyberpunk street market at night, neon lights reflecting on wet pavement, cinematic lighting..."
                      className="min-h-[200px] h-full resize-none bg-black/20 border-white/10 focus-visible:ring-primary/50 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024x1024">Square (1:1)</SelectItem>
                          <SelectItem value="1536x1024">Landscape (3:2)</SelectItem>
                          <SelectItem value="1024x1536">Portrait (2:3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Style (e.g. Anime)"
                        className="bg-black/20 border-white/10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isGenerating}
              className="w-full text-lg h-14 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all animate-pulse-glow"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Main Showcase Area */}
      <div className="flex-1 flex items-center justify-center bg-black/40 rounded-3xl border border-white/5 overflow-hidden relative shadow-2xl min-h-[400px]">
        {generatedImage ? (
          <div className="relative w-full h-full animate-in fade-in zoom-in duration-1000 flex items-center justify-center p-4">
            <img
              src={generatedImage}
              alt="Generated output"
              className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            />
          </div>
        ) : isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
              <div className="w-24 h-24 border-4 border-t-primary border-r-primary/50 border-b-transparent border-l-transparent rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-8 h-8 animate-pulse" />
            </div>
            <div className="text-xl text-primary font-mono animate-pulse tracking-widest uppercase">Processing</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-white/20 animate-in fade-in duration-1000">
            <ImageIcon className="w-32 h-32 mb-6 opacity-50" />
            <p className="text-xl font-light tracking-wide uppercase">Awaiting Input</p>
          </div>
        )}
      </div>
    </div>
  );
}
