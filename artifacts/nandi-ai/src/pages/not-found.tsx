import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center">
      <div className="max-w-md text-center space-y-6 p-8 border border-border bg-white">
        <div className="text-6xl font-serif italic text-primary">404</div>
        <h1 className="text-2xl font-medium uppercase tracking-widest font-mono">Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you requested could not be found.
        </p>
        <div className="pt-4 border-t border-border">
          <Link 
            href="/"
            className="inline-block text-xs font-mono uppercase tracking-widest hover:text-primary transition-colors"
          >
            Return to Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
