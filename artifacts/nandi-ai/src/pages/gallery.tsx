import { useGetImageHistory, useDeleteImage, getGetImageHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function Gallery() {
  const { data: images, isLoading } = useGetImageHistory(undefined, { query: { queryKey: getGetImageHistoryQueryKey() } });
  const deleteImage = useDeleteImage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteImage.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetImageHistoryQueryKey() });
          toast({ description: "Artwork removed from collection." });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Archive</h1>
          <p className="text-muted-foreground text-lg font-light tracking-wide max-w-md">
            Retrieving your visual history...
          </p>
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={`w-full bg-secondary/50 rounded-none ${i % 2 === 0 ? 'h-64' : 'h-96'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 pt-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Archive</h1>
          <p className="text-muted-foreground text-lg font-light tracking-wide max-w-md">
            A curated collection of your past visual explorations.
          </p>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {images?.length || 0} Artifacts
        </div>
      </div>

      {!images || images.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center border border-border bg-secondary/30 p-12 text-center">
          <div className="w-16 h-16 border border-border flex items-center justify-center mb-6 text-muted-foreground">
            <span className="font-serif italic text-2xl">?</span>
          </div>
          <p className="text-xl font-serif mb-6">The archive is empty.</p>
          <Link href="/">
            <Button variant="outline" className="rounded-none border-border font-mono uppercase tracking-wider text-xs">
              Go Create Something
            </Button>
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {images.map((img, index) => (
            <div 
              key={img.id} 
              className="relative group break-inside-avoid animate-in fade-in slide-in-from-bottom-4 bg-white border border-border p-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-zoom-in relative overflow-hidden bg-secondary">
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-foreground/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                      <p className="text-sm text-background font-serif italic line-clamp-4 leading-relaxed">
                        "{img.prompt}"
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-background/50 font-mono uppercase tracking-widest">{img.size}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-background/50 hover:text-destructive hover:bg-destructive/10 rounded-none transition-colors z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(img.id);
                          }}
                          data-testid={`btn-delete-${img.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-6xl w-full bg-background border-none p-0 overflow-hidden h-[100dvh] md:h-[90vh] flex flex-col md:flex-row gap-0 rounded-none shadow-2xl">
                  <DialogTitle className="sr-only">Image details</DialogTitle>
                  <div className="flex-1 bg-secondary/30 relative flex items-center justify-center p-4 md:p-12 overflow-hidden h-[60vh] md:h-full">
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="max-w-full max-h-full object-contain shadow-md"
                    />
                  </div>
                  <div className="w-full md:w-96 bg-white p-8 md:p-12 flex flex-col overflow-y-auto shrink-0 border-t md:border-t-0 md:border-l border-border">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Details</span>
                      <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground"><X className="w-4 h-4"/></Button>
                      </DialogTrigger>
                    </div>
                    
                    <div className="flex-1 space-y-8">
                      <div>
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Prompt</h3>
                        <p className="text-lg font-serif italic text-foreground leading-relaxed">
                          "{img.prompt}"
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
                        <div>
                          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Dimensions</h3>
                          <p className="text-sm font-medium">{img.size}</p>
                        </div>
                        {img.style && (
                          <div>
                            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Style</h3>
                            <p className="text-sm font-medium">{img.style}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Created</h3>
                          <p className="text-sm font-medium">{new Date(img.createdAt).toLocaleString(undefined, {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex gap-3 pt-8 border-t border-border">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-none border-border font-mono text-xs uppercase"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = `data:image/png;base64,${img.b64_json}`;
                          a.download = `nandi-${img.id}.png`;
                          a.click();
                        }}
                      >
                        Download
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1 rounded-none font-mono text-xs uppercase"
                        onClick={() => handleDelete(img.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
