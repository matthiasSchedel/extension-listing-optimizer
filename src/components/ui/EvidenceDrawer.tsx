import { useEffect } from 'react';

import { Badge } from '@/components/ui/Badge';
import type { ReviewEvidence } from '@/types';

interface EvidenceDrawerProps {
  open: boolean;
  title: string;
  evidenceIds: string[];
  evidenceMap: Record<string, ReviewEvidence>;
  onClose: () => void;
}

export function EvidenceDrawer({ open, title, evidenceIds, evidenceMap, onClose }: EvidenceDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const evidenceRows = evidenceIds
    .map((evidenceId) => evidenceMap[evidenceId])
    .filter((evidence): evidence is ReviewEvidence => Boolean(evidence));

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/35" role="dialog" aria-modal="true" aria-label="Evidence drawer">
      <button
        type="button"
        onClick={onClose}
        className="h-full flex-1 cursor-default"
        aria-label="Close evidence drawer backdrop"
      />
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Evidence</p>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-1 text-sm text-[color:var(--muted)]"
          >
            Close
          </button>
        </div>

        {evidenceRows.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">
            No direct review snippets were linked to this row.
          </p>
        ) : (
          <ul className="space-y-3">
            {evidenceRows.map((evidence) => (
              <li key={evidence.id} className="rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[color:var(--text)]">{evidence.author || 'Anonymous'}</p>
                  <Badge compact tone={toneForSentiment(evidence.sentiment)}>
                    {evidence.sentiment}
                  </Badge>
                  <span className="text-xs text-[color:var(--muted)]">{evidence.rating ?? 'n/a'}/5</span>
                </div>
                <p className="text-sm leading-6 text-[color:var(--text)]">{evidence.fullText}</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function toneForSentiment(sentiment: ReviewEvidence['sentiment']): 'good' | 'warn' | 'bad' {
  if (sentiment === 'positive') {
    return 'good';
  }
  if (sentiment === 'negative') {
    return 'bad';
  }
  return 'warn';
}
