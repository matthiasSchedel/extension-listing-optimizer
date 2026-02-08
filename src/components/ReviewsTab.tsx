import type { AnalyzeResponse, ReviewData } from '@/types';

interface ReviewsTabProps {
  data: AnalyzeResponse;
}

function sentimentBucket(review: ReviewData): 'positive' | 'neutral' | 'negative' {
  if ((review.rating ?? 0) >= 4) {
    return 'positive';
  }
  if ((review.rating ?? 0) <= 2) {
    return 'negative';
  }

  const text = review.text.toLowerCase();
  if (/great|excellent|love|helpful|amazing/.test(text)) {
    return 'positive';
  }
  if (/bug|broken|issue|hate|slow|crash/.test(text)) {
    return 'negative';
  }
  return 'neutral';
}

function topTokens(reviews: ReviewData[], mode: 'all' | 'positive' | 'negative'): string[] {
  const stop = new Set([
    'this',
    'that',
    'with',
    'have',
    'extension',
    'from',
    'for',
    'you',
    'the',
    'and',
    'very',
    'use',
    'using',
    'just',
    'like',
    'when',
    'works'
  ]);

  const counts = new Map<string, number>();

  for (const review of reviews) {
    if (mode !== 'all' && sentimentBucket(review) !== mode) {
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
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-slate-900/40">
        No reviews found. Add review prompts to collect customer feedback.
      </div>
    );
  }

  const positive = reviews.filter((review) => sentimentBucket(review) === 'positive').length;
  const neutral = reviews.filter((review) => sentimentBucket(review) === 'neutral').length;
  const negative = reviews.filter((review) => sentimentBucket(review) === 'negative').length;

  const total = reviews.length;

  const requests = topTokens(reviews, 'positive');
  const complaints = topTokens(reviews, 'negative');
  const cloud = topTokens(reviews, 'all');

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <h3 className="mb-3 font-display text-lg">Sentiment Breakdown</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-mint/20 p-3 text-sm">Positive: {Math.round((positive / total) * 100)}%</div>
          <div className="rounded-lg bg-slate-200/70 p-3 text-sm dark:bg-slate-800">Neutral: {Math.round((neutral / total) * 100)}%</div>
          <div className="rounded-lg bg-red-200/60 p-3 text-sm dark:bg-red-900/40">Negative: {Math.round((negative / total) * 100)}%</div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
          <h3 className="mb-2 font-display text-lg">Top Feature Requests</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {requests.length ? requests.map((token) => <li key={token}>{token}</li>) : <li>No strong trend yet</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
          <h3 className="mb-2 font-display text-lg">Top Complaints</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {complaints.length ? complaints.map((token) => <li key={token}>{token}</li>) : <li>No strong trend yet</li>}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-900/40">
        <h3 className="mb-2 font-display text-lg">Word Cloud</h3>
        <div className="flex flex-wrap gap-2">
          {cloud.map((token, index) => (
            <span key={token} className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs dark:border-white/10 dark:bg-slate-900" style={{ fontSize: `${12 + Math.max(0, 8 - index)}px` }}>
              {token}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
