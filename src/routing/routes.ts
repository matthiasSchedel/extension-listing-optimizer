export type ModuleSlug =
  | 'review-insights'
  | 'conversion-driver'
  | 'strengths-weaknesses'
  | 'product-improvements'
  | 'image-audit'
  | 'conversion-blockers';

export type NavigationGroup =
  | 'Understand Customer'
  | 'Improve Product'
  | 'Optimize Marketing';

export interface ModuleDefinition {
  slug: ModuleSlug;
  label: string;
  group: NavigationGroup;
  description: string;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    slug: 'review-insights',
    label: 'Review Insights',
    group: 'Understand Customer',
    description: 'What matters to customers',
  },
  {
    slug: 'conversion-driver',
    label: 'Conversion Driver',
    group: 'Understand Customer',
    description: 'What makes people buy',
  },
  {
    slug: 'strengths-weaknesses',
    label: 'Strengths & Weaknesses',
    group: 'Improve Product',
    description: 'What customers love/dislike',
  },
  {
    slug: 'product-improvements',
    label: 'Product Improvements',
    group: 'Improve Product',
    description: 'How to build a better product',
  },
  {
    slug: 'image-audit',
    label: 'Image Audit',
    group: 'Optimize Marketing',
    description: 'Objective feedback on your images',
  },
  {
    slug: 'conversion-blockers',
    label: 'Conversion Blockers',
    group: 'Optimize Marketing',
    description: "What shoppers don't see, but care about",
  },
];

export interface ParsedRouteProducts {
  type: 'products';
}

export interface ParsedRouteModule {
  type: 'module';
  extensionId: string;
  module: ModuleSlug;
}

export interface ParsedRouteLegacy {
  type: 'legacy';
}

export interface ParsedRouteNotFound {
  type: 'not-found';
}

export type ParsedRoute =
  | ParsedRouteProducts
  | ParsedRouteModule
  | ParsedRouteLegacy
  | ParsedRouteNotFound;

const MODULE_SLUGS = new Set(MODULE_DEFINITIONS.map((module) => module.slug));

export function parseRoute(pathname: string): ParsedRoute {
  if (pathname === '/' || pathname === '/products') {
    return { type: 'products' };
  }

  if (pathname === '/legacy') {
    return { type: 'legacy' };
  }

  const moduleMatch = pathname.match(/^\/products\/([^/]+)\/([^/]+)$/);
  if (moduleMatch) {
    const extensionId = decodeURIComponent(moduleMatch[1]);
    const moduleCandidate = decodeURIComponent(moduleMatch[2]) as ModuleSlug;
    if (MODULE_SLUGS.has(moduleCandidate)) {
      return {
        type: 'module',
        extensionId,
        module: moduleCandidate,
      };
    }
  }

  return { type: 'not-found' };
}

export function modulePath(extensionId: string, moduleSlug: ModuleSlug): string {
  return `/products/${encodeURIComponent(extensionId)}/${moduleSlug}`;
}
