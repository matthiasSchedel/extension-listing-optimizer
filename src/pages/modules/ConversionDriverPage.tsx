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

interface ConversionDriverPageProps {
  viewModel: WorkspaceViewModel;
}

export function ConversionDriverPage({ viewModel }: ConversionDriverPageProps) {
  const [evidenceState, setEvidenceState] = useState<{ open: boolean; title: string; evidenceIds: string[] }>({
    open: false,
    title: '',
    evidenceIds: [],
  });

  const rows = viewModel.conversionDrivers;

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        rank: row.rank,
        relevance: row.relevance,
        statement: row.statement,
        journeyStage: row.journeyStage,
        dataPointCount: row.dataPointCount,
        confidence: row.confidence.score,
      })),
    [rows],
  );

  const uncertain = rows.length < 5 && viewModel.reviewSummary.analyzedReviewCount < 20;

  return (
    <div className="space-y-4">
      <SectionIntroCard
        eyebrow="Conversion"
        title="What makes people buy"
        description="Drivers blend review sentiment, frequency, and listing alignment. Rankings are conservative when evidence coverage is thin."
        actions={
          <ModuleHeaderActions
            moduleName="conversion-driver"
            viewModel={viewModel}
            rows={exportRows}
            payload={rows}
          />
        }
      />

      {uncertain ? (
        <section className="rounded-[var(--radius-md)] border border-[color:var(--warn-border)] bg-[color:var(--warn-bg)] p-3 text-sm text-[color:var(--warn-text)]">
          Confidence is limited: fewer than 20 reviews were analyzed, so relevance ranks should be treated as directional.
        </section>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No reliable drivers yet"
          description="There is not enough positive/neutral evidence to produce conversion drivers without fake precision."
        />
      ) : (
        <DataTable
          caption="Conversion driver table"
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
              cell: (row) => <ScoreDots value={row.relevance} ariaLabel="Driver relevance" />,
            },
            {
              id: 'statement',
              header: 'Driver statement',
              className: 'min-w-[18rem]',
              sortValue: (row) => row.statement,
              cell: (row) => (
                <div>
                  <p>{row.statement}</p>
                  {row.counterSignals?.length ? (
                    <p className="mt-1 text-xs text-[color:var(--muted)]">Counter signal: {row.counterSignals[0]}</p>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'stage',
              header: 'Customer journey',
              sortValue: (row) => row.journeyStage,
              cell: (row) => row.journeyStage,
            },
            {
              id: 'dataPointCount',
              header: 'Data points count',
              sortValue: (row) => row.dataPointCount,
              cell: (row) => row.dataPointCount,
            },
            {
              id: 'drillIn',
              header: 'Drill-in',
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
                        evidenceIds: row.evidenceIds,
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
