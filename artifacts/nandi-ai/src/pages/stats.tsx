import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageStats, LOCAL_STATS_QUERY_KEY } from "@workspace/local-store";

export default function Stats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: LOCAL_STATS_QUERY_KEY,
    queryFn: getImageStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-10 pt-6">
        <div className="pb-6">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3">
            Image activity
          </h1>
          <p className="text-muted-foreground text-base max-w-md">
            Counts from images saved in this browser.
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
      label: "Saved images",
      value: stats?.totalGenerated ?? 0,
      description: "Images stored in this browser",
    },
    {
      label: "Created today",
      value: stats?.todayGenerated ?? 0,
      description: "Images created today in this browser",
    },
    {
      label: "Styles used",
      value: stats?.popularStyles?.length ?? 0,
      description: "Distinct styles in saved images",
    },
  ];

  return (
    <div className="space-y-14 pt-6 pb-20">
      <div className="pb-6">
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">
          Image activity
        </h1>
        <p className="text-muted-foreground text-base max-w-md">
          Counts reflect images saved in this browser.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="border border-border bg-card p-6"
          >
              <h3 className="text-sm font-medium text-muted-foreground mb-5">
                {card.label}
              </h3>
              <p className="text-5xl font-semibold tracking-tight leading-none mb-3 text-foreground">
                {card.value}
              </p>
              <p className="text-sm text-muted-foreground">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold mb-6">Style distribution</h2>

        <div className="glass rounded-sm border border-border p-6">
          {!stats?.popularStyles || stats.popularStyles.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
              No saved images with styles yet.
            </p>
          ) : (
            <div className="space-y-5">
              {stats.popularStyles.map((item) => {
                const percentage = stats.totalGenerated > 0 ? (item.count / stats.totalGenerated) * 100 : 0;
                return (
                  <div key={item.style} className="flex flex-col gap-2.5">
                    <div className="flex items-end justify-between">
                      <div className="font-medium text-sm text-foreground/90">{item.style || "Unstyled"}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {item.count} <span className="opacity-50">({percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        role="progressbar"
                        aria-label={`${item.style || "Unstyled"} share of saved images`}
                        aria-valuenow={Math.round(percentage)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        style={{
                          width: `${percentage}%`,
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
