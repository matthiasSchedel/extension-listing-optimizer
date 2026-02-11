import { useEffect, useMemo, useRef, useState } from 'react';

import { CopyTab } from '@/components/CopyTab';
import { IssuesTab } from '@/components/IssuesTab';
import { LoadingState } from '@/components/LoadingState';
import { ReviewsTab } from '@/components/ReviewsTab';
import { ScoreCard } from '@/components/ScoreCard';
import { ScreenshotTab } from '@/components/ScreenshotTab';
import { SuggestionsTab } from '@/components/SuggestionsTab';
import { UrlInput } from '@/components/UrlInput';
import type { AnalyzeResponse } from '@/types';

const loadingSteps = [
  'Validating URL',
  'Scraping listing metadata',
  'Scoring listing quality',
  'Generating AI suggestions',
  'Assembling dashboard',
];

type TabId = 'issues' | 'suggestions' | 'copy' | 'screenshots' | 'reviews';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'issues', label: 'Issues' },
  { id: 'suggestions', label: 'AI Suggestions' },
  { id: 'copy', label: 'Copy' },
  { id: 'screenshots', label: 'Screenshots' },
  { id: 'reviews', label: 'Reviews' },
];

function isChromeStoreUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['chromewebstore.google.com', 'chrome.google.com'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

interface LegacyDashboardPageProps {
  onBack: () => void;
}

export function LegacyDashboardPage({ onBack }: LegacyDashboardPageProps) {
  const [url, setUrl] = useState('');
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('issues');
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => Math.min(prev + 1, loadingSteps.length - 1));
    }, 1500);

    return () => window.clearInterval(interval);
  }, [loading]);

  const canSubmit = useMemo(() => Boolean(url.trim()) && !loading, [url, loading]);

  const submit = async () => {
    if (!url.trim()) {
      setError('Please enter a Chrome Web Store URL.');
      return;
    }

    if (!isChromeStoreUrl(url.trim())) {
      setError('Please use a valid Chrome Web Store URL.');
      return;
    }

    if (!canSubmit || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setError(null);
    setLoading(true);
    setLoadingStepIndex(0);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Failed to analyze listing.');
      }

      setData(body as AnalyzeResponse);
      setActiveTab('issues');
    } catch (unknownError: any) {
      setError(unknownError?.message || 'Analysis request failed.');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  return (
    <div className="space-y-4">
      <header className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Compatibility route</p>
            <h1 className="text-xl font-semibold text-[color:var(--text)]">Legacy Tab Dashboard</h1>
          </div>
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-3 py-1.5 text-sm"
            onClick={onBack}
          >
            Back to workspace
          </button>
        </div>

        <UrlInput
          value={url}
          loading={loading}
          error={error}
          onChange={setUrl}
          onSubmit={submit}
          onDismissError={() => setError(null)}
        />
      </header>

      {loading ? <LoadingState steps={loadingSteps} activeStepIndex={loadingStepIndex} /> : null}

      {data ? (
        <>
          <ScoreCard data={data} />
          <section className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Legacy analysis tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    activeTab === tab.id
                      ? 'border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--bg)]'
                      : 'border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--text)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div role="tabpanel">
              {activeTab === 'issues' ? <IssuesTab data={data} /> : null}
              {activeTab === 'suggestions' ? <SuggestionsTab data={data} /> : null}
              {activeTab === 'copy' ? <CopyTab data={data} /> : null}
              {activeTab === 'screenshots' ? <ScreenshotTab data={data} /> : null}
              {activeTab === 'reviews' ? <ReviewsTab data={data} /> : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
