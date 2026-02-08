import { useEffect, useMemo, useRef, useState } from "react";

import { CopyTab } from "./components/CopyTab";
import { IssuesTab } from "./components/IssuesTab";
import { LoadingState } from "./components/LoadingState";
import { ReviewsTab } from "./components/ReviewsTab";
import { ScoreCard } from "./components/ScoreCard";
import { ScreenshotTab } from "./components/ScreenshotTab";
import { SuggestionsTab } from "./components/SuggestionsTab";
import { UrlInput } from "./components/UrlInput";
import type { AnalyzeResponse } from "./types";

const loadingSteps = [
  "Validating URL",
  "Scraping listing metadata",
  "Scoring listing quality",
  "Generating AI suggestions",
  "Assembling dashboard",
];

type TabId = "issues" | "suggestions" | "copy" | "screenshots" | "reviews";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "issues", label: "Issues" },
  { id: "suggestions", label: "AI Suggestions" },
  { id: "copy", label: "Copy" },
  { id: "screenshots", label: "Screenshots" },
  { id: "reviews", label: "Reviews" },
];

function isChromeStoreUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["chromewebstore.google.com", "chrome.google.com"].includes(
      parsed.hostname,
    );
  } catch {
    return false;
  }
}

export default function App() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("issues");
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) =>
        Math.min(prev + 1, loadingSteps.length - 1),
      );
    }, 1500);

    return () => window.clearInterval(interval);
  }, [loading]);

  const canSubmit = useMemo(
    () => Boolean(url.trim()) && !loading,
    [url, loading],
  );

  const submit = async () => {
    if (!url.trim()) {
      setError("Please enter a Chrome Web Store URL.");
      return;
    }

    if (!isChromeStoreUrl(url.trim())) {
      setError("Please use a valid Chrome Web Store URL.");
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
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Failed to analyze listing.");
      }

      setData(body as AnalyzeResponse);
      setActiveTab("issues");
    } catch (unknownError: any) {
      setError(unknownError?.message || "Analysis request failed.");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-2xl sm:text-3xl">
            Chrome Listing Optimizer
          </p>
          <p className="text-sm text-black/70 dark:text-white/70">
            PageSpeed-style analysis for Chrome Web Store listings
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </header>

      <UrlInput
        value={url}
        loading={loading}
        error={error}
        onChange={setUrl}
        onSubmit={submit}
        onDismissError={() => setError(null)}
      />

      <section className="mt-6 space-y-4">
        {loading ? (
          <LoadingState
            steps={loadingSteps}
            activeStepIndex={loadingStepIndex}
          />
        ) : null}

        {data ? (
          <>
            <ScoreCard data={data} />
            <section className="card p-4 sm:p-6">
              <div
                className="mb-4 flex flex-wrap gap-2"
                role="tablist"
                aria-label="Analysis tabs"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      activeTab === tab.id
                        ? "border-ink bg-ink text-white dark:border-ember dark:bg-ember"
                        : "border-black/10 bg-white/70 hover:border-black/30 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-white/30"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" className="rise-in">
                {activeTab === "issues" ? <IssuesTab data={data} /> : null}
                {activeTab === "suggestions" ? (
                  <SuggestionsTab data={data} />
                ) : null}
                {activeTab === "copy" ? <CopyTab data={data} /> : null}
                {activeTab === "screenshots" ? (
                  <ScreenshotTab data={data} />
                ) : null}
                {activeTab === "reviews" ? <ReviewsTab data={data} /> : null}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
