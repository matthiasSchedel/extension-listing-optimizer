import type { ConfidenceScore } from '@/types';

interface ConfidenceInput {
  sampleSize: number;
  sampleTarget?: number;
  consistency: number;
  evidenceCoverage: number;
  specificity: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildConfidenceScore(input: ConfidenceInput): ConfidenceScore {
  const sampleTarget = input.sampleTarget ?? 80;
  const sampleComponent = clamp(input.sampleSize / sampleTarget, 0, 1);
  const consistencyComponent = clamp(input.consistency, 0, 1);
  const evidenceCoverageComponent = clamp(input.evidenceCoverage, 0, 1);
  const specificityComponent = clamp(input.specificity, 0, 1);

  const rawScore =
    sampleComponent * 0.4 +
    consistencyComponent * 0.25 +
    evidenceCoverageComponent * 0.2 +
    specificityComponent * 0.15;

  const score = Math.round(rawScore * 100);

  let level: ConfidenceScore['level'];
  if (score >= 75) {
    level = 'high';
  } else if (score >= 45) {
    level = 'medium';
  } else {
    level = 'low';
  }

  const drivers = [
    `Sample: ${input.sampleSize}/${sampleTarget}`,
    `Consistency: ${Math.round(consistencyComponent * 100)}%`,
    `Evidence coverage: ${Math.round(evidenceCoverageComponent * 100)}%`,
    `Specificity: ${Math.round(specificityComponent * 100)}%`,
  ];

  return {
    score,
    level,
    label:
      level === 'high'
        ? 'High confidence'
        : level === 'medium'
          ? 'Medium confidence'
          : 'Low confidence',
    drivers,
  };
}

export function confidenceScoreToDots(score: number): number {
  if (score >= 85) {
    return 5;
  }
  if (score >= 70) {
    return 4;
  }
  if (score >= 55) {
    return 3;
  }
  if (score >= 40) {
    return 2;
  }
  return 1;
}
