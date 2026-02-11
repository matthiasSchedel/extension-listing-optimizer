import { useMemo, useState } from 'react';

import { ProductHero, TopActionBar, EmptyState } from '@/components/ui';
import type { ModuleSlug } from '@/routing/routes';
import { modulePath } from '@/routing/routes';
import { useWorkspaceStore } from '@/state/workspaceStore';

import {
  ConversionBlockersPage,
  ConversionDriverPage,
  ImageAuditPage,
  ProductImprovementsPage,
  ReviewInsightsPage,
  StrengthsWeaknessesPage,
} from '@/pages/modules';

interface ProductModulePageProps {
  extensionId: string;
  module: ModuleSlug;
  onNavigate: (path: string) => void;
}

function shareKey(extensionId: string): string {
  return `chrome-listing-optimizer.share.${extensionId}`;
}

export function ProductModulePage({ extensionId, module, onNavigate }: ProductModulePageProps) {
  const { getViewModelById, getProductById, removeProduct } = useWorkspaceStore();
  const [shareEnabled, setShareEnabled] = useState(() => {
    try {
      return window.localStorage.getItem(shareKey(extensionId)) === '1';
    } catch {
      return false;
    }
  });

  const product = getProductById(extensionId);
  const viewModel = getViewModelById(extensionId);

  const moduleComponent = useMemo(() => {
    if (!viewModel) {
      return null;
    }

    if (module === 'review-insights') {
      return <ReviewInsightsPage viewModel={viewModel} />;
    }
    if (module === 'conversion-driver') {
      return <ConversionDriverPage viewModel={viewModel} />;
    }
    if (module === 'strengths-weaknesses') {
      return <StrengthsWeaknessesPage viewModel={viewModel} />;
    }
    if (module === 'product-improvements') {
      return <ProductImprovementsPage viewModel={viewModel} />;
    }
    if (module === 'image-audit') {
      return <ImageAuditPage viewModel={viewModel} />;
    }

    return <ConversionBlockersPage viewModel={viewModel} />;
  }, [module, viewModel]);

  const toggleShare = () => {
    setShareEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(shareKey(extensionId), next ? '1' : '0');
      return next;
    });
  };

  if (!product || !viewModel) {
    return (
      <EmptyState
        title="Product context unavailable"
        description="The route is valid, but no cached analysis was found for this extension. Re-run analysis from the products page."
        action={
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-3 py-1.5 text-sm"
            onClick={() => onNavigate('/products')}
          >
            Back to products
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <TopActionBar
        onBack={() => onNavigate('/products')}
        onToggleShare={toggleShare}
        shareEnabled={shareEnabled}
        onRemove={() => {
          removeProduct(extensionId);
          onNavigate('/products');
        }}
        externalUrl={product.url}
      />

      <ProductHero viewModel={viewModel} />

      <nav className="overflow-x-auto rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
        <div className="flex min-w-max gap-2">
          {[
            'review-insights',
            'conversion-driver',
            'strengths-weaknesses',
            'product-improvements',
            'image-audit',
            'conversion-blockers',
          ].map((slug) => {
            const isActive = slug === module;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => onNavigate(modulePath(extensionId, slug as ModuleSlug))}
                className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm ${
                  isActive
                    ? 'bg-[color:var(--text)] text-[color:var(--bg)]'
                    : 'border border-[color:var(--border)] text-[color:var(--text)]'
                }`}
              >
                {slug.replace(/-/g, ' ')}
              </button>
            );
          })}
        </div>
      </nav>

      {moduleComponent}
    </div>
  );
}
