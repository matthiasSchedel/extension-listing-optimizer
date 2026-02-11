interface ScoreDotsProps {
  value: number;
  max?: number;
  ariaLabel?: string;
}

export function ScoreDots({ value, max = 5, ariaLabel = 'Score' }: ScoreDotsProps) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${ariaLabel}: ${value}/${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const active = index < value;
        return (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full border ${
              active
                ? 'border-[color:var(--text)] bg-[color:var(--text)]'
                : 'border-[color:var(--border)] bg-transparent'
            }`}
          />
        );
      })}
    </span>
  );
}
