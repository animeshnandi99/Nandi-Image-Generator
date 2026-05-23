import { useGetImageStats, getGetImageStatsQueryKey } from "@workspace/api-client-react";
import { Layers, Activity, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: stats, isLoading } = useGetImageStats({ query: { queryKey: getGetImageStatsQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Metrics</h1>
          <p className="text-muted-foreground">Quantifying imagination...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Metrics</h1>
        <p className="text-muted-foreground">Data from your creative sessions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Generations"
          value={stats?.totalGenerated || 0}
          icon={<Layers className="w-5 h-5 text-primary" />}
          delay={0}
        />
        <StatCard
          title="Generated Today"
          value={stats?.todayGenerated || 0}
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          delay={100}
        />
        <StatCard
          title="Active Styles"
          value={stats?.popularStyles?.length || 0}
          icon={<Sparkles className="w-5 h-5 text-pink-400" />}
          delay={200}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-both">
        <Card className="glass-panel overflow-hidden border-white/10 bg-black/20">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Style Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!stats?.popularStyles || stats.popularStyles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Not enough data yet.</p>
            ) : (
              <div className="space-y-6">
                {stats.popularStyles.map((item, index) => (
                  <div key={item.style} className="flex items-center">
                    <div className="w-[120px] font-medium truncate pr-4">{item.style || "Unstyled"}</div>
                    <div className="flex-1 relative h-4 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary/70 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.max(10, (item.count / stats.totalGenerated) * 100)}%`, transitionDelay: `${index * 200}ms` }}
                      />
                    </div>
                    <div className="w-[60px] text-right text-sm text-muted-foreground font-mono">
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, delay }: { title: string; value: number; icon: React.ReactNode; delay: number }) {
  return (
    <Card 
      className="glass-panel border-white/10 bg-gradient-to-br from-white/5 to-transparent animate-in fade-in zoom-in duration-500 fill-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
