import type { AnalysisIssue, DimensionScore, ExtensionData } from '../types';

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
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

export function scoreSeo(extension: ExtensionData): DimensionScore {
  const issues: AnalysisIssue[] = [];
  let score = 0;

  const titleTokens = tokenize(extension.name);
  const shortTokens = tokenize(extension.shortDescription);
  const bodyTokens = tokenize(extension.description);

  const focusKeywords = unique([
    ...titleTokens.slice(0, 3),
    ...tokenize(extension.category ?? '').slice(0, 2)
  ]).slice(0, 5);

  const titleFirstThree = titleTokens.slice(0, 3);
  const hasKeywordEarly = focusKeywords.some((keyword) =>
    titleFirstThree.includes(keyword)
  );

  if (hasKeywordEarly) {
    score += 20;
  } else {
    issues.push(
      issue(
        'title-keyword-position',
        'Primary keyword not early in title',
        'Keywords in first three words improve scan and relevance signals.',
        'Move core keyword closer to the start of the title.',
        20,
        'critical'
      )
    );
  }

  const shortHasFocus = focusKeywords.some((keyword) =>
    shortTokens.includes(keyword)
  );
  if (shortHasFocus) {
    score += 20;
  } else {
    issues.push(
      issue(
        'short-description-keywords',
        'Short description misses core keywords',
        'Search previews rely heavily on the short description field.',
        'Include at least one core keyword in the first sentence.',
        20,
        'critical'
      )
    );
  }

  const coverage = focusKeywords.length
    ? focusKeywords.filter((keyword) => bodyTokens.includes(keyword)).length /
      focusKeywords.length
    : 0;

  score += Math.round(coverage * 25);
  if (coverage < 0.5) {
    issues.push(
      issue(
        'description-keyword-coverage',
        'Description keyword coverage is low',
        `Only ${Math.round(coverage * 100)}% of focus terms appear in the body copy.`,
        'Reinforce keyword themes naturally across headings and feature bullets.',
        25
      )
    );
  }

  const titleLength = extension.name.trim().length;
  if (titleLength >= 30 && titleLength <= 45) {
    score += 15;
  } else if (titleLength >= 20 && titleLength <= 60) {
    score += 8;
    issues.push(
      issue(
        'title-length',
        'Title length could be optimized',
        `Current title length is ${titleLength}.`,
        'Target 30-45 characters for visibility and readability.',
        7,
        'info'
      )
    );
  } else {
    issues.push(
      issue(
        'title-length',
        'Title length is outside ideal range',
        `Current title length is ${titleLength}.`,
        'Target 30-45 characters and keep primary keyword visible.',
        15
      )
    );
  }

  const shortLength = extension.shortDescription.trim().length;
  if (shortLength >= 120 && shortLength <= 132) {
    score += 20;
  } else if (shortLength > 0) {
    score += 8;
    issues.push(
      issue(
        'short-description-length',
        'Short description not fully utilized',
        `Current length is ${shortLength} characters.`,
        'Use close to the full 132-character limit for richer context.',
        12,
        'info'
      )
    );
  } else {
    issues.push(
      issue(
        'short-description-empty',
        'Short description is empty',
        'Empty short descriptions reduce search visibility and CTR.',
        'Write a concise 120-132 character value proposition.',
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
