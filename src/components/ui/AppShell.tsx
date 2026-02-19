import type { PropsWithChildren } from "react";

import type { ModuleSlug } from "@/routing/routes";
import { SidebarNav } from "@/components/ui/SidebarNav";

interface AppShellProps {
  extensionId?: string;
  activeModule?: ModuleSlug;
  onNavigate: (path: string) => void;
}

export function AppShell({
  extensionId,
  activeModule,
  onNavigate,
  children,
}: PropsWithChildren<AppShellProps>) {
  const sidebarVisible = false;

  return (
    <div className="workspace-shell min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <div
        className={`workspace-grid mx-auto max-w-[1400px] ${sidebarVisible ? "" : "workspace-grid--single"}`}
      >
        {sidebarVisible ? (
          <SidebarNav
            extensionId={extensionId}
            activeModule={activeModule}
            onNavigate={onNavigate}
          />
        ) : null}
        <main className="workspace-main p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
