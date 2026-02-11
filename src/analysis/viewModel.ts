import { buildConfidenceScore } from '@/analysis/confidence';
import type {
  AnalyzeResponse,
  ConfidenceScore,
  ConversionBlocker,
  ConversionDriver,
  Difficulty,
  ImageAudit,
  ImageAuditRecommendation,
  ImageDiagnostic,
  InsightCluster,
  JourneyStage,
  MarketFit,
  ProductImprovement,
  ReviewData,
  ReviewEvidence,
  ReviewInsightRow,
  SentimentLabel,
  StrengthClassification,
  StrengthWeaknessRow,
  WorkspaceViewModel,
} from '@/types';

interface AspectDefinition {
  id: string;
  label: string;
  stage: JourneyStage;
  specificity: number;
  keywords: string[];
  recommendation: string;
  suggestedFix: string;
  baseDifficulty: Difficulty;
}

interface NormalizedReview extends ReviewData {
  id: string;
  index: number;
  sentiment: SentimentLabel;
  normalizedText: string;
}

const STOP_WORDS = new Set([
  'this',
  'that',
  'with',
  'have',
  'extension',
  'from',
  'for',
  'you',
  'your',
  'about',
  'there',
  'when',
  'where',
  'what',
  'would',
  'could',
  'really',
  'very',
  'just',
  'more',
  'most',
  'been',
  'they',
  'them',
  'works',
  'work',
  'using',
]);

const POSITIVE_TERMS = [
  'love',
  'great',
  'excellent',
  'amazing',
  'helpful',
  'fast',
  'clean',
  'easy',
  'smooth',
  'perfect',
  'awesome',
  'solid',
  'reliable',
];

const NEGATIVE_TERMS = [
  'bug',
  'broken',
  'issue',
  'crash',
  'slow',
  'confusing',
  'hard',
  'expensive',
  'bad',
  'terrible',
  'worst',
  'missing',
  'doesn',
  'cant',
  'cannot',
];

const ASPECTS: AspectDefinition[] = [
  {
    id: 'onboarding',
    label: 'Onboarding & Setup',
    stage: 'Pre-Purchase',
    specificity: 0.82,
    keywords: ['setup', 'install', 'onboard', 'start', 'begin', 'tutorial', 'learn'],
    recommendation: 'Reduce first-session friction with a 60-second guided setup.',
    suggestedFix: 'Show a quick-start checklist in the first screenshot and opening paragraph.',
    baseDifficulty: 'Medium',
  },
  {
    id: 'performance',
    label: 'Performance & Speed',
    stage: 'Post-Purchase',
    specificity: 0.88,
    keywords: ['fast', 'speed', 'slow', 'lag', 'loading', 'responsive', 'performance'],
    recommendation: 'Prioritize speed regressions and publish measurable performance gains.',
    suggestedFix: 'Add benchmark-style proof points in the listing and changelog.',
    baseDifficulty: 'High',
  },
  {
    id: 'reliability',
    label: 'Reliability & Stability',
    stage: 'Retention',
    specificity: 0.9,
    keywords: ['stable', 'reliable', 'crash', 'bug', 'broken', 'error', 'fails'],
    recommendation: 'Address highest-frequency failure paths and include resolution notes in updates.',
    suggestedFix: 'Prominently communicate bug-fix cadence and known-issues policy.',
    baseDifficulty: 'High',
  },
  {
    id: 'ux',
    label: 'Usability & Interface',
    stage: 'Post-Purchase',
    specificity: 0.78,
    keywords: ['ui', 'interface', 'design', 'confusing', 'simple', 'easy', 'workflow', 'navigation'],
    recommendation: 'Simplify key journeys and reduce clicks on top-used flows.',
    suggestedFix: 'Use screenshots that annotate the exact before/after workflow path.',
    baseDifficulty: 'Medium',
  },
  {
    id: 'value',
    label: 'Value Proposition',
    stage: 'Pre-Purchase',
    specificity: 0.73,
    keywords: ['value', 'worth', 'save', 'benefit', 'helpful', 'useful', 'time'],
    recommendation: 'Clarify the primary outcome users get in the first 2 lines of copy.',
    suggestedFix: 'Rewrite title and short description around one concrete benefit.',
    baseDifficulty: 'Low',
  },
  {
    id: 'support',
    label: 'Support & Responsiveness',
    stage: 'Retention',
    specificity: 0.74,
    keywords: ['support', 'response', 'help', 'email', 'reply', 'team', 'service'],
    recommendation: 'Commit to support SLAs and document response timelines publicly.',
    suggestedFix: 'Add a visible support section with contact channels and expected response times.',
    baseDifficulty: 'Low',
  },
  {
    id: 'privacy',
    label: 'Trust & Privacy',
    stage: 'Pre-Purchase',
    specificity: 0.79,
    keywords: ['privacy', 'data', 'permission', 'secure', 'security', 'tracking', 'trust'],
    recommendation: 'Explain data handling clearly and reduce non-essential permissions.',
    suggestedFix: 'Promote privacy safeguards in copy and include trust proof screenshot frame.',
    baseDifficulty: 'Medium',
  },
  {
    id: 'automation',
    label: 'Automation Outcomes',
    stage: 'Post-Purchase',
    specificity: 0.86,
    keywords: ['automate', 'automation', 'workflow', 'productivity', 'time-saving', 'efficient'],
    recommendation: 'Show measurable time savings and automation outcomes with examples.',
    suggestedFix: 'Add screenshot sequence showing problem -> automation -> measurable result.',
    baseDifficulty: 'Medium',
  },
  {
    id: 'integration',
    label: 'Integrations & Compatibility',
    stage: 'Post-Purchase',
    specificity: 0.84,
    keywords: ['integrate', 'integration', 'compatible', 'works with', 'sync', 'connect', 'platform'],
    recommendation: 'Expand high-demand integrations and show compatibility coverage clearly.',
    suggestedFix: 'List supported platforms and add integration badges in visuals.',
    baseDifficulty: 'High',
  },
  {
    id: 'pricing',
    label: 'Pricing & Plan Clarity',
    stage: 'Pre-Purchase',
    specificity: 0.77,
    keywords: ['price', 'pricing', 'plan', 'subscription', 'cost', 'free', 'paid'],
    recommendation: 'Make plan boundaries explicit and map each plan to user segments.',
    suggestedFix: 'Add pricing context or free-tier scope to listing copy and visuals.',
    baseDifficulty: 'Low',
  },
  {
    id: 'general',
    label: 'General Product Experience',
    stage: 'Post-Purchase',
    specificity: 0.58,
    keywords: [],
    recommendation: 'Gather more granular feedback with structured review prompts.',
    suggestedFix: 'Prompt users for concrete outcomes and blockers after first week of use.',
    baseDifficulty: 'Medium',
  },
];

