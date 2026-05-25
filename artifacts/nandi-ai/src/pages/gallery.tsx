import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { getAllImages, deleteImage, LOCAL_IMAGES_QUERY_KEY, LOCAL_STATS_QUERY_KEY } from "@workspace/local-store";

export default function Gallery() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: images, isLoading } = useQuery({
    queryKey: LOCAL_IMAGES_QUERY_KEY,
    queryFn: getAllImages,
  });

  const handleDelete = async (id: string) => {
    await deleteImage(id);
    queryClient.invalidateQueries({ queryKey: LOCAL_IMAGES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: LOCAL_STATS_QUERY_KEY });
    toast({ description: "Artwork removed from collection." });
  };

  if (isLoading) {
    return (
      <div className="space-y-10 pt-6">
        <div className="pb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Gallery</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-md">
            Retrieving your visual history...
          </p>
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={`w-full bg-secondary/50 rounded-xl ${i % 2 === 0 ? 'h-64' : 'h-80'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 pt-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Gallery</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-md">
            Your collection of generated artworks.
          </p>
        </div>
        <div className="glass rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {images?.length || 0} artworks
        </div>
      </div>

      {!images || images.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center glass rounded-2xl p-12 text-center border border-dashed border-white/10">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-primary/40 flex items-center justify-center mb-6">
            <ImageIcon className="w-9 h-9 text-primary/60" />
          </div>
          <p className="text-xl font-semibold mb-2">No artworks yet</p>
          <p className="text-muted-foreground text-sm mb-8">Head to the Studio and create your first piece.</p>
          <Link href="/">
            <button className="btn-gradient text-white text-sm font-medium px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200">
              Go to Studio
            </button>
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="relative group break-inside-avoid animate-in fade-in slide-in-from-bottom-4 rounded-xl overflow-hidden border border-white/8 glass"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-zoom-in relative overflow-hidden">
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                      <p className="text-sm text-white/90 italic line-clamp-3 leading-relaxed mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        "{img.prompt}"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest">{img.size}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(img.id);
                          }}
                          data-testid={`btn-delete-${img.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-6xl w-full glass border border-white/10 p-0 overflow-hidden h-[100dvh] md:h-[90vh] flex flex-col md:flex-row gap-0 rounded-2xl shadow-2xl">
                  <DialogTitle className="sr-only">Image details</DialogTitle>
                  <div className="flex-1 bg-black/40 relative flex items-center justify-center p-4 md:p-12 overflow-hidden h-[60vh] md:h-full">
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                  <div className="w-full md:w-96 glass p-8 md:p-10 flex flex-col overflow-y-auto shrink-0 border-t md:border-t-0 md:border-l border-white/8">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Details</span>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-full">
                          <X className="w-4 h-4"/>
                        </Button>
                      </DialogTrigger>
                    </div>

                    <div className="flex-1 space-y-7">
                      <div>
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Prompt</h3>
                        <p className="text-base italic text-foreground/80 leading-relaxed">
                          "{img.prompt}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/8">
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

                    <div className="mt-8 flex gap-3 pt-6 border-t border-white/8">
                      <button
                        className="flex-1 glass border border-white/10 hover:border-white/20 text-sm font-medium py-2.5 rounded-xl transition-all duration-200"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = `data:image/png;base64,${img.b64_json}`;
                          a.download = `nandi-${img.id}.png`;
                          a.click();
                        }}
                      >
                        Download
                      </button>
                      <button
                        className="flex-1 bg-red-500/15 border border-red-500/20 hover:bg-red-500/25 text-red-400 text-sm font-medium py-2.5 rounded-xl transition-all duration-200"
                        onClick={() => handleDelete(img.id)}
                      >
                        Delete
                      </button>
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
