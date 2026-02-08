interface LoadingStateProps {
  steps: string[];
  activeStepIndex: number;
}

export function LoadingState({ steps, activeStepIndex }: LoadingStateProps) {
  return (
    <section className="card rise-in p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-ocean border-t-transparent" />
        <h2 className="font-display text-lg">Running analysis</h2>
      </div>
      <ol className="space-y-2" aria-label="Analysis progress">
        {steps.map((step, index) => {
          const complete = index < activeStepIndex;
          const active = index === activeStepIndex;

          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                  complete
                    ? 'border-mint bg-mint text-white'
                    : active
                      ? 'border-ocean bg-ocean text-white'
                      : 'border-black/15 bg-white text-black/60 dark:border-white/20 dark:bg-slate-900 dark:text-white/60'
                }`}
              >
                {complete ? '✓' : index + 1}
              </span>
              <span className={active ? 'font-semibold' : ''}>{step}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
