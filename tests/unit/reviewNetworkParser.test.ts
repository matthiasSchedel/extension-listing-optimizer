// @vitest-environment node
import { describe, expect, it } from "vitest";

import { __internal } from "../../server/scraper/chromeStore";

describe("network review parser", () => {
  it("extracts only real reviews and keeps developer replies nested", () => {
    const payload = JSON.stringify([
      ["opaque-token"],
      [
        [
          "b1fc9fd1-6740-4db2-b8e1-949d36098e06",
          [
            "Mark E",
            "https://lh3.googleusercontent.com/a-/ALV-UjXHXz9KnSp8R4GSYn66PXn_ebyeY6P_1Z5R0P7e0FQpuQ3trPUS=s32",
          ],
          1,
          "Trying first time today, immediately tries to install a bunch of other stuff not in the chrome store. No way. 1 star.",
          [1765274693, 101591410],
          [1765274693, 98683371],
          2,
          5,
          [
            "4c6ee539-0cdb-4627-a505-4d902208aee4",
            [
              "Mixe Morisson",
              "https://lh3.googleusercontent.com/a-/ALV-UjUmHycrgeGk7l9dvCrmP5BsyIXM_je-Cbs09xC03tc9lHEfGNU=s32",
            ],
            "Why are you lying? We do not offer any third party products. at install. Please scan your device for malware.",
            [1768156932, 124578543],
            [1768156932, 121635693],
            null,
            null,
            null,
            null,
            "en",
          ],
          null,
          null,
          "9.8.2.0",
          null,
          "en",
          "ghgabhipcejejjmhhchfonmamedcbeod",
        ],
        [
          "35e786c7-8bc6-4c7c-90cc-d3b6ef2f3e6d",
          [
            "Melanie Hudson",
            "https://lh3.googleusercontent.com/a/ACg8ocKx5tJ_KgYlp6QzORRkEUA3Ra2dqy56B2I-kdFfRAluPteLXQ=s32-mo",
          ],
          5,
          "Such a great product and so easy to use.",
          [1769064055, 999251835],
          [1769064055, 980873516],
          1,
          null,
          null,
          null,
          null,
          "9.8.2.0",
          null,
          "en",
          "ghgabhipcejejjmhhchfonmamedcbeod",
        ],
      ],
      11489,
      [
        "anna.",
        "https://lh3.googleusercontent.com/a-/ALV-UjWADLE7tdUzI5X2Q2b6H2UXLkBUAuKg8Vw-azMGmcxc2rVgfiG6=s32",
      ],
    ]);

    const parsed = __internal.parseReviewsFromNetworkBody(payload);

    expect(parsed).toHaveLength(2);
    expect(parsed.some((review) => review.author === "Mixe Morisson")).toBe(
      false,
    );
    expect(
      parsed.some((review) =>
        review.text.includes("lh3.googleusercontent.com"),
      ),
    ).toBe(false);

    const markE = parsed.find((review) => review.author === "Mark E");
    expect(markE?.rating).toBe(1);
    expect(markE?.developerReply).toContain(
      "We do not offer any third party products",
    );
  });
});
