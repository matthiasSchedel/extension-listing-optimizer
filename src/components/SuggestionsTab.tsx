import type { AnalyzeResponse } from '@/types';

interface SuggestionsTabProps {
  data: AnalyzeResponse;
}

function priorityClass(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') {
    return 'bg-red-100 text-red-700';
  }
  if (priority === 'medium') {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-sky-100 text-sky-700';
}

export function SuggestionsTab({ data }: SuggestionsTabProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h3 className="mb-2 font-display text-lg">Top 5 Improvements</h3>
        <ul className="space-y-3">
          {data.suggestions.topImprovements.map((item) => (
            <li key={item.title} className="rounded-lg border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2">
                <p className="font-semibold">{item.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClass(item.priority)}`}>
                  {item.priority}
                </span>
              </div>
              <p className="text-sm text-black/70 dark:text-white/70">{item.userImpact}</p>
              <p className="mt-1 text-xs italic text-black/60 dark:text-white/60">Evidence: {item.evidence}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h3 className="mb-2 font-display text-lg">Competitive Insights</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {data.suggestions.competitiveInsights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
