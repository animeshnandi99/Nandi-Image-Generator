import { useGetImageHistory, useDeleteImage, getGetImageHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
          toast({ description: "Image deleted from gallery." });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Gallery</h1>
          <p className="text-muted-foreground">Loading your creations...</p>
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={`w-full rounded-xl bg-white/5 ${i % 2 === 0 ? 'h-64' : 'h-96'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gallery</h1>
          <p className="text-muted-foreground">Your personal collection of synthesized realities.</p>
        </div>
        <div className="text-sm font-mono text-primary/70 bg-primary/10 px-3 py-1 rounded-full">
          {images?.length || 0} Assets
        </div>
      </div>

      {!images || images.length === 0 ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20">
          <p className="text-xl text-muted-foreground">The gallery is empty.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {images.map((img, index) => (
            <div 
              key={img.id} 
              className="relative group break-inside-avoid animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-zoom-in rounded-xl overflow-hidden border border-white/10 bg-black/40 relative">
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-sm text-white line-clamp-3 mb-3 leading-relaxed font-medium">
                        {img.prompt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-mono">{img.size}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-white/70 hover:text-destructive hover:bg-destructive/20 rounded-full transition-colors z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(img.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-7xl w-full border-white/10 bg-background/95 backdrop-blur-xl p-1 overflow-hidden h-[90vh] flex flex-col">
                  <div className="flex-1 min-h-0 relative flex items-center justify-center p-4">
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="p-6 bg-black/50 border-t border-white/10 shrink-0">
                    <p className="text-lg text-white/90 leading-relaxed max-w-4xl mx-auto">{img.prompt}</p>
                    <div className="flex items-center justify-between max-w-4xl mx-auto mt-4 text-sm text-white/50">
                      <div className="flex gap-4">
                        <span className="font-mono bg-white/5 px-2 py-1 rounded">{img.size}</span>
                        {img.style && <span className="bg-primary/20 text-primary px-2 py-1 rounded">{img.style}</span>}
                      </div>
                      <span>{new Date(img.createdAt).toLocaleDateString()}</span>
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
