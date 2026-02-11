import type { ReactNode } from 'react';

interface SectionIntroCardProps {
  eyebrow: string;
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function SectionIntroCard({
  eyebrow,
  icon,
  title,
  description,
  actions,
}: SectionIntroCardProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">{eyebrow}</p>
          <div className="mt-2 flex items-center gap-2">
            {icon ? <span className="text-[color:var(--muted)]">{icon}</span> : null}
            <h1 className="text-xl font-semibold text-[color:var(--text)]">{title}</h1>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
