import React from "react";
import { Link, useLocation } from "wouter";
import { Image, MessageSquare } from "lucide-react";
import logoImg from "@assets/nandi-ai-1777879067042_1779626685766.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Studio", icon: Image },
    { href: "/gallery", label: "Gallery", icon: Image },
    { href: "/chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-indigo-600/6 blur-[100px]" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <img
              src={logoImg}
              alt="NandiAi"
              className="w-10 h-10 rounded-lg object-cover shadow-lg"
            />
            <span className="font-bold text-xl tracking-tight gradient-text">
              NandiAi
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 glass-subtle rounded-full px-2 py-1.5">
            {links.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-white btn-gradient shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  data-testid={`nav-link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-white/5">
        <div className="flex items-center justify-around px-2 py-2">
          {links.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200"
                data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
                  isActive ? "btn-gradient shadow-md" : "text-muted-foreground"
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "gradient-text" : "text-muted-foreground"}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