const ASPECT_BY_ID = new Map(ASPECTS.map((aspect) => [aspect.id, aspect]));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

function getReviewSentiment(review: ReviewData): SentimentLabel {
  if ((review.rating ?? 0) >= 4) {
    return 'positive';
  }
  if ((review.rating ?? 0) <= 2 && review.rating !== null) {
    return 'negative';
  }

  const normalized = normalizeText(review.text);
  let positiveSignals = 0;
  let negativeSignals = 0;

  for (const term of POSITIVE_TERMS) {
    if (normalized.includes(term)) {
      positiveSignals += 1;
    }
  }

  for (const term of NEGATIVE_TERMS) {
    if (normalized.includes(term)) {
      negativeSignals += 1;
    }
  }

  if (positiveSignals >= negativeSignals + 1) {
    return 'positive';
  }
  if (negativeSignals >= positiveSignals + 1) {
    return 'negative';
  }

  return 'neutral';
}

function normalizeReviews(reviews: ReviewData[]): NormalizedReview[] {
  return reviews
    .map((review, index) => {
      const id = `r-${String(index + 1).padStart(3, '0')}`;
      return {
        ...review,
        id,
        index,
        sentiment: getReviewSentiment(review),
        normalizedText: normalizeText(review.text),
      };
    })
    .filter((review) => review.text.trim().length > 0);
}

function buildEvidenceMap(reviews: NormalizedReview[]): Record<string, ReviewEvidence> {
  const result: Record<string, ReviewEvidence> = {};

  for (const review of reviews) {
    const evidenceId = `ev-${review.id}`;
    result[evidenceId] = {
      id: evidenceId,
      reviewId: review.id,
      reviewIndex: review.index,
      author: review.author,
      rating: review.rating,
      sentiment: review.sentiment,
      snippet: review.text.slice(0, 180),
      fullText: review.text,
      date: review.date,
    };
  }

  return result;
}

function extractAspects(review: NormalizedReview): string[] {
  const matched = new Set<string>();

  for (const aspect of ASPECTS) {
    if (aspect.id === 'general') {
      continue;
    }

    if (aspect.keywords.some((keyword) => review.normalizedText.includes(keyword))) {
      matched.add(aspect.id);
    }
  }

  if (matched.size === 0) {
    matched.add('general');
  }

  return [...matched];
}

function topClusterTerm(reviews: NormalizedReview[]): string | null {
  const frequency = new Map<string, number>();

  for (const review of reviews) {
    for (const token of tokenize(review.text)) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }
  }

  const ranked = [...frequency.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked[0]?.[0] ?? null;
}

