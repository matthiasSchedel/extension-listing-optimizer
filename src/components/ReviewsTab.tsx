import { useEffect, useMemo, useState } from "react";

import type { AnalyzeResponse, ReviewData } from "@/types";

interface ReviewsTabProps {
  data: AnalyzeResponse;
}

const REVIEW_BATCH_SIZE = 25;

function sentimentBucket(
  review: ReviewData,
): "positive" | "neutral" | "negative" {
  if ((review.rating ?? 0) >= 4) {
    return "positive";
  }
  if ((review.rating ?? 0) <= 2) {
    return "negative";
  }

  const text = review.text.toLowerCase();
  if (/great|excellent|love|helpful|amazing/.test(text)) {
    return "positive";
  }
  if (/bug|broken|issue|hate|slow|crash/.test(text)) {
    return "negative";
  }
  return "neutral";
}

function topTokens(
  reviews: ReviewData[],
  mode: "all" | "positive" | "negative",
): string[] {
  const stop = new Set([
    "this",
    "that",
    "with",
    "have",
    "extension",
    "from",
    "for",
    "you",
    "the",
    "and",
    "very",
    "use",
    "using",
    "just",
    "like",
    "when",
    "works",
  ]);

  const counts = new Map<string, number>();

  for (const review of reviews) {
    if (mode !== "all" && sentimentBucket(review) !== mode) {
      continue;
    }

    for (const token of review.text.toLowerCase().split(/[^a-z0-9]+/)) {
      if (token.length < 4 || stop.has(token)) {
        continue;
      }
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token]) => token);
}

export function ReviewsTab({ data }: ReviewsTabProps) {
  const reviews = data.reviews;
  const [visibleReviewCount, setVisibleReviewCount] =
    useState(REVIEW_BATCH_SIZE);

  useEffect(() => {
    setVisibleReviewCount(REVIEW_BATCH_SIZE);
  }, [data.extension.id, reviews.length]);

  const visibleReviews = useMemo(
    () => reviews.slice(0, visibleReviewCount),
    [reviews, visibleReviewCount],
  );

  const canLoadMore = visibleReviewCount < reviews.length;
  const showMoreReviews = () => {
    setVisibleReviewCount((current) =>
      Math.min(current + REVIEW_BATCH_SIZE, reviews.length),
    );
  };

  const onReviewListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    const isNearBottom =
      node.scrollTop + node.clientHeight >= node.scrollHeight - 120;
    if (isNearBottom && canLoadMore) {
      showMoreReviews();
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-slate-900/40">
        No reviews found. Add review prompts to collect customer feedback.
      </div>
    );
  }

  const positive = reviews.filter(
    (review) => sentimentBucket(review) === "positive",
  ).length;
  const neutral = reviews.filter(
    (review) => sentimentBucket(review) === "neutral",
  ).length;
  const negative = reviews.filter(
    (review) => sentimentBucket(review) === "negative",
  ).length;

  const total = reviews.length;

  const requests = topTokens(reviews, "positive");
  const complaints = topTokens(reviews, "negative");
  const cloud = topTokens(reviews, "all");

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <h3 className="mb-3 font-display text-lg">Sentiment Breakdown</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-mint/20 p-3 text-sm">
            Positive: {Math.round((positive / total) * 100)}%
          </div>
          <div className="rounded-lg bg-slate-200/70 p-3 text-sm dark:bg-slate-800">
            Neutral: {Math.round((neutral / total) * 100)}%
          </div>
          <div className="rounded-lg bg-red-200/60 p-3 text-sm dark:bg-red-900/40">
            Negative: {Math.round((negative / total) * 100)}%
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
          <h3 className="mb-2 font-display text-lg">Top Feature Requests</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {requests.length ? (
              requests.map((token) => <li key={token}>{token}</li>)
            ) : (
              <li>No strong trend yet</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
          <h3 className="mb-2 font-display text-lg">Top Complaints</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {complaints.length ? (
              complaints.map((token) => <li key={token}>{token}</li>)
            ) : (
              <li>No strong trend yet</li>
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <h3 className="mb-2 font-display text-lg">Word Cloud</h3>
        <div className="flex flex-wrap gap-2">
          {cloud.map((token, index) => (
            <span
              key={token}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs dark:border-white/10 dark:bg-slate-900"
              style={{ fontSize: `${12 + Math.max(0, 8 - index)}px` }}
            >
              {token}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg">Scraped Reviews</h3>
          <p className="text-xs text-black/60 dark:text-white/60">
            Showing {visibleReviews.length} of {reviews.length}
          </p>
        </div>

        <div
          className="max-h-[28rem] space-y-3 overflow-y-auto pr-1"
          onScroll={onReviewListScroll}
        >
          {visibleReviews.map((review, index) => {
            const sentiment = sentimentBucket(review);
            const sentimentLabel =
              sentiment[0].toUpperCase() + sentiment.slice(1);
            const ratingText =
              review.rating === null ? "No rating" : `${review.rating}/5`;

            return (
              <article
                key={`${review.author}-${review.text.slice(0, 64)}-${index}`}
                className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-slate-900"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium">{review.author}</span>
                  <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
                    {ratingText}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      sentiment === "positive"
                        ? "bg-mint/20"
                        : sentiment === "negative"
                          ? "bg-red-200/60 dark:bg-red-900/40"
                          : "bg-slate-200/80 dark:bg-slate-800"
                    }`}
                  >
                    {sentimentLabel}
                  </span>
                  {review.date ? (
                    <span className="text-black/60 dark:text-white/60">
                      {review.date}
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-relaxed">{review.text}</p>

                {review.developerReply ? (
                  <div className="mt-2 rounded-md border-l-2 border-amber-400/70 bg-amber-100/40 p-2 text-xs dark:bg-amber-500/10">
                    <p className="mb-1 font-medium">Developer reply</p>
                    <p>{review.developerReply}</p>
                  </div>
                ) : null}
              </article>
            );
          })}

          {canLoadMore ? (
            <div className="pb-1 pt-2 text-center text-xs text-black/60 dark:text-white/60">
              Scroll to load more reviews
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
