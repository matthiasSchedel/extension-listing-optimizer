export type Severity = 'critical' | 'warning' | 'info';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type JourneyStage = 'Pre-Purchase' | 'Post-Purchase' | 'Retention';
export type Difficulty = 'Low' | 'Medium' | 'High';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type LiftLevel = 'low' | 'medium' | 'high';

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

export interface ReviewEvidence {
  id: string;
  reviewId: string;
  reviewIndex: number;
  author: string;
  rating: number | null;
  sentiment: SentimentLabel;
  snippet: string;
  fullText: string;
  date: string | null;
}

export interface ConfidenceScore {
  score: number;
  level: ConfidenceLevel;
  label: string;
  drivers: string[];
}

export interface InsightCluster {
  id: string;
  label: string;
  stage: JourneyStage;
  reviewIds: string[];
  reviewCount: number;
  aspectCount: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positiveRatio: number;
  negativeRatio: number;
  reliability: number;
  confidence: ConfidenceScore;
  statement: string;
  sentiment: SentimentLabel;
}

export interface ReviewInsightRow {
  id: string;
  rank: number;
  reviewCount: number;
  aspectCount: number;
  statement: string;
  sentiment: SentimentLabel;
  stage: JourneyStage;
  reliability: number;
  confidence: ConfidenceScore;
  evidenceIds: string[];
}

export interface ConversionDriver {
  id: string;
  rank: number;
  statement: string;
  relevance: number;
  journeyStage: JourneyStage;
  supportingReviewIds: string[];
  dataPointCount: number;
  evidenceIds: string[];
  confidence: ConfidenceScore;
  counterSignals?: string[];
}

export type StrengthClassification =
  | 'Primary Strength'
  | 'Emerging Strength'
  | 'Neutral'
  | 'Emerging Weakness'
  | 'Primary Weakness';

export interface StrengthWeaknessRow {
  id: string;
  rank: number;
  reviewCount: number;
  insight: string;
  positiveRatio: number;
  negativeRatio: number;
  classification: StrengthClassification;
  dataPointCount: number;
  confidence: ConfidenceScore;
  evidenceIds: string[];
  linkedClusterId: string;
}

export interface MarketFit {
  score: number;
  confidence: ConfidenceScore;
  summary: string;
  topStrength: string | null;
  topWeakness: string | null;
}

export interface ProductImprovement {
  id: string;
  rank: number;
  recommendation: string;
  impact: number;
  difficulty: Difficulty;
  linkedWeaknessId: string;
  linkedWeaknessLabel: string;
  expectedOutcome: string;
  supportingEvidenceIds: string[];
  rationale: string;
  confidence: ConfidenceScore;
}

export interface ImageDiagnostic {
  imageId: string;
  imageIndex: number;
  asset: ScreenshotAsset;
  score: number;
  designQuality: number;
  messageClarity: number;
  perceivedValue: number;
  messageStrength: number;
  narrativeRole: string;
  notes: string[];
  confidence: ConfidenceScore;
}

export interface ImageAuditRecommendation {
  id: string;
  priority: number;
  statement: string;
  imageIndex: number | null;
  confidence: ConfidenceScore;
}

export interface ImageAudit {
  overallScore: number;
  designQuality: number;
  messageClarity: number;
  perceivedValue: number;
  messageStrength: number;
  confidence: ConfidenceScore;
  diagnostics: ImageDiagnostic[];
  recommendations: ImageAuditRecommendation[];
  rationale: string[];
  missingFrames: string[];
}

export interface ConversionBlocker {
  id: string;
  rank: number;
  statement: string;
  relevance: number;
  dataPointCount: number;
  supportingEvidenceIds: string[];
  suggestedFix: string;
  estimatedLift: LiftLevel;
  confidence: ConfidenceScore;
}

export interface ReviewInsightsSummary {
  analyzedReviewCount: number;
  availableReviewEstimate: number;
  confidence: ConfidenceScore;
  processingSummary: string;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface WorkspaceViewModel {
  extensionId: string;
  generatedAt: string;
  extension: ExtensionData;
  scores: ScoreSummary;
  suggestions: Suggestions;
  reviewSummary: ReviewInsightsSummary;
  clusters: InsightCluster[];
  reviewInsights: ReviewInsightRow[];
  conversionDrivers: ConversionDriver[];
  strengthsWeaknesses: StrengthWeaknessRow[];
  marketFit: MarketFit;
  productImprovements: ProductImprovement[];
  imageAudit: ImageAudit;
  conversionBlockers: ConversionBlocker[];
  evidenceMap: Record<string, ReviewEvidence>;
  exportsMeta: {
    extensionId: string;
    generatedAt: string;
  };
}

export interface WorkspaceProductRecord {
  extensionId: string;
  analyzedAt: string;
  url: string;
  data: AnalyzeResponse;
}
