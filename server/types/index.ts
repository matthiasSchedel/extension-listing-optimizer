export type Severity = 'critical' | 'warning' | 'info';

export interface DeveloperInfo {
  name: string | null;
  website: string | null;
  email: string | null;
}

export interface ScreenshotAsset {
  url: string;
  width: number | null;
  height: number | null;
}

export interface PromoTiles {
  small: string | null;
  large: string | null;
  marquee: string | null;
}

export interface ExtensionData {
  name: string;
  id: string;
  version: string | null;
  description: string;
  shortDescription: string;
  category: string | null;
  installs: string | null;
  rating: number | null;
  ratingCount: number | null;
  lastUpdated: string | null;
  size: string | null;
  developer: DeveloperInfo;
  permissions: string[];
  supportedLanguages: string[];
  privacyPolicyUrl: string | null;
  screenshots: ScreenshotAsset[];
  icon: string | null;
  promoTiles: PromoTiles;
}

export interface ReviewData {
  author: string;
  rating: number | null;
  text: string;
  date: string | null;
  developerReply: string | null;
}

export interface CompetitorData {
  name: string;
  url: string;
  rating: number | null;
  installs: string | null;
  ratingCount: number | null;
  screenshotCount: number | null;
  descriptionLength: number | null;
  lastUpdated: string | null;
}

export interface AnalysisIssue {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  fix: string;
  impact: number;
}

export interface DimensionScore {
  score: number;
  issues: AnalysisIssue[];
}

export interface ScoreSummary {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  completeness: DimensionScore;
  seo: DimensionScore;
  socialProof: DimensionScore;
  trust: DimensionScore;
}

export interface ScreenshotStrategyItem {
  title: string;
  description: string;
  overlayText: string;
}

export interface ImprovementItem {
  title: string;
  priority: 'high' | 'medium' | 'low';
  userImpact: string;
  evidence: string;
}

export interface Suggestions {
  title: string;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  screenshotStrategy: ScreenshotStrategyItem[];
  topImprovements: ImprovementItem[];
  competitiveInsights: string[];
}

export interface AnalyzeResponse {
  extension: ExtensionData;
  reviews: ReviewData[];
  competitors: CompetitorData[];
  scores: ScoreSummary;
  suggestions: Suggestions;
}

export interface ScrapeResult {
  extension: ExtensionData;
  reviews: ReviewData[];
  competitors: CompetitorData[];
}
