// @vitest-environment node
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { scrapeMock, suggestMock } = vi.hoisted(() => ({
  scrapeMock: vi.fn(),
  suggestMock: vi.fn(),
}));

vi.mock("../../server/scraper/chromeStore", async () => {
  const actual = await vi.importActual<any>("../../server/scraper/chromeStore");
  return {
    ...actual,
    scrapeChromeStoreListing: scrapeMock,
  };
});

vi.mock("../../server/ai/suggestions", async () => {
  const actual = await vi.importActual<any>("../../server/ai/suggestions");
  return {
    ...actual,
    generateSuggestions: suggestMock,
  };
});

import sampleFixture from "../fixtures/sampleListing.json";
import { createApp } from "../../server/index";

const app = createApp();

beforeEach(() => {
  scrapeMock.mockReset();
  suggestMock.mockReset();
  scrapeMock.mockResolvedValue(sampleFixture);
  suggestMock.mockResolvedValue({
    title: "Title",
    shortDescription: "a".repeat(132),
    fullDescription: "body",
    keywords: ["a", "b", "c", "d", "e"],
    screenshotStrategy: [],
    topImprovements: [],
    competitiveInsights: [],
  });
});

describe("POST /api/analyze", () => {
  it("returns 200 with full analysis for valid url", async () => {
    const res = await request(app).post("/api/analyze").send({
      url: "https://chromewebstore.google.com/detail/sample/cccccccccccccccccccccccccccccccc",
    });

    expect(res.status).toBe(200);
    expect(res.body.extension.name).toBe(sampleFixture.extension.name);
    expect(res.body.scores).toBeTruthy();
  });

  it("returns 400 for invalid url body", async () => {
    const res = await request(app).post("/api/analyze").send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 for non chrome store url", async () => {
    const res = await request(app)
      .post("/api/analyze")
      .send({ url: "https://example.com" });
    expect(res.status).toBe(400);
  });

  it("returns 504 when scraping times out", async () => {
    scrapeMock.mockRejectedValue(new Error("Scraping request timed out."));

    const res = await request(app).post("/api/analyze").send({
      url: "https://chromewebstore.google.com/detail/sample/cccccccccccccccccccccccccccccccc",
    });

    expect(res.status).toBe(504);
  });
});
