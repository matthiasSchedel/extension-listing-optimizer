import { scoreCompleteness } from './completeness';
import { scoreSeo } from './seo';
import { scoreSocialProof } from './socialProof';
import { scoreTrust } from './trust';
import type { ScrapeResult, ScoreSummary } from '../types';

function toGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) {
    return 'A';
  }
  if (score >= 75) {
    return 'B';
  }
  if (score >= 60) {
    return 'C';
  }
  if (score >= 40) {
    return 'D';
  }
  return 'F';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function aggregateScores(scraped: ScrapeResult): ScoreSummary {
  const completeness = scoreCompleteness(scraped.extension);
  const seo = scoreSeo(scraped.extension);
  const socialProof = scoreSocialProof(scraped.extension, scraped.reviews);
  const trust = scoreTrust(scraped.extension, scraped.reviews);

  const overall = clampScore(
    completeness.score * 0.3 +
      seo.score * 0.25 +
      socialProof.score * 0.25 +
      trust.score * 0.2
  );

  return {
    overall,
    grade: toGrade(overall),
    completeness,
    seo,
    socialProof,
    trust
  };
}
