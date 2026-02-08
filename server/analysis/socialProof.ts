import type { AnalysisIssue, DimensionScore, ExtensionData, ReviewData } from '../types';

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseInstallCount(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/,/g, '').replace('+', '').trim().toLowerCase();
  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)([km])?/);
  if (!match) {
    return null;
  }

  let amount = Number(match[1]);
  if (match[2] === 'k') {
    amount *= 1000;
  }
  if (match[2] === 'm') {
    amount *= 1_000_000;
  }

  return Math.round(amount);
}

function issue(
  id: string,
  title: string,
  description: string,
  fix: string,
  impact: number,
  severity: AnalysisIssue['severity'] = 'warning'
): AnalysisIssue {
  return { id, severity, title, description, fix, impact };
}

function sentimentScore(text: string): number {
  const positive = ['great', 'love', 'excellent', 'awesome', 'helpful', 'perfect'];
  const negative = ['bug', 'broken', 'bad', 'issue', 'hate', 'slow', 'crash'];

  const lower = text.toLowerCase();
  let score = 0;

  for (const token of positive) {
    if (lower.includes(token)) {
      score += 1;
    }
  }

  for (const token of negative) {
    if (lower.includes(token)) {
      score -= 1;
    }
  }

  return score;
}

function monthsSince(dateValue: string | null): number | null {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const now = new Date();
  const months =
    (now.getFullYear() - parsed.getFullYear()) * 12 +
    (now.getMonth() - parsed.getMonth());

  return months;
}

export function scoreSocialProof(
  extension: ExtensionData,
  reviews: ReviewData[]
): DimensionScore {
  let score = 0;
  const issues: AnalysisIssue[] = [];

  const rating = extension.rating ?? 0;

  if (rating >= 4.5) {
    score += 25;
  } else if (rating >= 4.0) {
    score += 18;
  } else if (rating >= 3.5) {
    score += 10;
  } else if (rating > 0) {
    score += 3;
    issues.push(
      issue(
        'rating-low',
        'Average rating is low',
        `Current average rating is ${rating.toFixed(1)}.`,
        'Address frequent complaints in onboarding and stability.',
        22,
        'critical'
      )
    );
  } else {
    issues.push(
      issue(
        'rating-missing',
        'No rating data found',
        'Social proof is weak without visible rating quality.',
        'Encourage reviews after key activation milestones.',
        25,
        'critical'
      )
    );
  }

  const installCount = parseInstallCount(extension.installs);
  const reviewCount = extension.ratingCount ?? reviews.length;
  if (installCount && reviewCount) {
    const engagement = reviewCount / installCount;
    if (engagement >= 0.05) {
      score += 20;
    } else if (engagement >= 0.02) {
      score += 14;
    } else if (engagement >= 0.01) {
      score += 8;
    } else {
      score += 3;
      issues.push(
        issue(
          'engagement-ratio',
          'Review-to-install engagement is low',
          `Only ${(engagement * 100).toFixed(2)}% of users leave ratings.`,
          'Introduce lightweight in-product prompts for satisfied users.',
          17
        )
      );
    }
  } else {
    issues.push(
      issue(
        'engagement-missing-data',
        'Insufficient install/review data',
        'Unable to measure engagement ratio accurately.',
        'Verify install and review data visibility on listing.',
        20,
        'info'
      )
    );
  }

  const recentReviews = reviews.slice(0, 10);
  if (recentReviews.length > 0) {
    const sentimentTotal = recentReviews.reduce((sum, review) => {
      return sum + sentimentScore(review.text);
    }, 0);

    if (sentimentTotal >= 5) {
      score += 20;
    } else if (sentimentTotal >= 0) {
      score += 12;
    } else {
      score += 4;
      issues.push(
        issue(
          'review-sentiment',
          'Recent review sentiment is trending negative',
          'Recent comments indicate frustration around quality or outcomes.',
          'Prioritize fixes for top recurring issues in the last 10 reviews.',
          16,
          'critical'
        )
      );
    }
  } else {
    issues.push(
      issue(
        'reviews-empty',
        'No recent reviews available',
        'Limited sentiment data reduces social proof quality signals.',
        'Proactively gather user feedback in-app and via release notes.',
        20,
        'info'
      )
    );
  }

  const replies = recentReviews.filter((review) => review.developerReply).length;
  const replyRate = recentReviews.length ? replies / recentReviews.length : 0;

  if (replyRate >= 0.4) {
    score += 15;
  } else if (replyRate > 0) {
    score += 8;
    issues.push(
      issue(
        'developer-responses',
        'Developer response rate can improve',
        `Developer replied to ${Math.round(replyRate * 100)}% of recent reviews.`,
        'Respond to major issues and thank users in high-value reviews.',
        7,
        'info'
      )
    );
  } else {
    issues.push(
      issue(
        'developer-responses-none',
        'No developer replies found',
        'Responsiveness is a strong trust and support signal.',
        'Reply to review threads, especially low-star reports.',
        15
      )
    );
  }

  const months = monthsSince(extension.lastUpdated);
  if (months === null) {
    issues.push(
      issue(
        'update-date-missing',
        'Last update date unavailable',
        'Freshness cannot be assessed without an update timestamp.',
        'Ensure release date is visible and updated in listing metadata.',
        20,
        'info'
      )
    );
  } else if (months <= 3) {
    score += 20;
  } else if (months <= 6) {
    score += 10;
    issues.push(
      issue(
        'update-recency-warning',
        'Update recency is aging',
        `Last update appears to be about ${months} months ago.`,
        'Ship maintenance updates at least once per quarter.',
        10,
        'warning'
      )
    );
  } else {
    issues.push(
      issue(
        'update-recency-stale',
        'Listing appears stale',
        `Last update appears to be about ${months} months ago.`,
        'Publish an update and highlight changes in release notes.',
        20,
        'critical'
      )
    );
  }

  return {
    score: clampScore(score),
    issues
  };
}
