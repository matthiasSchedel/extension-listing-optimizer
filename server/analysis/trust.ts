import type { AnalysisIssue, DimensionScore, ExtensionData, ReviewData } from '../types';

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
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

function hasBroadPermission(permission: string): boolean {
  return /<all_urls>|\*:\/\//i.test(permission);
}

function reviewSpamSignal(reviews: ReviewData[]): number {
  if (reviews.length < 5) {
    return 0;
  }

  const normalized = reviews.map((review) =>
    review.text.toLowerCase().replace(/\s+/g, ' ').trim()
  );

  const uniqueCount = new Set(normalized).size;
  const duplicateRatio = 1 - uniqueCount / reviews.length;
  return duplicateRatio;
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
  return (
    (now.getFullYear() - parsed.getFullYear()) * 12 +
    (now.getMonth() - parsed.getMonth())
  );
}

export function scoreTrust(
  extension: ExtensionData,
  reviews: ReviewData[]
): DimensionScore {
  let score = 0;
  const issues: AnalysisIssue[] = [];

  const broadPermissionCount = extension.permissions.filter(hasBroadPermission).length;
  if (broadPermissionCount === 0 && extension.permissions.length <= 5) {
    score += 30;
  } else if (broadPermissionCount === 0) {
    score += 18;
    issues.push(
      issue(
        'permissions-count',
        'Permission count is high',
        `${extension.permissions.length} permissions requested.`,
        'Remove non-essential permissions and explain sensitive access.',
        12,
        'warning'
      )
    );
  } else {
    score += 5;
    issues.push(
      issue(
        'permissions-broad',
        'Broad host permissions detected',
        `${broadPermissionCount} broad permissions can reduce user trust.`,
        'Replace broad host access with narrowly scoped permissions.',
        25,
        'critical'
      )
    );
  }

  if (extension.privacyPolicyUrl) {
    score += 25;
  } else {
    issues.push(
      issue(
        'privacy-policy-missing',
        'Privacy policy missing',
        'Users and platform reviewers expect a clear privacy statement.',
        'Add a public privacy policy URL.',
        25,
        'critical'
      )
    );
  }

  const hasContact = Boolean(extension.developer.website || extension.developer.email);
  if (hasContact) {
    score += 20;
  } else {
    issues.push(
      issue(
        'contact-missing',
        'Developer contact information missing',
        'No website or support email was detected.',
        'Add at least one direct support channel.',
        20,
        'warning'
      )
    );
  }

  const spamSignal = reviewSpamSignal(reviews.slice(0, 20));
  if (spamSignal < 0.15) {
    score += 15;
  } else if (spamSignal < 0.3) {
    score += 8;
    issues.push(
      issue(
        'review-pattern-warning',
        'Some repetitive review patterns detected',
        'Repeated phrasing can look inorganic and reduce trust.',
        'Encourage authentic feedback and avoid incentive-driven wording.',
        7,
        'info'
      )
    );
  } else {
    issues.push(
      issue(
        'review-pattern-risk',
        'Highly repetitive review patterns',
        'A large share of reviews appear textually duplicated.',
        'Audit review acquisition channels and monitor abuse risk.',
        15,
        'critical'
      )
    );
  }

  const months = monthsSince(extension.lastUpdated);
  if (months === null) {
    issues.push(
      issue(
        'maintenance-date-missing',
        'Maintenance recency unknown',
        'Could not determine how recently the extension was updated.',
        'Ensure last update metadata is visible.',
        10,
        'info'
      )
    );
  } else if (months <= 12) {
    score += 10;
  } else {
    issues.push(
      issue(
        'maintenance-stale',
        'Maintenance appears inactive',
        `No visible update for about ${months} months.`,
        'Ship updates more regularly to signal active support.',
        10,
        'warning'
      )
    );
  }

  return {
    score: clampScore(score),
    issues
  };
}