function buildInsightStatement(
  aspectLabel: string,
  sentiment: SentimentLabel,
  signalTerm: string | null,
): string {
  const termSuffix = signalTerm ? ` around ${signalTerm}` : '';

  if (sentiment === 'positive') {
    return `Customers consistently praise ${aspectLabel.toLowerCase()}${termSuffix}.`;
  }
  if (sentiment === 'negative') {
    return `Customers report friction with ${aspectLabel.toLowerCase()}${termSuffix}.`;
  }

  return `Customer feedback on ${aspectLabel.toLowerCase()} is mixed${termSuffix}.`;
}

function buildClusters(reviews: NormalizedReview[]): InsightCluster[] {
  if (reviews.length === 0) {
    return [];
  }

  const perAspect = new Map<
    string,
    {
      reviewIds: Set<string>;
      reviews: NormalizedReview[];
      positiveCount: number;
      neutralCount: number;
      negativeCount: number;
      aspectCount: number;
    }
  >();

  for (const review of reviews) {
    const matchedAspects = extractAspects(review);

    for (const aspectId of matchedAspects) {
      const bucket =
        perAspect.get(aspectId) ??
        {
          reviewIds: new Set<string>(),
          reviews: [],
          positiveCount: 0,
          neutralCount: 0,
          negativeCount: 0,
          aspectCount: 0,
        };

      bucket.reviewIds.add(review.id);
      bucket.reviews.push(review);
      bucket.aspectCount += 1;
      if (review.sentiment === 'positive') {
        bucket.positiveCount += 1;
      } else if (review.sentiment === 'negative') {
        bucket.negativeCount += 1;
      } else {
        bucket.neutralCount += 1;
      }

      perAspect.set(aspectId, bucket);
    }
  }

  const totalReviewCount = reviews.length;

  const clusters: InsightCluster[] = [...perAspect.entries()]
    .map(([aspectId, bucket]) => {
      const aspect = ASPECT_BY_ID.get(aspectId) ?? ASPECT_BY_ID.get('general')!;
      const reviewCount = bucket.reviewIds.size;
      const dominantSentimentCount = Math.max(
        bucket.positiveCount,
        bucket.neutralCount,
        bucket.negativeCount,
      );
      const consistency = reviewCount === 0 ? 0 : dominantSentimentCount / reviewCount;
      const positiveRatio = reviewCount === 0 ? 0 : bucket.positiveCount / reviewCount;
      const negativeRatio = reviewCount === 0 ? 0 : bucket.negativeCount / reviewCount;

      const sentiment: SentimentLabel =
        bucket.positiveCount >= bucket.negativeCount + 1
          ? 'positive'
          : bucket.negativeCount >= bucket.positiveCount + 1
            ? 'negative'
            : 'neutral';

      const confidence = buildConfidenceScore({
        sampleSize: reviewCount,
        sampleTarget: 40,
        consistency,
        evidenceCoverage: reviewCount / totalReviewCount,
        specificity: aspect.specificity,
      });

      const reliability = Math.round(
        (Math.min(1, reviewCount / 25) * 0.6 + consistency * 0.4) * 100,
      );
      const signalTerm = topClusterTerm(bucket.reviews);

      return {
        id: `cluster-${aspectId}`,
        label: aspect.label,
        stage: aspect.stage,
        reviewIds: [...bucket.reviewIds].sort(),
        reviewCount,
        aspectCount: bucket.aspectCount,
        positiveCount: bucket.positiveCount,
        neutralCount: bucket.neutralCount,
        negativeCount: bucket.negativeCount,
        positiveRatio: round(positiveRatio),
        negativeRatio: round(negativeRatio),
        reliability,
        confidence,
        statement: buildInsightStatement(aspect.label, sentiment, signalTerm),
        sentiment,
      };
    })
    .sort((a, b) => {
      if (b.reliability !== a.reliability) {
        return b.reliability - a.reliability;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return a.id.localeCompare(b.id);
    });

  return clusters;
}

function reviewIdsToEvidenceIds(reviewIds: string[]): string[] {
  return reviewIds.map((reviewId) => `ev-${reviewId}`);
}

function buildReviewInsightRows(clusters: InsightCluster[]): ReviewInsightRow[] {
  return clusters.map((cluster, index) => ({
    id: `insight-${cluster.id}`,
    rank: index + 1,
    reviewCount: cluster.reviewCount,
    aspectCount: cluster.aspectCount,
    statement: cluster.statement,
    sentiment: cluster.sentiment,
    stage: cluster.stage,
    reliability: cluster.reliability,
    confidence: cluster.confidence,
    evidenceIds: reviewIdsToEvidenceIds(cluster.reviewIds),
  }));
}

function relevanceFromScore(rawScore: number): number {
  return Math.max(1, Math.min(5, Math.round(rawScore * 5)));
}

function driverStatement(cluster: InsightCluster): string {
  if (cluster.sentiment === 'positive') {
    return `${cluster.label} drives adoption for users in the ${cluster.stage.toLowerCase()} stage.`;
  }
  return `${cluster.label} influences install decisions but has mixed validation.`;
}

function dedupeBySemanticKey<T extends { statement: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const row of rows) {
    const key = tokenize(row.statement)
      .slice(0, 4)
      .sort()
      .join('-');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

function buildConversionDrivers(
  data: AnalyzeResponse,
  clusters: InsightCluster[],
): ConversionDriver[] {
  const listingText = normalizeText(
    `${data.extension.name} ${data.extension.shortDescription} ${data.extension.description}`,
  );
  const maxReviewCount = Math.max(1, ...clusters.map((cluster) => cluster.reviewCount));

  const rawDrivers: ConversionDriver[] = clusters
    .filter((cluster) => cluster.positiveRatio >= 0.35 || cluster.sentiment === 'positive')
    .map((cluster) => {
      const aspect = ASPECT_BY_ID.get(cluster.id.replace('cluster-', '')) ?? ASPECT_BY_ID.get('general')!;
      const frequency = cluster.reviewCount / maxReviewCount;
      const sentimentStrength = clamp(cluster.positiveRatio - cluster.negativeRatio * 0.5, 0, 1);
      const listingAlignment = aspect.keywords.some((keyword) => listingText.includes(keyword)) ? 1 : 0.45;
      const specificity = aspect.specificity;
      const rawRank = frequency * 0.4 + sentimentStrength * 0.3 + listingAlignment * 0.15 + specificity * 0.15;
      const confidence = buildConfidenceScore({
        sampleSize: cluster.reviewCount,
        sampleTarget: 25,
        consistency: Math.max(cluster.positiveRatio, cluster.negativeRatio, 1 - cluster.positiveRatio - cluster.negativeRatio),
        evidenceCoverage: frequency,
        specificity,
      });

      const counterSignals: string[] = [];
      if (cluster.negativeCount > 0) {
        counterSignals.push(`${cluster.negativeCount} reviews report opposing signals`);
      }

      return {
        id: `driver-${cluster.id}`,
        rank: 0,
        statement: driverStatement(cluster),
        relevance: relevanceFromScore(rawRank),
        journeyStage: cluster.stage,
        supportingReviewIds: cluster.reviewIds,
        dataPointCount: cluster.reviewCount,
        evidenceIds: reviewIdsToEvidenceIds(cluster.reviewIds),
        confidence,
        counterSignals: counterSignals.length ? counterSignals : undefined,
      };
    });

  const deduped = dedupeBySemanticKey(rawDrivers)
    .sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      if (b.dataPointCount !== a.dataPointCount) {
        return b.dataPointCount - a.dataPointCount;
      }
      return a.id.localeCompare(b.id);
    })
    .map((driver, index) => ({ ...driver, rank: index + 1 }));

  return deduped;
}

