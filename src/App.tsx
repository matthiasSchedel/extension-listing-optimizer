import { useEffect } from 'react';

import { AppShell, EmptyState } from '@/components/ui';
import { LegacyDashboardPage } from '@/pages/legacy/LegacyDashboardPage';
import { ProductModulePage } from '@/pages/ProductModulePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { useBrowserRoute } from '@/routing/useBrowserRoute';
import { WorkspaceStoreProvider } from '@/state/workspaceStore';

function WorkspaceRouter() {
  const { parsed, navigate } = useBrowserRoute();

  useEffect(() => {
    if (parsed.type === 'not-found') {
      navigate('/products', true);
    }
  }, [parsed, navigate]);

  if (parsed.type === 'legacy') {
    return (
      <AppShell onNavigate={navigate}>
        <LegacyDashboardPage onBack={() => navigate('/products')} />
      </AppShell>
    );
  }

  if (parsed.type === 'module') {
    return (
      <AppShell
        extensionId={parsed.extensionId}
        activeModule={parsed.module}
        onNavigate={navigate}
      >
        <ProductModulePage
          extensionId={parsed.extensionId}
          module={parsed.module}
          onNavigate={navigate}
        />
      </AppShell>
    );
  }

  if (parsed.type === 'products') {
    return (
      <AppShell onNavigate={navigate}>
        <ProductsPage onNavigate={navigate} />
      </AppShell>
    );
  }

  return (
    <AppShell onNavigate={navigate}>
      <EmptyState
        title="Route not found"
        description="The requested route does not exist in this workspace."
        action={
          <button
            type="button"
            onClick={() => navigate('/products', true)}
            className="rounded-[var(--radius-sm)] border border-[color:var(--border)] px-3 py-1.5 text-sm"
          >
            Back to products
          </button>
        }
      />
    </AppShell>
  );
}

export default function App() {
  return (
    <WorkspaceStoreProvider>
      <WorkspaceRouter />
    </WorkspaceStoreProvider>
  );
}
