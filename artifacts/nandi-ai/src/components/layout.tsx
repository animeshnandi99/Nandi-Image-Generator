import { Link, useLocation } from "wouter";
import { Sparkles, Grid, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row w-full dark">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-card/40 backdrop-blur-md flex-shrink-0 flex flex-col z-10 relative">
        <div className="p-6 md:p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            NandiAi
          </span>
        </div>

        <div className="flex flex-row md:flex-col gap-2 px-4 md:px-6 pb-4 md:pb-0 overflow-x-auto">
          <NavItem
            href="/"
            icon={<Sparkles className="w-5 h-5" />}
            label="Studio"
            active={location === "/"}
          />
          <NavItem
            href="/gallery"
            icon={<Grid className="w-5 h-5" />}
            label="Gallery"
            active={location === "/gallery"}
          />
          <NavItem
            href="/stats"
            icon={<BarChart3 className="w-5 h-5" />}
            label="Stats"
            active={location === "/stats"}
          />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-x-hidden min-w-0">
        {/* Decorative background noise/gradients */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-blue-500/5 rounded-full blur-[120px] mix-blend-screen" />
        </div>
        
        <div className="relative z-10 w-full h-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
      "hover:bg-white/5",
      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
    )}>
      <div className={cn("transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
      <span className="hidden md:block">{label}</span>
      <span className="md:hidden text-sm">{label}</span>
    </Link>
  );
}
