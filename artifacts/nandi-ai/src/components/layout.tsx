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
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="NandiAi"
              className="w-9 h-9 rounded-sm object-cover"
            />
            <span className="font-bold text-xl tracking-tight text-foreground">
              NandiAi
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex h-full items-center gap-6">
            {links.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`h-full border-b-2 pt-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
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

      <footer className="border-t border-border bg-background px-4 py-5 pb-24 md:px-6 md:pb-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} NandiAi</span>
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/privacy-policy" className="underline-offset-4 hover:text-foreground hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
              Terms and Conditions
            </Link>
          </nav>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background">
        <div className="flex items-center justify-around px-2 py-2">
          {links.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
                data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
              >
                <div className={`w-8 h-8 flex items-center justify-center border-b-2 ${
                  isActive ? "border-primary text-primary" : "border-transparent"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-foreground" : ""}`}>
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
