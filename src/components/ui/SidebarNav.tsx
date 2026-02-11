import { MODULE_DEFINITIONS, modulePath, type ModuleSlug, type NavigationGroup } from '@/routing/routes';

interface SidebarNavProps {
  extensionId?: string;
  activeModule?: ModuleSlug;
  onNavigate: (path: string) => void;
}

const GROUP_ORDER: NavigationGroup[] = [
  'Understand Customer',
  'Improve Product',
  'Optimize Marketing',
];

export function SidebarNav({ extensionId, activeModule, onNavigate }: SidebarNavProps) {
  return (
    <aside className="workspace-sidebar border-r border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">Workspace</p>
        <button
          type="button"
          className="mt-2 w-full rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-left text-sm font-medium text-[color:var(--text)] hover:border-[color:var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus)]"
          onClick={() => onNavigate('/products')}
        >
          Products
        </button>
      </div>

      {GROUP_ORDER.map((group) => {
        const modules = MODULE_DEFINITIONS.filter((module) => module.group === group);

        return (
          <section key={group} className="mb-5">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              {group}
            </h3>
            <div className="space-y-1">
              {modules.map((module) => {
                const disabled = !extensionId;
                const active = activeModule === module.slug;

                return (
                  <button
                    key={module.slug}
                    type="button"
                    disabled={disabled}
                    onClick={() => extensionId && onNavigate(modulePath(extensionId, module.slug))}
                    className={`w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus)] ${
                      active
                        ? 'bg-[color:var(--text)] text-[color:var(--bg)]'
                        : 'text-[color:var(--text)] hover:bg-[color:var(--surface-soft)]'
                    } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {module.label}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        className="mt-2 w-full rounded-[var(--radius-md)] border border-[color:var(--border)] px-3 py-2 text-left text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]"
        onClick={() => onNavigate('/legacy')}
      >
        Legacy Tabs (Compatibility)
      </button>
    </aside>
  );
}
