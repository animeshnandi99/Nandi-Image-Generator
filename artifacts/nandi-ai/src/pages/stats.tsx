import { useGetImageStats, getGetImageStatsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Stats() {
  const { data: stats, isLoading } = useGetImageStats({ query: { queryKey: getGetImageStatsQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-10 pt-6">
        <div className="pb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Stats</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-md">
            Analyzing your creative data...
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 w-full bg-secondary/50 rounded-2xl" />
          <Skeleton className="h-44 w-full bg-secondary/50 rounded-2xl" />
          <Skeleton className="h-44 w-full bg-secondary/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      label: "Total Generations",
      value: stats?.totalGenerated ?? 0,
      description: "All-time artworks created",
      accent: "from-purple-500/20 to-violet-500/10",
      glow: "shadow-purple-500/20",
    },
    {
      label: "Generated Today",
      value: stats?.todayGenerated ?? 0,
      description: "Artworks created today",
      accent: "from-indigo-500/20 to-blue-500/10",
      glow: "shadow-indigo-500/20",
      highlight: true,
    },
    {
      label: "Active Styles",
      value: stats?.popularStyles?.length ?? 0,
      description: "Distinct styles used",
      accent: "from-violet-500/20 to-fuchsia-500/10",
      glow: "shadow-violet-500/20",
    },
  ];

  return (
    <div className="space-y-14 pt-6 pb-20">
      <div className="pb-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="gradient-text">Stats</span>
        </h1>
        <p className="text-muted-foreground text-lg font-light max-w-md">
          Your creative activity and style preferences at a glance.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "relative p-8 rounded-2xl glass border border-white/8 overflow-hidden group",
              "hover:border-white/12 transition-all duration-300",
              `hover:shadow-xl ${card.glow}`
            )}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none rounded-2xl",
              card.accent
            )} />
            <div className="relative z-10">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-5">
                {card.label}
              </h3>
              <p className={cn(
                "text-6xl font-bold tracking-tight leading-none mb-3",
                card.highlight ? "gradient-text" : "text-foreground"
              )}>
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold mb-6">
          <span className="gradient-text">Style Distribution</span>
        </h2>
        
        <div className="glass rounded-2xl border border-white/8 p-8">
          {!stats?.popularStyles || stats.popularStyles.length === 0 ? (
            <p className="text-muted-foreground text-center py-12 italic">
              No style data yet. Start creating!
            </p>
          ) : (
            <div className="space-y-5">
              {stats.popularStyles.map((item, index) => {
                const percentage = stats.totalGenerated > 0 ? (item.count / stats.totalGenerated) * 100 : 0;
                return (
                  <div key={item.style} className="flex flex-col gap-2.5">
                    <div className="flex items-end justify-between">
                      <div className="font-medium text-sm text-foreground/90">{item.style || "Unstyled"}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {item.count} <span className="opacity-50">({percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.max(2, percentage)}%`,
                          transitionDelay: `${index * 100}ms`,
                          animation: `bar-enter 1s ${index * 100}ms ease-out both`
                        }}
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
