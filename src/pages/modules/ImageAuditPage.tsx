import { useMemo, useState } from 'react';

import { ModuleHeaderActions } from '@/components/workspace/ModuleHeaderActions';
import {
  Badge,
  ConfidenceRing,
  EmptyState,
  KpiCard,
  MetricBar,
  ScoreDots,
  SectionIntroCard,
} from '@/components/ui';
import type { WorkspaceViewModel } from '@/types';

interface ImageAuditPageProps {
  viewModel: WorkspaceViewModel;
}

export function ImageAuditPage({ viewModel }: ImageAuditPageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const audit = viewModel.imageAudit;

  const selected = audit.diagnostics[selectedIndex] ?? null;

  const exportRows = useMemo(
    () =>
      audit.diagnostics.map((diagnostic) => ({
        imageIndex: diagnostic.imageIndex + 1,
        score: diagnostic.score,
        designQuality: diagnostic.designQuality,
        messageClarity: diagnostic.messageClarity,
        perceivedValue: diagnostic.perceivedValue,
        messageStrength: diagnostic.messageStrength,
        confidence: diagnostic.confidence.score,
      })),
    [audit.diagnostics],
  );

  return (
    <div className="space-y-4">
      <SectionIntroCard
        eyebrow="Creative Diagnostics"
        title="Objective feedback on your images"
        description="Image scoring uses deterministic metadata and narrative-sequencing heuristics. Recommendations reference specific image indices."
        actions={
          <ModuleHeaderActions
            moduleName="image-audit"
            viewModel={viewModel}
            rows={exportRows}
            payload={audit}
          />
        }
      />

      <section className="grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Overall image score</p>
          <p className="text-3xl font-semibold text-[color:var(--text)]">{audit.overallScore}/5</p>
          <div className="mt-2">
            <ScoreDots value={Math.round(audit.overallScore)} ariaLabel="Overall image score" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ConfidenceRing confidence={audit.confidence} />
            <span className="text-sm text-[color:var(--muted)]">{audit.confidence.label}</span>
          </div>
        </div>
        <div className="md:col-span-3 grid gap-2 sm:grid-cols-2">
          <KpiCard label="Design Quality" value={`${audit.designQuality}/5`} />
          <KpiCard label="Message Clarity" value={`${audit.messageClarity}/5`} />
          <KpiCard label="Perceived Value" value={`${audit.perceivedValue}/5`} />
          <KpiCard label="Message Strength" value={`${audit.messageStrength}/5`} />
        </div>
      </section>

      {audit.diagnostics.length === 0 ? (
        <EmptyState
          title="No screenshots to audit"
          description="The image audit falls back to structural recommendations when only partial or missing image metadata exists."
        />
      ) : (
        <>
          <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <p className="mb-2 text-sm font-semibold text-[color:var(--text)]">Image Strip</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {audit.diagnostics.map((diagnostic) => (
                <button
                  key={diagnostic.imageId}
                  type="button"
                  onClick={() => setSelectedIndex(diagnostic.imageIndex)}
                  className={`min-w-[150px] overflow-hidden rounded-[var(--radius-md)] border ${
                    selectedIndex === diagnostic.imageIndex
                      ? 'border-[color:var(--text)]'
                      : 'border-[color:var(--border)]'
                  }`}
                >
                  <img
                    src={diagnostic.asset.url}
                    alt={`Screenshot ${diagnostic.imageIndex + 1}`}
                    className="h-20 w-full object-cover"
                  />
                  <div className="px-2 py-1 text-left text-xs text-[color:var(--muted)]">Image {diagnostic.imageIndex + 1}</div>
                </button>
              ))}
            </div>
          </section>

          {selected ? (
            <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <h2 className="text-base font-semibold text-[color:var(--text)]">Image {selected.imageIndex + 1} diagnostics</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{selected.narrativeRole}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <MetricBar value={selected.designQuality} max={5} label="Design quality" />
                <MetricBar value={selected.messageClarity} max={5} label="Message clarity" />
                <MetricBar value={selected.perceivedValue} max={5} label="Perceived value" />
                <MetricBar value={selected.messageStrength} max={5} label="Message strength" />
              </div>
              {selected.notes.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm text-[color:var(--muted)]">
                  {selected.notes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <h2 className="text-base font-semibold text-[color:var(--text)]">Recommended fixes</h2>
          <ul className="mt-3 space-y-2">
            {audit.recommendations.map((recommendation) => (
              <li key={recommendation.id} className="rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-[color:var(--text)]">{recommendation.statement}</p>
                  <Badge tone={recommendation.confidence.score >= 70 ? 'good' : recommendation.confidence.score >= 45 ? 'warn' : 'bad'}>
                    {recommendation.confidence.label}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <h2 className="text-base font-semibold text-[color:var(--text)]">Why you got this score</h2>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            {audit.rationale.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
          {audit.missingFrames.length > 0 ? (
            <div className="mt-3 rounded-[var(--radius-md)] border border-[color:var(--warn-border)] bg-[color:var(--warn-bg)] p-3 text-sm text-[color:var(--warn-text)]">
              Missing story frames: {audit.missingFrames.join(', ')}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
