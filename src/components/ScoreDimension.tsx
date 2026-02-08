import type { DimensionScore } from '@/types';

interface ScoreDimensionProps {
  label: string;
  data: DimensionScore;
}

export function ScoreDimension({ label, data }: ScoreDimensionProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
        <span>{label}</span>
        <span>{data.issues.length} issues</span>
      </div>
      <p className="mt-1 text-2xl font-display">{data.score}</p>
      <div className="mt-2 h-2 rounded-full bg-black/10 dark:bg-white/10" aria-label={`${label} score ${data.score} out of 100`}>
        <div
          className="h-2 rounded-full bg-ocean"
          style={{ width: `${Math.max(6, data.score)}%` }}
        />
      </div>
    </div>
  );
}