function classifyStrength(cluster: InsightCluster): StrengthClassification {
  const confidencePenalty = cluster.confidence.score < 45;

  if (cluster.positiveRatio >= 0.74 && !confidencePenalty) {
    return 'Primary Strength';
  }
  if (cluster.positiveRatio >= 0.58) {
    return 'Emerging Strength';
  }
  if (cluster.negativeRatio >= 0.64 && !confidencePenalty) {
    return 'Primary Weakness';
  }
  if (cluster.negativeRatio >= 0.45) {
    return 'Emerging Weakness';
  }
  return 'Neutral';
}

function buildStrengthsWeaknesses(clusters: InsightCluster[]): StrengthWeaknessRow[] {
  return clusters
    .map((cluster) => ({
      id: `sw-${cluster.id}`,
      rank: 0,
      reviewCount: cluster.reviewCount,
      insight: cluster.statement,
      positiveRatio: cluster.positiveRatio,
      negativeRatio: cluster.negativeRatio,
      classification: classifyStrength(cluster),
      dataPointCount: cluster.aspectCount,
      confidence: cluster.confidence,
      evidenceIds: reviewIdsToEvidenceIds(cluster.reviewIds),
      linkedClusterId: cluster.id,
    }))
    .sort((a, b) => {
      const scoreA = Math.abs(a.positiveRatio - a.negativeRatio) * a.dataPointCount;
      const scoreB = Math.abs(b.positiveRatio - b.negativeRatio) * b.dataPointCount;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.id.localeCompare(b.id);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildMarketFit(rows: StrengthWeaknessRow[], totalReviews: number): MarketFit {
  if (rows.length === 0) {
    const confidence = buildConfidenceScore({
      sampleSize: totalReviews,
      sampleTarget: 120,
      consistency: 0,
      evidenceCoverage: 0,
      specificity: 0,
    });

    return {
      score: 0,
      confidence,
      summary: 'Insufficient evidence to calculate market fit.',
      topStrength: null,
      topWeakness: null,
    };
  }

  let weightedTotal = 0;
  let weightedBase = 0;

  for (const row of rows) {
    const confidenceWeight = row.confidence.score / 100;
    const volumeWeight = Math.sqrt(Math.max(1, row.reviewCount));
    const rowWeight = confidenceWeight * volumeWeight;
    const sentimentNet = row.positiveRatio - row.negativeRatio;
    weightedTotal += sentimentNet * rowWeight;
    weightedBase += rowWeight;
  }

  const normalized = weightedBase === 0 ? 0 : weightedTotal / weightedBase;
  const score = Math.round(clamp((normalized + 1) * 50, 0, 100));

  const confidence = buildConfidenceScore({
    sampleSize: totalReviews,
    sampleTarget: 150,
    consistency: clamp(Math.abs(normalized), 0.2, 1),
    evidenceCoverage: clamp(totalReviews / 200, 0, 1),
    specificity: 0.72,
  });

  const topStrength = rows.find((row) => row.classification.includes('Strength'))?.insight ?? null;
  const topWeakness = rows.find((row) => row.classification.includes('Weakness'))?.insight ?? null;

  let summary = 'Market fit is balanced with room for stronger differentiation.';
  if (score >= 72) {
    summary = 'Market fit is strong; customers repeatedly validate the core value proposition.';
  } else if (score <= 45) {
    summary = 'Market fit is at risk; recurring negatives are likely suppressing retention and conversion.';
  }

  return {
    score,
    confidence,
    summary,
    topStrength,
    topWeakness,
  };
}

function difficultyWeight(difficulty: Difficulty): number {
  if (difficulty === 'Low') {
    return 1;
  }
  if (difficulty === 'Medium') {
    return 0.7;
  }
  return 0.45;
}

function deriveDifficulty(cluster: InsightCluster, fallback: Difficulty): Difficulty {
  if (cluster.label.includes('Performance') || cluster.label.includes('Reliability')) {
    return 'High';
  }
  if (cluster.label.includes('Support') || cluster.label.includes('Value')) {
    return 'Low';
  }
  return fallback;
}

function buildProductImprovements(
  strengthsWeaknesses: StrengthWeaknessRow[],
  clusters: InsightCluster[],
): ProductImprovement[] {
  const clusterById = new Map(clusters.map((cluster) => [cluster.id, cluster]));

  const weakRows = strengthsWeaknesses.filter((row) => row.classification.includes('Weakness'));

  const sourceRows = weakRows.length > 0 ? weakRows : strengthsWeaknesses.slice(0, 3);

  const improvements = sourceRows.map((row) => {
    const cluster = clusterById.get(row.linkedClusterId);
    const aspectId = row.linkedClusterId.replace('cluster-', '');
    const aspect = ASPECT_BY_ID.get(aspectId) ?? ASPECT_BY_ID.get('general')!;

    const severity = clamp(row.negativeRatio + (1 - row.positiveRatio), 0, 1);
    const evidenceWeight = clamp(row.reviewCount / 25, 0, 1);
    const upliftPotential = clamp((5 - Math.max(1, Math.round(row.positiveRatio * 5))) / 5, 0.2, 1);
    const difficulty = deriveDifficulty(cluster ?? {
      label: '',
    } as InsightCluster, aspect.baseDifficulty);
    const effortWeight = difficultyWeight(difficulty);

    const rankScore = severity * 0.35 + evidenceWeight * 0.25 + upliftPotential * 0.25 + effortWeight * 0.15;
    const impact = relevanceFromScore(rankScore);

    const confidence = buildConfidenceScore({
      sampleSize: row.reviewCount,
      sampleTarget: 30,
      consistency: Math.max(row.negativeRatio, row.positiveRatio),
      evidenceCoverage: evidenceWeight,
      specificity: aspect.specificity,
    });

    return {
      id: `improvement-${row.id}`,
      rank: 0,
      recommendation: aspect.recommendation,
      impact,
      difficulty,
      linkedWeaknessId: row.id,
      linkedWeaknessLabel: aspect.label,
      expectedOutcome: `Improve ${aspect.label.toLowerCase()} perception and reduce conversion drop-off.`,
      supportingEvidenceIds: row.evidenceIds,
      rationale: `Severity ${Math.round(severity * 100)}%, evidence ${row.reviewCount} reviews, effort ${difficulty}.`,
      confidence,
      _rankScore: rankScore,
    } as ProductImprovement & { _rankScore: number };
  });

  return improvements
    .sort((a, b) => {
      if (b._rankScore !== a._rankScore) {
        return b._rankScore - a._rankScore;
      }
      return a.id.localeCompare(b.id);
    })
    .map((item, index) => {
      const { _rankScore: _hidden, ...clean } = item;
      return { ...clean, rank: index + 1 };
    });
}

function imageRole(index: number, total: number): string {
  if (index === 0) {
    return 'Hero value frame';
  }
  if (index === total - 1) {
    return 'CTA/retention frame';
  }
  return 'Workflow proof frame';
}

function buildImageDiagnostics(
  data: AnalyzeResponse,
  drivers: ConversionDriver[],
): { diagnostics: ImageDiagnostic[]; recommendations: ImageAuditRecommendation[]; missingFrames: string[] } {
  const screenshots = data.extension.screenshots;
  const recommendations: ImageAuditRecommendation[] = [];

  if (screenshots.length === 0) {
    recommendations.push({
      id: 'img-rec-1',
      priority: 5,
      statement: 'Add a 5-frame narrative sequence covering value, workflow, proof, trust, and CTA.',
      imageIndex: null,
      confidence: buildConfidenceScore({
        sampleSize: data.reviews.length,
        sampleTarget: 40,
        consistency: 0.6,
        evidenceCoverage: 0.4,
        specificity: 0.9,
      }),
    });

    return {
      diagnostics: [],
      recommendations,
      missingFrames: ['Benefit proof', 'Workflow proof', 'Trust proof', 'Comparison frame', 'CTA frame'],
    };
  }

  const driverKeywords = tokenize(drivers.map((driver) => driver.statement).join(' '));

  const diagnostics: ImageDiagnostic[] = screenshots.map((asset, index) => {
    const width = asset.width ?? 640;
    const height = asset.height ?? 400;
    const resolutionScore = clamp(width * height >= 500_000 ? 1 : 0.55, 0.4, 1);
    const ratio = width / Math.max(1, height);
    const ratioScore = clamp(1 - Math.abs(ratio - 1.6) * 0.4, 0.4, 1);

    const strategyHint = data.suggestions.screenshotStrategy[index];
    const messageClarity = strategyHint?.overlayText ? 0.85 : 0.58;
    const messageStrength = driverKeywords.length > 0 ? 0.72 : 0.55;
    const perceivedValue = clamp((resolutionScore + messageClarity + messageStrength) / 3, 0.4, 0.95);
    const designQuality = clamp((resolutionScore + ratioScore) / 2, 0.45, 1);

    const score = round(((designQuality + messageClarity + perceivedValue + messageStrength) / 4) * 5, 1);

    const confidence = buildConfidenceScore({
      sampleSize: data.reviews.length,
      sampleTarget: 60,
      consistency: 0.65,
      evidenceCoverage: clamp(screenshots.length / 5, 0.3, 1),
      specificity: 0.76,
    });

    const notes: string[] = [];
    if (!strategyHint?.overlayText) {
      notes.push('No clear overlay text strategy detected for this frame.');
    }
    if (width < 640 || height < 400) {
      notes.push('Asset resolution is likely below recommended listing quality.');
    }

    return {
      imageId: `image-${index + 1}`,
      imageIndex: index,
      asset,
      score,
      designQuality: round(designQuality * 5, 1),
      messageClarity: round(messageClarity * 5, 1),
      perceivedValue: round(perceivedValue * 5, 1),
      messageStrength: round(messageStrength * 5, 1),
      narrativeRole: imageRole(index, screenshots.length),
      notes,
      confidence,
    };
  });

  const lowScoring = diagnostics
    .filter((diagnostic) => diagnostic.score <= 3.2)
    .sort((a, b) => a.score - b.score);

  lowScoring.slice(0, 3).forEach((diagnostic, idx) => {
    recommendations.push({
      id: `img-rec-low-${diagnostic.imageIndex}`,
      priority: 5 - idx,
      statement: `Improve image ${diagnostic.imageIndex + 1}: increase clarity of user outcome and add explicit benefit text.`,
      imageIndex: diagnostic.imageIndex,
      confidence: diagnostic.confidence,
    });
  });

  const missingFrames: string[] = [];
  if (screenshots.length < 3) {
    missingFrames.push('Workflow proof');
  }
  if (!data.extension.privacyPolicyUrl) {
    missingFrames.push('Trust proof');
  }
  if (!data.suggestions.screenshotStrategy.some((item) => normalizeText(item.title).includes('compare'))) {
    missingFrames.push('Comparison frame');
  }
  if (!data.suggestions.screenshotStrategy.some((item) => normalizeText(item.overlayText).includes('start'))) {
    missingFrames.push('CTA frame');
  }

  if (missingFrames.length > 0) {
    recommendations.push({
      id: 'img-rec-missing-frames',
      priority: 4,
      statement: `Missing story frames: ${missingFrames.join(', ')}. Add them to reduce buyer uncertainty.`,
      imageIndex: null,
      confidence: buildConfidenceScore({
        sampleSize: data.reviews.length,
        sampleTarget: 50,
        consistency: 0.7,
        evidenceCoverage: 0.65,
        specificity: 0.8,
      }),
    });
  }

  return {
    diagnostics,
    recommendations: recommendations.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id)),
    missingFrames,
  };
}

function buildImageAudit(data: AnalyzeResponse, drivers: ConversionDriver[]): ImageAudit {
  const { diagnostics, recommendations, missingFrames } = buildImageDiagnostics(data, drivers);

  if (diagnostics.length === 0) {
    const confidence = buildConfidenceScore({
      sampleSize: data.reviews.length,
      sampleTarget: 50,
      consistency: 0.35,
      evidenceCoverage: 0.2,
      specificity: 0.9,
    });

    return {
      overallScore: 1,
      designQuality: 1,
      messageClarity: 1,
      perceivedValue: 1,
      messageStrength: 1,
      confidence,
      diagnostics,
      recommendations,
      rationale: ['No screenshot evidence available. Score reflects missing visual communication assets.'],
      missingFrames,
    };
  }

  const designQuality = round(
    diagnostics.reduce((sum, diagnostic) => sum + diagnostic.designQuality, 0) / diagnostics.length,
    1,
  );
  const messageClarity = round(
    diagnostics.reduce((sum, diagnostic) => sum + diagnostic.messageClarity, 0) / diagnostics.length,
    1,
  );
  const perceivedValue = round(
    diagnostics.reduce((sum, diagnostic) => sum + diagnostic.perceivedValue, 0) / diagnostics.length,
    1,
  );
  const messageStrength = round(
    diagnostics.reduce((sum, diagnostic) => sum + diagnostic.messageStrength, 0) / diagnostics.length,
    1,
  );

  const overallScore = round(
    (designQuality + messageClarity + perceivedValue + messageStrength) / 4,
    1,
  );

  const confidence = buildConfidenceScore({
    sampleSize: data.reviews.length,
    sampleTarget: 80,
    consistency: clamp(overallScore / 5, 0, 1),
    evidenceCoverage: clamp(diagnostics.length / 6, 0.3, 1),
    specificity: 0.74,
  });

  const rationale = [
    `Design quality is ${designQuality}/5 across ${diagnostics.length} assets.`,
    `Message clarity averages ${messageClarity}/5 based on overlay and narrative heuristics.`,
    `Perceived value is ${perceivedValue}/5 and should align more directly to top conversion drivers.`,
  ];

  return {
    overallScore,
    designQuality,
    messageClarity,
    perceivedValue,
    messageStrength,
    confidence,
    diagnostics,
    recommendations,
    rationale,
    missingFrames,
  };
}

function blockerStatement(cluster: InsightCluster): string {
  return `Shoppers care about ${cluster.label.toLowerCase()}, but listing evidence is weak or ambiguous.`;
}

function buildConversionBlockers(
  data: AnalyzeResponse,
  clusters: InsightCluster[],
  strengthsWeaknesses: StrengthWeaknessRow[],
): ConversionBlocker[] {
  const listingText = normalizeText(
    `${data.extension.name} ${data.extension.shortDescription} ${data.extension.description} ${data.suggestions.screenshotStrategy
      .map((item) => `${item.title} ${item.overlayText}`)
      .join(' ')}`,
  );

  const weakClusterIds = new Set(
    strengthsWeaknesses
      .filter((row) => row.classification.includes('Weakness') || row.classification === 'Neutral')
      .map((row) => row.linkedClusterId),
  );

  const rawBlockers: ConversionBlocker[] = [];

  for (const cluster of clusters) {
    const aspectId = cluster.id.replace('cluster-', '');
    const aspect = ASPECT_BY_ID.get(aspectId) ?? ASPECT_BY_ID.get('general')!;

    const listingMentionsAspect = aspect.keywords.some((keyword) => listingText.includes(keyword));
    const weakSignal = weakClusterIds.has(cluster.id) || cluster.negativeRatio >= 0.32;

    if (!weakSignal) {
      continue;
    }

    if (listingMentionsAspect && cluster.negativeRatio < 0.45) {
      continue;
    }

    const sampleWeight = clamp(cluster.reviewCount / 20, 0, 1);
    const severity = clamp(cluster.negativeRatio * 0.7 + (1 - cluster.positiveRatio) * 0.3, 0, 1);
    const rawRelevance = sampleWeight * 0.45 + severity * 0.4 + aspect.specificity * 0.15;
    const relevance = relevanceFromScore(rawRelevance);

    const estimatedLift: ConversionBlocker['estimatedLift'] =
      relevance >= 4 ? 'high' : relevance >= 3 ? 'medium' : 'low';

    const confidence = buildConfidenceScore({
      sampleSize: cluster.reviewCount,
      sampleTarget: 30,
      consistency: Math.max(cluster.negativeRatio, cluster.positiveRatio),
      evidenceCoverage: sampleWeight,
      specificity: aspect.specificity,
    });

    rawBlockers.push({
      id: `blocker-${cluster.id}`,
      rank: 0,
      statement: blockerStatement(cluster),
      relevance,
      dataPointCount: cluster.reviewCount,
      supportingEvidenceIds: reviewIdsToEvidenceIds(cluster.reviewIds),
      suggestedFix: aspect.suggestedFix,
      estimatedLift,
      confidence,
    });
  }

  if (!data.extension.privacyPolicyUrl) {
    rawBlockers.push({
      id: 'blocker-trust-privacy',
      rank: 0,
      statement: 'Trust-sensitive shoppers cannot find privacy assurance in the listing.',
      relevance: 4,
      dataPointCount: Math.max(3, Math.round(data.reviews.length * 0.1)),
      supportingEvidenceIds: [],
      suggestedFix: 'Publish and link a clear privacy policy with plain-language data use summary.',
      estimatedLift: 'high',
      confidence: buildConfidenceScore({
        sampleSize: data.reviews.length,
        sampleTarget: 40,
        consistency: 0.7,
        evidenceCoverage: 0.55,
        specificity: 0.9,
      }),
    });
  }

  return dedupeBySemanticKey(rawBlockers)
    .sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      if (b.dataPointCount !== a.dataPointCount) {
        return b.dataPointCount - a.dataPointCount;
      }
      return a.id.localeCompare(b.id);
    })
    .map((blocker, index) => ({ ...blocker, rank: index + 1 }));
}

