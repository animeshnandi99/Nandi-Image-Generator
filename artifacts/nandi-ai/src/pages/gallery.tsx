import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import {
  getAllImages,
  deleteImage,
  getImageMimeType,
  LOCAL_IMAGES_QUERY_KEY,
  LOCAL_STATS_QUERY_KEY,
} from "@workspace/local-store";

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
            Gallery
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-md">
            Loading images saved in this browser.
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
          <h1 className="text-3xl md:text-4xl font-semibold mb-3">
            Gallery
          </h1>
          <p className="text-muted-foreground text-base max-w-md">
            Images saved in this browser.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {images?.length || 0} saved {images?.length === 1 ? "image" : "images"}
        </div>
      </div>

      {!images || images.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center glass rounded-2xl p-12 text-center border border-dashed border-white/10">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-primary/40 flex items-center justify-center mb-6">
            <ImageIcon className="w-9 h-9 text-primary/60" />
          </div>
          <p className="text-xl font-semibold mb-2">No artworks yet</p>
          <p className="text-muted-foreground text-sm mb-8">Create an image in the Studio to see it here.</p>
          <Link href="/">
            <button className="border border-primary bg-primary text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-sm hover:bg-primary/90">
              Go to Studio
            </button>
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group break-inside-avoid rounded-sm overflow-hidden border border-border bg-card"
            >
              <Dialog>
                <div className="overflow-hidden">
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      aria-label={`View saved image: ${img.prompt}`}
                    >
                      <img
                        src={`data:${getImageMimeType(img)};base64,${img.b64_json}`}
                        alt={img.prompt}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </button>
                  </DialogTrigger>

                  <div className="space-y-3 p-3">
                    <p className="text-sm leading-relaxed line-clamp-3">{img.prompt}</p>
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                      <span className="text-xs text-muted-foreground font-mono">{img.size}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete saved image: ${img.prompt}`}
                        onClick={() => handleDelete(img.id)}
                        data-testid={`btn-delete-${img.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogContent className="max-w-6xl w-full glass border border-border p-0 overflow-hidden h-[100dvh] md:h-[90vh] flex flex-col md:flex-row gap-0 rounded-sm">
                  <DialogTitle className="sr-only">Image details</DialogTitle>
                  <div className="flex-1 bg-neutral-100 relative flex items-center justify-center p-4 md:p-12 overflow-hidden h-[60vh] md:h-full">
                    <img
                      src={`data:${getImageMimeType(img)};base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="w-full md:w-96 bg-card p-8 md:p-10 flex flex-col overflow-y-auto shrink-0 border-t md:border-t-0 md:border-l border-border">
                    <div className="flex items-center justify-between mb-8">
                       <span className="text-xs font-medium text-muted-foreground">Details</span>
                      <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" aria-label="Close image details" className="h-8 w-8 -mr-2 rounded-sm text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4"/>
                        </Button>
                      </DialogTrigger>
                    </div>

                    <div className="flex-1 space-y-7">
                      <div>
                         <h3 className="text-xs font-medium text-muted-foreground mb-3">Prompt</h3>
                         <p className="text-base text-foreground leading-relaxed">
                          "{img.prompt}"
                        </p>
                      </div>

                       <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border">
                        <div>
                           <h3 className="text-xs font-medium text-muted-foreground mb-2">Dimensions</h3>
                          <p className="text-sm font-medium">{img.size}</p>
                        </div>
                        {img.style && (
                          <div>
                             <h3 className="text-xs font-medium text-muted-foreground mb-2">Style</h3>
                            <p className="text-sm font-medium">{img.style}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                           <h3 className="text-xs font-medium text-muted-foreground mb-2">Created</h3>
                          <p className="text-sm font-medium">{new Date(img.createdAt).toLocaleString(undefined, {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}</p>
                        </div>
                      </div>
                    </div>

                     <div className="mt-8 flex gap-3 pt-6 border-t border-border">
                      <button
                         className="flex-1 glass border border-border hover:border-primary text-sm font-medium py-2.5 rounded-sm"
                        onClick={() => {
                          const a = document.createElement('a');
                          const mimeType = getImageMimeType(img);
                          const extension = mimeType.split("/")[1] === "jpeg"
                            ? "jpg"
                            : mimeType.split("/")[1];
                          a.href = `data:${mimeType};base64,${img.b64_json}`;
                          a.download = `nandi-${img.id}.${extension}`;
                          a.click();
                        }}
                      >
                        Download
                      </button>
                      <button
                         className="flex-1 bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 text-destructive text-sm font-medium py-2.5 rounded-sm"
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
