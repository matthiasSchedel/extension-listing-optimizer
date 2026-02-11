import { useMemo, useState } from 'react';

import { ModuleHeaderActions } from '@/components/workspace/ModuleHeaderActions';
import {
  Badge,
  ConfidenceRing,
  DataTable,
  EmptyState,
  EvidenceDrawer,
  KpiCard,
  SectionIntroCard,
} from '@/components/ui';
import type { WorkspaceViewModel } from '@/types';

interface ReviewInsightsPageProps {
  viewModel: WorkspaceViewModel;
}

export function ReviewInsightsPage({ viewModel }: ReviewInsightsPageProps) {
  const [evidenceState, setEvidenceState] = useState<{ open: boolean; title: string; evidenceIds: string[] }>({
    open: false,
    title: '',
    evidenceIds: [],
  });

  const rows = viewModel.reviewInsights;

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        rank: row.rank,
        reviewCount: row.reviewCount,
        aspectCount: row.aspectCount,
        statement: row.statement,
        sentiment: row.sentiment,
        stage: row.stage,
        reliability: row.reliability,
        confidence: row.confidence.score,
      })),
    [rows],
  );

  const totalSentiment =
    viewModel.reviewSummary.sentiment.positive +
    viewModel.reviewSummary.sentiment.neutral +
    viewModel.reviewSummary.sentiment.negative;

  const sentimentSummary = totalSentiment === 0
    ? 'No reviews analyzed yet'
    : `${Math.round((viewModel.reviewSummary.sentiment.positive / totalSentiment) * 100)}% positive`;

  return (
    <div className="space-y-4">
      <SectionIntroCard
        eyebrow="Review Intelligence"
        title="What matters to customers"
        description="Insights are generated from deterministic aspect clustering and linked back to source reviews for auditability."
        actions={
          <ModuleHeaderActions
            moduleName="review-insights"
            viewModel={viewModel}
            rows={exportRows}
            payload={rows}
          />
        }
      />

      <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--text)]">Coverage & Confidence</p>
            <p className="text-sm text-[color:var(--muted)]">
              {viewModel.reviewSummary.analyzedReviewCount} analyzed / {viewModel.reviewSummary.availableReviewEstimate} estimated available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={toneByConfidence(viewModel.reviewSummary.confidence.score)}>
              {viewModel.reviewSummary.confidence.label}
            </Badge>
            <ConfidenceRing confidence={viewModel.reviewSummary.confidence} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <KpiCard
          label="Statistical Confidence"
          value={`${viewModel.reviewSummary.confidence.score}%`}
          detail={viewModel.reviewSummary.confidence.drivers[0]}
          tone={toneByConfidenceCard(viewModel.reviewSummary.confidence.score)}
        />
        <KpiCard
          label="Processing Flow"
          value={viewModel.reviewSummary.processingSummary}
          detail="reviews -> aspects -> insights"
        />
        <KpiCard
          label="Sentiment Summary"
          value={sentimentSummary}
          detail={`${viewModel.reviewSummary.sentiment.negative} negative signals`}
          tone={viewModel.reviewSummary.sentiment.negative > viewModel.reviewSummary.sentiment.positive ? 'bad' : 'good'}
        />
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="Not enough review evidence"
          description="This module needs review text to generate ranked customer insights. Analyze a listing with public reviews or collect more feedback."
        />
      ) : (
        <DataTable
          caption="Customer insights table"
          rows={rows}
          rowKey={(row) => row.id}
          initialSortBy="reliability"
          columns={[
            {
              id: 'rank',
              header: 'Rank',
              sortValue: (row) => row.rank,
              cell: (row) => row.rank,
            },
            {
              id: 'reviewCount',
              header: 'Review count',
              sortValue: (row) => row.reviewCount,
              cell: (row) => row.reviewCount,
            },
            {
              id: 'aspectCount',
              header: 'Review aspects count',
              sortValue: (row) => row.aspectCount,
              cell: (row) => row.aspectCount,
            },
            {
              id: 'statement',
              header: 'Customer insight statement',
              sortValue: (row) => row.statement,
              className: 'min-w-[18rem]',
              cell: (row) => row.statement,
            },
            {
              id: 'sentiment',
              header: 'Sentiment',
              sortValue: (row) => row.sentiment,
              cell: (row) => <Badge tone={toneForSentiment(row.sentiment)}>{row.sentiment}</Badge>,
            },
            {
              id: 'stage',
              header: 'Customer journey stage',
              sortValue: (row) => row.stage,
              cell: (row) => row.stage,
            },
            {
              id: 'reliability',
              header: 'Data reliability',
              sortValue: (row) => row.reliability,
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <span>{row.reliability}%</span>
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
                    Drill-in
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

function toneForSentiment(sentiment: 'positive' | 'neutral' | 'negative'): 'good' | 'warn' | 'bad' {
  if (sentiment === 'positive') {
    return 'good';
  }
  if (sentiment === 'negative') {
    return 'bad';
  }
  return 'warn';
}

function toneByConfidence(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 75) {
    return 'good';
  }
  if (score >= 45) {
    return 'warn';
  }
  return 'bad';
}

function toneByConfidenceCard(score: number): 'neutral' | 'good' | 'warn' | 'bad' {
  if (score >= 75) {
    return 'good';
  }
  if (score >= 45) {
    return 'warn';
  }
  return 'bad';
}
