import { useGetImageStats, getGetImageStatsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: stats, isLoading } = useGetImageStats({ query: { queryKey: getGetImageStatsQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-12 pt-6">
        <div className="border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Metrics</h1>
          <p className="text-muted-foreground text-lg font-light tracking-wide max-w-md">
            Analyzing operational data...
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full bg-secondary/50 rounded-none" />
          <Skeleton className="h-40 w-full bg-secondary/50 rounded-none" />
          <Skeleton className="h-40 w-full bg-secondary/50 rounded-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pt-6 pb-20">
      <div className="border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Metrics</h1>
        <p className="text-muted-foreground text-lg font-light tracking-wide max-w-md">
          Performance data and stylistic preferences from your creative sessions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-8 border border-border bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <div className="w-16 h-16 border-2 border-foreground" />
          </div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Total Generations</h3>
          <p className="text-6xl font-serif font-light tracking-tight">{stats?.totalGenerated || 0}</p>
        </div>
        
        <div className="p-8 border border-border bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <div className="w-16 h-16 border-2 border-primary rounded-full" />
          </div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Generated Today</h3>
          <p className="text-6xl font-serif font-light tracking-tight text-primary">{stats?.todayGenerated || 0}</p>
        </div>
        
        <div className="p-8 border border-border bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <div className="w-16 h-16 border-b-2 border-r-2 border-foreground transform rotate-45 translate-x-4 -translate-y-4" />
          </div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Active Styles</h3>
          <p className="text-6xl font-serif font-light tracking-tight">{stats?.popularStyles?.length || 0}</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif">Style Distribution</h2>
        </div>
        
        <div className="p-8 border border-border bg-white">
          {!stats?.popularStyles || stats.popularStyles.length === 0 ? (
            <p className="text-muted-foreground text-center py-12 font-serif italic">Insufficient data for distribution analysis.</p>
          ) : (
            <div className="space-y-6">
              {stats.popularStyles.map((item, index) => {
                const percentage = stats.totalGenerated > 0 ? (item.count / stats.totalGenerated) * 100 : 0;
                return (
                  <div key={item.style} className="flex flex-col gap-2">
                    <div className="flex items-end justify-between">
                      <div className="font-medium text-sm">{item.style || "Unstyled"}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {item.count} <span className="opacity-50">({percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-secondary relative overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${Math.max(2, percentage)}%`, transitionDelay: `${index * 100}ms` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
