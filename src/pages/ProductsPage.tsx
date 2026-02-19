import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui";
import { modulePath } from "@/routing/routes";
import { useWorkspaceStore } from "@/state/workspaceStore";

interface ProductsPageProps {
  onNavigate: (path: string) => void;
}

const ANALYSIS_STEPS = [
  "Validating Chrome Web Store URL",
  "Scraping listing metadata and assets",
  "Scoring quality dimensions",
  "Generating recommendations",
  "Finalizing workspace modules",
];

export function ProductsPage({ onNavigate }: ProductsPageProps) {
  const [url, setUrl] = useState("");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { products, loading, error, dismissError, analyzeUrl, clearAll } =
    useWorkspaceStore();

  const sortedProducts = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
      ),
    [products],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await analyzeUrl(url);
    if (!result) {
      return;
    }

    setUrl("");
    onNavigate(modulePath(result.record.extensionId, "review-insights"));
  };

  useEffect(() => {
    if (!loading) {
      setLoadingStepIndex(0);
      setLoadingProgress(0);
      return;
    }

    setLoadingStepIndex(0);
    setLoadingProgress(12);

    const progressInterval = window.setInterval(() => {
      setLoadingProgress((current) =>
        Math.min(94, current + Math.max(1, Math.round((100 - current) / 20))),
      );
    }, 260);

    const stepInterval = window.setInterval(() => {
      setLoadingStepIndex((current) =>
        Math.min(current + 1, ANALYSIS_STEPS.length - 1),
      );
    }, 1450);

    return () => {
      window.clearInterval(progressInterval);
      window.clearInterval(stepInterval);
    };
  }, [loading]);

  return (
    <div className="space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Chrome Listing Optimizer
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">
          Products Workspace
        </h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Analyze a Chrome Web Store listing once, then navigate deep module
          pages with persistent context.
        </p>

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={submit}
        >
          <input
            aria-label="Chrome Web Store URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://chromewebstore.google.com/detail/<slug>/<extension-id>"
            className="flex-1 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[var(--radius-md)] border border-[color:var(--text)] bg-[color:var(--text)] px-4 py-2 text-sm font-semibold text-[color:var(--bg)] disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Analyze URL"}
          </button>
        </form>

        {error ? (
          <div className="mt-3 flex items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--bad-border)] bg-[color:var(--bad-bg)] p-3 text-sm text-[color:var(--bad-text)]">
            <p>{error}</p>
            <button
              type="button"
              onClick={dismissError}
              className="text-xs font-semibold underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {loading ? (
          <section className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[color:var(--text)]">
                Analyzing extension listing
              </h2>
              <span className="rounded-full border border-[color:var(--info-border)] bg-[color:var(--info-bg)] px-2 py-0.5 text-xs font-medium text-[color:var(--info-text)]">
                {loadingProgress}%
              </span>
            </div>

            <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--border)]/45">
              <div
                className="analysis-progress-fill h-full rounded-full"
                style={{ width: `${loadingProgress}%` }}
                aria-hidden="true"
              />
              <div className="analysis-progress-sheen" aria-hidden="true" />
            </div>

            <ol
              className="mt-4 grid gap-2 sm:grid-cols-2"
              aria-label="Analysis progress"
            >
              {ANALYSIS_STEPS.map((step, index) => {
                const complete = index < loadingStepIndex;
                const active = index === loadingStepIndex;

                return (
                  <li
                    key={step}
                    className={`flex items-center gap-2 rounded-[var(--radius-sm)] border px-2.5 py-2 text-xs ${
                      active
                        ? "border-[color:var(--info-border)] bg-[color:var(--info-bg)] text-[color:var(--info-text)]"
                        : complete
                          ? "border-[color:var(--good-border)] bg-[color:var(--good-bg)] text-[color:var(--good-text)]"
                          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                        active
                          ? "bg-[color:var(--info)] text-white"
                          : complete
                            ? "bg-[color:var(--good)] text-white"
                            : "border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--muted)]"
                      }`}
                    >
                      {complete ? "✓" : index + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                    {active ? (
                      <span
                        className="flex items-center gap-1"
                        aria-hidden="true"
                      >
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
      </section>

      {sortedProducts.length === 0 ? (
        <EmptyState
          title="No analyzed products yet"
          description="Submit a Chrome Web Store URL to create your first product workspace."
        />
      ) : (
        <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[color:var(--text)]">
              Analyzed products
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-1 text-xs text-[color:var(--muted)]"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {sortedProducts.map((product) => (
              <article
                key={product.extensionId}
                className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--text)]">
                    {product.data.extension.name}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    {product.data.extension.category ?? "Uncategorized"} ·{" "}
                    {product.data.scores.overall}/100 ·{" "}
                    {product.data.reviews.length} reviews
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-1 text-xs"
                    onClick={() =>
                      onNavigate(
                        modulePath(product.extensionId, "review-insights"),
                      )
                    }
                  >
                    Open Workspace
                  </button>
                  <button
                    type="button"
                    className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-1 text-xs"
                    onClick={() => onNavigate("/legacy")}
                  >
                    Legacy View
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
