import type { ConfidenceScore } from '@/types';

interface ConfidenceRingProps {
  confidence: ConfidenceScore;
  size?: number;
}

export function ConfidenceRing({ confidence, size = 44 }: ConfidenceRingProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, confidence.score));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="inline-flex items-center gap-2" title={confidence.drivers.join(' | ')}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={confidence.label}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor(confidence.level)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs text-[color:var(--muted)]">{confidence.score}%</span>
    </div>
  );
}

function ringColor(level: ConfidenceScore['level']): string {
  if (level === 'high') {
    return 'var(--good)';
  }
  if (level === 'medium') {
    return 'var(--warn)';
  }
  return 'var(--bad)';
}
