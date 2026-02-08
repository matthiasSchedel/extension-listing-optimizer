import { FormEvent } from 'react';

interface UrlInputProps {
  value: string;
  loading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onDismissError: () => void;
}

export function UrlInput({
  value,
  loading,
  error,
  onChange,
  onSubmit,
  onDismissError
}: UrlInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="card rise-in p-4 sm:p-6">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste Chrome Web Store URL..."
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20 dark:border-white/20 dark:bg-slate-950"
          aria-label="Chrome Web Store URL"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-ink px-5 py-3 font-display text-sm text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ember dark:hover:bg-orange-600"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
      {error ? (
        <div className="mt-3 flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-200">
          <p>{error}</p>
          <button
            type="button"
            onClick={onDismissError}
            className="ml-3 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </section>
  );
}
