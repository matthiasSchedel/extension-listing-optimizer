import type { AnalysisIssue, DimensionScore, ExtensionData } from '../types';

const RECOMMENDED_DIMENSIONS = new Set(['1280x800', '640x400']);

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

export function scoreCompleteness(extension: ExtensionData): DimensionScore {
  let score = 0;
  const issues: AnalysisIssue[] = [];

  const descriptionLength = extension.description.trim().length;
  if (descriptionLength > 250) {
    score += 10;
  } else {
    issues.push(
      issue(
        'description-min-length',
        'Description is too short for discovery',
        `Current description has ${descriptionLength} characters (target: 250+).`,
        'Expand with key features, use cases, and value proposition.',
        10,
        'critical'
      )
    );
  }

  if (descriptionLength > 1000) {
    score += 10;
  } else {
    issues.push(
      issue(
        'description-depth',
        'Description lacks depth',
        'Long-form descriptions generally rank better and reduce uncertainty.',
        'Aim for 1000+ characters with clear sections and examples.',
        10
      )
    );
  }

  const screenshotCount = extension.screenshots.length;
  if (screenshotCount >= 3) {
    score += 15;
  } else {
    issues.push(
      issue(
        'screenshots-minimum',
        'Not enough screenshots',
        `Only ${screenshotCount} screenshots found.`,
        'Add at least 3 screenshots to show core flows.',
        15,
        'critical'
      )
    );
  }

  if (screenshotCount >= 5) {
    score += 10;
  } else {
    issues.push(
      issue(
        'screenshots-coverage',
        'Screenshot coverage can be expanded',
        'Five screenshots usually provide stronger conversion context.',
        'Show setup, core workflow, key differentiator, and results.',
        10,
        'info'
      )
    );
  }

  const validDimCount = extension.screenshots.filter((screenshot) => {
    if (!screenshot.width || !screenshot.height) {
      return false;
    }

    return RECOMMENDED_DIMENSIONS.has(
      `${screenshot.width}x${screenshot.height}`
    );
  }).length;

  if (screenshotCount > 0 && validDimCount / screenshotCount >= 0.6) {
    score += 10;
  } else {
    issues.push(
      issue(
        'screenshot-dimensions',
        'Screenshot dimensions are off spec',
        'Most screenshots should use 1280x800 or 640x400.',
        'Export screenshots in recommended Chrome Web Store dimensions.',
        10
      )
    );
  }

  if (extension.promoTiles.small) {
    score += 10;
  } else {
    issues.push(
      issue(
        'promo-small',
        'Small promo tile missing',
        'Small promo tile is required for featuring opportunities.',
        'Upload a 440x280 promo image.',
        10,
        'critical'
      )
    );
  }

  if (extension.promoTiles.large) {
    score += 5;
  } else {
    issues.push(
      issue(
        'promo-large',
        'Large promo tile missing',
        'Large promo tile improves merchandising placement.',
        'Upload a 920x680 promo image.',
        5,
        'info'
      )
    );
  }

  if (extension.promoTiles.marquee) {
    score += 5;
  } else {
    issues.push(
      issue(
        'promo-marquee',
        'Marquee promo tile missing',
        'Marquee assets improve chance of premium featuring slots.',
        'Provide a 1400x560 marquee promo graphic.',
        5,
        'info'
      )
    );
  }

  const hasFormatting = /\n/.test(extension.description) ||
    /^\s*[-*•]/m.test(extension.description);

  if (hasFormatting) {
    score += 5;
  } else {
    issues.push(
      issue(
        'description-formatting',
        'Description readability can improve',
        'Unstructured text is harder to scan.',
        'Use headings, bullets, and line breaks.',
        5,
        'info'
      )
    );
  }

  if (extension.developer.website) {
    score += 5;
  } else {
    issues.push(
      issue(
        'developer-website',
        'Developer website is missing',
        'Website links increase trust and credibility.',
        'Add an official website URL to the listing.',
        5
      )
    );
  }

  if (extension.privacyPolicyUrl) {
    score += 10;
  } else {
    issues.push(
      issue(
        'privacy-policy',
        'Privacy policy link missing',
        'Privacy policy is expected for trust and compliance.',
        'Publish and link a clear privacy policy.',
        10,
        'critical'
      )
    );
  }

  const minimalPermissions =
    extension.permissions.length <= 5 &&
    !extension.permissions.some((permission) => /all_urls|\*:\/\//i.test(permission));

  if (minimalPermissions) {
    score += 5;
  } else {
    issues.push(
      issue(
        'permissions-scope',
        'Permission scope appears broad',
        'Broader permissions can reduce install conversion.',
        'Request only permissions required for core functionality.',
        5,
        'warning'
      )
    );
  }

  return {
    score: clampScore(score),
    issues
  };
}
