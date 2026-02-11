import { scoreToLabel } from '@/utils/scoring';
import type { WorkspaceViewModel } from '@/types';

import { KpiCard } from '@/components/ui/KpiCard';

interface ProductHeroProps {
  viewModel: WorkspaceViewModel;
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Unknown update date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export function ProductHero({ viewModel }: ProductHeroProps) {
  const extension = viewModel.extension;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]">
              {extension.icon ? (
                <img src={extension.icon} alt="Extension icon" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold text-[color:var(--text)]">{extension.name}</h1>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {extension.category ?? 'Uncategorized'} · {extension.installs ?? 'Unknown installs'}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Updated {formatDate(extension.lastUpdated)} · Version {extension.version ?? 'n/a'}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
            {extension.shortDescription || extension.description}
          </p>
        </div>

        <div className="grid min-w-[14rem] grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          <KpiCard label="Overall" value={`${viewModel.scores.overall}/100`} detail={scoreToLabel(viewModel.scores.overall)} />
          <KpiCard label="Grade" value={viewModel.scores.grade} />
          <KpiCard
            label="Reviews"
            value={viewModel.reviewSummary.analyzedReviewCount}
            detail={`Confidence ${viewModel.reviewSummary.confidence.score}%`}
          />
          <KpiCard label="Rating" value={extension.rating ? extension.rating.toFixed(1) : 'n/a'} />
        </div>
      </div>
    </section>
  );
}
