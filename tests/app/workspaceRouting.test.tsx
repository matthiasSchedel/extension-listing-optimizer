import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { buildAnalyzeResponseFixture } from "../helpers/analyzeResponse";

describe("workspace routing and persistence", () => {
  beforeEach(() => {
    window.localStorage.clear?.();
    window.localStorage.removeItem("chrome-listing-optimizer.workspace.v2");
    window.history.replaceState({}, "", "/products");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("navigates products -> review insights -> conversion driver and restores on reload", async () => {
    const payload = buildAnalyzeResponseFixture();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<App />);

    fireEvent.change(screen.getByLabelText("Chrome Web Store URL"), {
      target: {
        value: `https://chromewebstore.google.com/detail/demo/${payload.extension.id}`,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Analyze URL" }));

    await waitFor(() => {
      expect(screen.getByText("What matters to customers")).toBeInTheDocument();
    });

    expect(window.location.pathname).toBe(
      `/products/${payload.extension.id}/review-insights`,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: /conversion driver/i })[0],
    );

    await waitFor(() => {
      expect(screen.getByText("What makes people buy")).toBeInTheDocument();
    });

    expect(window.location.pathname).toBe(
      `/products/${payload.extension.id}/conversion-driver`,
    );

    unmount();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("What makes people buy")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders compatibility route with legacy tabs", async () => {
    window.history.replaceState({}, "", "/legacy");
    render(<App />);

    expect(screen.getByText("Legacy Tab Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyze" })).toBeInTheDocument();
  });
});
