import type { AnalyzeResponse } from '@/types';
import { CopyButton } from './CopyButton';

interface CopyTabProps {
  data: AnalyzeResponse;
}

export function CopyTab({ data }: CopyTabProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg">Suggested Title</h3>
          <CopyButton value={data.suggestions.title} label="Copy" />
        </div>
        <p className="text-sm">{data.suggestions.title}</p>
      </section>

      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg">Suggested Short Description</h3>
          <CopyButton value={data.suggestions.shortDescription} label="Copy" />
        </div>
        <p className="text-sm">{data.suggestions.shortDescription}</p>
      </section>

      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg">Suggested Full Description</h3>
          <CopyButton value={data.suggestions.fullDescription} label="Copy" />
        </div>
        <pre className="whitespace-pre-wrap text-sm">{data.suggestions.fullDescription}</pre>
      </section>

      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg">Suggested Keywords</h3>
          <CopyButton value={data.suggestions.keywords.join(', ')} label="Copy" />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {data.suggestions.keywords.map((keyword) => (
            <span key={keyword} className="rounded-full border border-black/10 px-3 py-1 dark:border-white/10">{keyword}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
