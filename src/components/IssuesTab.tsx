import type { AnalyzeResponse, AnalysisIssue } from '@/types';
import { severityClasses } from '@/utils/scoring';

interface IssuesTabProps {
  data: AnalyzeResponse;
}

export function IssuesTab({ data }: IssuesTabProps) {
  const issues: AnalysisIssue[] = [
    ...data.scores.completeness.issues,
    ...data.scores.seo.issues,
    ...data.scores.socialProof.issues,
    ...data.scores.trust.issues
  ].sort((a, b) => b.impact - a.impact);

  if (issues.length === 0) {
    return <p className="text-sm">No issues detected. Listing quality is strong.</p>;
  }

  return (
    <ul className="space-y-3">
      {issues.map((item) => (
        <li key={item.id} className="rounded-xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/40">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">{item.title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${severityClasses(item.severity)}`}>
              {item.severity}
            </span>
          </div>
          <p className="text-sm text-black/70 dark:text-white/70">{item.description}</p>
          <p className="mt-2 text-sm"><strong>How to fix:</strong> {item.fix}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Estimated impact: {item.impact}/25</p>
        </li>
      ))}
    </ul>
  );
}
