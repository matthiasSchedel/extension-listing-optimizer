import { useMemo, useState } from 'react';

import { ModuleHeaderActions } from '@/components/workspace/ModuleHeaderActions';
import {
  Badge,
  ConfidenceRing,
  DataTable,
  EmptyState,
  EvidenceDrawer,
  MetricBar,
  SectionIntroCard,
} from '@/components/ui';
import type { WorkspaceViewModel } from '@/types';

interface StrengthsWeaknessesPageProps {
  viewModel: WorkspaceViewModel;
}

export function StrengthsWeaknessesPage({ viewModel }: StrengthsWeaknessesPageProps) {
  const [evidenceState, setEvidenceState] = useState<{ open: boolean; title: string; evidenceIds: string[] }>({
    open: false,
    title: '',
    evidenceIds: [],
  });

  const rows = viewModel.strengthsWeaknesses;

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        rank: row.rank,
        reviewCount: row.reviewCount,
        insight: row.insight,
        positiveRatio: row.positiveRatio,
        negativeRatio: row.negativeRatio,
        classification: row.classification,
        dataPointCount: row.dataPointCount,
        confidence: row.confidence.score,
      })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <SectionIntroCard
        eyebrow="Market Fit"
        title="What customers love/dislike"
        description="Strengths and weaknesses are classified from shared review clusters with confidence-aware thresholds."
        actions={
          <ModuleHeaderActions
            moduleName="strengths-weaknesses"
            viewModel={viewModel}
            rows={exportRows}
            payload={{ rows, marketFit: viewModel.marketFit }}
          />
        }
      />

      <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <div className="grid gap-3 md:grid-cols-3 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Market Fit Score</p>
            <p className="text-3xl font-semibold text-[color:var(--text)]">{viewModel.marketFit.score}</p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{viewModel.marketFit.summary}</p>
          </div>
          <div className="md:col-span-2 space-y-2">
            <MetricBar value={viewModel.marketFit.score} label="Confidence-weighted sentiment score" />
            <div className="flex items-center gap-2">
              <ConfidenceRing confidence={viewModel.marketFit.confidence} />
              <span className="text-sm text-[color:var(--muted)]">{viewModel.marketFit.confidence.label}</span>
            </div>
            {viewModel.marketFit.topStrength ? (
              <p className="text-sm text-[color:var(--muted)]">
                Top strength: <span className="text-[color:var(--text)]">{viewModel.marketFit.topStrength}</span>
              </p>
            ) : null}
            {viewModel.marketFit.topWeakness ? (
              <p className="text-sm text-[color:var(--muted)]">
                Top weakness: <span className="text-[color:var(--text)]">{viewModel.marketFit.topWeakness}</span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No sentiment clusters available"
          description="This module requires review evidence to classify strengths and weaknesses."
        />
      ) : (
        <DataTable
          caption="Strengths and weaknesses table"
          rows={rows}
          rowKey={(row) => row.id}
          initialSortBy="rank"
          columns={[
            {
              id: 'rank',
              header: 'Rank',
              sortValue: (row) => row.rank,
              cell: (row) => row.rank,
            },
            {
              id: 'reviewCount',
              header: 'Reviews',
              sortValue: (row) => row.reviewCount,
              cell: (row) => row.reviewCount,
            },
            {
              id: 'insight',
              header: 'Product insight',
              className: 'min-w-[18rem]',
              sortValue: (row) => row.insight,
              cell: (row) => row.insight,
            },
            {
              id: 'ratio',
              header: 'Sentiment ratio',
              sortValue: (row) => row.positiveRatio - row.negativeRatio,
              cell: (row) => `${Math.round(row.positiveRatio * 100)}% / ${Math.round(row.negativeRatio * 100)}%`,
            },
            {
              id: 'classification',
              header: 'Classification',
              sortValue: (row) => row.classification,
              cell: (row) => <Badge tone={toneByClassification(row.classification)}>{row.classification}</Badge>,
            },
            {
              id: 'dataPoints',
              header: 'Data points',
              sortValue: (row) => row.dataPointCount,
              cell: (row) => row.dataPointCount,
            },
            {
              id: 'drillIn',
              header: 'Row drill-in',
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <ConfidenceRing confidence={row.confidence} />
                  <button
                    type="button"
                    className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-1 text-xs"
                    onClick={() =>
                      setEvidenceState({
                        open: true,
                        title: row.insight,
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

function toneByClassification(classification: string): 'good' | 'warn' | 'bad' | 'default' {
  if (classification.includes('Strength')) {
    return 'good';
  }
  if (classification.includes('Weakness')) {
    return 'bad';
  }
  return 'warn';
}
