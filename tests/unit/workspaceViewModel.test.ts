import { describe, expect, it } from 'vitest';

import { buildWorkspaceViewModel } from '@/analysis';
import { buildAnalyzeResponseFixture } from '../helpers/analyzeResponse';

describe('workspace view model', () => {
  it('builds stable clusters and insights across repeated runs', () => {
    const data = buildAnalyzeResponseFixture();

    const first = buildWorkspaceViewModel(data);
    const second = buildWorkspaceViewModel(data);

    expect(first.reviewInsights.length).toBeGreaterThan(0);
    expect(first.reviewInsights.map((row) => row.statement)).toEqual(
      second.reviewInsights.map((row) => row.statement),
    );
    expect(first.clusters.map((cluster) => cluster.id)).toEqual(
      second.clusters.map((cluster) => cluster.id),
    );
  });

  it('ranks and deduplicates conversion drivers', () => {
    const data = buildAnalyzeResponseFixture();
    const viewModel = buildWorkspaceViewModel(data);

    const statements = viewModel.conversionDrivers.map((row) => row.statement);
    expect(new Set(statements).size).toBe(statements.length);

    for (let index = 1; index < viewModel.conversionDrivers.length; index += 1) {
      expect(viewModel.conversionDrivers[index - 1].relevance).toBeGreaterThanOrEqual(
        viewModel.conversionDrivers[index].relevance,
      );
    }
  });

  it('links evidence IDs for all major module rows', () => {
    const data = buildAnalyzeResponseFixture();
    const viewModel = buildWorkspaceViewModel(data);

    const allEvidenceIds = [
      ...viewModel.reviewInsights.flatMap((row) => row.evidenceIds),
      ...viewModel.conversionDrivers.flatMap((row) => row.evidenceIds),
      ...viewModel.strengthsWeaknesses.flatMap((row) => row.evidenceIds),
      ...viewModel.productImprovements.flatMap((row) => row.supportingEvidenceIds),
      ...viewModel.conversionBlockers.flatMap((row) => row.supportingEvidenceIds),
    ];

    expect(allEvidenceIds.length).toBeGreaterThan(0);

    for (const evidenceId of allEvidenceIds) {
      expect(viewModel.evidenceMap[evidenceId]).toBeTruthy();
    }
  });

  it('falls back gracefully for low-image and low-review edge cases', () => {
    const data = buildAnalyzeResponseFixture({
      reviews: [
        {
          author: 'Only One',
          rating: 4,
          text: 'Helpful extension.',
          date: '2026-01-01',
          developerReply: null,
        },
      ],
      extension: {
        ...buildAnalyzeResponseFixture().extension,
        screenshots: [{ url: 'https://picsum.photos/640/400?solo', width: 640, height: 400 }],
        privacyPolicyUrl: null,
      },
    });

    const viewModel = buildWorkspaceViewModel(data);

    expect(viewModel.imageAudit.overallScore).toBeGreaterThanOrEqual(1);
    expect(viewModel.imageAudit.diagnostics.length).toBe(1);
    expect(viewModel.reviewSummary.confidence.level).toBe('low');
  });
});
