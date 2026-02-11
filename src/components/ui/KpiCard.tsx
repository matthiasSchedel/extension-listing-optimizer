import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}

export function KpiCard({ label, value, detail, tone = 'neutral' }: KpiCardProps) {
  return (
    <article
      className={`rounded-[var(--radius-md)] border bg-[color:var(--surface)] p-3 ${toneBorder(
        tone,
      )}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[color:var(--text)]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[color:var(--muted)]">{detail}</p> : null}
    </article>
  );
}

function toneBorder(tone: NonNullable<KpiCardProps['tone']>) {
  if (tone === 'good') {
    return 'border-[color:var(--good-border)]';
  }
  if (tone === 'warn') {
    return 'border-[color:var(--warn-border)]';
  }
  if (tone === 'bad') {
    return 'border-[color:var(--bad-border)]';
  }
  return 'border-[color:var(--border)]';
}
