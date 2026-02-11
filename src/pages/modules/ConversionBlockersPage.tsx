import { useMemo, useState } from 'react';

import { ModuleHeaderActions } from '@/components/workspace/ModuleHeaderActions';
import {
  Badge,
  ConfidenceRing,
  DataTable,
  EmptyState,
  EvidenceDrawer,
  ScoreDots,
  SectionIntroCard,
} from '@/components/ui';
import type { WorkspaceViewModel } from '@/types';

interface ConversionBlockersPageProps {
  viewModel: WorkspaceViewModel;
}

export function ConversionBlockersPage({ viewModel }: ConversionBlockersPageProps) {
  const [evidenceState, setEvidenceState] = useState<{ open: boolean; title: string; evidenceIds: string[] }>({
    open: false,
    title: '',
    evidenceIds: [],
  });

  const rows = viewModel.conversionBlockers;

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        rank: row.rank,
        relevance: row.relevance,
        statement: row.statement,
        dataPointCount: row.dataPointCount,
        suggestedFix: row.suggestedFix,
        estimatedLift: row.estimatedLift,
        confidence: row.confidence.score,
      })),
    [rows],
  );

  if (viewModel.reviewSummary.analyzedReviewCount === 0) {
    return (
      <div className="space-y-4">
        <SectionIntroCard
          eyebrow="Gaps"
          title="What shoppers don't see, but care about"
          description="Blockers compare recurring concerns against claims and trust signals in your listing."
          actions={
            <ModuleHeaderActions
              moduleName="conversion-blockers"
              viewModel={viewModel}
              rows={exportRows}
              payload={rows}
            />
          }
        />
        <EmptyState
          title="Missing evidence diagnostics"
          description="No reviews were available, so blocker extraction is intentionally disabled. Add review data to avoid fabricated blocker claims."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionIntroCard
        eyebrow="Gaps"
        title="What shoppers don't see, but care about"
        description="Blockers compare recurring review concerns against listing claims, screenshots, and trust-signal availability."
        actions={
          <ModuleHeaderActions
            moduleName="conversion-blockers"
            viewModel={viewModel}
            rows={exportRows}
            payload={rows}
          />
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No blocker pattern detected"
          description="Current listing signals appear aligned with available concerns. Keep monitoring as more reviews accumulate."
        />
      ) : (
        <DataTable
          caption="Conversion blockers table"
          rows={rows}
          rowKey={(row) => row.id}
          initialSortBy="relevance"
          columns={[
            {
              id: 'rank',
              header: 'Rank',
              sortValue: (row) => row.rank,
              cell: (row) => row.rank,
            },
            {
              id: 'relevance',
              header: 'Relevance',
              sortValue: (row) => row.relevance,
              cell: (row) => <ScoreDots value={row.relevance} ariaLabel="Blocker relevance" />,
            },
            {
              id: 'statement',
              header: 'Blocker statement',
              className: 'min-w-[20rem]',
              sortValue: (row) => row.statement,
              cell: (row) => (
                <div>
                  <p>{row.statement}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Fix: {row.suggestedFix}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Estimated lift: {row.estimatedLift}</p>
                </div>
              ),
            },
            {
              id: 'dataPoints',
              header: 'Data points',
              sortValue: (row) => row.dataPointCount,
              cell: (row) => row.dataPointCount,
            },
            {
              id: 'drillIn',
              header: 'Drill-in action',
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <Badge tone={row.confidence.score >= 70 ? 'good' : row.confidence.score >= 45 ? 'warn' : 'bad'}>
                    {row.confidence.score}%
                  </Badge>
                  <ConfidenceRing confidence={row.confidence} />
                  <button
                    type="button"
                    className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-1 text-xs"
                    onClick={() =>
                      setEvidenceState({
                        open: true,
                        title: row.statement,
                        evidenceIds: row.supportingEvidenceIds,
                      })
                    }
                  >
                    View
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <EvidenceDrawer
        open={evidenceState.open}
        title={evidenceState.title}
        evidenceIds={evidenceState.evidenceIds}
        evidenceMap={viewModel.evidenceMap}
        onClose={() => setEvidenceState((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}
