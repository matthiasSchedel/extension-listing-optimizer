import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { buildWorkspaceViewModel } from "@/analysis";
import type {
  AnalyzeResponse,
  WorkspaceProductRecord,
  WorkspaceViewModel,
} from "@/types";

interface PersistedStore {
  version: number;
  products: WorkspaceProductRecord[];
}

interface AnalyzeResult {
  record: WorkspaceProductRecord;
  viewModel: WorkspaceViewModel;
}

interface WorkspaceStoreValue {
  products: WorkspaceProductRecord[];
  loading: boolean;
  error: string | null;
  analyzeUrl: (url: string) => Promise<AnalyzeResult | null>;
  dismissError: () => void;
  getProductById: (extensionId: string) => WorkspaceProductRecord | undefined;
  getViewModelById: (extensionId: string) => WorkspaceViewModel | undefined;
  removeProduct: (extensionId: string) => void;
  clearAll: () => void;
}

const STORE_KEY = "chrome-listing-optimizer.workspace.v2";
const STORE_VERSION = 2;

const WorkspaceStoreContext = createContext<WorkspaceStoreValue | undefined>(
  undefined,
);

function isChromeStoreUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["chromewebstore.google.com", "chrome.google.com"].includes(
      parsed.hostname,
    );
  } catch {
    return false;
  }
}

function loadStore(): WorkspaceProductRecord[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PersistedStore;
    if (parsed.version !== STORE_VERSION || !Array.isArray(parsed.products)) {
      return [];
    }

    return parsed.products
      .filter((item) => item?.data?.extension?.id)
      .sort(
        (a, b) =>
          new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
      );
  } catch {
    return [];
  }
}

function saveStore(products: WorkspaceProductRecord[]): void {
  const payload: PersistedStore = {
    version: STORE_VERSION,
    products,
  };

  window.localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function upsertRecord(
  products: WorkspaceProductRecord[],
  record: WorkspaceProductRecord,
): WorkspaceProductRecord[] {
  const filtered = products.filter(
    (item) => item.extensionId !== record.extensionId,
  );
  return [record, ...filtered];
}

function removeRecord(
  products: WorkspaceProductRecord[],
  extensionId: string,
): WorkspaceProductRecord[] {
  return products.filter((record) => record.extensionId !== extensionId);
}

export function WorkspaceStoreProvider({ children }: PropsWithChildren) {
  const [products, setProducts] = useState<WorkspaceProductRecord[]>(() =>
    loadStore(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const viewModelCacheRef = useRef(new Map<string, WorkspaceViewModel>());

  const updateProducts = useCallback(
    (
      updater: (current: WorkspaceProductRecord[]) => WorkspaceProductRecord[],
    ) => {
      setProducts((current) => {
        const next = updater(current);
        saveStore(next);
        return next;
      });
    },
    [],
  );

  const analyzeUrl = useCallback(
    async (url: string) => {
      const normalizedUrl = url.trim();

      if (!normalizedUrl) {
        setError("Please enter a Chrome Web Store URL.");
        return null;
      }

      if (!isChromeStoreUrl(normalizedUrl)) {
        setError("Please use a valid Chrome Web Store URL.");
        return null;
      }

      if (inFlightRef.current || loading) {
        return null;
      }

      inFlightRef.current = true;
      setError(null);
      setLoading(true);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: normalizedUrl }),
        });

        const body = (await response.json()) as
          | AnalyzeResponse
          | { error?: string };
        if (!response.ok) {
          throw new Error(
            (body as { error?: string }).error ?? "Failed to analyze listing.",
          );
        }

        const data = body as AnalyzeResponse;
        const nextRecord: WorkspaceProductRecord = {
          extensionId: data.extension.id,
          analyzedAt: new Date().toISOString(),
          url: normalizedUrl,
          data,
        };

        updateProducts((current) => {
          return upsertRecord(current, nextRecord);
        });

        const viewModel = buildWorkspaceViewModel(data);
        viewModelCacheRef.current.set(data.extension.id, viewModel);

        return {
          record: nextRecord,
          viewModel,
        };
      } catch (unknownError: any) {
        setError(unknownError?.message ?? "Analysis request failed.");
        return null;
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [loading, updateProducts],
  );

  const getProductById = useCallback(
    (extensionId: string) =>
      products.find((product) => product.extensionId === extensionId),
    [products],
  );

  const getViewModelById = useCallback(
    (extensionId: string) => {
      const cached = viewModelCacheRef.current.get(extensionId);
      const record = getProductById(extensionId);
      if (!record) {
        return undefined;
      }

      if (
        cached &&
        cached.generatedAt &&
        cached.extension.id === record.data.extension.id &&
        cached.reviewSummary.analyzedReviewCount === record.data.reviews.length
      ) {
        return cached;
      }

      const built = buildWorkspaceViewModel(record.data);
      viewModelCacheRef.current.set(extensionId, built);
      return built;
    },
    [getProductById],
  );

  const removeProduct = useCallback(
    (extensionId: string) => {
      updateProducts((current) => removeRecord(current, extensionId));
      viewModelCacheRef.current.delete(extensionId);
    },
    [updateProducts],
  );

  const clearAll = useCallback(() => {
    updateProducts(() => []);
    viewModelCacheRef.current.clear();
  }, [updateProducts]);

  const value = useMemo<WorkspaceStoreValue>(
    () => ({
      products,
      loading,
      error,
      analyzeUrl,
      dismissError: () => setError(null),
      getProductById,
      getViewModelById,
      removeProduct,
      clearAll,
    }),
    [
      products,
      loading,
      error,
      analyzeUrl,
      getProductById,
      getViewModelById,
      removeProduct,
      clearAll,
    ],
  );

  return (
    <WorkspaceStoreContext.Provider value={value}>
      {children}
    </WorkspaceStoreContext.Provider>
  );
}

export function useWorkspaceStore(): WorkspaceStoreValue {
  const context = useContext(WorkspaceStoreContext);
  if (!context) {
    throw new Error(
      "useWorkspaceStore must be used within WorkspaceStoreProvider",
    );
  }

  return context;
}
