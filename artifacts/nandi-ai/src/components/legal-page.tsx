import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-4">
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">NandiAi policies</p>
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Draft. Confirm the site owner, contact email, and governing jurisdiction before public release.
        </p>
      </header>

      <div className="border border-border bg-card p-4 text-sm leading-relaxed">
        This page is not ready for public release. The operator details and jurisdiction-specific terms still need confirmation.
      </div>

      <div className="space-y-8 text-sm leading-7 text-foreground/90">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-border pt-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
