interface MetricBarProps {
  value: number;
  max?: number;
  label?: string;
}

export function MetricBar({ value, max = 100, label }: MetricBarProps) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      {label ? <p className="mb-1 text-xs text-[color:var(--muted)]">{label}</p> : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-soft)]">
        <div
          className="h-full rounded-full bg-[color:var(--text)] transition-all"
          style={{ width: `${Math.max(2, width)}%` }}
        />
      </div>
    </div>
  );
}
