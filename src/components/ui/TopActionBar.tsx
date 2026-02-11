interface TopActionBarProps {
  onBack: () => void;
  onToggleShare: () => void;
  shareEnabled: boolean;
  onRemove?: () => void;
  externalUrl?: string;
}

export function TopActionBar({
  onBack,
  onToggleShare,
  shareEnabled,
  onRemove,
  externalUrl,
}: TopActionBarProps) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-3 py-1.5 text-sm text-[color:var(--text)] hover:border-[color:var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus)]"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onToggleShare}
          aria-pressed={shareEnabled}
          className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus)] ${
            shareEnabled
              ? 'border-[color:var(--info-border)] bg-[color:var(--info-bg)] text-[color:var(--info-text)]'
              : 'border-[color:var(--border)] text-[color:var(--text)]'
          }`}
        >
          Share {shareEnabled ? 'On' : 'Off'}
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-[var(--radius-sm)] border border-[color:var(--bad-border)] bg-[color:var(--bad-bg)] px-3 py-1.5 text-sm text-[color:var(--bad-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus)]"
          >
            Remove Product
          </button>
        ) : null}
      </div>

      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:border-[color:var(--text)]"
        >
          Open Listing ↗
        </a>
      ) : null}
    </header>
  );
}
