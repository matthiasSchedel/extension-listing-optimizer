import type { PropsWithChildren } from 'react';

interface BadgeProps {
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'info';
  compact?: boolean;
}

export function Badge({ tone = 'default', compact = false, children }: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        compact ? 'px-2 py-0.5' : ''
      } ${toneClass(tone)}`}
    >
      {children}
    </span>
  );
}

export const Pill = Badge;

function toneClass(tone: NonNullable<BadgeProps['tone']>): string {
  if (tone === 'good') {
    return 'border-[color:var(--good-border)] bg-[color:var(--good-bg)] text-[color:var(--good-text)]';
  }
  if (tone === 'warn') {
    return 'border-[color:var(--warn-border)] bg-[color:var(--warn-bg)] text-[color:var(--warn-text)]';
  }
  if (tone === 'bad') {
    return 'border-[color:var(--bad-border)] bg-[color:var(--bad-bg)] text-[color:var(--bad-text)]';
  }
  if (tone === 'info') {
    return 'border-[color:var(--info-border)] bg-[color:var(--info-bg)] text-[color:var(--info-text)]';
  }
  return 'border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--text)]';
}