function buildReviewSummary(reviews: NormalizedReview[], clusters: InsightCluster[]): WorkspaceViewModel['reviewSummary'] {
  const positive = reviews.filter((review) => review.sentiment === 'positive').length;
  const neutral = reviews.filter((review) => review.sentiment === 'neutral').length;
  const negative = reviews.filter((review) => review.sentiment === 'negative').length;

  const consistency =
    reviews.length === 0 ? 0 : Math.max(positive, neutral, negative) / Math.max(1, reviews.length);

  const confidence = buildConfidenceScore({
    sampleSize: reviews.length,
    sampleTarget: 120,
    consistency,
    evidenceCoverage: clamp(clusters.length / 8, 0.2, 1),
    specificity: 0.68,
  });

  return {
    analyzedReviewCount: reviews.length,
    availableReviewEstimate: reviews.length,
    confidence,
    processingSummary: `${reviews.length} reviews -> ${clusters.length} aspect clusters -> ${clusters.length} synthesized insights`,
    sentiment: {
      positive,
      neutral,
      negative,
    },
  };
}

export function buildWorkspaceViewModel(data: AnalyzeResponse): WorkspaceViewModel {
  const normalizedReviews = normalizeReviews(data.reviews);
  const clusters = buildClusters(normalizedReviews);

  const reviewInsights = buildReviewInsightRows(clusters);
  const conversionDrivers = buildConversionDrivers(data, clusters);
  const strengthsWeaknesses = buildStrengthsWeaknesses(clusters);
  const marketFit = buildMarketFit(strengthsWeaknesses, normalizedReviews.length);
  const productImprovements = buildProductImprovements(strengthsWeaknesses, clusters);
  const conversionBlockers = buildConversionBlockers(data, clusters, strengthsWeaknesses);
  const imageAudit = buildImageAudit(data, conversionDrivers);

  return {
    extensionId: data.extension.id,
    generatedAt: new Date().toISOString(),
    extension: data.extension,
    scores: data.scores,
    suggestions: data.suggestions,
    reviewSummary: buildReviewSummary(normalizedReviews, clusters),
    clusters,
    reviewInsights,
    conversionDrivers,
    strengthsWeaknesses,
    marketFit,
    productImprovements,
    imageAudit,
    conversionBlockers,
    evidenceMap: buildEvidenceMap(normalizedReviews),
    exportsMeta: {
      extensionId: data.extension.id,
      generatedAt: new Date().toISOString(),
    },
  };
}
