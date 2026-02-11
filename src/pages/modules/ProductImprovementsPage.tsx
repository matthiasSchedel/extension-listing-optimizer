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

interface ProductImprovementsPageProps {
  viewModel: WorkspaceViewModel;
}

export function ProductImprovementsPage({ viewModel }: ProductImprovementsPageProps) {
  const [evidenceState, setEvidenceState] = useState<{ open: boolean; title: string; evidenceIds: string[] }>({
    open: false,
    title: '',
    evidenceIds: [],
  });

  const rows = viewModel.productImprovements;
  const hasWeakness = viewModel.strengthsWeaknesses.some((row) => row.classification.includes('Weakness'));

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        rank: row.rank,
        impact: row.impact,
        difficulty: row.difficulty,
        recommendation: row.recommendation,
        linkedWeakness: row.linkedWeaknessLabel,
        expectedOutcome: row.expectedOutcome,
        confidence: row.confidence.score,
      })),
    [rows],
  );

  return (
    <div className="space-y-4">
      <SectionIntroCard
        eyebrow="Prioritization"
        title="How to build a better product"
        description="Recommendations are ranked by weakness severity, evidence density, implementation effort, and expected conversion uplift."
        actions={
          <ModuleHeaderActions
            moduleName="product-improvements"
            viewModel={viewModel}
            rows={exportRows}
            payload={rows}
          />
        }
      />

      {!hasWeakness ? (
        <section className="rounded-[var(--radius-md)] border border-[color:var(--info-border)] bg-[color:var(--info-bg)] p-3 text-sm text-[color:var(--info-text)]">
          No primary weaknesses were detected. This list focuses on optimization opportunities to improve upside.
        </section>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No prioritized actions available"
          description="Recommendations will appear once the model detects stable evidence clusters."
        />
      ) : (
        <DataTable
          caption="Product improvements table"
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
              id: 'impact',
              header: 'Impact',
              sortValue: (row) => row.impact,
              cell: (row) => <ScoreDots value={row.impact} ariaLabel="Improvement impact" />,
            },
            {
              id: 'difficulty',
              header: 'Difficulty',
              sortValue: (row) => row.difficulty,
              cell: (row) => <Badge tone={toneByDifficulty(row.difficulty)}>{row.difficulty}</Badge>,
            },
            {
              id: 'recommendation',
              header: 'Improvement recommendation',
              className: 'min-w-[19rem]',
              sortValue: (row) => row.recommendation,
              cell: (row) => (
                <div>
                  <p>{row.recommendation}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Outcome: {row.expectedOutcome}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Rationale: {row.rationale}</p>
                </div>
              ),
            },
            {
              id: 'linked',
              header: 'Linked weakness',
              sortValue: (row) => row.linkedWeaknessLabel,
              cell: (row) => row.linkedWeaknessLabel,
            },
            {
              id: 'action',
              header: 'Row action',
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <ConfidenceRing confidence={row.confidence} />
                  <button
                    type="button"
                    className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-1 text-xs"
                    onClick={() =>
                      setEvidenceState({
                        open: true,
                        title: row.recommendation,
                        evidenceIds: row.supportingEvidenceIds,
                      })
                    }
                  >
                    Evidence
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

function toneByDifficulty(difficulty: 'Low' | 'Medium' | 'High'): 'good' | 'warn' | 'bad' {
  if (difficulty === 'Low') {
    return 'good';
  }
  if (difficulty === 'Medium') {
    return 'warn';
  }
  return 'bad';
}
